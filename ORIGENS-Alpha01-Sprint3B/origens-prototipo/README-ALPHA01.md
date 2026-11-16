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


## Population Dynamics v0.1 (experimental)
- `population-dynamics.js` adds an isolated deterministic aggregate model for populations distributed across habitats.
- It models resource recovery, carrying-capacity pressure, births/deaths, local/global extinction and recolonization from adjacent surviving refuges.
- `diversity()` calculates allele richness, expected heterozygosity and Shannon entropy from supplied allele counts.
- Run its tests with `node population-dynamics.test.cjs`.
- This module is experimental and is not yet connected to the browser UI or authoritative C# engine. Its rates are heuristic and not scientifically calibrated.
- Full contract and limitations: `../../docs/architecture/POPULATION_DYNAMICS_V0.1.md` (repository-level documentation: `docs/architecture/POPULATION_DYNAMICS_V0.1.md`).


## Genetic Dynamics v0.1 (experimental)
- `genetic-dynamics.js` models aggregate diploid allele-copy evolution by habitat using selection, mutation, finite-population drift and explicit gene-flow transfers.
- Each locus must contain exactly two allele copies per individual. Migration inputs must be synchronized with the ecology's final population counts.
- Run tests with `node genetic-dynamics.test.cjs`.
- The model uses simplified allele-level fitness and does not represent individual genotypes, dominance, recombination or new allele creation. It is not scientifically calibrated and is not yet connected to Population Dynamics or the authoritative C# engine.
- Full contract: `../../docs/architecture/GENETIC_DYNAMICS_V0.1.md`.
