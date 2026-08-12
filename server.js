const express=require('express');
const http=require('http');
const {Server}=require('socket.io');
const path=require('path');
const app=express(), server=http.createServer(app), io=new Server(server);
app.use(express.static(path.join(__dirname,'public')));
const players={};
io.on('connection',s=>{
  s.on('join',p=>{ players[s.id]={id:s.id,name:(p.name||'Aluno').slice(0,18),room:p.room||'---',xp:50}; io.emit('players',Object.values(players));});
  s.on('xp',xp=>{if(players[s.id]){players[s.id].xp=xp;io.emit('players',Object.values(players));}});
  s.on('disconnect',()=>{delete players[s.id];io.emit('players',Object.values(players));});
});
server.listen(process.env.PORT||8080,'0.0.0.0',()=>console.log('MATH SCHOOL 3D V4 online'));
