const STORAGE_KEY = 'tumorboard_urology_cases_v1';
const fields = ['caseId','patientIdentifier','tumorBoardDate','age','sex','diagnosis','status','comorbidities','clinicalSummary','labs','imagingSummary','procedureHistory','pathology','tnmStage','tumorBoardQuestion','mdtDecision'];
let cases = loadCases();
let selectedId = null;

const $ = id => document.getElementById(id);
const form = $('caseForm');

function loadCases(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []}catch{return []} }
function saveCases(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(cases)); $('saveStatus').textContent='Saved'; setTimeout(()=> $('saveStatus').textContent='', 1200); }
function uid(){ return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()); }
function getFormData(){ const data={}; fields.forEach(f=>data[f]=$(f).value.trim()); data.id=data.caseId || uid(); data.updatedAt=new Date().toISOString(); delete data.caseId; return data; }
function setFormData(c={}){ fields.forEach(f=>$(f).value = f==='caseId' ? (c.id||'') : (c[f]||'')); $('formHeading').textContent = c.id ? 'Редактирование кейса' : 'Новый кейс'; selectedId=c.id||null; renderList(); }
function clearForm(){ setFormData({status:'New'}); }

function renderList(){
  const q=$('searchInput').value.toLowerCase(); const diag=$('filterDiagnosis').value;
  const list=$('caseList'); list.innerHTML='';
  const filtered=cases.filter(c=>{
    const text=Object.values(c).join(' ').toLowerCase();
    return (!q || text.includes(q)) && (!diag || c.diagnosis===diag);
  }).sort((a,b)=>(b.tumorBoardDate||'').localeCompare(a.tumorBoardDate||''));
  if(!filtered.length){ list.innerHTML='<p class="meta">Кейсов пока нет.</p>'; return; }
  for(const c of filtered){
    const node=$('caseItemTemplate').content.cloneNode(true); const art=node.querySelector('article');
    art.classList.toggle('active', c.id===selectedId);
    node.querySelector('h3').textContent=`${c.patientIdentifier || 'No ID'} · ${c.diagnosis || 'Diagnosis'}`;
    node.querySelector('.meta').textContent=`${c.age||'?'} y · ${c.sex||''} · ${c.tumorBoardDate||'no date'} · ${c.status||''}`;
    node.querySelector('.summary').textContent=c.tumorBoardQuestion || c.clinicalSummary || c.imagingSummary || '';
    art.onclick=()=>setFormData(c); list.appendChild(node);
  }
}

function slideText(c){
return `SLIDE 1 — CLINICAL / RADIOLOGY / PROCEDURES\nPatient: ${c.patientIdentifier || ''}, ${c.age || ''} y, ${c.sex || ''}\nDiagnosis: ${c.diagnosis || ''}\nComorbidities / ECOG: ${c.comorbidities || ''}\nClinical summary: ${c.clinicalSummary || ''}\nLabs: ${c.labs || ''}\nImaging: ${c.imagingSummary || ''}\nProcedures / operations: ${c.procedureHistory || ''}\n\nSLIDE 2 — PATHOLOGY / STAGE / MDT QUESTION\nPathology: ${c.pathology || ''}\nTNM / Risk group: ${c.tnmStage || ''}\nQuestion for Tumor Board: ${c.tumorBoardQuestion || ''}\nMDT decision: ${c.mdtDecision || ''}`;
}

form.addEventListener('submit', e=>{ e.preventDefault(); const data=getFormData(); const i=cases.findIndex(c=>c.id===data.id); if(i>=0) cases[i]=data; else cases.push(data); selectedId=data.id; saveCases(); renderList(); setFormData(data); });
$('newCaseBtn').onclick=clearForm;
$('searchInput').oninput=renderList; $('filterDiagnosis').onchange=renderList;
$('deleteBtn').onclick=()=>{ if(!selectedId) return; if(confirm('Удалить кейс?')){ cases=cases.filter(c=>c.id!==selectedId); saveCases(); clearForm(); renderList(); } };
$('copySlidesBtn').onclick=async()=>{ const c=getFormData(); await navigator.clipboard.writeText(slideText(c)); $('saveStatus').textContent='Copied'; setTimeout(()=> $('saveStatus').textContent='', 1200); };
$('exportJsonBtn').onclick=()=>{ const blob=new Blob([JSON.stringify(cases,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='tumorboard-cases.json'; a.click(); URL.revokeObjectURL(a.href); };

if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js'); }
clearForm(); renderList();
