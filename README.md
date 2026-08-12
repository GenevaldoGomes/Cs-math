# CS:MATH 3.0 — Operação Progressão

Versão ampliada do jogo multiplayer educativo para PA e PG.

## Novidades da versão 3.0

- Tela inicial com estilo cinematográfico/tático.
- Cinco setores de progressão:
  1. Infiltração
  2. PA
  3. PG
  4. Somas
  5. Elite
- Ranking geral e separado por turmas 206, 207 e 208.
- Painel do professor em tempo real em `/professor.html`.
- Conquistas desbloqueáveis.
- Sons sintetizados no navegador para clique, acerto, erro e tempo.
- XP, streak, patentes, cronômetro e dificuldade progressiva.
- Resolução explicada após cada questão.
- Layout responsivo para celular.

## Executar

1. Instale Node.js 18+.
2. Abra o terminal na pasta do projeto.
3. Rode:

   npm install
   npm start

4. Jogo: http://localhost:3000
5. Painel do professor: http://localhost:3000/professor.html

## Hospedagem

Como o jogo usa Socket.IO em tempo real, prefira uma hospedagem Node.js persistente,
como Railway, Render, VPS ou servidor próprio.

## Observação importante

O painel do professor nesta versão é aberto para facilitar testes. Antes de publicar
para uso real, recomenda-se adicionar senha/autenticação ao painel.
