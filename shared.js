'use strict';
window.DQMC={
 async rpc(name,args){
  const snapshot=this.token(),tracked=args?.p_token!==undefined||name==='dqmc_login';
  if(args?.p_token!==undefined&&args.p_token!==snapshot)throw Error('SESSION_CHANGED');
  const c=window.DQMC_CONFIG;const r=await fetch(c.url+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:c.key,Authorization:'Bearer '+c.key,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(30000)});const data=await r.json();
  if(tracked&&snapshot!==this.token())throw Error('SESSION_CHANGED');
  if(!r.ok||data?.error){const e=Error(data?.error||data?.message||'SERVER_ERROR');e.requestToken=args?.p_token;throw e;}return data;
 },
 token(){return sessionStorage.getItem('dqmc:token')||''},
 escape(v){return String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));},
 message(e){const s=String(e?.message||e);const msgs={CENTER_NOT_EMPTY:'لا يمكن حذف المركز؛ توجد بيانات أو جداول أو أرشيف محفوظ.',CENTER_HAS_ACCOUNTS:'لا يمكن حذف المركز؛ توجد حسابات أو صلاحيات مرتبطة به. أزيليها أولًا من إدارة الحسابات.',CENTER_UNAVAILABLE:'المركز غير متاح أو حُذف. حدّثي قائمة المراكز.',CONFIRMATION_REQUIRED:'لم يطابق التأكيد المطلوب؛ لم يُحذف شيء.',ACCOUNT_NOT_FOUND:'الحساب غير موجود؛ حدّثي القائمة.',SESSION_EXPIRED:'انتهت جلسة الدخول. سجّلي الدخول مجددًا.',INVALID_LOGIN:'اسم المستخدم أو كلمة المرور غير صحيحة.',LOGIN_RATE_LIMIT:'محاولات دخول كثيرة. انتظري ١٥ دقيقة.',SUPERADMIN_REQUIRED:'هذه العملية للمسؤول العام فقط.',CENTER_ACCESS_DENIED:'هذا المركز غير مسموح لهذا الحساب.',VERSION_CONFLICT:'عدّل مستخدم آخر البيانات. حدّثي الصفحة قبل الحفظ.',PASSWORD_MIN_8:'كلمة المرور للحساب الإداري لا تقل عن ٨ أحرف.',MANAGER_REQUIRED:'إدارة حسابات المركز متاحة لمسؤول المركز فقط.',ACCOUNT_PROTECTED:'لا يمكن تعديل حسابك الحالي أو حساب المسؤول العام هنا.',SHARED_ACCOUNT_PROTECTED:'هذا الحساب مرتبط بالإدارة العامة أو بمراكز أخرى؛ يمكن تعديل صلاحياته في هذا المركز فقط.',SCOPE_DENIED:'ليست لديك صلاحية تنفيذ هذه العملية.',SUPERADMIN_ACCOUNT_PROTECTED:'حساب المسؤول العام محمي من التعديل هنا.'};return Object.entries(msgs).find(([k])=>s.includes(k))?.[1]||('تعذر إكمال العملية: '+s);}
};
