# ADR-012 — Partição genética e ecológica pós-especiação

- **Status:** Aceito para o protótipo experimental
- **Data:** 2026-11-16

## Contexto

O ecossistema multiespécie já mantinha recursos ambientais compartilhados e pools genéticos separados, mas não conseguia transformar uma divisão de linhagem em duas populações e espécies simuláveis. A partição não poderia clonar o pool ancestral, pois isso duplicaria indivíduos e alelos.

## Decisão

Implementar Genetics.partitionState e conectar a confirmação de especiação de Lineage Dynamics ao MultiSpeciesEcosystem.step.

A partição genética amostra sem reposição duas cópias alélicas por indivíduo transferido, independentemente por locus. A população restante e suas cópias formam o pool ancestral; a população transferida e suas cópias formam o pool descendente.

A operação é determinística, pura e validada por invariantes de conservação. A espécie descendente herda parâmetros demográficos da ancestral e recebe identidade genética e filogenética próprias. Habitats e recursos não são particionados nem duplicados.

As observações que satisfazem os critérios de especiação continuam sendo fornecidas pelo chamador. O incremento não cria um detector automático de divergência ou isolamento.

## Consequências

### Positivas
- Especiação confirmada pode produzir duas espécies que continuam no mesmo ecossistema.
- População e cópias alélicas são conservadas exatamente durante a divisão.
- Cada espécie passa a ter pool genético independente.
- Ancestralidade e história da linhagem permanecem explícitas.
- O estoque ambiental continua único e compartilhado.

### Limitações
- A amostragem é independente por locus; não há genótipos individuais, fase, ligação ou recombinação.
- A observação de especiação é fornecida externamente e seus limiares continuam heurísticos.
- A espécie descendente herda parâmetros demográficos da ancestral.
- Não há predação, teias alimentares ou múltiplos recursos.

## Próximo passo

Evoluir a dinâmica ecológica compartilhada para múltiplos recursos e, em seguida, relações tróficas explícitas. Manter o modelo agregado até haver justificativa para introduzir agentes/indivíduos.
