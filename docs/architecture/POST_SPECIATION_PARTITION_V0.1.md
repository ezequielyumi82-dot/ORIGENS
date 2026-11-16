# Partição pós-especiação v0.1 — contrato experimental

**Estado:** implementada e integrada ao Multi-Species Ecosystem. Modelo agregado experimental; não representa genótipos individuais nem recombinação.

## Objetivo

Concluir a transição entre uma linhagem ancestral e uma descendente sem duplicar indivíduos, cópias alélicas ou recursos ambientais.

## Operação genética

**Genetics.partitionState(state, { childSpeciesId, childPopulations })**

- Recebe um pool genético no tick atual e a quantidade de indivíduos que será transferida para a espécie descendente em cada habitat.
- Valida identidade descendente, habitats conhecidos e disponibilidade populacional.
- Para cada locus, sorteia sem reposição exatamente duas cópias por indivíduo transferido.
- O pool ancestral recebe as cópias restantes; o descendente recebe as cópias sorteadas.
- A soma das cópias ancestrais e descendentes é exatamente igual ao pool antes da partição, locus por locus.
- A operação é determinística a partir do estado e não altera a entrada.
- O estado genético descendente recebe ID próprio e uma semente determinística derivada do ancestral, descendente, tick e estado RNG.

A amostragem é feita separadamente por locus. Como o modelo não possui genótipos individuais, não preserva fase, haplótipos, ligação ou associação entre loci.

## Integração ecológica

**MultiSpeciesEcosystem.step(state, { observations })**

1. Avança recursos, nascimentos e mortes no habitat compartilhado.
2. Atualiza os pools genéticos das espécies existentes para as populações finais.
3. Envia as observações fornecidas para Lineage Dynamics.
4. Quando Lineage Dynamics confirma um evento de especiação, consulta a população da linhagem descendente.
5. Particiona o pool genético ancestral conforme a população descendente por habitat.
6. Atualiza a população e a genética da espécie ancestral e cria o registro ecológico/genético da descendente.
7. Herda os parâmetros demográficos da espécie ancestral para a descendente.
8. Mantém os mesmos habitats e o mesmo estoque ambiental; nenhuma cópia de recurso é criada.

A observação de divergência/isolamento continua sendo fornecida pelo chamador. Este incremento implementa a transação de partição, não um detector automático de especiação.

## Invariantes

- Para cada habitat: população ancestral + população descendente = população antes da divisão.
- Para cada habitat e locus: cópias alélicas ancestrais + descendentes = cópias existentes antes da partição genética.
- Cada pool genético tem seu próprio speciesId e população sincronizada.
- Cada linhagem permanece vinculada a uma única espécie.
- A árvore de ancestralidade mantém parentSpeciesId e parentLineageId.
- O habitat e seu estoque de recursos permanecem únicos.
- A operação não muta o estado de entrada; erro em qualquer validação aborta a produção do próximo estado.

## Limites

- Sem genótipos individuais, recombinação, ligação ou herança de haplótipos.
- Sem avaliação de isolamento reprodutivo; os limiares permanecem heurísticos.
- Não há detector automático de divergência/isolamento dentro do Multi-Species Ecosystem.
- A descendente herda os parâmetros demográficos da ancestral; adaptação ecológica diferenciada será etapa futura.
- Não há predação, redes alimentares ou dinâmica de múltiplos recursos.

## Testes

Foram adicionados testes para conservação locus a locus, amostragem sem reposição, determinismo, imutabilidade, rejeição de partição acima da população disponível, criação de espécie descendente e sincronização com linhagens.
