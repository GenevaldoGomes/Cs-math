const express=require('express');const http=require('http');const{Server}=require('socket.io');const path=require('path');
const app=express(),server=http.createServer(app),io=new Server(server);app.use(express.static(path.join(__dirname,'public')));
const players=new Map();io.on('connection',s=>{s.on('joinSchool',d=>{players.set(s.id,{id:s.id,name:(d.name||'Aluno').slice(0,25),turma:d.turma||'',xp:0,room:'Entrada'});io.emit('players',[...players.values()])});
s.on('state',d=>{const p=players.get(s.id);if(p){p.room=d.room||p.room;p.x=d.x;p.z=d.z;s.broadcast.emit('state',{id:s.id,...d})}});
s.on('xp',v=>{const p=players.get(s.id);if(p){p.xp+=Number(v)||0;io.emit('players',[...players.values()])}});
s.on('disconnect',()=>{players.delete(s.id);io.emit('players',[...players.values()])})});server.listen(process.env.PORT||8080,'0.0.0.0');