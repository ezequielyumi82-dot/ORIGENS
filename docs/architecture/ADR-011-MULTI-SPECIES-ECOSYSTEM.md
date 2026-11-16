# ADR-011 — Ecossistema multiespécie com recursos compartilhados

- **Status:** Aceito para o protótipo experimental v0.1
- **Data:** 2026-11-16

## Contexto

Integrated Evolution v0.1 interrompia a simulação após a primeira especiação. O mundo ecológico e o estado genético representavam uma única espécie. Executar um mundo completo independente por espécie duplicaria artificialmente habitats, recursos e capacidade ambiental.

## Decisão

Criar uma camada `multi-species-ecosystem.js` que mantém:
- habitats e estoques de recursos únicos e compartilhados;
- população, parâmetros demográficos, pool genético e linhagem independentes por espécie;
- cálculo de demanda agregada por habitat;
- uma única satisfação ambiental aplicada a todas as espécies presentes;
- atualização sincronizada de genética e linhagens.

A camada é separada do Integrated Evolution v0.1 para preservar seu contrato e seus testes.

## Consequências

### Positivas
- Recursos ambientais não são duplicados entre espécies.
- Uma espécie pode extinguir-se sem extinguir as demais.
- A identidade genética e a população permanecem separadas por espécie.
- A história de linhagens é atualizada a cada tick.
- O cálculo é determinístico e testável.

### Limitações aceitas
- Competição indireta por um recurso escalar, sem competição por nicho ou recursos múltiplos.
- Sem predação, teias alimentares ou múltiplos recursos.
- A observação de especiação ainda é fornecida externamente; não há detector automático.
- A partição pós-especiação foi implementada em ADR-012, com amostragem alélica sem reposição e conservação por locus.

## Próxima decisão

Ampliar o ambiente para múltiplos recursos e, depois, introduzir relações tróficas sem duplicar estoques ou energia. A partição pós-especiação está tratada no ADR-012.
