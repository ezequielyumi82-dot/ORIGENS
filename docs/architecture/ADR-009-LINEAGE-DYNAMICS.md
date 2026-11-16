# ADR-009 — Identidade persistente de espécies e linhagens

- **Estado:** aprovado para prototipagem experimental; não aprovado como critério científico de especiação.
- **Data:** 16/11/2026.

## Contexto

Population Dynamics representa população agregada por habitat. Genetic Dynamics representa frequências alélicas agregadas e já possui um adaptador experimental para sincronização ecológica. Ainda faltava registrar identidade evolutiva persistente, ancestralidade, divisão de populações e extinções sem apagar o histórico.

## Decisão

Adicionar módulo isolado \`lineage-dynamics.js\` com:
- identidade estável de espécie e linhagem;
- relações de ancestralidade;
- populações agregadas por linhagem/habitat;
- observações de divergência e isolamento;
- divisão populacional determinística após critérios configuráveis;
- histórico persistente de extinções de linhagens e espécies.

Os identificadores descendentes são derivados deterministicamente dos ancestrais, tick e ordinal. A divisão populacional é explícita e conserva indivíduos. A especiação só ocorre quando divergência, população isolada e duração mínima são atendidas.

## Consequências positivas

- Permite reconstruir relações de descendência e eventos de especiação/extinção.
- Separa identidade histórica de estado populacional atual.
- Torna parâmetros e critérios de especiação explícitos e testáveis.
- Mantém o protótipo experimental desacoplado da interface e do núcleo C#.

## Limitações aceitas

- Divergência genética e isolamento são observações fornecidas externamente.
- O modelo não calcula isolamento reprodutivo nem aplica conceito taxonômico formal.
- Não representa indivíduos, genótipos, acasalamento ou migração de genes entre linhagens.
- Os limiares padrão são heurísticos e não calibrados cientificamente.
- Persistência autoritativa e replay ainda não foram implementados.

## Alternativas não escolhidas

- Criar IDs aleatórios, que dificultariam replay determinístico.
- Inferir especiação apenas por diferença de frequência alélica.
- Excluir registros extintos para simplificar o estado.
- Misturar identidade de linhagem diretamente ao motor ecológico.

## Revisão necessária

Antes de promover o contrato ao núcleo C#, definir o vínculo com os snapshots/journal, testar cenários ecológicos e genéticos integrados e revisar os critérios com base em literatura e objetivos científicos do projeto.
