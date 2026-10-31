'use strict';
const $=id=>document.getElementById(id),esc=DQMC.escape;
let state={centers:[],superadmin:false},accounts=[],editingVersion=null,centerContext=null,loginBusy=false;
const centerRoute=new URLSearchParams(location.search).get('permissions')==='1'?new URLSearchParams(location.search).get('center'):null;
const scopes={schedule:'الجدول',daily:'الجدول اليومي',teachers:'المعلمات',admins:'الإداريات',subjects:'المواد',reserve:'الاحتياط',staffMovement:'حركة الدوام',leaves:'حصر الإجازات',leaveLedger:'ملخص الإجازات'};
function notice(text,error=false){$('notice').textContent=text;$('notice').className=error?'error':'ok'}
async function run(fn){const bs=[...document.querySelectorAll('button')];bs.forEach(b=>b.disabled=true);try{await fn()}catch(e){if(e.message==='SESSION_CHANGED')return;notice(DQMC.message(e),true);if(String(e.message).includes('SESSION_EXPIRED')&&e.requestToken===DQMC.token()){sessionStorage.removeItem('dqmc:token');$('dashboard').hidden=true;$('accountPanel').hidden=true;$('login').hidden=false;}}finally{bs.forEach(b=>b.disabled=false)}}
async function load(){state=await DQMC.rpc('dqmc_centers',{p_token:DQMC.token()});$('login').hidden=true;$('dashboard').hidden=false;$('identity').textContent=state.username+(state.superadmin?' — المسؤول العام':'');$('addCenter').hidden=$('accounts').hidden=!state.superadmin;
 $('centers').innerHTML=state.centers.length?state.centers.map(c=>`<article class="card"><small>مركز مستقل</small><h3>${esc(c.name)}</h3><p class="muted">${esc(c.footer||'جدول الحصص وحركة الدوام والاحتياط')}</p><div class="toolbar"><button data-open="${c.id}">فتح المركز ←</button><button class="secondary" data-settings="${c.id}">الإعدادات</button></div></article>`).join(''):'<div class="panel">لا توجد مراكز مضافة أو مسموحة لهذا الحساب بعد.</div>';
 if(centerRoute){const ctx=await DQMC.rpc('dqmc_open_center',{p_token:DQMC.token(),p_center:centerRoute});centerContext=ctx.center;document.querySelector('header h1').textContent='صلاحيات المركز';document.querySelector('header p').textContent=centerContext.name;await loadAccounts();return;}
 if(state.superadmin){const u=await DQMC.rpc('dqmc_usage',{p_token:DQMC.token()});$('usage').textContent=`المراكز: ${u.centers} | الحسابات: ${u.accounts} | حجم قاعدة البيانات الحالية: ${(u.database_bytes/1024/1024).toFixed(1)} ميجابايت — هذا قياس فعلي وليس تقديرًا للسعة المتبقية.`;}}
