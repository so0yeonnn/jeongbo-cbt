(function(root){
  const sameAnswers=(a,b)=>JSON.stringify([...(a||[])].sort())===JSON.stringify([...(b||[])].sort());
  function updateWrongRecord(previous,question,selected,correct,now){
    if(correct&&!previous)return null;
    const row=previous?{...previous,history:[...(previous.history||[])]}:{id:question.id,wrongCount:0,history:[]};
    if(correct){
      row.active=false; row.lastResult='correct'; row.lastReviewedAt=now;
    }else{
      row.wrongCount=(row.wrongCount||0)+1; row.active=true; row.lastResult='wrong'; row.lastWrongAt=now;
      row.selected=selected||[]; row.correct=question.answer; row.importance=question.difficulty==='상'?'높음':'보통'; row.reviewStatus='미복습';
    }
    row.question=question;
    row.history=[...row.history,{at:now,correct,selected:selected||[]}].slice(-30);
    return row;
  }
  root.CBT_LOGIC={sameAnswers,updateWrongRecord};
})(typeof globalThis==='undefined'?window:globalThis);
