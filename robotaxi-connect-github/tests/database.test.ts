import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Real PostgreSQL engine, real migrations, real SQL privileges and RLS.
// Only Supabase-owned auth/storage infrastructure is minimally bootstrapped.
test('PostgreSQL migrations, tenant isolation and business transactions', async (t) => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
      create schema auth; create schema storage;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
      grant usage on schema auth,storage,public to anon,authenticated,service_role;
      grant execute on function auth.uid() to anon,authenticated,service_role;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,metadata jsonb default '{}');
      alter table storage.objects enable row level security;
      grant select,insert,update,delete on storage.objects to authenticated;
      grant all on all tables in schema public to service_role;`);
    const migrations = (await readdir(new URL('../supabase/migrations/', import.meta.url)))
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const file of migrations)
      await db.exec(
        await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8'),
      );
    const admin = crypto.randomUUID(),
      userA = crypto.randomUUID(),
      userB = crypto.randomUUID(),
      unverified = crypto.randomUUID(),
      providerUser = crypto.randomUUID();
    for (const [id, email, confirmed, role] of [
      [admin, 'admin@example.test', true, 'COMPANY_USER'],
      [userA, 'a@example.test', true, 'ADMIN'],
      [userB, 'b@example.test', true, 'COMPANY_USER'],
      [unverified, 'unverified@example.test', false, 'COMPANY_USER'],
      [providerUser, 'provider@example.test', true, 'PROVIDER_USER'],
    ] as const) {
      await db.query(
        'insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,$3,$4)',
        [
          id,
          email,
          confirmed ? '2026-09-15T00:00:00Z' : null,
          JSON.stringify({ first_name: 'Demo', last_name: 'Contact', locale: 'de', role }),
        ],
      );
    }
    await db.query("update public.profiles set role='ADMIN' where id=$1", [admin]);
    await db.query("update public.profiles set role='PROVIDER_USER' where id=$1", [providerUser]);
    async function asUser<T>(
      id: string,
      operation: () => Promise<T>,
      role = 'authenticated',
    ): Promise<T> {
      await db.exec('begin');
      try {
        await db.query("select set_config('request.jwt.claim.sub',$1,true)", [id]);
        await db.exec(`set local role ${role}`);
        const value = await operation();
        await db.exec('commit');
        return value;
      } catch (error) {
        await db.exec('rollback');
        throw error;
      }
    }
    async function rpc<T = string>(name: string, input: unknown): Promise<T> {
      const result = await db.query<{ value: T }>(`select public.${name}($1::jsonb) value`, [
        JSON.stringify(input),
      ]);
      return result.rows[0].value;
    }
    const company = (name: string) => ({
      name,
      street: 'Teststraße',
      house_number: '1',
      postal_code: '10115',
      city: 'Berlin',
      country: 'Deutschland',
      phone: '+49 30 123456',
      email: 'ignored@example.test',
      website: '',
      company_type: 'TAXI',
      current_vehicles: 38,
      potential_vehicles: 12,
      timeline: '2028',
      requirements: '',
      locale: 'de',
      consent: true,
      legal_version: '2026-09-v1',
    });
    let a = '',
      b = '',
      pid = '',
      pcid = '',
      rid = '',
      contractId = '',
      documentId = '';
    await t.test(
      'registration requires verified email; role metadata cannot grant admin',
      async () => {
        const profile = await db.query<{ role: string }>('select role from profiles where id=$1', [
          userA,
        ]);
        assert.equal(profile.rows[0].role, 'COMPANY_USER');
        await assert.rejects(
          () => asUser(unverified, () => rpc('save_company', company('Unverified'))),
          /FORBIDDEN/,
        );
        await assert.rejects(
          () => asUser(providerUser, () => rpc('save_company', company('Provider'))),
          /FORBIDDEN/,
        );
        await assert.rejects(
          () => asUser(userA, () => rpc('save_company', { ...company('A'), consent: false })),
          /CONSENT_REQUIRED/,
        );
        a = await asUser(userA, () => rpc('save_company', company('Company A')));
        b = await asUser(userB, () => rpc('save_company', company('Company B')));
        const saved = await db.query<{ status: string; email: string }>(
          'select status,email from companies where id=$1',
          [a],
        );
        assert.equal(saved.rows[0].status, 'PENDING_APPROVAL');
        assert.equal(saved.rows[0].email, 'a@example.test');
        await assert.rejects(
          () => asUser(userA, () => rpc('save_company', company('Duplicate'))),
          /ALREADY_REGISTERED/,
        );
      },
    );
    await t.test('all sensitive tables have RLS and anonymous access is denied', async () => {
      const rows = await db.query<{ relname: string; relrowsecurity: boolean }>(
        "select relname,relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'",
      );
      assert.ok(rows.rows.length >= 18);
      assert.ok(rows.rows.every((r) => r.relrowsecurity));
      await assert.rejects(
        () => asUser('', () => db.query('select * from companies'), 'anon'),
        /permission denied/,
      );
    });
    await t.test('company A cannot read or mutate company B, membership or roles', async () => {
      await asUser(userA, async () => {
        assert.equal((await db.query('select * from companies')).rows.length, 1);
        assert.equal((await db.query('select * from companies where id=$1', [b])).rows.length, 0);
        assert.equal(
          (await db.query('select * from fleet_profiles where company_id=$1', [b])).rows.length,
          0,
        );
        assert.equal((await db.query('select * from company_members')).rows.length, 1);
        assert.equal((await db.query('select * from providers')).rows.length, 0);
      });
      await assert.rejects(
        () =>
          asUser(userA, () => db.query("update profiles set role='ADMIN' where id=$1", [userA])),
        /permission denied/,
      );
      await assert.rejects(
        () =>
          asUser(userA, () =>
            db.query('select save_company($1::jsonb,$2)', [JSON.stringify(company('Tamper')), b]),
          ),
        /FORBIDDEN/,
      );
      await assert.rejects(
        () => asUser(userA, () => db.query('select approve_company($1)', [a])),
        /FORBIDDEN/,
      );
      await assert.rejects(
        () => asUser(userA, () => db.query('select admin_dashboard()')),
        /FORBIDDEN/,
      );
    });
    await t.test('approval and its notification are atomic and idempotent', async () => {
      await asUser(admin, () => db.query('select approve_company($1)', [a]));
      await asUser(admin, () => db.query('select approve_company($1)', [a]));
      await asUser(admin, () => db.query('select approve_company($1)', [b]));
      assert.equal(
        (
          await db.query(
            "select * from email_logs where company_id=$1 and template='account_approved'",
            [a],
          )
        ).rows.length,
        1,
      );
    });
    await t.test(
      'database identity is non-sensitive; member assignment is admin-only',
      async () => {
        await asUser(
          '',
          async () =>
            assert.equal(
              (await db.query<{ value: string }>('select robotaxi_identity() value')).rows[0].value,
              'robotaxi-connect/v1',
            ),
          'anon',
        );
        const extra = crypto.randomUUID();
        await db.query(
          'insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',
          [extra, 'extra@example.test', JSON.stringify({ first_name: 'Extra', last_name: 'User' })],
        );
        await assert.rejects(
          () =>
            asUser(userA, () =>
              db.query('select add_company_member($1,$2)', [b, 'extra@example.test']),
            ),
          /FORBIDDEN/,
        );
        await asUser(admin, () =>
          db.query('select add_company_member($1,$2)', [b, 'extra@example.test']),
        );
        await asUser(extra, async () => {
          const result = await db.query<{ id: string }>('select id from companies');
          assert.deepEqual(
            result.rows.map((r) => r.id),
            [b],
          );
        });
        await assert.rejects(
          () =>
            asUser(admin, () =>
              db.query('select add_company_member($1,$2)', [a, 'extra@example.test']),
            ),
          /unique constraint/,
        );
      },
    );
    const terms = {
      customer_protection_months: 12,
      commission_initial: 5,
      commission_recurring: 1,
      commission_fixed: 0,
      currency: 'EUR',
      internal_notes: 'CONFIDENTIAL',
    };
    const requestId = crypto.randomUUID();
    let referralInput: Record<string, unknown>;
    await t.test(
      'referral creation snapshots selected data and queues two emails once',
      async () => {
        await asUser(admin, async () => {
          pid = (
            await db.query<{ value: string }>(
              "select save_admin_record('provider',$1::jsonb) value",
              [
                JSON.stringify({
                  name: 'Demo Provider',
                  legal_name: 'Demo Provider Ltd',
                  country: 'DE',
                  solution: 'Demo',
                  active: true,
                }),
              ],
            )
          ).rows[0].value;
          pcid = (
            await db.query<{ value: string }>(
              "select save_admin_record('provider_contact',$1::jsonb) value",
              [
                JSON.stringify({
                  provider_id: pid,
                  name: 'Demo Contact',
                  email: 'provider@example.test',
                  phone: '',
                  position: '',
                  locale: 'en',
                }),
              ],
            )
          ).rows[0].value;
          referralInput = {
            ...terms,
            request_id: requestId,
            company_id: a,
            provider_id: pid,
            provider_contact_id: pcid,
            estimated_vehicles: 12,
            desired_start: '2028-01-01',
            customer_visible: true,
            shared_fields: ['name', 'fleet'],
          };
          rid = await rpc('create_referral', referralInput);
          assert.equal(await rpc('create_referral', referralInput), rid);
        });
        const logs = await db.query<{ payload: { disclosure?: Record<string, unknown> } }>(
          "select payload from email_logs where payload->>'referral_id'=$1",
          [rid],
        );
        assert.equal(logs.rows.length, 2);
        const disclosure = logs.rows.find((r) => r.payload.disclosure)!.payload.disclosure!;
        assert.deepEqual(Object.keys(disclosure).sort(), [
          'current_vehicles',
          'name',
          'potential_vehicles',
        ]);
        assert.equal(JSON.stringify(logs.rows).includes('CONFIDENTIAL'), false);
        const audit = await db.query(
          'select * from audit_logs where entity_id=$1 and actor_user_id=$2',
          [rid, admin],
        );
        assert.equal(audit.rows.length, 1);
      },
    );
    await t.test(
      'referral rollback prevents partial records and unapproved submissions',
      async () => {
        await assert.rejects(
          () => asUser(userA, () => rpc('create_referral', referralInput)),
          /FORBIDDEN/,
        );
        const invalidId = crypto.randomUUID();
        await assert.rejects(
          () =>
            asUser(admin, () =>
              rpc('create_referral', {
                ...referralInput,
                request_id: invalidId,
                commission_fixed: 500,
              }),
            ),
          /check constraint/,
        );
        assert.equal(
          (await db.query('select * from referrals where request_id=$1', [invalidId])).rows.length,
          0,
        );
        await assert.rejects(
          () =>
            asUser(admin, () =>
              rpc('create_referral', {
                ...referralInput,
                request_id: crypto.randomUUID(),
                provider_contact_id: crypto.randomUUID(),
              }),
            ),
          /INVALID_CONTACT/,
        );
      },
    );
    await t.test(
      'only published referral fields are visible and business history cannot be deleted',
      async () => {
        await asUser(userA, async () => {
          assert.equal((await db.query('select * from referrals')).rows.length, 1);
          assert.equal((await db.query('select * from referral_terms')).rows.length, 0);
          assert.equal((await db.query('select * from audit_logs')).rows.length, 0);
        });
        await asUser(userB, async () =>
          assert.equal((await db.query('select * from referrals')).rows.length, 0),
        );
        await assert.rejects(
          () => asUser(admin, () => db.query('delete from referrals where id=$1', [rid])),
          /permission denied/,
        );
        await asUser(admin, () =>
          db.query("select update_referral($1,'CANCELLED',true,'')", [rid]),
        );
        await assert.rejects(
          () => asUser(admin, () => db.query("select update_referral($1,'WON',true,'')", [rid])),
          /INVALID_TRANSITION/,
        );
      },
    );
    await t.test('contracts keep commissions private and enforce tenant links', async () => {
      const input = {
        ...terms,
        company_id: a,
        provider_id: pid,
        referral_id: rid,
        contract_number: 'TEST-001',
        contract_type: 'BROKERAGE',
        title: 'Demo Contract',
        status: 'ACTIVE',
        valid_from: '2026-09-01',
        valid_until: '2027-09-01',
        signed_at: '2026-09-01',
        customer_visible: true,
        customer_visible_notes: 'Shared note',
      };
      contractId = await asUser(admin, () => rpc('save_contract', input));
      await asUser(userA, async () => {
        const rows = await db.query<Record<string, unknown>>('select * from contracts');
        assert.equal(rows.rows.length, 1);
        assert.equal('commission_initial' in rows.rows[0], false);
        assert.equal((await db.query('select * from contract_terms')).rows.length, 0);
      });
      await asUser(userB, async () =>
        assert.equal((await db.query('select * from contracts')).rows.length, 0),
      );
      await assert.rejects(
        () =>
          asUser(admin, () =>
            rpc('save_contract', { ...input, company_id: b, contract_number: 'BAD' }),
          ),
        /REFERRAL_MISMATCH/,
      );
    });
    const path = () => `companies/${a}/contracts/test.pdf`;
    await t.test('private storage enforces tenant and explicit document visibility', async () => {
      await assert.rejects(
        () =>
          asUser(userB, () =>
            db.query("insert into storage.objects(bucket_id,name) values('company-files',$1)", [
              path(),
            ]),
          ),
        /row-level security/,
      );
      await asUser(admin, () =>
        db.query("insert into storage.objects(bucket_id,name) values('company-files',$1)", [
          path(),
        ]),
      );
      documentId = await asUser(admin, () =>
        rpc('attach_document', {
          company_id: a,
          contract_id: contractId,
          title: 'Test PDF',
          storage_path: path(),
          mime_type: 'application/pdf',
          size_bytes: 100,
          customer_visible: true,
        }),
      );
      await asUser(userA, async () => {
        assert.equal((await db.query('select * from documents')).rows.length, 1);
        assert.equal((await db.query('select * from storage.objects')).rows.length, 1);
      });
      await asUser(userB, async () => {
        assert.equal((await db.query('select * from documents')).rows.length, 0);
        assert.equal((await db.query('select * from storage.objects')).rows.length, 0);
      });
      await asUser(admin, () =>
        db.query('select set_document_visibility($1,false,false)', [documentId]),
      );
      await asUser(userA, async () =>
        assert.equal((await db.query('select * from storage.objects')).rows.length, 0),
      );
      await asUser(admin, () =>
        db.query('select set_document_visibility($1,true,false)', [documentId]),
      );
      await db.query('update contracts set customer_visible=false where id=$1', [contractId]);
      await asUser(userA, async () => {
        assert.equal((await db.query('select * from documents')).rows.length, 0);
        assert.equal((await db.query('select * from storage.objects')).rows.length, 0);
      });
      await asUser(admin, async () =>
        assert.equal((await db.query('delete from storage.objects returning id')).rows.length, 0),
      );
    });
    await t.test('audit history is immutable even for SQL owner updates', async () => {
      await assert.rejects(
        () => db.exec("update audit_logs set action='tampered'"),
        /IMMUTABLE_RECORD/,
      );
      await assert.rejects(
        () => asUser(admin, () => db.exec('delete from audit_logs')),
        /permission denied/,
      );
    });
    await t.test(
      'only worker role can lease email jobs; leases prevent stale completion',
      async () => {
        await assert.rejects(
          () => asUser(admin, () => db.query('select * from claim_email_batch(1)')),
          /permission denied/,
        );
        await asUser(
          '',
          async () => {
            const { rows } = await db.query<{ id: string; lock_token: string }>(
              'select * from claim_email_batch(1)',
            );
            assert.equal(rows.length, 1);
            const job = rows[0];
            const attempt = await db.query<{ id: string }>('select start_email_attempt($1,$2) id', [
              job.id,
              job.lock_token,
            ]);
            await db.query('select finish_email_attempt($1,$2,$3,$4,null)', [
              job.id,
              job.lock_token,
              attempt.rows[0].id,
              'test-message',
            ]);
          },
          'service_role',
        );
        assert.equal(
          (await db.query("select * from email_attempts where status='SENT'")).rows.length,
          1,
        );
      },
    );
    await t.test('worker retries fail closed after the provider idempotency window', async () => {
      await db.exec(
        "update email_logs set created_at=now()-interval '25 hours',attempt_count=1,status='PROCESSING',locked_until=now()-interval '1 hour' where status='QUEUED'",
      );
      await asUser(
        '',
        async () =>
          assert.equal((await db.query('select * from claim_email_batch(25)')).rows.length, 0),
        'service_role',
      );
      const failures = await db.query<{ retryable: boolean }>(
        "select retryable from email_logs where error_code='DELIVERY_RECONCILIATION_REQUIRED'",
      );
      assert.ok(failures.rows.length > 0);
      assert.ok(failures.rows.every((r) => !r.retryable));
      await assert.rejects(
        () =>
          asUser(
            '',
            () =>
              db.query('select finish_email_attempt($1,$2,$3,null,null)', [
                crypto.randomUUID(),
                crypto.randomUUID(),
                crypto.randomUUID(),
              ]),
            'service_role',
          ),
        /STALE_LEASE/,
      );
    });
    await t.test(
      'deactivation immediately revokes all company access even with existing JWT',
      async () => {
        await asUser(userA, () => db.query("select request_privacy('DEACTIVATE')"));
        await asUser(userA, async () => {
          for (const table of [
            'companies',
            'company_members',
            'fleet_profiles',
            'referrals',
            'contracts',
            'documents',
          ])
            assert.equal((await db.query(`select * from ${table}`)).rows.length, 0, table);
        });
        await assert.rejects(
          () => asUser(userA, () => rpc('save_company', company('Deactivated'))),
          /FORBIDDEN/,
        );
      },
    );
    async function withPassword<T>(id:string, operation:()=>Promise<T>) {
      return asUser(id, async()=>{
        await db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({amr:[{method:'password',timestamp:Math.floor(Date.now()/1000)}]})]);
        return operation();
      });
    }
    await t.test('provider registration cannot choose admin; providers see only their own profile', async()=>{
      const tech=crypto.randomUUID();
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)',[tech,'tech@example.test',JSON.stringify({account_type:'technology',role:'ADMIN'})]);
      assert.equal((await db.query<{role:string}>('select role from profiles where id=$1',[tech])).rows[0].role,'PROVIDER_USER');
      await asUser(tech,()=>rpc('save_provider_account',{company_name:'Tech Ltd',email:'tech@example.test',solution:'Autonomy'}));
      await asUser(tech,()=>rpc('save_provider_account',{company_name:'Tech Ltd',email:'tech@example.test',solution:'Autonomy',qualification:{use_cases:'Taxi pilots',training_support:'Training required'}}));
      await asUser(tech,async()=>assert.equal((await db.query<{qualification:{use_cases:string}}>('select qualification from provider_accounts')).rows[0].qualification.use_cases,'Taxi pilots'));
      await assert.rejects(()=>asUser(tech,()=>rpc('save_provider_account',{company_name:'Tech Ltd',email:'tech@example.test',qualification:{use_cases:{bad:true}}})),/INVALID_INPUT/);

      await asUser(providerUser, async()=>assert.equal((await db.query('select * from provider_accounts')).rows.length,0));
      await asUser(tech, async()=>{
        assert.equal((await db.query('select * from provider_accounts')).rows.length,1);
        assert.equal((await db.query('select * from companies')).rows.length,0);
        assert.equal((await db.query('select * from providers')).rows.length,0);
      });
      await assert.rejects(()=>asUser(tech,()=>db.query('select prepare_account_deletion()')),/REAUTH_REQUIRED/);
      await assert.rejects(()=>withPassword(admin,()=>db.query('select prepare_account_deletion()')),/FORBIDDEN/);
      await withPassword(tech,()=>db.query('select prepare_account_deletion()'));
      await withPassword(tech,()=>db.query('select finish_account_deletion()'));
      assert.equal((await db.query('select * from auth.users where id=$1',[tech])).rows.length,0);
      assert.equal((await db.query('select * from provider_accounts where user_id=$1',[tech])).rows.length,0);
      await assert.rejects(()=>withPassword(tech,()=>db.query('select prepare_account_deletion()')),/FORBIDDEN/);
    });
    await t.test('erasure requires storage API cleanup and removes company records without touching another company',async()=>{
      // A contains real referral snapshots, contracts, files and audit entries from the scenarios above.
      const before=(await db.query('select * from companies where id=$1',[b])).rows;
      await withPassword(userA,()=>db.query('select prepare_account_deletion()'));
      await assert.rejects(()=>asUser(userA,()=>db.query('select account_deletion_files($1)',[userA])),/permission denied/);
      const manifest=await asUser('',()=>db.query<{account_deletion_files:string[]}>('select account_deletion_files($1)',[userA]),'service_role');
      assert.ok(manifest.rows[0].account_deletion_files.length>0);
      await assert.rejects(()=>withPassword(userA,()=>db.query('select finish_account_deletion()')),/FILES_REMAIN/);
      await assert.rejects(()=>asUser(admin,()=>db.query("insert into storage.objects(bucket_id,name) values('company-files',$1)",[`companies/${a}/documents/new.pdf`])),/ACCOUNT_DELETION_IN_PROGRESS/);
      await asUser(userB,async()=>{
        await db.query("delete from storage.objects where bucket_id='company-files' and name like $1",[`companies/${a}/%`]);
      });
      assert.ok((await db.query('select * from storage.objects where name like $1',[`companies/${a}/%`])).rows.length>0);
      // Users gain no additional read access to internal files. The Edge Function removes them through Storage API.
      await asUser(userA,async()=>assert.equal((await db.query('select * from storage.objects')).rows.length,0));
      await db.query("delete from storage.objects where bucket_id='company-files' and name like $1",[`companies/${a}/%`]);
      await withPassword(userA,()=>db.query('select finish_account_deletion()'));
      for(const table of ['auth.users','public.profiles']) assert.equal((await db.query(`select * from ${table} where id=$1`,[userA])).rows.length,0);
      assert.equal((await db.query('select * from companies where id=$1',[a])).rows.length,0);
      for(const table of ['documents','contracts','referrals','audit_logs','email_logs']) assert.equal((await db.query(`select * from ${table} where company_id=$1`,[a])).rows.length,0,table);
      assert.deepEqual((await db.query('select * from companies where id=$1',[b])).rows,before);
      await asUser(userA,async()=>assert.equal((await db.query('select * from companies')).rows.length,0));
    });
    await t.test('shared company survives deletion of one account; final member removes the company',async()=>{
      const other=crypto.randomUUID();
      await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[other,'other@example.test']);
      await asUser(admin,()=>db.query('select add_company_member($1,$2)',[b,'other@example.test']));
      await withPassword(userB,()=>db.query('select prepare_account_deletion()'));
      await withPassword(userB,()=>db.query('select finish_account_deletion()'));
      assert.equal((await db.query('select * from companies where id=$1',[b])).rows.length,1);
      await asUser(other,async()=>assert.equal((await db.query('select * from companies')).rows.length,1));
      await withPassword(other,()=>db.query('select prepare_account_deletion()'));
      await withPassword(other,()=>db.query('select finish_account_deletion()'));
      assert.equal((await db.query('select * from companies where id=$1',[b])).rows.length,1);
      const extra=(await db.query<{id:string}>("select id from auth.users where email='extra@example.test'")).rows[0].id;
      await withPassword(extra,()=>db.query('select prepare_account_deletion()'));
      await withPassword(extra,()=>db.query('select finish_account_deletion()'));
      assert.equal((await db.query('select * from companies where id=$1',[b])).rows.length,0);
    });
  } finally {
    await db.close();
  }
});
