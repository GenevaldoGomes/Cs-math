const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
const players = new Map();
const teachers = new Set();

const ranks = [
  { name:'Recruta', min:0 },
  { name:'Prata I', min:100 },
  { name:'Prata II', min:220 },
  { name:'Ouro I', min:380 },
  { name:'Ouro II', min:580 },
  { name:'Águia', min:820 },
  { name:'Mestre', min:1100 },
  { name:'Global', min:1500 },
];

const achievementLabels = {
  primeiro_acerto:'Primeiro Acerto',
  sequencia_3:'Sequência de 3',
  sequencia_5:'Sequência de 5',
  cem_xp:'100 XP',
  dez_acertos:'10 Acertos'
};

function rankData(xp){
  let idx=0;
  for(let i=0;i<ranks.length;i++) if(xp>=ranks[i].min) idx=i;
  const cur=ranks[idx];
  if(idx===ranks.length-1) return {rank:cur.name,rankXP:xp-cur.min,nextRankXP:500,rankProgress:100};
  const next=ranks[idx+1], span=next.min-cur.min, within=xp-cur.min;
  return {rank:cur.name,rankXP:within,nextRankXP:span,rankProgress:Math.max(0,Math.min(100,Math.round(within/span*100)))};
}
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>[...a].sort(()=>Math.random()-.5);

function wrongOptions(correct,scale=1){
  const set=new Set([correct]);
  const offsets=shuffle([1,2,3,4,5,-1,-2,-3,-4,-5,10,-10]);
  for(const o of offsets){
    const v=correct+o*scale;if(v!==correct)set.add(v);
    if(set.size===4)break;
  }
  return shuffle([...set]).map(String);
}

function stageFor(p){
  const answered=p.hits+p.misses;
  return Math.max(1,Math.min(5,1+Math.floor(answered/4)));
}

