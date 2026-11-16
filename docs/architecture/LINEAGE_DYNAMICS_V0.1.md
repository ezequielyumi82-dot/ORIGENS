# Lineage Dynamics — especificação experimental v0.1

**Estado:** implementado como módulo experimental isolado em JavaScript. Não integrado à interface, ao motor ecológico/genético ou ao núcleo C#. Não é um modelo científico calibrado.

## Objetivo

Manter identidade persistente de espécies e linhagens ao longo dos ticks, registrar relações de ancestralidade, representar divisões populacionais associadas à especiação e preservar o histórico de extinções.

Arquivo: \`ORIGENS-Alpha01-Sprint3B/origens-prototipo/lineage-dynamics.js\`.

## Modelo de dados

- **Espécie:** \`id\`, nome opcional, espécie ancestral opcional, tick de origem, estado ativo/extinto e tick de extinção.
- **Linhagem:** \`id\`, \`speciesId\`, linhagem ancestral opcional, tick de origem, contador de ticks de isolamento, estado e tick de extinção.
- **População:** contagem inteira por linhagem e habitat.
- **Evento:** registro append-only de especiação e extinções.

Os identificadores de descendentes são derivados deterministicamente da identidade ancestral, tick e ordinal de descendência. Não dependem de UUID aleatório. Uma colisão é tratada como erro explícito.

## API

- \`createState(config)\`: valida espécies, linhagens, relações e populações iniciais.
- \`step(state, options)\`: retorna um novo estado no tick seguinte, sem alterar o estado de entrada.
- \`history(state)\`: fornece cópias dos registros de espécies, linhagens e eventos históricos.
- \`validateState(state)\`: verifica referências e estrutura básica.

\`step\` aceita:
- \`populationUpdates\`: lista de populações finais por linhagem, discriminadas por habitat;
- \`observations\`: observações por linhagem com \`geneticDivergence\`, \`isolatedPopulation\` e \`splitByHabitat\`.

## Critérios experimentais de especiação

Configuração inicial padrão:
- divergência genética mínima: 0,25;
- população isolada mínima: 10 indivíduos;
- duração mínima: 3 ticks consecutivos.

Uma observação só avança o contador de isolamento quando os três critérios são atendidos. Se algum critério falhar, o contador volta a zero. Ao atingir a duração mínima, a divisão exige uma distribuição populacional explícita em \`splitByHabitat\`, que deve respeitar a população disponível em cada habitat.

A divisão cria uma nova espécie e uma nova linhagem filha, ambas ligadas aos respectivos ancestrais. A população transferida é subtraída da linhagem ancestral e atribuída à descendente; o total de indivíduos é conservado. A distância genética é uma entrada observada pelo chamador, não calculada por este módulo.

## Extinção e histórico

Quando a população total de uma linhagem chega a zero, seu estado passa para \`extinct\` e o tick de extinção é registrado. Uma espécie só é marcada como extinta quando todas as suas linhagens estão extintas. Registros e eventos não são apagados. O módulo não reativa linhagens extintas.

## Invariantes

- IDs de espécies e linhagens são únicos.
- Cada linhagem referencia uma espécie existente.
- Cada população referencia uma linhagem existente.
- Contagens por habitat são inteiras e não negativas.
- Uma divisão não pode transferir mais indivíduos do que existem no habitat de origem.
- Uma divisão conserva o total de indivíduos.
- A mesma entrada e as mesmas observações produzem o mesmo resultado.
- A função \`step\` não altera o estado recebido.

## Limitações e riscos

- Modelo agregado; não representa indivíduos, acasalamento, isolamento reprodutivo real ou fluxo gênico medido.
- A divergência genética é fornecida pelo chamador; não é derivada diretamente das frequências alélicas.
- A população isolada e a distribuição da população dividida também são entradas externas.
- O limiar de divergência, população mínima e duração são parâmetros heurísticos, não valores biologicamente universais.
- A criação de uma espécie é uma regra operacional simplificada, não uma afirmação taxonômica.
- Não há ainda integração automática com Population Dynamics ou Genetic Dynamics.
- Persistência, snapshots, replay, migração de schema e implementação C# permanecem pendentes.

## Próxima integração recomendada

Criar um adaptador explícito que agregue população e divergência genética por linhagem a partir dos módulos ecológico e genético; validar cenários de isolamento, contato secundário, gargalo e extinção; depois portar o contrato para o núcleo C# e sua persistência.
