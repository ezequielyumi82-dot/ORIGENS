# ORIGENS — Alpha 0.1 / Sprint 3A

## Executar
- Extraia a pasta `origens-prototipo`.
- Abra `index.html` para entrar no hub.
- Abra `tests.html` para executar os testes de integração.
- Para persistência mais confiável, sirva a pasta por HTTP local (ex.: Live Server).

## Sprint 3B
- Configure um organismo em Anatomia.
- Abra Laboratório e use “Importar da Anatomia”.
- Use “Gerar descendente” para criar uma geração herdada e observar possíveis mutações.
- O estado genético é mantido no `localStorage` do navegador.

## Verificação local
- Navegador: abra `tests.html` para executar as 12 verificações de integração.
- Node.js: execute `node tests-node.cjs` para rodar os 3 testes unitários do núcleo genético.

## Persistência
O progresso é salvo no armazenamento local do navegador. Limpar os dados do site remove esse progresso.

## Arquivos centrais
- `engine.js`: motor evolutivo + ORIGENSApp (hub/estado global).
- `seed-core.js`: RNG, EventBus, relógios, WorldManager e SaveDelta.
- `genetic-core.js`: identidade genética, fenótipo e herança determinística (Sprint 3B).
- `life.js` / `mind.js` / `planet.js`: simulações reproduzíveis por seed.
- `TDD-v0.8.md`: contratos, critérios e próximos passos.
- `tests.html`: testes locais sem dependências.
