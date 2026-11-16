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
- Sem predação, teias alimentares, dispersão ou especiação automática.
- Uma linhagem por espécie no escopo inicial.
- Sem partição de cópias alélicas na transição de especiação; esse procedimento deve preservar exatamente os indivíduos e as cópias de cada locus antes de ser habilitado.

## Próxima decisão

Projetar a partição pós-especiação como transação atômica: repartir população por habitat, copiar indivíduos sem duplicação, separar cópias alélicas por locus, criar identidade descendente e validar conservação de população e alelos. Só então conectar a observação de especiação ao ecossistema multiespécie.
