# ADR-010 — Coordenador integrado de ecologia, genética e linhagens

- **Estado:** aprovado para prototipagem experimental.
- **Data:** 16/11/2026.

## Contexto

Os módulos Population Dynamics, Genetic Dynamics e Lineage Dynamics tinham contratos isolados. A integração precisava manter ticks e populações coerentes e derivar a observação de especiação dos dados genéticos, sem receber uma divergência arbitrária do chamador.

## Decisão

Criar \`integrated-evolution.js\` como coordenador puro e determinístico. Em cada tick, avança ecologia, sincroniza genética por meio de \`stepWithEcology\`, atualiza a população da linhagem e deriva um indicador de divergência genética a partir das frequências alélicas por habitat.

O candidato à especiação é um habitat ocupado sem vizinhos ocupados pela mesma linhagem. A distância é a variação total média por locus contra uma referência ponderada dos outros habitats ocupados. A decisão final continua sob os limiares configuráveis de Lineage Dynamics.

## Limite explícito

A v0.1 começa com uma espécie e uma linhagem. Após especiação, o estado integrado fica em \`species_partition_required\` e não avança. Não será simulada a descendência de múltiplas espécies até que ecologia compartilhada, populações e pools genéticos sejam particionados sem duplicar recursos ou misturar alelos.

## Consequências positivas

- Um único passo sincroniza os três subsistemas.
- Divergência e população são derivadas de estados simulados, não digitadas manualmente.
- As validações impedem discrepâncias de tick, espécie, habitat e população.
- A pausa na especiação evita falsa continuidade multiespécie.

## Limitações

O indicador genético e o isolamento geográfico são proxies simplificados, não critérios taxonômicos. O módulo ainda não possui persistência nem integração C#. A camada multiespécie e o ambiente compartilhado permanecem trabalho futuro.
