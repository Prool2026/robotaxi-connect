import { AccountSettings } from './account-settings';
import Link from 'next/link';
import { ArrowUpRight, CarFront, GitBranch, FileText, Download, ShieldCheck } from 'lucide-react';
import type { PortalData } from '@/lib/data';
import type { Locale } from '@/lib/domain';
import { messages, label } from '@/i18n/messages';
import { Workspace, PageHeading, Kpi, Panel, Badge, DateText, Empty, InfoList } from './workspace';
import { CompanyForm } from './company-form';
import { ActionForm } from './action-form';
import { Field, Checkbox } from './fields';
import { profileAction, privacyAction } from '@/app/actions/business';
export const portalSections = [
  '',
  'profile',
  'fleet',
  'referrals',
  'contracts',
  'documents',
  'account',
];
export function PortalScreen({
  locale,
  section,
  data,
  demo = false,
}: {
  locale: Locale;
  section: string;
  data: PortalData;
  demo?: boolean;
}) {
  const m = messages[locale];
  const { company: c, fleet: f, profile } = data;
  const base = `/${locale}/${demo ? 'demo/' : ''}portal`;
  return (
    <Workspace locale={locale} demo={demo} active={section} name={c.name}>
      {!section ? (
        <>
          <PageHeading
            title={`${m.welcome}, ${profile.first_name}.`}
            body={m.dashboardBody}
            eyebrow={c.name}
          >
            <Link className="button secondary" href={`${base}/profile`}>
              {m.updateProfile}
              <ArrowUpRight size={15} />
            </Link>
          </PageHeading>
          <div className="kpi-grid">
            <Kpi
              title={m.current_vehicles}
              value={f.current_vehicles}
              foot={m.vehicles}
              icon={CarFront}
            />
            <Kpi
              title={m.potential_vehicles}
              value={f.potential_vehicles}
              foot={label(locale, f.timeline)}
              icon={CarFront}
              featured
            />
            <Kpi title={m.referrals} value={data.referrals.length} icon={GitBranch} />
            <Kpi title={m.contracts} value={data.contracts.length} icon={FileText} />
          </div>
          <div className={`notice ${c.approved_at ? 'success' : 'warning'}`}>
            <strong>{c.approved_at ? m.approvedTitle : m.pendingTitle}</strong>
            {c.approved_at ? m.approvedBody : m.pendingBody}
          </div>
          <div className="dashboard-columns">
            <Panel title={m.referrals} link={{ href: `${base}/referrals`, label: m.viewAll }}>
              <ReferralList locale={locale} data={data} />
            </Panel>
            <Panel title={m.nextSteps}>
              <div className="panel-body">
                <ShieldCheck size={26} strokeWidth={1.3} />
                <p style={{ marginTop: 16 }}>{m.nextStepsBody}</p>
                <Link className="button secondary" href={`${base}/fleet`}>
                  {m.fleetDetails}
                  <ArrowUpRight size={15} />
                </Link>
              </div>
            </Panel>
          </div>
          <Panel title={m.companyDetails}>
            <div className="panel-body">
              <InfoList
                locale={locale}
                items={[
                  [m.name, c.name],
                  [m.companyStatus, <Badge key="status" locale={locale} value={c.status} />],
                  [m.city, c.city],
                  [m.registered, <DateText key="date" locale={locale} value={c.created_at} />],
                ]}
              />
            </div>
          </Panel>
        </>
      ) : section === 'profile' || section === 'fleet' ? (
        <>
          <PageHeading
            title={section === 'fleet' ? m.fleetDetails : m.profile}
            body={m.companyBody}
          />
          <Panel>
            <div className="panel-body">
              <CompanyForm locale={locale} company={c} fleet={f} disabled={demo} />
            </div>
          </Panel>
        </>
      ) : section === 'referrals' ? (
        <>
          <PageHeading title={m.referrals} body={m.dashboardBody} />
          <Panel>
            <ReferralList locale={locale} data={data} />
          </Panel>
        </>
      ) : section === 'contracts' ? (
        <>
          <PageHeading title={m.contracts} />
          {!data.contracts.length ? (
            <Panel>
              <Empty locale={locale} />
            </Panel>
          ) : (
            <div className="record-list">
              {data.contracts.map((contract) => {
                const docs = data.documents.filter((d) => d.contract_id === contract.id);
                return (
                  <Panel key={contract.id} title={contract.title}>
                    <div className="panel-body">
                      <InfoList
                        locale={locale}
                        items={[
                          [m.contract_number, contract.contract_number],
                          [m.status, <Badge key="s" locale={locale} value={contract.status} />],
                          [
                            m.valid_from,
                            <DateText key="f" locale={locale} value={contract.valid_from} />,
                          ],
                          [
                            m.valid_until,
                            <DateText key="t" locale={locale} value={contract.valid_until} />,
                          ],
                          [
                            m.signed_at,
                            <DateText key="d" locale={locale} value={contract.signed_at} />,
                          ],
                          [m.notes, contract.customer_visible_notes],
                        ]}
                      />
                      {docs.map((d) => (
                        <div key={d.id} className="record-meta">
                          {demo ? (
                            <span>
                              {d.title} · {m.demo}
                            </span>
                          ) : (
                            <a className="button secondary" href={`/api/documents/${d.id}`}>
                              <Download size={15} />
                              {d.title}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </>
      ) : section === 'documents' ? (
        <>
          <PageHeading title={m.documents} />
          <Panel>
            {!data.documents.length ? (
              <Empty locale={locale} />
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{m.title}</th>
                      <th>{m.created}</th>
                      <th>{m.documentSize}</th>
                      <th>{m.download}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.documents.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <strong>{d.title}</strong>
                          <small>{d.mime_type}</small>
                        </td>
                        <td>
                          <DateText locale={locale} value={d.created_at} />
                        </td>
                        <td>{(d.size_bytes / 1024).toFixed(0)} KB</td>
                        <td>
                          {demo ? (
                            '—'
                          ) : (
                            <a className="text-link" href={`/api/documents/${d.id}`}>
                              <Download size={15} />
                              {m.download}
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      ) : (
        <>
          <PageHeading title={m.accountTitle} body={m.accountBody} />
          <fieldset disabled={demo}><AccountSettings locale={locale} profile={profile} email={c.email} /></fieldset>
        </>
      )}
    </Workspace>
  );
}
function ReferralList({ locale, data }: { locale: Locale; data: PortalData }) {
  const m = messages[locale];
  return !data.referrals.length ? (
    <Empty locale={locale} />
  ) : (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>{m.provider}</th>
            <th>{m.status}</th>
            <th>{m.sent_at}</th>
          </tr>
        </thead>
        <tbody>
          {data.referrals.map((r) => (
            <tr key={r.id}>
              <td>
                <strong>{r.provider_name}</strong>
                {r.customer_visible_notes && <small>{r.customer_visible_notes}</small>}
              </td>
              <td>
                <Badge locale={locale} value={r.status} />
              </td>
              <td>
                <DateText locale={locale} value={r.sent_at} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
