'use strict';

const SESSION_KEY='jeongbo-cbt-session-v2';
const WRONG_KEY='jeongbo-cbt-wrongs-v2';
const RESULT_KEY='jeongbo-cbt-results-v2';
const PROGRESS_UPDATED_KEY='jeongbo-cbt-progress-updated-v2';
const PACK_DB='jeongbo-private-pack-v2';
const PACK_STORE='packs';
let questionBank=[];
let packMeta=null;
const letters=['A','B','C','D'];
const $=id=>document.getElementById(id);
const screens=['start-screen','quiz-screen','overview-screen','result-screen'];
const show=id=>screens.forEach(name=>$(name).classList.toggle('active',name===id));
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const same=globalThis.CBT_LOGIC.sameAnswers;
const isCorrect=(q,answer)=>Boolean(q?.void)||(q?.acceptAny?answer?.length===1&&q.answer.includes(answer[0]):same(q.answer,answer));
const shuffle=items=>{const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};

let exam=[];
let examName='';
let examMode='regular';
let solveMode='study';
let answers=[];
let flags=[];
let confidences=[];
let current=0;
let remaining=0;
let timerId=null;
let suppressProgressSync=false;

function readJson(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function writeJson(key,value){
  localStorage.setItem(key,JSON.stringify(value));
  if(!suppressProgressSync&&[SESSION_KEY,WRONG_KEY,RESULT_KEY].includes(key)){
    localStorage.setItem(PROGRESS_UPDATED_KEY,new Date().toISOString());
    globalThis.DriveSync?.queueProgress();
  }
}
function getWrongRecords(){return readJson(WRONG_KEY,{version:1,records:{}});}
function saveWrongRecords(value){writeJson(WRONG_KEY,value);}
function activeWrongs(){const all=getWrongRecords().records;return Object.values(all).filter(row=>row.active).sort((a,b)=>(b.wrongCount||0)-(a.wrongCount||0));}

function dailyPriorities(){
  const frequency=globalThis.CBT_CONCEPTS.frequency(questionBank);const frequencyMap=new Map(frequency.map(row=>[`${row.subject}::${row.concept}`,row]));const map=new Map();
  activeWrongs().forEach(record=>{
    const q=questionBank.find(item=>item.id===record.id)||record.question;if(!q)return;
    const p=globalThis.CBT_CONCEPTS.profile(q),key=`${q.subject}::${p.label}`,row=map.get(key)||{subject:q.subject,concept:p.label,wrong:0,attempts:0,correct:0,lastWrongAt:null};
    row.wrong+=record.wrongCount||1;row.attempts+=(record.history||[]).length;row.correct+=(record.history||[]).filter(item=>item.correct).length;
    if(!row.lastWrongAt||record.lastWrongAt>row.lastWrongAt)row.lastWrongAt=record.lastWrongAt;map.set(key,row);
  });
  const rows=[...map.entries()].map(([key,row])=>{const freq=frequencyMap.get(key)||{count:0,level:'하'};const rate=row.attempts?Math.round(row.correct/row.attempts*100):0;const days=row.lastWrongAt?Math.max(0,(Date.now()-Date.parse(row.lastWrongAt))/86400000):999;const recent=days<=7?3:days<=30?2:1;const levelScore={상:3,중:2,하:1}[freq.level]||1;return {...row,rate,frequency:freq.count,level:freq.level,score:row.wrong*4+(100-rate)/20+recent+levelScore};}).sort((a,b)=>b.score-a.score||b.frequency-a.frequency);
  if(rows.length)return rows.slice(0,20);
  return frequency.slice(0,20).map(row=>({subject:row.subject,concept:row.concept,wrong:0,rate:null,frequency:row.count,level:row.level,score:row.count}));
}

function progressSnapshot(){
  return {
    version:2,
    updatedAt:localStorage.getItem(PROGRESS_UPDATED_KEY)||new Date(0).toISOString(),
    session:readJson(SESSION_KEY,null),
    wrongs:readJson(WRONG_KEY,{version:1,records:{}}),
    results:readJson(RESULT_KEY,[])
  };
}

function applyProgressSnapshot(snapshot){
  if(snapshot?.version!==2)throw new Error('Drive 진도 파일 형식이 올바르지 않습니다.');
  suppressProgressSync=true;
  try{
    [[SESSION_KEY,snapshot.session],[WRONG_KEY,snapshot.wrongs],[RESULT_KEY,snapshot.results]].forEach(([key,value])=>{
      if(value==null)localStorage.removeItem(key);else localStorage.setItem(key,JSON.stringify(value));
    });
    localStorage.setItem(PROGRESS_UPDATED_KEY,snapshot.updatedAt||new Date().toISOString());
  }finally{suppressProgressSync=false;}
}

function openPackDb(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(PACK_DB,1);
    request.onupgradeneeded=()=>request.result.createObjectStore(PACK_STORE);
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
async function readPack(){const db=await openPackDb();return new Promise((resolve,reject)=>{const request=db.transaction(PACK_STORE).objectStore(PACK_STORE).get('active');request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error);});}
async function writePack(pack){const db=await openPackDb();return new Promise((resolve,reject)=>{const request=db.transaction(PACK_STORE,'readwrite').objectStore(PACK_STORE).put(pack,'active');request.onsuccess=()=>resolve();request.onerror=()=>reject(request.error);});}
async function deletePack(){const db=await openPackDb();return new Promise((resolve,reject)=>{const request=db.transaction(PACK_STORE,'readwrite').objectStore(PACK_STORE).delete('active');request.onsuccess=()=>resolve();request.onerror=()=>reject(request.error);});}

function validatePack(pack){
  if(pack?.meta?.format!=='jeongbo-private-pack-v2'||!Array.isArray(pack.questions))throw new Error('정보처리기사 2020~2025 개인용 기출팩 형식이 아닙니다.');
  const sets=new Set(pack.questions.map(q=>q.round));
  if(pack.questions.length!==1800||sets.size!==18)throw new Error(`18회·1,800문항 기출팩이 아닙니다. (${sets.size}회·${pack.questions.length}문항)`);
  if(pack.questions.some(q=>!q.id||!q.stem||q.options?.length!==4||!q.year||!q.round))throw new Error('필수 문항 정보가 누락된 기출팩입니다.');
  return true;
}

function checkboxGroup(id,values,formatter=x=>x){
  $(id).innerHTML=values.map((value,index)=>`<label class="chapter-check"><input type="checkbox" value="${esc(value)}" checked><span>${esc(formatter(value,index))}</span></label>`).join('');
}

function renderStart(){
  clearInterval(timerId); $('timer').textContent='--:--'; show('start-screen');
  const loaded=questionBank.length>0;
  $('bank-controls').classList.toggle('hidden',!loaded);
  $('clear-pack').classList.toggle('hidden',!loaded);
  $('pack-summary').textContent=loaded?`${packMeta?.title||'개인용 기출팩'} · ${[...new Set(questionBank.map(q=>q.round))].length}회 · ${questionBank.length.toLocaleString('ko-KR')}문항`:'아직 기출팩을 불러오지 않았습니다.';
  if(!loaded)return;
  const sets=[...new Set(questionBank.map(q=>q.round))];
  $('set-count-label').textContent=`${sets.length}회차`;
  $('set-grid').innerHTML=sets.map(round=>{
    const count=questionBank.filter(q=>q.round===round).length;
    return `<button class="set-button curated" data-round="${esc(round)}">${esc(round)}<small>${count}문제 · 기출</small></button>`;
  }).join('');
  document.querySelectorAll('[data-round]').forEach(button=>button.onclick=()=>{
    const round=button.dataset.round;
    startExam(questionBank.filter(q=>q.round===round),`${round} 모의고사`,null,'regular',selectedSolveMode());
  });
  const subjects=[...new Set(questionBank.map(q=>q.subject))];
  const years=[...new Set(questionBank.map(q=>q.year))].sort((a,b)=>b-a);
  const types=[...new Set(questionBank.map(q=>q.type))];
  checkboxGroup('subject-picker',subjects);
  checkboxGroup('year-picker',years);
  checkboxGroup('type-picker',types);
  const wrongs=activeWrongs();
  $('wrong-start').classList.toggle('hidden',!wrongs.length);
  $('wrong-start').textContent=`저장된 오답 ${wrongs.length}문제 다시 풀기`;
  $('resume-button').classList.toggle('hidden',!localStorage.getItem(SESSION_KEY));
  const priorities=dailyPriorities();
  $('daily-priorities').innerHTML=priorities.map((row,index)=>`<div class="daily-row"><b>${index+1}. ${esc(row.concept)}</b><small>${esc(row.subject)} · ${row.wrong?`누적 오답 ${row.wrong} · 정답률 ${row.rate}% · `:''}최근 6회 ${row.frequency}문항</small><span class="frequency ${row.level==='상'?'high':row.level==='중'?'medium':'low'}">${row.level}</span></div>`).join('');
}

function checkedValues(id){return [...$(id).querySelectorAll('input:checked')].map(input=>input.value);}
function selectedSolveMode(){return document.querySelector('input[name="solve-mode"]:checked')?.value||'study';}

function startExam(items,name,resume=null,mode='regular',method=selectedSolveMode()){
  if(!items.length){$('filter-status').textContent='선택 조건에 맞는 문제가 없습니다.';return;}
  exam=items; examName=name; examMode=resume?.examMode||mode; solveMode=resume?.solveMode||method;
  answers=resume?.answers||items.map(()=>[]); flags=resume?.flags||items.map(()=>false); confidences=resume?.confidences||items.map(()=>null);
  current=resume?.current||0; remaining=resume?.remaining??Math.max(600,items.length*90);
  show('quiz-screen'); renderQuestion(); saveSession(); startTimer(); window.scrollTo(0,0);
}

function startTimer(){
  clearInterval(timerId);
  if(solveMode==='study'){$('timer').textContent='학습 모드';return;}
  updateTimer();
  timerId=setInterval(()=>{remaining-=1;updateTimer();saveSession();if(remaining<=0){clearInterval(timerId);finishExam();}},1000);
}
function updateTimer(){const value=Math.max(0,remaining);$('timer').textContent=`${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;}

function renderQuestion(){
  const q=exam[current]; if(!q)return;
  $('question-number').textContent=`${current+1} / ${exam.length}${examMode==='wrong-review'?` · 누적 오답 ${q.wrongCount||1}회`:''}`;
  $('answered-count').textContent=`응답 ${answers.filter(row=>row.length).length}`;
  $('progress-fill').style.width=`${(current+1)/exam.length*100}%`;
  $('solve-mode-badge').textContent=solveMode==='study'?'해설 학습':'실전 시험';
  $('exam-name').textContent=examName; $('subject').textContent=q.subject; $('unit').textContent=q.unit; $('difficulty').textContent=q.difficulty;
  $('question-text').textContent=q.stem;
  const layout=$('question-layout');
  const layoutHtml=q.layout?.kind==='image'&&q.layout.imageData?`<img class="private-question-image" src="${q.layout.imageData}" alt="${esc(q.layout.alt||'원문 문항 이미지')}">`:q.layout?.html||'';
  layout.classList.toggle('hidden',!layoutHtml); layout.innerHTML=layoutHtml;
  $('options').innerHTML=q.options.map((option,index)=>`<div class="option"><input id="choice-${index}" type="radio" name="answer" value="${index}" ${answers[current]?.includes(index)?'checked':''}><label for="choice-${index}"><strong>${letters[index]}.</strong> ${esc(option)}</label></div>`).join('');
  const confidence=$('confidence-picker');confidence.classList.toggle('hidden',!answers[current]?.length);
  $('options').querySelectorAll('input').forEach(input=>input.onchange=()=>{answers[current]=[Number(input.value)];confidence.classList.remove('hidden');$('answered-count').textContent=`응답 ${answers.filter(row=>row.length).length}`;renderInstantFeedback(q);saveSession();});
  confidence.querySelectorAll('button').forEach(button=>{button.classList.toggle('active',button.dataset.confidence===confidences[current]);button.onclick=()=>{confidences[current]=button.dataset.confidence;renderQuestion();saveSession();};});
  renderInstantFeedback(q);
  $('prev-button').disabled=current===0; $('next-button').textContent=current===exam.length-1?'전체 보기':'다음';
  $('flag-button').classList.toggle('active',Boolean(flags[current])); $('flag-button').textContent=flags[current]?'검토 해제':'검토';
}

function renderInstantFeedback(q){
  const box=$('instant-feedback');
  if(solveMode!=='study'||!answers[current]?.length){box.className='instant-feedback hidden';box.innerHTML='';return;}
  if(q.void){box.className='instant-feedback';box.innerHTML='<div class="feedback-title"><strong>채점 제외 문항</strong></div><p>원본 정답표에서 정답을 하나로 확정할 수 없어 점수에는 반영하지 않습니다.</p>';return;}
  const correct=isCorrect(q,answers[current]);
  const answer=q.answer.map(i=>`${letters[i]}. ${q.options[i]}`).join(', ');
  const reasonRows=q.optionReasons||[]; const uniqueReasons=[...new Set(reasonRows)];
  const reasons=uniqueReasons.length===1?`<p>${esc(uniqueReasons[0])}</p>`:`<ul class="option-reason-list">${reasonRows.map((reason,i)=>`<li><strong>${letters[i]}.</strong> ${esc(reason)}</li>`).join('')}</ul>`;
  box.className=`instant-feedback ${correct?'correct':'incorrect'}`;
  const concept=globalThis.CBT_CONCEPTS.profile(q);
  box.innerHTML=`<div class="feedback-title"><strong>${correct?'정답입니다':'다시 확인해 보세요'}</strong><span>정답 ${esc(answer)}</span></div><section class="feedback-section"><h4>해설</h4><p>${esc(q.explanation)}</p></section>${reasons}<section class="feedback-section"><h4>핵심 개념</h4><ul>${concept.summary.map(line=>`<li>${esc(line)}</li>`).join('')}</ul></section><div class="memory-point"><strong>시험 암기 포인트</strong><span>${esc(concept.memory)}</span></div><section class="feedback-section"><h4>자주 헷갈리는 개념</h4><p>${esc(concept.compare)}</p></section><div class="keyword-tags">${concept.keywords.slice(0,5).map(word=>`<span>${esc(word)}</span>`).join('')}</div>${q.clue?`<div class="review-clue"><strong>정답을 가르는 단서</strong><br>${esc(q.clue)}</div>`:''}`;
}

function saveSession(){writeJson(SESSION_KEY,{examIds:exam.map(q=>q.id),examName,examMode,solveMode,answers,flags,confidences,current,remaining});}
function showOverview(){
  show('overview-screen');
  const answered=answers.filter(row=>row.length).length;
  $('overview-summary').textContent=`응답 ${answered}개 · 미응답 ${exam.length-answered}개 · 애매 ${confidences.filter(value=>value==='low').length}개 · 검토 ${flags.filter(Boolean).length}개`;
  $('question-grid').innerHTML=exam.map((_,index)=>`<button class="${answers[index]?.length?'answered':''} ${flags[index]?'flagged':''}" data-index="${index}">${index+1}</button>`).join('');
  $('question-grid').querySelectorAll('button').forEach(button=>button.onclick=()=>{current=Number(button.dataset.index);show('quiz-screen');renderQuestion();saveSession();});
}

function recordResults(){
  const store=getWrongRecords(); const now=new Date().toISOString();
  exam.forEach((q,index)=>{
    if(q.void)return;
    const correct=isCorrect(q,answers[index]);
    const previous=store.records[q.id]||null;
    const storedQuestion={...q,layout:q.layout?.kind==='image'?{kind:'imageRef'}:q.layout};
    const updated=globalThis.CBT_LOGIC.updateWrongRecord(previous,storedQuestion,answers[index]||[],correct,now);
    if(updated)store.records[q.id]=updated;
  });
  saveWrongRecords(store);
}

function finishExam(){
  clearInterval(timerId); localStorage.removeItem(SESSION_KEY); recordResults();
  const scorable=exam.filter(q=>!q.void); const voidCount=exam.length-scorable.length;
  const correct=exam.filter((q,index)=>!q.void&&isCorrect(q,answers[index])).length;
  const pct=scorable.length?Math.round(correct/scorable.length*100):100;
  const conceptAnalysis=globalThis.CBT_CONCEPTS.analyze(exam,answers,confidences);
  const subjects=[...new Set(exam.map(q=>q.subject))];
  const subjectStats=subjects.map(subject=>{const rows=exam.map((q,index)=>({q,index})).filter(row=>row.q.subject===subject&&!row.q.void);const good=rows.filter(row=>isCorrect(row.q,answers[row.index])).length;return {subject,good,total:rows.length,rate:rows.length?Math.round(good/rows.length*100):100};});
  const isFullExam=subjects.length===5&&exam.length>=98;
  const passed=isFullExam&&pct>=60&&subjectStats.every(row=>row.rate>=40);
  const result={at:new Date().toISOString(),name:examName,mode:examMode,solveMode,total:exam.length,correct,pct,questionIds:exam.map(q=>q.id),subjectStats,weakConcepts:conceptAnalysis.filter(row=>row.wrong||row.uncertain).slice(0,10).map(({subject,concept,total,correct,wrong,uncertain,rate})=>({subject,concept,total,correct,wrong,uncertain,rate}))};
  const results=readJson(RESULT_KEY,[]); results.unshift(result); writeJson(RESULT_KEY,results.slice(0,100));
  show('result-screen'); $('result-label').textContent=examName; $('result-title').textContent=`${correct} / ${scorable.length} (${pct}%)`;
  const methodLabel=solveMode==='study'?'해설 학습 모드':'실전 시험 모드';
  $('result-summary').textContent=`${methodLabel} · ${examMode==='wrong-review'?'맞힌 문항은 활성 오답에서 제외했으며 전체 기록은 유지했습니다.':`새 오답 ${scorable.length-correct}문항을 고유 ID 기준으로 누적했습니다.`}${voidCount?` · 정답 불명확 ${voidCount}문항 채점 제외`:''}`;
  $('pass-card').className=`analysis-card pass-card ${isFullExam?(passed?'passed':'failed'):'practice'}`;
  $('pass-card').innerHTML=isFullExam?`<strong>${passed?'합격 기준 충족':'합격 기준 미충족'}</strong><span>평균 60점 이상 · 모든 과목 40점 이상</span>`:`<strong>학습 진단 결과</strong><span>정규 100문항 응시 때 합격 여부를 판정합니다.</span>`;
  $('subject-results').innerHTML=subjectStats.map(row=>{
    return `<div class="chapter-row"><strong>${esc(row.subject)}</strong><span>${row.good}/${row.total} · ${row.rate}%</span><div class="chapter-bar"><span style="width:${row.rate}%"></span></div></div>`;
  }).join('');
  const weak=conceptAnalysis.filter(row=>row.wrong||row.uncertain).slice(0,10);
  $('weak-concepts').innerHTML=weak.length?weak.map((row,index)=>`<div class="concept-row"><b>${index+1}. ${esc(row.concept)}</b><small>${esc(row.subject)} · 오답 ${row.wrong} · 애매 ${row.uncertain} · 정답률 ${row.rate}%</small><span class="priority ${index<3?'high':index<6?'medium':'low'}">${index<3?'우선 복습':index<6?'중요':'보통'}</span></div>`).join(''):'<p class="empty-analysis">현재 취약 개념이 없습니다.</p>';
  const frequency=globalThis.CBT_CONCEPTS.frequency(questionBank).slice(0,10);
  $('frequency-concepts').innerHTML=frequency.map(row=>`<div class="concept-row"><b>${esc(row.concept)}</b><small>${esc(row.subject)} · 최근 6회 ${row.count}문항</small><span class="frequency ${row.level==='상'?'high':row.level==='중'?'medium':'low'}">${row.level}</span></div>`).join('');
  $('answer-review').innerHTML=exam.map((q,index)=>renderReview(q,index)).join('');
  window.scrollTo(0,0);
}

function renderReview(q,index){
  const correct=isCorrect(q,answers[index]);
  const selected=answers[index]?.length?answers[index].map(i=>`${letters[i]}. ${q.options[i]}`).join(', '):'미응답';
  const answer=q.answer.map(i=>`${letters[i]}. ${q.options[i]}`).join(', ');
  const reasonRows=q.optionReasons||[]; const uniqueReasons=[...new Set(reasonRows)];
  const reasons=uniqueReasons.length===1?`<p>${esc(uniqueReasons[0])}</p>`:`<ul class="option-reason-list">${reasonRows.map((reason,i)=>`<li><strong>${letters[i]}.</strong> ${esc(reason)}</li>`).join('')}</ul>`;
  if(q.void)return `<article class="wrong"><h4>${index+1}. ${esc(q.stem)}</h4><span class="source-badge">채점 제외 · ${esc(q.id)}</span><p>${esc(q.explanation)}</p></article>`;
  const concept=globalThis.CBT_CONCEPTS.profile(q);const low=confidences[index]==='low';
  return `<article class="wrong"><h4>${index+1}. ${esc(q.stem)}</h4><span class="source-badge">${esc(q.sourceType)} · ${esc(q.id)}</span>${low?'<span class="uncertain-badge">애매한 정답</span>':''}<p class="${correct?'answer-good':'answer-bad'}">내 답: ${esc(selected)}</p><p class="answer-good">정답: ${esc(answer)}</p><p><strong>정답 근거:</strong> ${esc(q.explanation)}</p>${reasons}<div class="memory-point"><strong>${esc(concept.label)}</strong><span>${esc(concept.memory)}</span></div><p><strong>헷갈리는 개념:</strong> ${esc(concept.compare)}</p><div class="keyword-tags">${concept.keywords.slice(0,5).map(word=>`<span>${esc(word)}</span>`).join('')}</div>${q.clue?`<div class="review-clue"><strong>정답을 가르는 단서</strong><br>${esc(q.clue)}</div>`:''}${q.conceptDetail?`<p><strong>관련 개념:</strong> ${esc(q.conceptDetail)}</p>`:''}${q.judgmentRule?`<p><strong>유사 문제 판단 기준:</strong> ${esc(q.judgmentRule)}</p>`:''}</article>`;
}

function notionConceptText(){
  const rows=globalThis.CBT_CONCEPTS.analyze(exam,answers,confidences).filter(row=>row.wrong||row.uncertain);
  return `# 정보처리기사 개념 중심 복습\n\n- 응시: ${examName}\n- 날짜: ${new Date().toLocaleString('ko-KR')}\n- 원문 문제·선지는 포함하지 않음\n\n${rows.map(row=>`## ${row.concept}\n- 과목: ${row.subject}\n- 관련 문제 수: ${row.total}\n- 맞은 횟수: ${row.correct}\n- 틀린 횟수: ${row.wrong}\n- 정답률: ${row.rate}%\n- 애매하게 맞힌 횟수: ${row.uncertain}\n- 핵심 개념: ${row.profile.summary.join(' ')}\n- 암기 포인트: ${row.profile.memory}\n- 헷갈리는 개념: ${row.profile.compare}\n- 관련 키워드: ${row.profile.keywords.join(', ')}`).join('\n\n')||'취약 개념 없음'}`;
}

function exportText(){
  const scorable=exam.filter(q=>!q.void); const correct=exam.filter((q,index)=>!q.void&&isCorrect(q,answers[index])).length;
  const wrong=exam.map((q,index)=>({q,index})).filter(row=>!row.q.void&&!isCorrect(row.q,answers[row.index]));
  return `# 정보처리기사 CBT 결과\n\n- 시험: ${examName}\n- 풀이 방법: ${solveMode==='study'?'해설 보며 풀기':'실전 시험처럼'}\n- 점수: ${correct}/${scorable.length} (${scorable.length?Math.round(correct/scorable.length*100):100}%)\n- 응시 시각: ${new Date().toLocaleString('ko-KR')}\n- 활성 오답: ${activeWrongs().length}문항\n\n## 오답 ID\n${wrong.map(row=>`- ${row.q.id} · ${row.q.subject} · ${row.q.unit}`).join('\n')||'- 없음'}`;
}

$('private-pack-input').onchange=async event=>{
  const file=event.target.files?.[0]; if(!file)return;
  $('pack-status').textContent='기출팩을 확인하고 저장하는 중입니다…';
  try{
    const pack=JSON.parse(await file.text()); validatePack(pack); await writePack(pack);
    questionBank=pack.questions; packMeta=pack.meta; localStorage.removeItem(SESSION_KEY);
    $('pack-status').textContent='18회·1,800문항 기출팩을 이 기기에 저장했습니다.'; renderStart();
    globalThis.DriveSync?.uploadPack().catch(error=>setDriveStatus(error.message,'bad'));
  }catch(error){$('pack-status').textContent=`불러오기 실패: ${error.message}`;}
  event.target.value='';
};
$('clear-pack').onclick=async()=>{await deletePack();questionBank=[];packMeta=null;localStorage.removeItem(SESSION_KEY);renderStart();$('pack-status').textContent='이 기기에서 기출팩을 삭제했습니다.';};

$('select-all-subjects').onclick=()=>$('subject-picker').querySelectorAll('input').forEach(input=>input.checked=true);
$('clear-subjects').onclick=()=>$('subject-picker').querySelectorAll('input').forEach(input=>input.checked=false);
$('subject-start').onclick=()=>{
  const subjects=checkedValues('subject-picker');
  const candidates=questionBank.filter(q=>subjects.includes(q.subject));
  const count=Math.min(Number($('subject-question-count').value),candidates.length);
  if(!count){$('subject-status').textContent='풀 과목을 하나 이상 선택하세요.';return;}
  $('subject-status').textContent='';
  const name=subjects.length===1?subjects[0]:`${subjects.length}개 과목 맞춤`;
  startExam(shuffle(candidates).slice(0,count),name,null,'regular',selectedSolveMode());
};

$('custom-start').onclick=()=>{
  const subjects=checkedValues('subject-picker'), years=checkedValues('year-picker').map(Number), types=checkedValues('type-picker');
  const candidates=questionBank.filter(q=>subjects.includes(q.subject)&&years.includes(Number(q.year))&&types.includes(q.type));
  const count=Math.min(Number($('question-count').value),candidates.length);
  if(!count){$('filter-status').textContent='과목·연도·유형을 하나 이상 선택하세요.';return;}
  $('filter-status').textContent=''; startExam(shuffle(candidates).slice(0,count),'맞춤 문제',null,'regular',selectedSolveMode());
};
$('wrong-start').onclick=()=>{const rows=activeWrongs();const items=rows.map(row=>{const full=questionBank.find(q=>q.id===row.id)||row.question;return full?{...full,wrongCount:row.wrongCount}:null;}).filter(Boolean);startExam(items,'오답 재시험',null,'wrong-review',selectedSolveMode());};
$('resume-button').onclick=()=>{
  const saved=readJson(SESSION_KEY,null);if(!saved)return;
  const items=saved.examIds?saved.examIds.map(id=>questionBank.find(q=>q.id===id)).filter(Boolean):saved.exam;
  if(!items?.length){$('pack-status').textContent='이어 풀 문제를 찾지 못했습니다. 기출팩을 먼저 동기화해 주세요.';return;}
  startExam(items,saved.examName,saved,saved.examMode,saved.solveMode);
};
$('prev-button').onclick=()=>{if(current>0){current-=1;renderQuestion();saveSession();window.scrollTo(0,0);}};
$('next-button').onclick=()=>{if(current<exam.length-1){current+=1;renderQuestion();saveSession();window.scrollTo(0,0);}else showOverview();};
$('flag-button').onclick=()=>{flags[current]=!flags[current];renderQuestion();saveSession();};
$('open-overview').onclick=showOverview; $('return-button').onclick=()=>{show('quiz-screen');renderQuestion();};
$('finish-button').onclick=()=>{$('finish-dialog-text').textContent=`응답 ${answers.filter(row=>row.length).length}/${exam.length}문항입니다.`;$('finish-dialog').showModal();};
$('cancel-finish').onclick=()=>$('finish-dialog').close(); $('confirm-finish').onclick=()=>{$('finish-dialog').close();finishExam();};
$('exit-button').onclick=()=>{saveSession();renderStart();};
$('reset-button').onclick=renderStart;
$('copy-button').onclick=async()=>{await navigator.clipboard.writeText(exportText());$('export-status').textContent='결과를 복사했습니다.';};
$('share-button').onclick=async()=>{const text=exportText();if(navigator.share)await navigator.share({title:'정보처리기사 CBT 결과',text});else{await navigator.clipboard.writeText(text);$('export-status').textContent='공유 기능 대신 결과를 복사했습니다.';}};
$('download-button').onclick=()=>{const blob=new Blob([exportText()],{type:'text/markdown;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='정보처리기사-CBT-결과.md';a.click();URL.revokeObjectURL(a.href);};
$('notion-copy-button').onclick=async()=>{await navigator.clipboard.writeText(notionConceptText());$('export-status').textContent='문제 원문 없이 개념 중심 정리를 복사했습니다. Notion 허브에 붙여 넣으세요.';};

function setDriveStatus(message,tone=''){$('drive-status').textContent=message;$('drive-status').className=`status ${tone}`.trim();}
function setDriveConnection(connected){
  $('drive-badge').textContent=connected?'연결됨':'연결 안 됨';
  $('drive-badge').classList.toggle('connected',connected);
  $('drive-connect').textContent=connected?'Google 계정 다시 연결':'Google Drive 연결';
  $('drive-sync-now').classList.toggle('hidden',!connected);
}

globalThis.DriveSync.configure({
  getPack:readPack,
  setPack:async pack=>{validatePack(pack);await writePack(pack);questionBank=pack.questions;packMeta=pack.meta;},
  getProgress:progressSnapshot,
  setProgress:applyProgressSnapshot,
  onStatus:setDriveStatus,
  onConnection:setDriveConnection,
  onBusy:busy=>{$('drive-connect').disabled=busy;$('drive-sync-now').disabled=busy;},
  onSynced:()=>renderStart()
});
$('drive-connect').onclick=()=>globalThis.DriveSync.connect().catch(()=>{});
$('drive-sync-now').onclick=()=>globalThis.DriveSync.syncNow().catch(()=>{});

if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
async function initialize(){
  try{const pack=await readPack();if(pack){validatePack(pack);questionBank=pack.questions;packMeta=pack.meta;}}
  catch(error){$('pack-status').textContent=`저장된 기출팩을 읽지 못했습니다: ${error.message}`;}
  renderStart();
}
initialize();