function makeQuestion(stage){
  let families;
  if(stage===1) families=['PA_TERM','CLASSIFY'];
  else if(stage===2) families=['PA_TERM','PA_SUM','CLASSIFY'];
  else if(stage===3) families=['PG_TERM','CLASSIFY'];
  else if(stage===4) families=['PA_SUM','PG_SUM','PG_TERM'];
  else families=['PA_SUM','PG_SUM','PG_TERM','MIXED'];
  const type=pick(families);

  if(type==='PA_TERM'){
    const a1=Math.floor(Math.random()*15)+1,r=Math.floor(Math.random()*8)+2,n=Math.floor(Math.random()*9)+5;
    const ans=a1+(n-1)*r;
    return {topic:'PA — TERMO GERAL',difficulty:stage<3?'RECRUTA':'INTERMEDIÁRIO',
      question:`Em uma PA, a₁ = ${a1} e a razão é ${r}. Qual é o ${n}º termo?`,
      options:wrongOptions(ans),correct:String(ans),
      explanation:`Use aₙ = a₁ + (n − 1)·r. Então: a${n} = ${a1} + (${n} − 1)·${r} = ${a1} + ${(n-1)*r} = ${ans}.`};
  }

  if(type==='PA_SUM'){
    const a1=Math.floor(Math.random()*10)+2,r=Math.floor(Math.random()*6)+1,n=Math.floor(Math.random()*8)+5;
    const an=a1+(n-1)*r,ans=n*(a1+an)/2;
    return {topic:'PA — SOMA',difficulty:stage<5?'INTERMEDIÁRIO':'AVANÇADO',
      question:`Uma PA tem a₁ = ${a1}, razão ${r} e ${n} termos. Qual é a soma Sₙ?`,
      options:wrongOptions(ans,n%2===0?1:2),correct:String(ans),
      explanation:`Primeiro: aₙ = ${a1} + (${n}−1)·${r} = ${an}. Depois, Sₙ = n(a₁+aₙ)/2 = ${n}(${a1}+${an})/2 = ${ans}.`};
  }

  if(type==='PG_TERM'){
    const a1=pick([1,2,3,4,5]),q=pick([2,3]),n=pick([4,5,6]);
    const ans=a1*Math.pow(q,n-1);
    return {topic:'PG — TERMO GERAL',difficulty:stage<4?'INTERMEDIÁRIO':'AVANÇADO',
      question:`Em uma PG, a₁ = ${a1} e q = ${q}. Determine o ${n}º termo.`,
      options:wrongOptions(ans,Math.max(1,a1)),correct:String(ans),
      explanation:`Use aₙ = a₁·q^(n−1). Logo: a${n} = ${a1}·${q}^${n-1} = ${a1}·${Math.pow(q,n-1)} = ${ans}.`};
  }

  if(type==='PG_SUM'){
    const a1=pick([1,2,3]),q=pick([2,3]),n=pick([4,5]);
    const ans=a1*(Math.pow(q,n)-1)/(q-1);
    return {topic:'PG — SOMA',difficulty:'AVANÇADO',
      question:`Uma PG tem a₁ = ${a1}, q = ${q} e ${n} termos. Calcule Sₙ.`,
      options:wrongOptions(ans,a1),correct:String(ans),
      explanation:`Para q ≠ 1: Sₙ = a₁(qⁿ−1)/(q−1). Assim: S${n} = ${a1}(${q}^${n}−1)/(${q}−1) = ${ans}.`};
  }

  if(type==='CLASSIFY'){
    const seqs=[
      {q:'2, 5, 8, 11, ...',a:'PA crescente',e:'A diferença entre termos consecutivos é constante e vale 3.'},
      {q:'81, 27, 9, 3, ...',a:'PG decrescente',e:'Cada termo é o anterior multiplicado por 1/3.'},
      {q:'4, 4, 4, 4, ...',a:'PA constante',e:'A razão aditiva é 0; portanto, é uma PA constante.'},
      {q:'3, 6, 12, 24, ...',a:'PG crescente',e:'Cada termo é o anterior multiplicado por 2.'}
    ];
    const s=pick(seqs),opts=shuffle(['PA crescente','PA constante','PG crescente','PG decrescente']);
    return {topic:'CLASSIFICAÇÃO',difficulty:'INTERMEDIÁRIO',question:`Classifique a sequência: ${s.q}`,options:opts,correct:s.a,explanation:s.e};
  }

  const a1=2,r=3,n=8,an=a1+(n-1)*r,sum=n*(a1+an)/2;
  return {topic:'DESAFIO MISTO',difficulty:'ELITE',
    question:`Uma PA começa em ${a1} e tem razão ${r}. Se ela possui ${n} termos, qual é a soma dos termos?`,
    options:wrongOptions(sum,4),correct:String(sum),
    explanation:`Calcule a${n} = ${a1}+(${n}−1)·${r} = ${an}. Em seguida, S${n} = ${n}(${a1}+${an})/2 = ${sum}.`};
}

function publicState(p){
  const rd=rankData(p.xp);
  return {...rd,hits:p.hits,misses:p.misses,streak:p.streak,xp:p.xp,achievements:[...p.achievements]};
}

function checkAchievements(socket,p){
  const unlock=[];
  if(p.hits>=1) unlock.push('primeiro_acerto');
  if(p.streak>=3) unlock.push('sequencia_3');
  if(p.streak>=5) unlock.push('sequencia_5');
  if(p.xp>=100) unlock.push('cem_xp');
  if(p.hits>=10) unlock.push('dez_acertos');

  for(const id of unlock){
    if(!p.achievements.has(id)){
      p.achievements.add(id);
      socket.emit('achievement',{id,label:achievementLabels[id]});
    }
  }
}

function leaderboard(){
  return [...players.values()]
    .sort((a,b)=>b.xp-a.xp)
    .map(p=>({nome:p.nome,turma:p.turma,xp:p.xp,rank:rankData(p.xp).rank}));
}

