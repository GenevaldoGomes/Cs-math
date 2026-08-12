# MATH SCHOOL 3D V6.3

Atualização sobre a V6.3:
- personagens low-poly com proporções mais humanas: cabeça, cabelo, olhos, nariz, pescoço, tronco, braços, mãos, pernas e pés;
- animação procedural de caminhada em braços e pernas;
- diretor não gira mais no lugar;
- diretor escolhe destinos aleatórios no corredor, caminha até eles, para por alguns instantes e segue para outro ponto;
- controles PC e celular da V6.3 preservados;
- campanhas PA/PG, XP, moedas e níveis preservados.

## V6.4 — Personagens GLB/GLTF locais
- NPCs e Diretor carregados por `GLTFLoader` a partir de `public/models/`.
- 4 modelos GLB locais, leves (~50 KB cada), sem dependência externa de assets.
- Fallback procedural: se um GLB falhar, o personagem anterior continua visível.
- Diretor continua com patrulha aleatória; alunos continuam circulando.
- Compatível com Railway mantendo o mesmo domínio.
