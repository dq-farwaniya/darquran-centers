/* Authenticated center bridge. The server independently verifies center membership. */
(function(){'use strict';
 const raw=Storage.prototype;const get=raw.getItem,set=raw.setItem,remove=raw.removeItem;
 const token=get.call(sessionStorage,'dqmc:token')||'';
 const params=new URLSearchParams(location.search),center=params.get('center')||'';
 const ctx=JSON.parse(get.call(sessionStorage,'dqmc:context:'+center)||'null');
 if(!ctx||!token){location.replace('index.html');throw Error('CENTER_LOGIN_REQUIRED')}
 window.DQ_CENTER=ctx.center;const prefix='dqmc:'+center+':';
 const authKeys=new Set(['currentUser','loggedIn','dq_main_admin_token_v2','dq_wa_token_20261018']);
 const authPrefix=prefix+'account:'+ctx.account.id+':';
 raw.getItem=function(k){return get.call(authKeys.has(k)?sessionStorage:this,(authKeys.has(k)?authPrefix:prefix)+k)};
 raw.setItem=function(k,v){return set.call(authKeys.has(k)?sessionStorage:this,(authKeys.has(k)?authPrefix:prefix)+k,v)};
 raw.removeItem=function(k){return remove.call(authKeys.has(k)?sessionStorage:this,(authKeys.has(k)?authPrefix:prefix)+k)};
 // Preserve the old app's cross-tab notifications without leaking another center.
 window.addEventListener('storage',e=>{if(e.key?.startsWith(prefix)&&!e.key.startsWith(authPrefix)&&!authKeys.has(e.key.slice(prefix.length))){window.dispatchEvent(new StorageEvent('storage',{key:e.key.slice(prefix.length),oldValue:e.oldValue,newValue:e.newValue,url:e.url,storageArea:e.storageArea}))}});
 localStorage.setItem('currentUser',JSON.stringify(ctx.account));localStorage.setItem('loggedIn','yes');
 sessionStorage.setItem('dq_main_admin_token_v2',token);sessionStorage.setItem('dq_wa_token_20261018',token);
 function unifiedLogin(){const current=get.call(sessionStorage,'dqmc:token')||'';if(current&&current!==token){location.replace('index.html');return;}remove.call(sessionStorage,'dqmc:token');location.replace('index.html?expired=1')}
 function assertCurrentSession(){if(get.call(sessionStorage,'dqmc:token')!==token){location.replace('index.html');throw Error('SESSION_CHANGED')}}
 async function validateHubSession(){try{assertCurrentSession();await rpc('dqmc_open_center',{p_token:token,p_center:center});window.dqAdminToken2026=token;window.dqWaToken20261018=token;const screen=document.getElementById('loginScreen');if(screen)screen.style.display='none';}catch(e){if(e.message==='SESSION_EXPIRED')unifiedLogin();else console.error('Center session verification:',e.message)}}
 const realFetch=window.fetch.bind(window),c=window.DQMC_CONFIG,docs=new Map();
 async function rpc(name,args){assertCurrentSession();const r=await realFetch(c.url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:c.key,Authorization:'Bearer '+c.key,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(30000)});const data=await r.json();assertCurrentSession();if(!r.ok||data?.error){const message=data?.message||data?.error||'SERVER_ERROR';if(message==='SESSION_EXPIRED')unifiedLogin();throw Error(message)}return data;}
 const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
 window.fetch=async function(input,init={}){
  const u=new URL(typeof input==='string'?input:input.url,location.href);
  if(u.origin!==c.url)return realFetch(input,init);
  try{
   const method=String(init.method||'GET').toUpperCase();
   if(u.pathname==='/rest/v1/dar_quran_data'){
    if(method==='GET'){
     const id=(u.searchParams.get('id')||'').replace(/^eq\./,'');const cache=docs.get(id);
     if(cache&&Date.now()-cache.at<5000)return response(cache.rows);
     const result=await rpc('dqmc_read_data',{p_token:token,p_center:center,p_id:id,p_stamp:cache?.rows?.[0]?.updated_at||null});
     const rows=result.unchanged?cache.rows:result.rows;docs.set(id,{rows,at:Date.now()});return response(rows);
    }
    if(!['PATCH','POST'].includes(method))throw Error('METHOD_DENIED');
    const b=JSON.parse(init.body||'{}');const id=b.id||(u.searchParams.get('id')||'').replace(/^eq\./,'');
    const stamp=(u.searchParams.get('updated_at')||'').replace(/^eq\./,'')||null;
    const result=await rpc('dqmc_write_data',{p_token:token,p_center:center,p_id:id,p_stamp:stamp,p_data:b.data});
    if(result.length)docs.set(id,{rows:result,at:0});else docs.delete(id);return response(result);
   }
   if(u.pathname.startsWith('/rest/v1/rpc/')){
    const op=u.pathname.split('/').pop();if(op.startsWith('dqmc_'))throw Error('BRIDGE_DIRECT_CALL_DENIED');
    const result=await rpc('dqmc_center_rpc',{p_token:token,p_center:center,p_op:op,p_args:JSON.parse(init.body||'{}')});return response(result);
   }
   throw Error('ENDPOINT_DENIED');
  }catch(e){return response({message:String(e.message)},400)}
 };
 window.addEventListener('pageshow',event=>{if(event.persisted)location.reload()});
 if(navigator.locks){const request=navigator.locks.request.bind(navigator.locks);navigator.locks.request=(name,...args)=>request(prefix+name,...args)}
 window.addEventListener('DOMContentLoaded',()=>{
  window.logout=unifiedLogin;
  window.expireMainAdmin2026=validateHubSession;
  window.doLogin=()=>location.replace('index.html');
  const previous=window.show;window.show=function(id){if(id==='permissions'){location.href='index.html?permissions=1&center='+encodeURIComponent(center);return;}return previous.apply(this,arguments)};
  const bar=document.createElement('div');bar.style.cssText='padding:12px;background:#fff4d6;display:flex;gap:15px;align-items:center;flex-wrap:wrap';
  const b=document.createElement('button');b.textContent='← إدارة المراكز والإعدادات';b.onclick=()=>location.href='index.html';bar.append(b);
  const txt=document.createElement('strong');txt.textContent=ctx.center.name+' — الحساب الحالي: '+ctx.account.name;bar.append(txt);document.body.prepend(bar);
  document.querySelectorAll('#trialImport2026').forEach(e=>e.hidden=true);
  if(ctx.account.role==='edit'){window.dqWaToken20261018=token;}
 });
})();