function teacherPayload(){
  const list=[...players.values()].map(p=>({
    nome:p.nome,turma:p.turma,xp:p.xp,rank:rankData(p.xp).rank,
    hits:p.hits,misses:p.misses,streak:p.streak,round:p.round
  }));
  const totalAnswers=list.reduce((s,p)=>s+p.hits+p.misses,0);
  const totalHits=list.reduce((s,p)=>s+p.hits,0);
  const classXP={'206':0,'207':0,'208':0};
  list.forEach(p=>classXP[p.turma]=(classXP[p.turma]||0)+p.xp);
  const topClass=Object.entries(classXP).sort((a,b)=>b[1]-a[1])[0];
  return {
    players:list,
    summary:{
      online:list.length,
      totalAnswers,
      avgAccuracy:totalAnswers?Math.round(totalHits/totalAnswers*100):0,
      topClass:topClass && topClass[1]>0 ? topClass[0] : '—'
    }
  };
}

function pushDashboards(){
  io.emit('leaderboard',leaderboard());
  for(const id of teachers) io.to(id).emit('teacherData',teacherPayload());
}

function sendQuestion(socket){
  const p=players.get(socket.id);if(!p)return;
  p.round++;p.answeredCurrent=false;
  const stage=stageFor(p);
  p.current=makeQuestion(stage);
  p.time=25;
  socket.emit('question',{question:p.current.question,options:p.current.options,topic:p.current.topic,difficulty:p.current.difficulty,round:p.round,stage});
  socket.emit('playerState',publicState(p));
  socket.emit('timer',p.time);
  pushDashboards();
}

io.on('connection',socket=>{
  socket.on('joinGame',({nome,turma})=>{
    nome=String(nome||'').trim().slice(0,20);
    turma=String(turma||'').trim();
    if(nome.length<2||!['206','207','208'].includes(turma))return;
    players.set(socket.id,{
      id:socket.id,nome,turma,xp:0,hits:0,misses:0,streak:0,round:0,time:25,
      current:null,answeredCurrent:false,achievements:new Set()
    });
    socket.emit('joined',{nome,turma});
    sendQuestion(socket);
    pushDashboards();
  });

  socket.on('teacherJoin',()=>{
    teachers.add(socket.id);
    socket.emit('teacherData',teacherPayload());
  });

  socket.on('answer',({answer})=>{
    const p=players.get(socket.id);
    if(!p||!p.current||p.answeredCurrent)return;
    p.answeredCurrent=true;
    const correct=String(answer)===String(p.current.correct);
    if(correct){
      p.hits++;p.streak++;
      const bonus=Math.min(20,p.streak*2);
      const speed=Math.max(0,Math.floor(p.time/5));
      p.xp+=20+bonus+speed;
    }else{
      p.misses++;p.streak=0;p.xp=Math.max(0,p.xp-4);
    }
    checkAchievements(socket,p);
    socket.emit('answerResult',{correct,correctAnswer:p.current.correct,explanation:p.current.explanation});
    socket.emit('playerState',publicState(p));
    pushDashboards();
  });

  socket.on('nextQuestion',()=>sendQuestion(socket));

  socket.on('disconnect',()=>{
    players.delete(socket.id);
    teachers.delete(socket.id);
    pushDashboards();
  });
});

setInterval(()=>{
  for(const [id,p] of players){
    if(!p.current||p.answeredCurrent)continue;
    if(p.time>0){p.time--;io.to(id).emit('timer',p.time)}
    if(p.time===0){
      p.answeredCurrent=true;p.misses++;p.streak=0;
      io.to(id).emit('answerResult',{
        correct:false,correctAnswer:p.current.correct,
        explanation:`Tempo esgotado. ${p.current.explanation}`
      });
      io.to(id).emit('playerState',publicState(p));
      pushDashboards();
    }
  }
},1000);

server.listen(PORT,()=>console.log(`CS:MATH 3.0 rodando em http://localhost:${PORT}`));
