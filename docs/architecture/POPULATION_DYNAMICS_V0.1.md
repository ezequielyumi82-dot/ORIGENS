# Population Dynamics — especificação experimental v0.1

**Estado:** implementado no protótipo JavaScript isolado; não integrado ao núcleo C# e não é ainda um modelo ecológico científico calibrado.

## Escopo desta entrega

O módulo introduz uma primeira representação agregada de uma espécie distribuída por habitats. Cada habitat mantém população, capacidade de suporte, disponibilidade e regeneração de recursos, taxa reprodutiva, mortalidade e conectividade com habitats vizinhos.

O modelo é deliberadamente agregado: não simula indivíduos, genótipos individuais, idade, sexo, nichos múltiplos ou cadeias tróficas. Serve para validar contratos de população, eventos e reprodutibilidade antes da migração para C#.

## Contrato público

Arquivo: `population-dynamics.js`

- `createWorld(config)`: valida e normaliza seed, espécie, habitats e parâmetros.
- `step(world)`: avança exatamente um tick e retorna um novo estado, sem mutar o estado de entrada.
- `diversity(alleleCounts)`: calcula riqueza alélica média, heterozigosidade esperada média e entropia de Shannon média por locus.

### Estado de habitat

- `id`: identificador estável textual.
- `population`: contagem inteira não negativa.
- `carryingCapacity`: capacidade nominal do habitat.
- `resources`: disponibilidade entre 0 e 1.
- `resourceRegeneration`: regeneração por tick entre 0 e 1.
- `reproductionRate`, `mortalityRate`: taxas por tick entre 0 e 1.
- `neighbors`: IDs de habitats conectados.

A capacidade efetiva por tick é `floor(carryingCapacity × resources)`. Nascimentos são limitados pelos espaços disponíveis nessa capacidade. A mortalidade aumenta com pressão de densidade e escassez de recursos. A recuperação ambiental segue `R' = R + regeneration × (1 − R)`.

## Extinção e recolonização

- **Extinção local:** população de uma espécie cai a zero em um habitat; gera `population.local_extinction`.
- **Extinção global:** soma populacional de todos os habitats cai a zero; gera `population.global_extinction`.
- **Refúgio:** habitat adjacente que mantém população positiva.
- **Recolonização:** um habitat previamente vazio, com recursos acima do limiar, pode receber um indivíduo de um refúgio adjacente, conforme a taxa de migração. A transferência conserva a população total.
- **Recuperação de recursos:** ocorre mesmo quando a população local é zero, permitindo recolonização posterior.

A recolonização não ocorre sem uma população-fonte. Portanto, a extinção global não é revertida espontaneamente neste protótipo.

## Diversidade genética

A função `diversity` recebe contagens de alelos por locus e calcula:
- riqueza alélica média: número de alelos observados por locus;
- heterozigosidade esperada: (H = 1 - \sum p_i^2);
- entropia de Shannon: (S = -\sum p_i \ln(p_i)).

O módulo ainda não altera frequências alélicas por seleção, mutação, deriva genética ou migração. A métrica é uma função de análise sobre dados fornecidos externamente, não uma genética populacional integrada.

## Determinismo e eventos

A ordem dos habitats e das fontes de recolonização é ordenada por ID. A aleatoriedade é local ao módulo (Xorshift32) e o estado RNG integra o estado retornado. A mesma seed, estado e versão devem gerar o mesmo resultado no mesmo runtime/semântica numérica.

Eventos emitidos:
- `population.births`
- `population.deaths`
- `population.local_extinction`
- `population.recolonized`
- `population.global_extinction`

Os eventos carregam o tick que foi processado (o tick anterior ao incremento do estado).

## Limitações e riscos conhecidos

1. As taxas são heurísticas de protótipo, sem calibração empírica.
2. A população é inteira e agregada; não há indivíduos nem distribuição etária.
3. A migração transfere um indivíduo e usa o primeiro refúgio elegível em ordem estável.
4. A diversidade é calculada a partir de contagens externas e não evolui automaticamente.
5. O RNG é versionado apenas pela constante do módulo; save migration ainda não foi implementada.
6. A fórmula de mortalidade e a capacidade efetiva precisam de validação ecológica e análise de sensibilidade.
7. O modelo deve ser reimplementado no C# autoritativo após revisão de contratos e integração com persistência/replay.

## Critérios para próxima versão

- testes de invariantes de conservação populacional durante migração;
- cenários de gargalo, deriva, mutação e perda de alelos;
- migração bidirecional e dispersão parametrizada;
- múltiplas espécies e competição por recursos compartilhados;
- curva de capacidade de suporte dinâmica;
- integração com eventos versionados, snapshots e replay do núcleo C#.
