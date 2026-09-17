'use client';
import { useActionState } from 'react';
import { accountAction, type AccountState } from '@/app/actions/account';
export function AccountForm({kind,locale,submit,children}:{kind:string;locale:'de'|'en';submit:string;children:React.ReactNode}) {
 const [state,action,pending]=useActionState(accountAction.bind(null,kind,locale),{} as AccountState);
 return <form action={action} className="action-form"><fieldset disabled={pending}>{children}</fieldset>{state.error&&<p className="notice error" role="alert">{state.error}</p>}{state.success&&<p className="notice success" role="status">{state.success}</p>}<button type="submit" className={`button ${kind==='delete'?'danger':'primary'}`} disabled={pending}>{pending?(locale==='de'?'Wird bearbeitet …':'Processing …'):submit}</button></form>;
}
