import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Plus, CarFront, GitBranch, Building2, Clock3, Download } from 'lucide-react';
import { brand } from '@/config/brand';
import { messages, label } from '@/i18n/messages';
import { companyStatuses, referralStatuses, type Locale, type Company } from '@/lib/domain';
import type { AdminData, Terms } from '@/lib/data';
import {
  Workspace,
  PageHeading,
  Kpi,
  Panel,
  Badge,
  DateText,
  Empty,
  InfoList,
  Money,
  initials,
} from './workspace';
import { CompanyForm } from './company-form';
import { ProviderForm, ContactForm, ContractForm, UploadForm } from './admin-forms';
import { ReferralDialog } from './referral-form';
import { Field, Checkbox } from './fields';
import { ActionForm } from './action-form';
import {
  companyStatusAction,
  adminRecordAction,
  updateReferralAction,
  documentVisibilityAction,
  resolvePrivacyAction,
  addMemberAction,
} from '@/app/actions/business';
export const adminSections = [
  '',
  'companies',
  'contacts',
  'providers',
  'referrals',
  'contracts',
  'documents',
  'activities',
  'settings',
];
export function AdminScreen({
  locale,
  segments,
  data,
  demo = false,
  search = '',
  status = '',
  page = 0,
  created = false,
}: {
  locale: Locale;
  segments: string[];
  data: AdminData;
  demo?: boolean;
  search?: string;
  status?: string;
  page?: number;
  created?: boolean;
}) {
  const m = messages[locale];
  const section = segments[0] || '';
  const id = segments[1];
  const base = `/${locale}/${demo ? 'demo/' : ''}admin`;
  const s = data.stats;
  const companyName = (cid: string) =>
    data.companies.find((c) => c.id === cid)?.name || cid.slice(0, 8);
  const companyLink = (cid: string) => (
    <Link href={`${base}/companies/${cid}`}>{companyName(cid)}</Link>
  );
  let content: React.ReactNode;
  if (!section)
    content = (
      <>
        <PageHeading title={m.adminTitle} body={m.adminBody} eyebrow={m.dashboard}>
          <Link className="button primary" href={`${base}/companies/new`}>
            <Plus size={16} />
            {m.addCompany}
          </Link>
        </PageHeading>
        <div className="kpi-grid">
          <Kpi
            title={m.totalCompanies}
            value={s.total}
            foot={`${s.new} · ${m.newRegistrations}`}
            icon={Building2}
          />
          <Kpi title={m.pendingCompanies} value={s.pending} icon={Clock3} />
          <Kpi
            title={m.totalPotential}
            value={s.potential}
            foot={m.vehicles}
            icon={CarFront}
            featured
          />
          <Kpi title={m.activeReferrals} value={s.active_referrals} icon={GitBranch} />
        </div>
        <div className="dashboard-columns">
          <Panel title={m.recentCompanies} link={{ label: m.viewAll, href: `${base}/companies` }}>
            <CompanyTable
              locale={locale}
              companies={data.companies.slice(0, 6)}
              data={data}
              base={base}
            />
          </Panel>
          <div>
            <Panel title={m.pipeline}>
              <div className="panel-body">
                {['SENT', 'RECEIVED', 'IN_DISCUSSION', 'OFFER', 'WON'].map((status) => (
                  <div key={status} className="pipeline-row">
                    <span>{label(locale, status)}</span>
                    <div className="pipeline-track">
                      <div
                        className="pipeline-bar"
                        style={{
                          width: `${Math.min(100, ((s.statuses[status] || 0) / Math.max(1, ...Object.values(s.statuses))) * 100)}%`,
                        }}
                      />
                    </div>
                    <strong>{s.statuses[status] || 0}</strong>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title={m.pipelineValue}>
              <div className="panel-body">
                {Object.entries(s.pipeline).length ? (
                  Object.entries(s.pipeline).map(([currency, value]) => (
                    <h2 key={currency} style={{ fontSize: 29, marginBottom: 10 }}>
                      <Money locale={locale} value={value} currency={currency} />
                    </h2>
                  ))
                ) : (
                  <h2 style={{ fontSize: 29, marginBottom: 10 }}>—</h2>
                )}
                <p className="muted">{m.pipelineNote}</p>
              </div>
            </Panel>
          </div>
        </div>
        <div className="kpi-grid">
          <Kpi title={m.newRegistrations} value={s.new} />
          <Kpi title={m.qualifiedCompanies} value={s.qualified} />
          <Kpi title={m.wonReferrals} value={s.won} />
          <Kpi title={m.openContracts} value={s.open_contracts} />
        </div>
      </>
    );
  else if (section === 'companies' && !id)
    content = (
      <>
        <PageHeading title={m.companies} body={`${data.companyCount} · ${m.totalCompanies}`}>
          <Link className="button primary" href={`${base}/companies/new`}>
            <Plus size={16} />
            {m.addCompany}
          </Link>
        </PageHeading>
        <form className="toolbar" method="get">
          <input
            className="search-input"
            name="q"
            aria-label={m.search}
            placeholder={m.searchCompanies}
            defaultValue={search}
          />
          <select name="status" aria-label={m.status} defaultValue={status}>
            <option value="">{m.allStatuses}</option>
            {companyStatuses.map((s) => (
              <option key={s} value={s}>
                {label(locale, s)}
              </option>
            ))}
          </select>
          <button className="button secondary">{m.filter}</button>
        </form>
        <Panel>
          <CompanyTable locale={locale} companies={data.companies} data={data} base={base} />
        </Panel>
        <div className="page-actions">
          {page > 0 && (
            <Link
              className="button secondary"
              href={`${base}/companies?q=${encodeURIComponent(search)}&status=${status}&page=${page - 1}`}
            >
              {m.back}
            </Link>
          )}
          {(page + 1) * 50 < data.companyCount && (
            <Link
              className="button secondary"
              href={`${base}/companies?q=${encodeURIComponent(search)}&status=${status}&page=${page + 1}`}
            >
              {m.continue}
            </Link>
          )}
        </div>
      </>
    );
  else if (section === 'companies' && id === 'new')
    content = (
      <>
        <PageHeading title={m.addCompany} />
        <Panel>
          <div className="panel-body">
            <CompanyForm locale={locale} admin disabled={demo} />
          </div>
        </Panel>
      </>
    );
  else if (section === 'companies' && id) {
    const c = data.companies.find((c) => c.id === id);
    if (!c) notFound();
    const fleet = data.fleets.find((f) => f.company_id === id);
    content = (
      <>
        <PageHeading
          title={c.name}
          body={`${c.city} · ${label(locale, c.company_type)}`}
          eyebrow={m.company}
        >
          <ReferralDialog
            locale={locale}
            company={c}
            fleet={fleet}
            providers={data.providers}
            contacts={data.providerContacts}
            requestId={crypto.randomUUID()}
            disabled={demo}
          />
          <Link className="button secondary" href={`${base}/contracts/new?company=${id}`}>
            {m.addContract}
          </Link>
        </PageHeading>
        <div className="details-grid">
          <div>
            <Panel title={m.profile}>
              <div className="panel-body">
                <CompanyForm locale={locale} company={c} fleet={fleet} admin disabled={demo} />
              </div>
            </Panel>
            <Panel title={m.contacts}>
              <div className="panel-body">
                <div className="record-list">
                  {data.contacts
                    .filter((x) => x.company_id === id)
                    .map((x) => (
                      <details className="record" key={x.id}>
                        <summary>
                          {x.name} · {x.email}
                          <Plus size={15} />
                        </summary>
                        <div style={{ paddingTop: 20 }}>
                          <ContactForm locale={locale} parentId={id} contact={x} disabled={demo} />
                        </div>
                      </details>
                    ))}
                </div>
                <h3 className="small-heading" style={{ marginTop: 25 }}>
                  {m.addContact}
                </h3>
                <ContactForm locale={locale} parentId={id} disabled={demo} />
              </div>
            </Panel>
          </div>
          <div>
            <Panel title={m.status}>
              <div className="panel-body">
                <Badge locale={locale} value={c.status} />
                {!c.approved_at && (
                  <div style={{ marginTop: 20 }}>
                    <ActionForm
                      locale={locale}
                      action={companyStatusAction.bind(null, locale, id, true)}
                      submit="approve"
                      disabled={demo}
                    >
                      {null}
                    </ActionForm>
                  </div>
                )}
                <div style={{ marginTop: 24 }}>
                  <ActionForm
                    locale={locale}
                    action={companyStatusAction.bind(null, locale, id, false)}
                    disabled={demo}
                  >
                    <Field
                      name="status"
                      locale={locale}
                      options={companyStatuses}
                      value={c.status}
                    />
                  </ActionForm>
                </div>
                <p className="record-meta">
                  {m.registered}: <DateText locale={locale} value={c.created_at} />
                </p>
              </div>
            </Panel>
            <Panel title={m.addMember}>
              <div className="panel-body">
                <p>{m.memberHint}</p>
                <ActionForm
                  locale={locale}
                  action={addMemberAction.bind(null, locale, id)}
                  submit="addMember"
                  disabled={demo}
                >
                  <Field name="email" locale={locale} type="email" required max={254} />
                </ActionForm>
              </div>
            </Panel>
            <Panel title={m.internal_notes}>
              <div className="panel-body">
                <ActionForm
                  locale={locale}
                  action={adminRecordAction.bind(null, locale, 'company_note', null)}
                  disabled={demo}
                >
                  <input type="hidden" name="company_id" value={id} />
                  <Field
                    name="internal_notes"
                    locale={locale}
                    type="textarea"
                    value={data.companyNotes.find((n) => n.company_id === id)?.internal_notes}
                    max={10000}
                  />
                </ActionForm>
              </div>
            </Panel>
            <Panel title={m.addActivity}>
              <div className="panel-body">
                <ActivityForm locale={locale} data={data} companyId={id} disabled={demo} />
              </div>
            </Panel>
            <Panel title={m.activities}>
              <div className="panel-body">
                {data.activities
                  .filter((a) => a.company_id === id)
                  .map((a) => (
                    <div className="activity-row" key={a.id}>
                      <strong>{label(locale, a.kind)}</strong>
                      <p>{a.body}</p>
                      <small>
                        <DateText locale={locale} value={a.created_at} />
                      </small>
                    </div>
                  ))}
              </div>
            </Panel>
          </div>
        </div>
        <Panel title={m.referrals}>
          <div className="panel-body">
            {data.referrals
              .filter((r) => r.company_id === id)
              .map((r) => (
                <div className="record-head" key={r.id}>
                  <Link href={`${base}/referrals/${r.id}`}>
                    {r.provider_name} <ArrowUpRight size={13} style={{ display: 'inline' }} />
                  </Link>
                  <Badge locale={locale} value={r.status} />
                </div>
              ))}
          </div>
        </Panel>
      </>
    );
  } else if (section === 'contacts')
    content = (
      <>
        <PageHeading title={m.contacts} />
        <Panel>
          {!data.contacts.length ? (
            <Empty locale={locale} />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{m.contactName}</th>
                    <th>{m.company}</th>
                    <th>{m.email}</th>
                    <th>{m.phone}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.contacts.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                        <small>{c.position}</small>
                      </td>
                      <td>{companyLink(c.company_id!)}</td>
                      <td>{c.email}</td>
                      <td>{c.phone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </>
    );
  else if (section === 'providers' && !id)
    content = (
      <>
        <PageHeading title={m.providerManagement}>
          <Link className="button primary" href={`${base}/providers/new`}>
            <Plus size={16} />
            {m.addProvider}
          </Link>
        </PageHeading>
        <Panel>
          {!data.providers.length ? (
            <Empty locale={locale} />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{m.provider}</th>
                    <th>{m.country}</th>
                    <th>{m.solution}</th>
                    <th>{m.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.providers.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`${base}/providers/${p.id}`}>
                          <strong>{p.name}</strong>
                          <small>{p.legal_name}</small>
                        </Link>
                      </td>
                      <td>{p.country}</td>
                      <td>{p.solution}</td>
                      <td>
                        <Badge locale={locale} value={p.active ? 'ACTIVE' : 'ARCHIVED'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </>
    );
  else if (section === 'providers' && id) {
    const provider = data.providers.find((p) => p.id === id);
    if (id !== 'new' && !provider) notFound();
    content = (
      <>
        <PageHeading title={provider?.name || m.addProvider} />
        <div className="details-grid">
          <Panel title={m.provider}>
            <div className="panel-body">
              <ProviderForm locale={locale} provider={provider} disabled={demo} />
            </div>
          </Panel>
          {provider && (
            <Panel title={m.contacts}>
              <div className="panel-body">
                {data.providerContacts
                  .filter((c) => c.provider_id === id)
                  .map((c) => (
                    <details className="record" key={c.id}>
                      <summary>
                        {c.name}
                        <Plus size={14} />
                      </summary>
                      <div style={{ paddingTop: 18 }}>
                        <ContactForm
                          locale={locale}
                          parentId={id}
                          provider
                          contact={c}
                          disabled={demo}
                        />
                      </div>
                    </details>
                  ))}
                <h3 className="small-heading" style={{ marginTop: 24 }}>
                  {m.addContact}
                </h3>
                <ContactForm locale={locale} parentId={id} provider disabled={demo} />
              </div>
            </Panel>
          )}
        </div>
      </>
    );
  } else if (section === 'referrals' && !id)
    content = (
      <>
        <PageHeading title={m.referrals} />
        <Panel>
          {!data.referrals.length ? (
            <Empty locale={locale} />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{m.company}</th>
                    <th>{m.provider}</th>
                    <th>{m.vehicles}</th>
                    <th>{m.status}</th>
                    <th>{m.sent_at}</th>
                    <th>{m.details}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.referrals.map((r) => (
                    <tr key={r.id}>
                      <td>{companyLink(r.company_id)}</td>
                      <td>{r.provider_name}</td>
                      <td>{r.estimated_vehicles}</td>
                      <td>
                        <Badge locale={locale} value={r.status} />
                      </td>
                      <td>
                        <DateText locale={locale} value={r.sent_at} />
                      </td>
                      <td>
                        <Link href={`${base}/referrals/${r.id}`} aria-label={m.details}>
                          <ArrowUpRight size={17} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </>
    );
  else if (section === 'referrals' && id) {
    const r = data.referrals.find((r) => r.id === id);
    if (!r) notFound();
    const terms = data.referralTerms.find((t) => t.referral_id === id);
    const actor = data.profiles.find((p) => p.id === r.created_by);
    content = (
      <>
        <PageHeading
          title={r.provider_name}
          body={companyName(r.company_id)}
          eyebrow={m.referrals}
        />
        {created && <div className="notice success">{m.referralCreated}</div>}
        <div className="details-grid">
          <Panel title={m.details}>
            <div className="panel-body">
              <InfoList
                locale={locale}
                items={[
                  [m.referralId, r.id],
                  [m.company, companyLink(r.company_id)],
                  [m.estimated_vehicles, r.estimated_vehicles],
                  [m.sent_at, <DateText key="d" locale={locale} value={r.sent_at} />],
                  [m.actor, actor ? `${actor.first_name} ${actor.last_name}` : r.created_by],
                ]}
              />
              {terms && (
                <>
                  <h3 className="small-heading" style={{ marginTop: 30 }}>
                    {m.termsInternal}
                  </h3>
                  <TermsDisplay locale={locale} terms={terms} />
                  <h3 className="small-heading" style={{ marginTop: 30 }}>
                    {m.shared_fields}
                  </h3>
                  <InfoList
                    locale={locale}
                    items={Object.entries(terms.disclosure || {}).map(([k, v]) => [
                      k,
                      String(v ?? '—'),
                    ])}
                  />
                </>
              )}
            </div>
          </Panel>
          <Panel title={m.status}>
            <div className="panel-body">
              <ActionForm
                action={updateReferralAction.bind(null, locale, id)}
                locale={locale}
                disabled={demo}
              >
                <Field name="status" locale={locale} options={referralStatuses} value={r.status} />
                <Field
                  name="customer_visible_notes"
                  locale={locale}
                  value={r.customer_visible_notes}
                  type="textarea"
                />
                <Checkbox
                  name="customer_visible"
                  locale={locale}
                  text="customer_visible"
                  checked={r.customer_visible}
                />
              </ActionForm>
            </div>
          </Panel>
        </div>
        <Panel title={m.contracts}>
          <div className="panel-body">
            {data.contracts
              .filter((c) => (c as typeof c & { referral_id: string }).referral_id === id)
              .map((c) => (
                <Link key={c.id} href={`${base}/contracts/${c.id}`}>
                  {c.contract_number} · {c.title}
                </Link>
              ))}
          </div>
        </Panel>
      </>
    );
  } else if (section === 'contracts' && !id)
    content = (
      <>
        <PageHeading title={m.contracts}>
          <Link className="button primary" href={`${base}/contracts/new`}>
            <Plus size={16} />
            {m.addContract}
          </Link>
        </PageHeading>
        <Panel>
          {!data.contracts.length ? (
            <Empty locale={locale} />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{m.title}</th>
                    <th>{m.company}</th>
                    <th>{m.status}</th>
                    <th>{m.valid_until}</th>
                    <th>{m.visibility}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.contracts.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link href={`${base}/contracts/${c.id}`}>
                          <strong>{c.title}</strong>
                          <small>{c.contract_number}</small>
                        </Link>
                      </td>
                      <td>{companyLink(c.company_id)}</td>
                      <td>
                        <Badge locale={locale} value={c.status} />
                      </td>
                      <td>
                        <DateText locale={locale} value={c.valid_until} />
                      </td>
                      <td>{c.customer_visible ? m.visible : m.internal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </>
    );
  else if (section === 'contracts' && id) {
    const c = data.contracts.find((c) => c.id === id);
    if (id !== 'new' && !c) notFound();
    content = (
      <>
        <PageHeading title={c?.title || m.addContract} />
        <Panel>
          <div className="panel-body">
            <ContractForm
              locale={locale}
              companies={data.companies}
              providers={data.providers}
              referrals={data.referrals}
              contract={c}
              terms={data.contractTerms.find((t) => t.contract_id === id)}
              disabled={demo}
            />
          </div>
        </Panel>
        {c && (
          <Panel title={m.uploadTitle}>
            <div className="panel-body">
              <UploadForm
                locale={locale}
                companies={data.companies}
                contracts={data.contracts}
                companyId={c.company_id}
                contractId={id}
                disabled={demo}
              />
              {data.documents
                .filter((d) => d.contract_id === id)
                .map((d) => (
                  <div className="record-meta" key={d.id}>
                    {demo ? (
                      d.title
                    ) : (
                      <a href={`/api/documents/${d.id}`} className="text-link">
                        <Download size={15} />
                        {d.title}
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </Panel>
        )}
      </>
    );
  } else if (section === 'documents')
    content = (
      <>
        <PageHeading title={m.documents} />
        <Panel title={m.uploadTitle}>
          <div className="panel-body">
            <UploadForm
              locale={locale}
              companies={data.companies}
              contracts={data.contracts}
              disabled={demo}
            />
          </div>
        </Panel>
        <Panel>
          {!data.documents.length ? (
            <Empty locale={locale} />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{m.title}</th>
                    <th>{m.company}</th>
                    <th>{m.visibility}</th>
                    <th>{m.edit}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.documents.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <strong>
                          {!demo && !d.archived_at ? (
                            <a href={`/api/documents/${d.id}`}>{d.title} ↗</a>
                          ) : (
                            d.title
                          )}
                        </strong>
                        <small>
                          <DateText locale={locale} value={d.created_at} />
                        </small>
                      </td>
                      <td>{companyLink(d.company_id)}</td>
                      <td>
                        {d.archived_at ? m.archived : d.customer_visible ? m.visible : m.internal}
                      </td>
                      <td>
                        <ActionForm
                          action={documentVisibilityAction.bind(null, locale, d.id)}
                          locale={locale}
                          disabled={demo}
                          className="compact"
                        >
                          <Checkbox
                            name="customer_visible"
                            locale={locale}
                            text="customer_visible"
                            checked={d.customer_visible}
                          />
                          <Checkbox
                            name="archive"
                            locale={locale}
                            text="archive"
                            checked={!!d.archived_at}
                          />
                        </ActionForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </>
    );
  else if (section === 'activities')
    content = (
      <>
        <PageHeading title={m.activities} />
        <Panel title={m.addActivity}>
          <div className="panel-body">
            <ActivityForm locale={locale} data={data} disabled={demo} />
          </div>
        </Panel>
        <Panel title={m.activities}>
          <div className="panel-body">
            {data.activities.map((a) => (
              <div className="activity-row" key={a.id}>
                <strong>
                  {companyLink(a.company_id)} · {label(locale, a.kind)}
                </strong>
                <p>{a.body}</p>
                <small>
                  <DateText locale={locale} value={a.created_at} />
                </small>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={m.audit}>
          <div className="panel-body">
            <p>{m.auditBody}</p>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{m.date}</th>
                  <th>{m.action}</th>
                  <th>{m.actor}</th>
                  <th>{m.entity}</th>
                  <th>{m.details}</th>
                </tr>
              </thead>
              <tbody>
                {data.audit.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <DateText locale={locale} value={a.created_at} />
                    </td>
                    <td>{a.action}</td>
                    <td>
                      {data.profiles.find((p) => p.id === a.actor_user_id)?.first_name ||
                        a.actor_user_id?.slice(0, 8) ||
                        '—'}
                    </td>
                    <td>
                      {a.entity_type}
                      <small>{a.entity_id}</small>
                    </td>
                    <td className="audit-metadata">{JSON.stringify(a.metadata)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </>
    );
  else if (section === 'settings')
    content = (
      <>
        <PageHeading title={m.settings} body={m.configurationDescription} />
        <Panel title={m.configurationTitle}>
          <div className="panel-body">
            <InfoList
              locale={locale}
              items={[
                [m.name, brand.name],
                [m.legal_name, brand.legalName || m.notSet],
                ['Domain', brand.domain || m.notSet],
                [m.email, brand.supportEmail || m.notSet],
              ]}
            />
          </div>
        </Panel>
        <Panel title={m.privacyRequests}>
          {!data.privacyRequests.length ? (
            <Empty locale={locale} />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{m.company}</th>
                    <th>{m.kind}</th>
                    <th>{m.created}</th>
                    <th>{m.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.privacyRequests.map((p) => (
                    <tr key={p.id}>
                      <td>{p.company_id ? companyLink(p.company_id) : p.user_id}</td>
                      <td>{label(locale, p.kind)}</td>
                      <td>
                        <DateText locale={locale} value={p.created_at} />
                      </td>
                      <td>
                        <ActionForm
                          locale={locale}
                          action={resolvePrivacyAction.bind(null, locale, p.id)}
                          disabled={demo}
                          className="compact"
                        >
                          <Field
                            name="status"
                            locale={locale}
                            options={['OPEN', 'IN_PROGRESS', 'COMPLETED', 'DECLINED']}
                            value={p.status}
                          />
                        </ActionForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <Panel title={m.emailLogs}>
          {!data.emailLogs.length ? (
            <Empty locale={locale} />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{m.recipient}</th>
                    <th>{m.template}</th>
                    <th>{m.status}</th>
                    <th>{m.attempts}</th>
                    <th>{m.details}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.emailLogs.map((e) => (
                    <tr key={e.id}>
                      <td>{e.recipient}</td>
                      <td>{e.template}</td>
                      <td>
                        <Badge locale={locale} value={e.status} />
                      </td>
                      <td>{e.attempt_count}</td>
                      <td>
                        {e.error_code || e.external_message_id || '—'}
                        <small>
                          <DateText locale={locale} value={e.created_at} />
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </>
    );
  else notFound();
  return (
    <Workspace
      locale={locale}
      admin
      demo={demo}
      active={section}
      name={`${data.profile.first_name} ${data.profile.last_name}`}
    >
      {content}
      {section !== 'companies' && !id && (
        <div className="page-actions">
          {page > 0 && (
            <Link className="button secondary" href={`${base}/${section}?page=${page - 1}`}>
              {m.back}
            </Link>
          )}
          {(page + 1) * 50 < (data.collectionCount || 0) && (
            <Link className="button secondary" href={`${base}/${section}?page=${page + 1}`}>
              {m.continue}
            </Link>
          )}
        </div>
      )}
    </Workspace>
  );
}
function CompanyTable({
  locale,
  companies,
  data,
  base,
}: {
  locale: Locale;
  companies: Company[];
  data: AdminData;
  base: string;
}) {
  const m = messages[locale];
  return !companies.length ? (
    <Empty locale={locale} />
  ) : (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>{m.company}</th>
            <th>{m.status}</th>
            <th>{m.fleet}</th>
            <th>{m.potential}</th>
            <th>{m.registered}</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c) => {
            const f = data.fleets.find((f) => f.company_id === c.id);
            return (
              <tr key={c.id}>
                <td>
                  <Link className="company-cell" href={`${base}/companies/${c.id}`}>
                    <span className="company-avatar">{initials(c.name)}</span>
                    <span>
                      <strong>{c.name}</strong>
                      <small>
                        {c.city} · {label(locale, c.company_type)}
                      </small>
                    </span>
                  </Link>
                </td>
                <td>
                  <Badge locale={locale} value={c.status} />
                </td>
                <td>{f?.current_vehicles ?? '—'}</td>
                <td>{f?.potential_vehicles ?? '—'}</td>
                <td>
                  <DateText locale={locale} value={c.created_at} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
function ActivityForm({
  locale,
  data,
  companyId,
  disabled,
}: {
  locale: Locale;
  data: AdminData;
  companyId?: string;
  disabled?: boolean;
}) {
  return (
    <ActionForm
      action={adminRecordAction.bind(null, locale, 'activity', null)}
      locale={locale}
      submit="addActivity"
      disabled={disabled}
    >
      {companyId ? (
        <input type="hidden" name="company_id" value={companyId} />
      ) : (
        <Field
          name="company_id"
          labelKey="company"
          locale={locale}
          choices={data.companies.map((c) => ({ value: c.id, label: c.name }))}
          value={data.companies[0]?.id}
          required
        />
      )}
      <Field
        name="kind"
        locale={locale}
        options={['NOTE', 'CALL', 'MEETING', 'EMAIL']}
        value="NOTE"
      />
      <Field name="body" locale={locale} type="textarea" required max={10000} />
    </ActionForm>
  );
}
function TermsDisplay({ locale, terms: t }: { locale: Locale; terms: Terms }) {
  return (
    <InfoList
      locale={locale}
      items={[
        ['customer_protection_months', t.customer_protection_months],
        ['commission_initial', `${t.commission_initial} %`],
        ['commission_recurring', `${t.commission_recurring} %`],
        [
          'commission_fixed',
          <Money key="m" locale={locale} currency={t.currency} value={t.commission_fixed} />,
        ],
        ['internal_notes', t.internal_notes],
      ]}
    />
  );
}
