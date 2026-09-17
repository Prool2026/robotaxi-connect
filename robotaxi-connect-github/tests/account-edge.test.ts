import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';
const file=new URL('../supabase/functions/delete-account/index.ts',import.meta.url);
async function service(options:{authError?:boolean;prepareError?:boolean;fileError?:boolean}={}) {
 const source=(await readFile(file,'utf8')).replace(/import \{ createClient \} from [^;]+;/,'');
 const calls:string[]=[]; let handler!:(request:Request)=>Promise<Response>;
 const caller={auth:{getUser:async()=>({data:{user:options.authError?null:{id:'self'}},error:options.authError})},rpc:async(name:string)=>{calls.push(name);return {error:options.prepareError&&name==='prepare_account_deletion'};}};
 const admin={rpc:async(name:string,args:{uid:string})=>{calls.push(`${name}:${args.uid}`);return {data:['companies/self/file.pdf']};},storage:{from:()=>({remove:async()=>{calls.push('remove_storage');return {error:options.fileError};}})}};
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText,{Request,Response,createClient:(_url:string,key:string)=>key==='service'?admin:caller,Deno:{env:{get:(name:string)=>name==='SUPABASE_SERVICE_ROLE_KEY'?'service':'public'},serve:(fn:typeof handler)=>{handler=fn;}}});
 return {calls,run:(body:object={confirm:true,userId:'other-user'})=>handler(new Request('https://example.test/delete',{method:'POST',headers:{Authorization:'Bearer token','Content-Type':'application/json'},body:JSON.stringify(body)}))};
}
test('account erasure service authenticates and ignores caller-supplied target IDs',async()=>{
 const s=await service(); const response=await s.run();
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),{deleted:true});
 assert.deepEqual(s.calls,['prepare_account_deletion','account_deletion_files:self','remove_storage','finish_account_deletion']);
});
test('storage failure never deletes the auth account; invalid auth never prepares deletion',async()=>{
 const s=await service({fileError:true}); assert.equal((await s.run()).status,503); assert.ok(!s.calls.includes('finish_account_deletion'));
 const invalid=await service({authError:true}); assert.equal((await invalid.run()).status,401); assert.deepEqual(invalid.calls,[]);
 const stale=await service({prepareError:true}); assert.equal((await stale.run()).status,403); assert.deepEqual(stale.calls,['prepare_account_deletion']);
 const absent=await service(); assert.equal((await absent.run({})).status,400); assert.deepEqual(absent.calls,[]);
});
