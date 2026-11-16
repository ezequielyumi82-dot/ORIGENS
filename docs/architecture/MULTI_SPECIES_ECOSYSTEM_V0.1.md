# Multi-Species Ecosystem v0.1 — contrato experimental

**Estado:** implementado em JavaScript experimental. Não é o motor autoritativo C# e não é um modelo científico calibrado.

## Objetivo

Permitir várias espécies no mesmo conjunto de habitats, compartilhando o mesmo estoque ambiental de recursos, mantendo populações e pools genéticos independentes por espécie e sincronizando a história de linhagens.

Arquivo: `ORIGENS-Alpha01-Sprint3B/origens-prototipo/multi-species-ecosystem.js`.

## API

- `createEcosystem({ habitats, species, lineages, seed, tick })`: valida recursos, identidades, ticks e populações ecológicas/genéticas/filogenéticas.
- `step(state, { observations })`: regenera recursos uma vez por habitat, calcula a demanda conjunta, atualiza pools genéticos, envia observações de especiação ao módulo de linhagens e executa a partição genética/populacional quando uma especiação é confirmada.
- `summary(state)`: apresenta recursos por habitat, populações e frequências genéticas por espécie, eventos e diagnósticos.
- `validateEcosystem(state)`: valida sincronização, identidades e invariantes.

## Estado inicial

Cada habitat possui um único estoque de recursos:
- `resources`: recurso disponível;
- `maxResources`: limite do estoque;
- `regeneration`: regeneração absoluta por tick;
- `resourceUnit`: conversão entre indivíduos e unidades de recurso;
- `neighbors`: topologia espacial preservada para etapas futuras.

Cada espécie possui:
- identidade `id` e `lineageId` exclusivos;
- população inteira por habitat;
- `resourceUse`, `reproductionRate`, `mortalityRate` e `shortageMortality`;
- um estado genético independente, com o mesmo conjunto de habitats e população sincronizada.

O registro de linhagens usa os módulos existentes e mantém uma linhagem exclusiva por espécie, inclusive após a criação de descendentes.

## Regra de competição por recurso

Para cada habitat, primeiro é calculada a demanda agregada:

`demanda = soma(população_da_espécie × consumo_por_indivíduo)`

A disponibilidade é calculada uma única vez:

`disponível = resources × resourceUnit`

A satisfação compartilhada é:

`satisfação = min(1, disponível / demanda)`

O consumo total é limitado ao recurso disponível. A satisfação é aplicada às taxas reprodutivas e de mortalidade por escassez de todas as espécies presentes. Assim, uma espécie não recebe uma cópia própria do estoque ambiental.

A ordem de espécies é estável por ID e o gerador pseudoaleatório é determinístico. A atualização não altera o estado de entrada.

## Ordem do tick

1. Regenerar o recurso uma vez por habitat, respeitando `maxResources`.
2. Calcular a demanda conjunta das espécies no habitat.
3. Calcular uma satisfação ambiental compartilhada e consumir o recurso uma única vez.
4. Atualizar nascimentos e mortes de cada espécie.
5. Atualizar cada estado genético com sua própria população final.
6. Atualizar o registro de linhagens com as populações finais e registrar extinções.

## Partição pós-especiação

Quando uma observação fornecida pelo chamador satisfaz os critérios de Lineage Dynamics, a camada cria a espécie descendente, transfere a população por habitat e reparte o pool genético sem reposição. A partição preserva exatamente indivíduos e cópias alélicas por locus. A descendente herda os parâmetros demográficos da ancestral; habitats e recursos continuam únicos. Detalhes: `POST_SPECIATION_PARTITION_V0.1.md` e ADR-012.

## Limites deliberados

- Modelo agregado por habitat; não existem indivíduos, genótipos individuais ou agentes.
- A competição é indireta, mediada pelo consumo de um recurso escalar compartilhado.
- Não há predadores, presas, relações tróficas, transferência de energia ou decompositores.
- Não há dispersão, recolonização nem migração entre habitats nesta camada.
- A observação de divergência/isolamento continua sendo fornecida pelo chamador; não há detector automático de especiação nesta camada.
- A partição genética é agregada e independente por locus; não preserva genótipos individuais, fase, ligação ou haplótipos.
- Uma espécie possui uma linhagem exclusiva no escopo v0.1.
- A extinção de uma espécie não encerra as demais nem remove o habitat ou seu recurso.
- As taxas são heurísticas; unidades e calibração ecológica precisam ser revistas antes de qualquer interpretação científica.

## Testes

Arquivo: `multi-species-ecosystem.test.cjs`. Os cenários cobrem estoque compartilhado, competição, pools genéticos separados, sincronização de linhagens, extinção específica, determinismo, imutabilidade e validação de estado.
