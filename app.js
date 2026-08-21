'use strict';

const SESSION_KEY='jeongbo-cbt-session-v1';
const WRONG_KEY='jeongbo-cbt-wrongs-v1';
const RESULT_KEY='jeongbo-cbt-results-v1';
const questionBank=globalThis.QUESTION_BANK||[];
const meta=globalThis.CBT_META||{};
const letters=['A','B','C','D'];
const $=id=>document.getElementById(id);
const screens=['start-screen','quiz-screen','overview-screen','result-screen'];
const show=id=>screens.forEach(name=>$(name).classList.toggle('active',name===id));
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const same=(a,b)=>JSON.stringify([...(a||[])].sort())===JSON.stringify([...(b||[])].sort());
const shuffle=items=>{const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;};

let exam=[];
let examName='';
let examMode='regular';
let answers=[];
let flags=[];
let current=0;
let remaining=0;
let timerId=null;

function readJson(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function writeJson(key,value){localStorage.setItem(key,JSON.stringify(value));}
function getWrongRecords(){return readJson(WRONG_KEY,{version:1,records:{}});}
function saveWrongRecords(value){writeJson(WRONG_KEY,value);}
function activeWrongs(){const all=getWrongRecords().records;return Object.values(all).filter(row=>row.active).sort((a,b)=>(b.wrongCount||0)-(a.wrongCount||0));}

function checkboxGroup(id,values,formatter=x=>x){
  $(id).innerHTML=values.map((value,index)=>`<label class="chapter-check"><input type="checkbox" value="${esc(value)}" checked><span>${esc(formatter(value,index))}</span></label>`).join('');
}

function renderStart(){
  clearInterval(timerId); $('timer').textContent='--:--'; show('start-screen');
  const sets=[...new Set(questionBank.map(q=>q.round))];
  $('set-count-label').textContent=`${sets.length}회차`;
  $('set-grid').innerHTML=sets.map(round=>{
    const count=questionBank.filter(q=>q.round===round).length;
    return `<button class="set-button curated" data-round="${esc(round)}">${esc(round)}<small>${count}문제 · 독자 작성</small></button>`;
  }).join('');
  document.querySelectorAll('[data-round]').forEach(button=>button.onclick=()=>{
    const round=button.dataset.round;
    startExam(questionBank.filter(q=>q.round===round),`${round} 모의고사`);
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
}

function checkedValues(id){return [...$(id).querySelectorAll('input:checked')].map(input=>input.value);}

function startExam(items,name,resume=null,mode='regular'){
  if(!items.length){$('filter-status').textContent='선택 조건에 맞는 문제가 없습니다.';return;}
  exam=items; examName=name; examMode=resume?.examMode||mode;
  answers=resume?.answers||items.map(()=>[]); flags=resume?.flags||items.map(()=>false);
  current=resume?.current||0; remaining=resume?.remaining??Math.max(600,items.length*90);
  show('quiz-screen'); renderQuestion(); saveSession(); startTimer(); window.scrollTo(0,0);
}

function startTimer(){
  clearInterval(timerId); updateTimer();
  timerId=setInterval(()=>{remaining-=1;updateTimer();saveSession();if(remaining<=0){clearInterval(timerId);finishExam();}},1000);
}
function updateTimer(){const value=Math.max(0,remaining);$('timer').textContent=`${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;}

function renderQuestion(){
  const q=exam[current]; if(!q)return;
  $('question-number').textContent=`${current+1} / ${exam.length}${examMode==='wrong-review'?` · 누적 오답 ${q.wrongCount||1}회`:''}`;
  $('answered-count').textContent=`응답 ${answers.filter(row=>row.length).length}`;
  $('progress-fill').style.width=`${(current+1)/exam.length*100}%`;
  $('exam-name').textContent=examName; $('subject').textContent=q.subject; $('unit').textContent=q.unit; $('difficulty').textContent=q.difficulty;
  $('question-text').textContent=q.stem;
  const layout=$('question-layout');
  layout.classList.toggle('hidden',!q.layout?.html); layout.innerHTML=q.layout?.html||'';
  $('options').innerHTML=q.options.map((option,index)=>`<div class="option"><input id="choice-${index}" type="radio" name="answer" value="${index}" ${answers[current]?.includes(index)?'checked':''}><label for="choice-${index}"><strong>${letters[index]}.</strong> ${esc(option)}</label></div>`).join('');
  $('options').querySelectorAll('input').forEach(input=>input.onchange=()=>{answers[current]=[Number(input.value)];$('answered-count').textContent=`응답 ${answers.filter(row=>row.length).length}`;saveSession();});
  $('prev-button').disabled=current===0; $('next-button').textContent=current===exam.length-1?'전체 보기':'다음';
  $('flag-button').classList.toggle('active',Boolean(flags[current])); $('flag-button').textContent=flags[current]?'검토 해제':'검토';
}

function saveSession(){writeJson(SESSION_KEY,{exam,examName,examMode,answers,flags,current,remaining});}
function showOverview(){
  show('overview-screen');
  const answered=answers.filter(row=>row.length).length;
  $('overview-summary').textContent=`응답 ${answered}개 · 미응답 ${exam.length-answered}개 · 검토 ${flags.filter(Boolean).length}개`;
  $('question-grid').innerHTML=exam.map((_,index)=>`<button class="${answers[index]?.length?'answered':''} ${flags[index]?'flagged':''}" data-index="${index}">${index+1}</button>`).join('');
  $('question-grid').querySelectorAll('button').forEach(button=>button.onclick=()=>{current=Number(button.dataset.index);show('quiz-screen');renderQuestion();saveSession();});
}

function recordResults(){
  const store=getWrongRecords(); const now=new Date().toISOString();
  exam.forEach((q,index)=>{
    const correct=same(q.answer,answers[index]);
    const previous=store.records[q.id]||{id:q.id,wrongCount:0,history:[]};
    if(correct){
      if(previous.id){previous.active=false;previous.lastResult='correct';previous.lastReviewedAt=now;}
    }else{
      previous.wrongCount=(previous.wrongCount||0)+1;
      previous.active=true; previous.lastResult='wrong'; previous.lastWrongAt=now;
      previous.selected=answers[index]||[]; previous.correct=q.answer;
      previous.importance=q.difficulty==='상'?'높음':'보통'; previous.reviewStatus='미복습';
    }
    previous.question=q; previous.history=[...(previous.history||[]),{at:now,correct,selected:answers[index]||[]}].slice(-30);
    store.records[q.id]=previous;
  });
  saveWrongRecords(store);
}

function finishExam(){
  clearInterval(timerId); localStorage.removeItem(SESSION_KEY); recordResults();
  const correct=exam.filter((q,index)=>same(q.answer,answers[index])).length;
  const pct=Math.round(correct/exam.length*100);
  const result={at:new Date().toISOString(),name:examName,mode:examMode,total:exam.length,correct,pct,questionIds:exam.map(q=>q.id)};
  const results=readJson(RESULT_KEY,[]); results.unshift(result); writeJson(RESULT_KEY,results.slice(0,100));
  show('result-screen'); $('result-label').textContent=examName; $('result-title').textContent=`${correct} / ${exam.length} (${pct}%)`;
  $('result-summary').textContent=examMode==='wrong-review'?'맞힌 문항은 활성 오답에서 제외했으며 전체 기록은 유지했습니다.':`새 오답 ${exam.length-correct}문항을 고유 ID 기준으로 누적했습니다.`;
  const subjects=[...new Set(exam.map(q=>q.subject))];
  $('subject-results').innerHTML=subjects.map(subject=>{
    const rows=exam.map((q,index)=>({q,index})).filter(row=>row.q.subject===subject); const good=rows.filter(row=>same(row.q.answer,answers[row.index])).length; const rate=Math.round(good/rows.length*100);
    return `<div class="chapter-row"><strong>${esc(subject)}</strong><span>${good}/${rows.length} · ${rate}%</span><div class="chapter-bar"><span style="width:${rate}%"></span></div></div>`;
  }).join('');
  $('answer-review').innerHTML=exam.map((q,index)=>renderReview(q,index)).join('');
  window.scrollTo(0,0);
}

function renderReview(q,index){
  const correct=same(q.answer,answers[index]);
  const selected=answers[index]?.length?answers[index].map(i=>`${letters[i]}. ${q.options[i]}`).join(', '):'미응답';
  const answer=q.answer.map(i=>`${letters[i]}. ${q.options[i]}`).join(', ');
  const reasons=q.optionReasons.map((reason,i)=>`<li><strong>${letters[i]}.</strong> ${esc(reason)}</li>`).join('');
  return `<article class="wrong"><h4>${index+1}. ${esc(q.stem)}</h4><span class="source-badge">${esc(q.sourceType)} · ${esc(q.id)}</span><p class="${correct?'answer-good':'answer-bad'}">내 답: ${esc(selected)}</p><p class="answer-good">정답: ${esc(answer)}</p><p><strong>정답 근거:</strong> ${esc(q.explanation)}</p><ul class="option-reason-list">${reasons}</ul><div class="review-clue"><strong>정답을 가르는 단서</strong><br>${esc(q.clue)}</div><p><strong>관련 개념:</strong> ${esc(q.conceptDetail)}</p><p><strong>유사 문제 판단 기준:</strong> ${esc(q.judgmentRule)}</p></article>`;
}

function exportText(){
  const correct=exam.filter((q,index)=>same(q.answer,answers[index])).length;
  const wrong=exam.map((q,index)=>({q,index})).filter(row=>!same(row.q.answer,answers[row.index]));
  return `# 정보처리기사 CBT 결과\n\n- 시험: ${examName}\n- 점수: ${correct}/${exam.length} (${Math.round(correct/exam.length*100)}%)\n- 응시 시각: ${new Date().toLocaleString('ko-KR')}\n- 활성 오답: ${activeWrongs().length}문항\n\n## 오답 ID\n${wrong.map(row=>`- ${row.q.id} · ${row.q.subject} · ${row.q.unit}`).join('\n')||'- 없음'}`;
}

$('custom-start').onclick=()=>{
  const subjects=checkedValues('subject-picker'), years=checkedValues('year-picker').map(Number), types=checkedValues('type-picker');
  const candidates=questionBank.filter(q=>subjects.includes(q.subject)&&years.includes(Number(q.year))&&types.includes(q.type));
  const count=Math.min(Number($('question-count').value),candidates.length);
  if(!count){$('filter-status').textContent='과목·연도·유형을 하나 이상 선택하세요.';return;}
  $('filter-status').textContent=''; startExam(shuffle(candidates).slice(0,count),'맞춤 문제');
};
$('wrong-start').onclick=()=>{const rows=activeWrongs();const items=rows.map(row=>({...row.question,wrongCount:row.wrongCount})).filter(Boolean);startExam(items,'오답 재시험',null,'wrong-review');};
$('resume-button').onclick=()=>{const saved=readJson(SESSION_KEY,null);if(saved)startExam(saved.exam,saved.examName,saved,saved.examMode);};
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

if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
renderStart();
