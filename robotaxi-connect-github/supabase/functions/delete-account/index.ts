// Supabase Edge runtime. Secrets are supplied by Supabase, never by the browser.
// @ts-ignore Deno resolves npm specifiers in the Edge runtime.
import { createClient } from 'npm:@supabase/supabase-js@2.116.0';
declare const Deno: { env: {get(name:string):string|undefined}; serve(handler:(request:Request)=>Promise<Response>):void };
Deno.serve(async(request:Request)=>{
 const headers={'Content-Type':'application/json','Cache-Control':'no-store'};
 const reply=(body:object,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(request.method!=='POST') return reply({error:'METHOD_NOT_ALLOWED'},405);
 const authorization=request.headers.get('Authorization');
 if(!authorization?.startsWith('Bearer ')) return reply({error:'UNAUTHORIZED'},401);
 try {
  const body=await request.json();
  if(body.confirm!==true) return reply({error:'CONFIRMATION_REQUIRED'},400);
  const url=Deno.env.get('SUPABASE_URL')!;
  const caller=createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:auth,error:authError}=await caller.auth.getUser(authorization.slice(7));
  if(authError||!auth.user) return reply({error:'UNAUTHORIZED'},401);
  // The RPC checks account role, verified email, recent password authentication and sole membership.
  const prepared=await caller.rpc('prepare_account_deletion');
  if(prepared.error) return reply({error:'REAUTH_OR_ACCOUNT_CHECK_FAILED'},403);
  const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const manifest=await admin.rpc('account_deletion_files',{uid:auth.user.id});
  if(manifest.error||!Array.isArray(manifest.data)) return reply({error:'DELETION_INCOMPLETE'},503);
  for(let i=0;i<manifest.data.length;i+=100) {
   const removed=await admin.storage.from('company-files').remove(manifest.data.slice(i,i+100));
   if(removed.error) return reply({error:'DELETION_INCOMPLETE'},503);
  }
  const finished=await caller.rpc('finish_account_deletion');
  if(finished.error) return reply({error:'DELETION_INCOMPLETE'},503);
  return reply({deleted:true});
 } catch { return reply({error:'DELETION_INCOMPLETE'},503); }
});
