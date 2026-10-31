(function(){'use strict';
 const center=new URLSearchParams(location.search).get('center'),c=window.DQMC_CONFIG;
 if(!center)throw Error('CENTER_REQUIRED');const realFetch=fetch.bind(window);
 const get=Storage.prototype.getItem,set=Storage.prototype.setItem,remove=Storage.prototype.removeItem,prefix='dqmc:staff:'+center+':';
 Storage.prototype.getItem=function(k){return get.call(this,prefix+k)};Storage.prototype.setItem=function(k,v){return set.call(this,prefix+k,v)};Storage.prototype.removeItem=function(k){return remove.call(this,prefix+k)};
 window.fetch=async function(input,init={}){const u=new URL(typeof input==='string'?input:input.url,location.href);if(u.origin!==c.url)return realFetch(input,init);if(!u.pathname.startsWith('/rest/v1/rpc/dq_trial_'))throw Error('ENDPOINT_DENIED');const op=u.pathname.split('/').pop();const r=await realFetch(c.url+'/rest/v1/rpc/dqmc_staff_rpc',{method:'POST',headers:{apikey:c.key,Authorization:'Bearer '+c.key,'Content-Type':'application/json'},body:JSON.stringify({p_center:center,p_op:op,p_args:JSON.parse(init.body||'{}')})});const data=await r.json();return new Response(JSON.stringify(data),{status:data?.error?400:r.status,headers:{'Content-Type':'application/json'}})};
})();
