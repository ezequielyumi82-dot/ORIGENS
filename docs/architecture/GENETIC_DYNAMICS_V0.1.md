# Genetic Dynamics — especificação experimental v0.1

**Estado:** implementado como módulo experimental isolado no protótipo JavaScript. Não integrado à interface nem ao núcleo C#; não é um modelo científico calibrado.

## Objetivo e escopo

Acrescentar evolução de frequências alélicas por habitat, mantendo a população agregada. O modelo é diploide em contagem de cópias: cada indivíduo corresponde a duas cópias alélicas por locus. As cópias são amostradas independentemente; portanto, esta versão não representa pares de cromossomos, dominância, ligação gênica, recombinação ou genótipos individuais.

Arquivo: `genetic-dynamics.js`.

- `createState(config)`: valida população, loci, contagens e parâmetros; ordena habitats e alelos.
- `step(state, options)`: executa um passo genético determinístico, devolvendo novo estado sem alterar o original.
- `stepWithEcology(state, previousWorld, nextWorld)`: adaptador que consome dois ticks ecológicos consecutivos, sincroniza populações finais e converte eventos de recolonização/migração em fluxo gênico.
- `frequencies(state)`: retorna frequências alélicas por habitat e locus.

## Formato dos dados

Cada habitat contém `id`, `population` e `alleleCounts`. Para cada locus, a soma das contagens deve ser exatamente `2 × population`. Todos os habitats que compartilham um locus devem usar o mesmo conjunto de alelos.

Configuração opcional:
- `seed`: semente do gerador pseudoaleatório;
- `mutationRate`: probabilidade por cópia amostrada de sofrer mutação;
- `selection`: aptidão relativa por alelo, organizada por locus. Aptidão padrão = 1.

`step` aceita ainda:
- `populations`: população final por habitat, permitindo sincronizar o resultado do motor ecológico;
- `migrations`: lista de transferências `{ sourceHabitatId, targetHabitatId, individuals }`. As populações informadas devem representar o estado depois das migrações.

## Integração com a ecologia

O adaptador `stepWithEcology` recebe o estado genético anterior e os estados ecológicos anterior/posterior. Ele exige ticks consecutivos, identidade de espécie igual e conjunto de habitats idêntico. Também exige que as populações genéticas de entrada coincidam com as populações do mundo ecológico anterior. As populações finais são copiadas do mundo ecológico posterior; eventos `population.recolonized` e `population.migrated` do tick processado são convertidos em transferências de indivíduos e suas cópias alélicas.

O adaptador falha explicitamente diante de estado desatualizado ou evento de migração inválido, em vez de tentar reconciliar dados silenciosamente. Eventos de nascimento e morte alteram o tamanho do pool genético via população final, sem criar uma migração artificial.

## Mecanismos

1. **Seleção:** frequências ancestrais são ponderadas pela aptidão relativa de cada alelo. É uma aproximação de seleção no nível do alelo, não uma função de aptidão de genótipo.
2. **Mutação:** após a escolha ponderada, uma cópia pode mudar para outro alelo já declarado no locus. A versão atual não cria alelos novos nem usa uma matriz de mutação direcional.
3. **Deriva genética:** as cópias do novo pool são amostradas com reposição, em quantidade `2 × população`. Isso representa amostragem finita tipo Wright–Fisher e pode alterar frequências mesmo sem seleção ou mutação.
4. **Fluxo gênico:** migrantes são amostrados sem reposição no pool de origem e suas cópias são transferidas ao destino. A transferência conserva o total global de cada alelo por locus. A população final por habitat deve ser fornecida em `options.populations` quando houver migração.

## Invariantes e determinismo

- Contagens sempre inteiras e não negativas.
- Por habitat e locus, total de cópias = `2 × população`.
- Migração não cria nem elimina cópias alélicas globalmente.
- A mesma versão, estado, seed e opções produzem o mesmo resultado no mesmo runtime/semântica numérica.
- O estado RNG acompanha o estado genético retornado.

## Limitações e riscos

- Modelo agregado, sem indivíduos, genótipos, idade, sexo, estrutura familiar ou acasalamento.
- Sem dominância, epistasia, ligação, recombinação, mutações direcionais ou surgimento de novos alelos.
- Seleção atua sobre aptidão alélica relativa, uma simplificação que não equivale à seleção fenotípica/genotípica real.
- Deriva e mutação usam amostragem por cópia; populações muito grandes podem ter custo linear no número de cópias.
- O adaptador consome recolonizações e eventos `population.migrated`; o módulo ecológico atual só produz recolonizações como evento de migração. Outros tipos de migração ainda precisam ser modelados explicitamente.
- Não há calibração empírica nem validação biológica. Não usar para inferência científica.
- Evolução e persistência ainda não foram integradas ao C#; schema/save/replay precisam ser definidos antes de persistência autoritativa.

## Próxima integração recomendada

Definir identidade de espécie/locus versionada, adicionar cenários de gargalo e extinção com perda/fixação de alelos e, depois, portar os contratos para C# junto de snapshots, journal e migrações de schema. Antes disso, revisar o modelo com cenários de gargalo, populações pequenas, perda/fixação de alelos e sensibilidade dos parâmetros.