$('loginForm').onsubmit=e=>{e.preventDefault();if(loginBusy)return;loginBusy=true;run(async()=>{const r=await DQMC.rpc('dqmc_login',{p_user:$('username').value.trim(),p_password:$('password').value});sessionStorage.setItem('dqmc:token',r.token);$('password').value='';notice('تم الدخول باسم '+r.username);await load()}).finally(()=>{loginBusy=false})};
$('logout').onclick=()=>run(async()=>{await DQMC.rpc('dqmc_logout',{p_token:DQMC.token()});sessionStorage.removeItem('dqmc:token');location.reload()});
$('refresh').onclick=()=>run(load);
function editCenter(c){$('centerId').value=c?.id||'';editingVersion=c?.version??null;$('centerName').value=c?.name||'';$('centerShort').value=c?.short_name||'';$('centerFooter').value=c?.footer||'';$('centerRetention').value=c?.retention_days||'';$('centerHeading').textContent=c?'إعدادات المركز':'إضافة مركز فارغ';$('centerDialog').showModal()}
$('addCenter').onclick=()=>editCenter(null);
$('centers').onclick=e=>{const op=e.target.closest('[data-open]'),st=e.target.closest('[data-settings]');if(op)location.href='app.html?center='+encodeURIComponent(op.dataset.open);if(st)editCenter(state.centers.find(c=>c.id===st.dataset.settings))};
$('centerForm').onsubmit=e=>{e.preventDefault();run(async()=>{await DQMC.rpc('dqmc_save_center',{p_token:DQMC.token(),p_id:$('centerId').value||null,p_name:$('centerName').value.trim(),p_short_name:$('centerShort').value.trim(),p_footer:$('centerFooter').value.trim(),p_retention_days:Number($('centerRetention').value)||null,p_expected_version:editingVersion});$('centerDialog').close();await load();notice('حُفظ المركز. الحذف التلقائي للأرشيف يظل معطّلًا.')})};
async function loadAccounts(){
 if(centerContext){
  const result=await DQMC.rpc('dqmc_center_accounts',{p_token:DQMC.token(),p_center:centerContext.id});
  accounts=result.accounts.map(a=>({...a,memberships:[{center_id:centerContext.id,role:a.role,scopes:a.scopes}]}));
  $('accountsHeading').textContent='الصلاحيات — '+result.center_name;
  $('accountsHelp').textContent='حسابات هذا المركز فقط. يمكنك إضافة حساب وتحديد صلاحياته أو إلغاء دخوله لهذا المركز. الحساب المشترك تُعدل بيانات دخوله من الإدارة العامة.';
  $('closeAccounts').textContent='← العودة إلى المركز';
 }else{
  accounts=await DQMC.rpc('dqmc_accounts',{p_token:DQMC.token()});
  $('accountsHeading').textContent='الحسابات والصلاحيات — الإدارة العامة';
 }
 $('accountPanel').hidden=false;$('dashboard').hidden=true;
 $('accountList').innerHTML=accounts.length?accounts.map(a=>`<div class="account-row"><div><b>${esc(a.username)}</b><p class="muted">${centerContext?(a.role==='admin'?'مسؤول المركز':a.role==='edit'?'تعديل حسب الأقسام':'مشاهدة')+(a.active?'':' — الحساب معطّل من الإدارة العامة'):(a.superadmin?'مسؤول عام':a.active?'مفعّل':'معطّل')+' — '+a.memberships.length+' مراكز'}</p></div>${a.superadmin||a.editable===false?'<span class="muted">حساب محمي</span>':`<button data-account="${a.id}" class="secondary">تعديل</button>`}</div>`).join(''):'<p class="muted">لا توجد حسابات إضافية في هذا المركز. وصول المسؤول العام محفوظ تلقائيًا.</p>';
}
$('accounts').onclick=()=>run(loadAccounts);
$('closeAccounts').onclick=()=>{if(centerContext){location.href='app.html?center='+encodeURIComponent(centerContext.id);return;}$('accountPanel').hidden=true;$('dashboard').hidden=false};
function editAccount(a){
 $('accountId').value=a?.id||'';$('accountName').value=a?.username||'';$('accountPassword').value='';
 const locked=!!(centerContext&&a&&!a.credentials_editable);
 $('accountName').readOnly=locked;$('accountPassword').disabled=locked;
 $('accountActive').checked=centerContext?true:(a?.active??true);
 $('activeLabel').textContent=centerContext?'السماح بالدخول لهذا المركز':'الحساب مفعّل';
 $('accountHeading').textContent=centerContext?'حساب داخل '+centerContext.name:'حساب إداري';
 $('accountHelp').textContent=locked?'هذا الحساب مشترك أو تابع للإدارة العامة. عدّل صلاحياته في هذا المركز فقط؛ بيانات الدخول محمية.':centerContext?'الحساب الجديد يتبع هذا المركز فقط. إلغاء السماح يزيل صلاحية المركز دون حذف بيانات الموظفات.':'';
 const centers=centerContext?[centerContext]:state.centers;
 $('membershipFields').innerHTML=centers.map(c=>{const m=a?.memberships.find(m=>m.center_id===c.id);return `<div class="membership" data-center="${c.id}"><label class="check"><input class="selected" type="checkbox" ${m||centerContext?'checked':''} ${centerContext?'disabled':''}>${esc(c.name)}</label><select class="role"><option value="admin" ${m?.role==='admin'?'selected':''}>مسؤول المركز — جميع صلاحياته</option><option value="edit" ${!m||m.role==='edit'?'selected':''}>إدارية — تعديل حسب الأقسام</option><option value="view" ${m?.role==='view'?'selected':''}>مشاهدة داخل المركز</option></select><p class="roleHelp muted"></p><div class="scopes">${Object.entries(scopes).map(([key,label])=>`<label class="check"><input type="checkbox" value="${key}" ${m?.scopes.includes(key)?'checked':''}>${label}</label>`).join('')}</div></div>`}).join('');
 document.querySelectorAll('.membership').forEach(el=>{el.querySelector('.role').onchange=()=>updateMembershipControls(el);updateMembershipControls(el)});
 $('accountDialog').showModal();
}
function updateMembershipControls(el){const role=el.querySelector('.role').value;el.querySelector('.scopes').hidden=role!=='edit';el.querySelector('.roleHelp').textContent=role==='admin'?'جميع الأقسام والصلاحيات داخل هذا المركز. تحديد الأقسام متاح عند اختيار إدارية.':role==='view'?'مشاهدة بيانات المركز دون تعديل.':'اختاري الأقسام المسموح بتعديلها لهذا الحساب.';}
$('addAccount').onclick=()=>editAccount(null);
$('accountList').onclick=e=>{const b=e.target.closest('[data-account]');if(b)editAccount(accounts.find(a=>a.id===b.dataset.account))};
$('accountForm').onsubmit=e=>{e.preventDefault();run(async()=>{
 const memberships=[...document.querySelectorAll('.membership')].filter(el=>el.querySelector('.selected').checked).map(el=>({center_id:el.dataset.center,role:el.querySelector('.role').value,scopes:el.querySelector('.role').value==='edit'?[...el.querySelectorAll('.scopes input:checked')].map(i=>i.value):[]}));
 if(centerContext){
  const a=accounts.find(a=>a.id===$('accountId').value),m=memberships[0];
  if(!m)throw Error('INVALID_ACCOUNT');
  if(a&&!$('accountActive').checked&&!confirm('إلغاء دخول هذا الحساب إلى '+centerContext.name+'؟ بيانات المركز تبقى محفوظة.'))return;
  await DQMC.rpc('dqmc_save_center_account',{p_token:DQMC.token(),p_center:centerContext.id,p_id:$('accountId').value||null,p_username:$('accountName').value.trim(),p_password:$('accountPassword').value,p_enabled:$('accountActive').checked,p_role:m.role,p_scopes:m.scopes,p_expected_version:a?.edit_version||null});
 }else{
  await DQMC.rpc('dqmc_save_account',{p_token:DQMC.token(),p_id:$('accountId').value||null,p_username:$('accountName').value.trim(),p_password:$('accountPassword').value,p_active:$('accountActive').checked,p_memberships:memberships});
 }
 $('accountDialog').close();await loadAccounts();notice(centerContext?'حُفظت صلاحيات هذا المركز.':'حُفظ الحساب وصلاحيات مراكزه.');
})};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
if(DQMC.token())run(load);

if(new URLSearchParams(location.search).get('expired')==='1'&&!DQMC.token())notice('سجّلي الدخول هنا بحسابك المخصص للمركز.');
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload()});
