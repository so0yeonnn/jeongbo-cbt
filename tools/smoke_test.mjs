import fs from 'node:fs';
import vm from 'node:vm';

const context={};
vm.createContext(context);
vm.runInContext(fs.readFileSync('bank.js','utf8'),context);
vm.runInContext(fs.readFileSync('logic.js','utf8'),context);
const questions=context.QUESTION_BANK;
const logic=context.CBT_LOGIC;
if(questions.length!==240)throw new Error('question count');
const q=questions[0];
let row=logic.updateWrongRecord(null,q,[1],false,'2026-08-21T00:00:00Z');
if(row.wrongCount!==1||!row.active)throw new Error('first wrong');
row=logic.updateWrongRecord(row,q,[2],false,'2026-08-21T00:01:00Z');
if(row.wrongCount!==2||row.history.length!==2)throw new Error('repeat wrong');
row=logic.updateWrongRecord(row,q,q.answer,true,'2026-08-21T00:02:00Z');
if(row.active||row.wrongCount!==2||row.history.length!==3)throw new Error('correct review');
if(logic.updateWrongRecord(null,q,q.answer,true,'2026-08-21T00:03:00Z')!==null)throw new Error('correct-only record');
console.log(JSON.stringify({questions:questions.length,wrongCount:row.wrongCount,active:row.active,history:row.history.length}));
