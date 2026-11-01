window.DQMC_CONFIG=Object.freeze({url:'https://epcbxnfouempccysckhz.supabase.co',key:'sb_publishable_gdrF9S7VFmhwlY1ia0MVCw__RJHGgMh'});

/* Display and browser-form privacy settings; no saved center data is changed. */
(function(){
 'use strict';
 const title='إدارة المراكز لجدول الحصص';
 const center=new URLSearchParams(location.search).get('center');
 const protectedTypes=new Set(['password','hidden','checkbox','radio','button','submit','reset','file']);
 function prepareField(el){
  if(!center||!el.matches('input,textarea')||protectedTypes.has(el.type)||el.closest('#loginScreen'))return;
  // Stable center-specific browser form identity, without changing DOM IDs used by the app.
  // This is a browser autofill hint, not a substitute for server-side center isolation.
  const identity=el.id||el.getAttribute('name');
  if(!identity)return;
  if(!el.dataset.dqmcOriginalField)el.dataset.dqmcOriginalField=identity;
  el.setAttribute('autocomplete','off');
  el.setAttribute('name','dqmc-'+center+'-'+el.dataset.dqmcOriginalField);
 }
 function prepareTree(node){
  if(node.nodeType!==1)return;
  prepareField(node);
  node.querySelectorAll('input,textarea').forEach(prepareField);
 }
 function start(){
  if(document.documentElement.dataset.dqmcPresentationReady==='20261101')return;
  document.documentElement.dataset.dqmcPresentationReady='20261101';
  if(document.getElementById('dashboard')&&document.getElementById('loginForm')){
   document.title=title;
   const heading=document.querySelector('body > header h1');if(heading)heading.textContent=title;
   const footer=document.querySelector('body > footer');if(footer)footer.textContent=title+' — محافظة الفروانية';
  }
  if(!center||!document.getElementById('teacherModal'))return;
  prepareTree(document.documentElement);
  const observer=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(prepareTree)));
  observer.observe(document.body,{childList:true,subtree:true});
  // Handle controls whose browser-fill attributes are changed when an editor opens.
  document.addEventListener('focusin',event=>prepareField(event.target));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
