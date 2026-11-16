# Integrated Evolution v0.1 — contrato de integração

**Estado:** implementado em JavaScript experimental; CI pendente para esta revisão. Não é o motor autoritativo C# nem um modelo científico calibrado.

## Objetivo

Coordenar um tick ecológico, genético e de linhagem de forma determinística, mantendo os três estados sincronizados. O módulo não substitui os motores individuais: chama suas APIs e valida os contratos entre eles.

Arquivo: \`ORIGENS-Alpha01-Sprint3B/origens-prototipo/integrated-evolution.js\`.

## API

- \`createSimulation({ ecology, genetics, lineages })\`: valida identidades, ticks, habitats e populações iniciais; cria o estado integrado.
- \`step(state)\`: avança um tick nos três subsistemas e retorna um novo estado.
- \`summary(state)\`: produz um resumo com populações, frequências alélicas, espécies, linhagens, eventos e diagnóstico.
- \`validateSimulation(state)\`: verifica versão e sincronização dos ticks.

## Ordem de execução por tick

1. Population Dynamics avança recursos, nascimentos, mortes, recolonização e eventos ecológicos.
2. Genetic Dynamics recebe os estados ecológicos consecutivos por \`stepWithEcology\`, sincroniza a população e transfere cópias alélicas nos eventos de recolonização.
3. O coordenador sincroniza a população por habitat no registro de linhagens.
4. O coordenador calcula um indicador de divergência genética por habitat e identifica um candidato geograficamente isolado.
5. Lineage Dynamics recebe a observação derivada e atualiza duração do isolamento, especiação e extinção.

Os estados são tratados como valores imutáveis: \`step\` cria novos estados e não altera a entrada.

## Indicador de divergência genética

Para cada habitat ocupado por uma linhagem:
- habitats vizinhos ocupados pela mesma linhagem impedem que o habitat seja tratado como isolado;
- o habitat candidato é comparado com os demais habitats ocupados;
- por locus, calcula-se a distância de variação total entre a frequência alélica local e a frequência de referência dos outros habitats, ponderada pela população;
- o indicador final é a média das distâncias por locus.

A observação enviada a Lineage Dynamics usa a população do habitat isolado como população isolada e a distribuição desse habitat como divisão proposta. A seleção do candidato é determinística: maior divergência, depois maior população e, por fim, ID do habitat em ordem lexicográfica.

## Limite deliberado de v0.1

O coordenador exige exatamente uma espécie e uma linhagem no início. Quando a primeira especiação é registrada, retorna o estado com \`status: "species_partition_required"\` e bloqueia ticks subsequentes.

Isso é intencional: os estados ecológico e genético atuais ainda representam uma espécie por mundo. Continuar após a especiação sem separar populações, pools genéticos e identidades por espécie misturaria indevidamente as descendentes. A próxima etapa deverá implementar partição por espécie/linhagem, mantendo os recursos ambientais compartilhados sem duplicar habitats.

## Outros estados de parada

- \`extinct\`: o mundo ecológico ou a linhagem não possui população sobrevivente.
- \`running\`: o tick pode continuar.
- \`species_partition_required\`: requer a futura camada multiespécie antes de qualquer avanço.

## Validações

- ticks iniciais iguais nos três módulos;
- identidade de espécie consistente;
- exatamente uma espécie e uma linhagem no escopo v0.1;
- habitats únicos e conjuntos idênticos;
- população genética igual à população ecológica por habitat;
- população da linhagem igual à população ecológica por habitat;
- nenhum avanço a partir de estado parado;
- nenhum avanço com ticks dessincronizados.

## Limitações científicas e técnicas

- Modelo agregado por habitat; não representa indivíduos, genótipos ou isolamento reprodutivo.
- A divergência é distância entre frequências alélicas observadas por habitat, não estimativa formal de distância evolutiva.
- A regra de isolamento geográfico é simplificada: um habitat só é candidato quando não tem vizinhos ocupados pela mesma linhagem.
- Não há persistência, snapshot, replay ou port C# nesta etapa.
- A especiação pausa o coordenador; não há simulação multiespécie após a divisão.
- Taxas, limiares e métricas continuam heurísticos e exigem validação científica antes de qualquer interpretação realista.

## Testes

Arquivo: \`integrated-evolution.test.cjs\`. O CI executará os cenários de sincronização, divergência derivada, isolamento espacial, especiação e pausa segura, extinção, conservação populacional, validações e imutabilidade.
