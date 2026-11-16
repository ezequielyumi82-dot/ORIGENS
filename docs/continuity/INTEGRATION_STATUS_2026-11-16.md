# Estado de integração — 16/11/2026

## Decisão

O repositório `ezequielyumi82-dot/ORIGENS` foi aprovado como referência central do projeto.

## O que foi verificado

- Repositório público, branch padrão `main`.
- O histórico atual contém o protótipo Alpha 0.1 / Sprint 3B em HTML, CSS e JavaScript.
- O protótipo possui um teste automatizado Node.js em `tests-node.cjs` e uma página de testes no navegador.
- O arquivo `gemini-code-1785857912392.md` contém uma baseline de governança e o roadmap do Geological Engine (EB-320).
- O backup de continuidade de 11/11/2026 contém uma solução .NET 8 com 7 projetos e 33 métodos/atributos de teste NUnit identificados por inspeção textual nesta retomada. O README interno do backup informa 27; essa divergência precisa ser reconciliada após compilar e enumerar os testes com o SDK.
- O próprio pacote Stage 4 declara explicitamente que build e testes NUnit não foram executados.

## Resultado de CI observado nesta integração

- Workflow `ORIGENS CI` executado no GitHub Actions em 16/11/2026.
- Job `Web prototype — Node.js tests`: `success`.
- A execução mais recente cobre `node tests-node.cjs`, `node population-dynamics.test.cjs` e `node genetic-dynamics.test.cjs`; não valida o núcleo C#.

## Desenvolvimento adicional — Population Dynamics v0.1

Foi criado o módulo experimental isolado `population-dynamics.js` no protótipo Alpha, com estado agregado por habitat, regeneração de recursos, pressão de capacidade de suporte, nascimentos, mortes, extinção local/global e recolonização a partir de refúgios adjacentes. Também foi adicionada a função de métricas de diversidade (riqueza alélica, heterozigosidade esperada e entropia de Shannon) a partir de contagens fornecidas.

- Testes locais executados nesta sessão: 11/11 aprovados com Node.js 22.16.0.
- Testes existentes do Sprint 3B executados localmente: 3/3 aprovados.
- CI do GitHub Actions após a correção do workflow: sucesso, executando as suítes do protótipo, população e genética.
- A suíte foi adicionada ao workflow GitHub Actions.
- O módulo permanece experimental, sem integração à interface e sem integração ao núcleo C#; as taxas não são calibradas cientificamente.
- A diversidade é medida, mas mutação, deriva e seleção genética ainda não atualizam frequências alélicas neste módulo.

## Desenvolvimento adicional — Genetic Dynamics v0.1

Foi criado o módulo experimental isolado `genetic-dynamics.js`, com representação diploide agregada (duas cópias alélicas por indivíduo/locus), seleção por aptidão relativa de alelos, mutação entre alelos já declarados, deriva genética por amostragem finita e fluxo gênico explícito entre habitats. A função `frequencies` expõe as frequências por habitat e locus.

- Testes locais desta etapa: 11/11 aprovados com Node.js 22.16.0.
- Os testes cobrem validação do pool diploide, determinismo, deriva, mutação, seleção, migração, conservação global de cópias alélicas, sincronização com mudanças demográficas e rejeição de migração inválida.
- A suíte genética foi adicionada ao GitHub Actions.
- Execução GitHub Actions `ORIGENS CI` após esta etapa: run `43926040537`, job `Web prototype — Node.js tests`, conclusão `success`; a execução cobre os três comandos Node.js configurados.
- O módulo não está integrado automaticamente ao módulo ecológico nem ao núcleo C#. A migração é fornecida explicitamente pelo chamador, com as populações finais por habitat.
- Limitações: sem genótipos individuais, dominância, recombinação, ligação, mutação direcional ou surgimento de alelos; aptidão simplificada por alelo; sem calibração científica.

## Integração experimental ecologia-genética

Foi adicionado `stepWithEcology` ao módulo genético. O adaptador recebe estados ecológicos de ticks consecutivos, verifica identidade da espécie, habitats e população de entrada, sincroniza a população genética com o estado ecológico posterior e converte eventos `population.recolonized`/`population.migrated` em transferências de cópias alélicas. Eventos demográficos de nascimento e morte ajustam o tamanho do pool conforme a população final do habitat.

- Foram adicionados 3 testes de recolonização com transferência genética, sincronização após mudança demográfica e rejeição de estado ecológico incompatível. Os 3 testes foram executados e aprovados na CI posterior, dentro da suíte Genetic Dynamics (14/14).
- A migração é processada na ordem dos eventos ecológicos; estado incompatível ou evento inválido interrompe a operação.
- O módulo populacional atual emite recolonização, mas ainda não possui dispersão geral independente de recolonização. O adaptador reconhece `population.migrated` como contrato futuro, ainda não emitido pelo motor ecológico.
- A integração é experimental e continua fora do núcleo C# e da interface.
- A última CI confirmada (run `43926116897`) antecede a implementação do adaptador; portanto, não serve como evidência de aprovação dos 3 novos testes.

## O que esta branch prepara

- README principal com a visão integrada e o estado real dos componentes.
- Estrutura de documentação e regras de integração.
- CI Node.js para as suítes do protótipo e dos módulos experimentais populacional e genético.
- Preservação dos arquivos e diretórios atuais do protótipo e da baseline geológica.

## Workflow .NET e motivo de bloqueio atual

O workflow .NET 8 foi preparado, mas uma execução inicial falhou antes do restore porque o diretório de trabalho `engines/dotnet/` ainda não existe no branch. Isso confirma a pendência de importação, não uma falha de compilação C#. O workflow foi ajustado para executar automaticamente apenas quando houver conteúdo em `engines/dotnet/`; não há build ou teste NUnit declarado como aprovado.

## Pendências que não devem ser mascaradas

1. O conteúdo da solução C#/.NET ainda precisa ser copiado do backup para `engines/dotnet/`.
2. Não há build .NET nem execução de NUnit confirmados nesta sessão: o SDK .NET não está instalado no ambiente local e a execução remota inicial foi interrompida antes do restore porque a pasta `engines/dotnet/` ainda não havia sido criada.
3. A contagem de testes (27 no README do backup versus 33 ocorrências NUnit encontradas no arquivo) deve ser apurada pelo runner, não por contagem textual.
4. O roadmap EB-320 e a implementação ecológica Alpha 0.1 precisam ser relacionados por uma arquitetura de domínios, sem assumir que um substitui o outro.
5. Ainda não há prova de determinismo cross-platform, compatibilidade Unity 6/Android ou benchmarks.

## Próxima sequência

1. Importar a solução Stage 4 para `engines/dotnet/`, preservando os sete projetos e os documentos de continuidade.
2. Adicionar CI .NET 8 com restore, build Release e NUnit.
3. Corrigir erros reais de compilação/teste e registrar evidências.
4. Formalizar os contratos de extinção local/global, recuperação populacional, diversidade genética e capacidade de suporte antes de ampliar a simulação.
5. Formalizar identidade de espécie/locus/linhagem e validar gargalos, fixação e perda de alelos.
6. Executar/confirmar a CI após a integração do adaptador e corrigir eventuais falhas.
7. Evoluir a documentação mestre a cada etapa concluída.

## Evidência do ambiente desta retomada

- `dotnet --info`: comando indisponível; SDK .NET não instalado.
- Node.js: versão 22.16.0 disponível no ambiente de trabalho.
- A existência do workflow não será tratada como prova de execução bem-sucedida até que uma execução do GitHub Actions termine com sucesso.


## Desenvolvimento adicional — Lineage Dynamics v0.1

Foi criado o módulo experimental \`lineage-dynamics.js\` para identidade persistente de espécies e linhagens, ancestralidade, divisão populacional, especiação condicionada e histórico de extinções.

- IDs descendentes são derivados deterministicamente de ancestral, tick e ordinal.
- A especiação exige divergência genética, população isolada mínima e duração consecutiva configuráveis.
- A população dividida é transferida explicitamente por habitat; o módulo valida disponibilidade e conserva o total de indivíduos.
- Linhagens e espécies extintas permanecem registradas com seus ticks de extinção.
- Foram adicionados 11 testes em \`lineage-dynamics.test.cjs\`.
- O workflow Node.js foi atualizado para executar também essa suíte.
- A implementação é experimental e ainda não está conectada automaticamente à ecologia, genética, interface ou núcleo C#.
- A divergência genética e os dados de isolamento são fornecidos pelo chamador. Os limiares são heurísticos e não representam critérios taxonômicos ou científicos universais.
- CI GitHub Actions run `43932525139`: `success`, executando as quatro suítes Node.js no commit `fa43c90dacde0f937b9dbb128984d429a86c3dea`.

## Próximas pendências evolutivas

1. Confirmar CI para o adaptador ecologia-genética e para os 11 novos testes de linhagem.
2. Revisar validações de ancestralidade e cenários de especiação/extinção com dados ecológicos/genéticos integrados.
3. Criar adaptador que derive observações de linhagem a partir dos estados ecológico e genético, sem duplicar ou inventar população.
4. Definir persistência/versionamento e portar os contratos estáveis para C# após importar a solução Stage 4.
5. Manter os critérios experimentais explicitamente separados de alegações de realismo científico.


## Verificação final da etapa de linhagens

- A revisão adicional encontrou e corrigiu uma incompatibilidade entre a validação antecipada da divisão e o teste de observação que não atende aos critérios de isolamento. A validação de consistência da divisão agora ocorre somente depois que a observação satisfaz os critérios mínimos.
- Foram acrescentadas proteções contra ciclos de ancestralidade, população isolada maior que a população disponível, divisão maior que o grupo isolado e atualizações duplicadas.
- CI final observada: run \`43932525139\`, conclusão \`success\`; job \`Web prototype — Node.js tests\`.
- As quatro suítes foram executadas no mesmo job: Sprint 3B (3), Population Dynamics (11), Genetic Dynamics (14, incluindo os 3 testes do adaptador) e Lineage Dynamics (14).
- Total confirmado: 42 testes aprovados. Isso valida o comportamento coberto pelas suítes JavaScript; não equivale a validação científica nem a build/teste do núcleo C#.


## Desenvolvimento adicional — Integrated Evolution v0.1

Foi criado \`integrated-evolution.js\` como coordenador experimental de Population Dynamics, Genetic Dynamics e Lineage Dynamics.

- Um passo avança a ecologia, sincroniza o pool genético via \`stepWithEcology\`, atualiza população por habitat na linhagem e deriva um indicador de divergência das frequências alélicas.
- O isolamento espacial é um proxy simples: o habitat candidato não pode ter vizinhos ocupados pela mesma linhagem.
- Foram adicionados testes para sincronização, divergência derivada, isolamento espacial, especiação, pausa segura, extinção, conservação de população, validação e imutabilidade.
- Limite deliberado: v0.1 começa com uma espécie e uma linhagem. Após especiação, o estado fica em \`species_partition_required\`; não avança até existir partição multiespécie real. Isso evita misturar pools genéticos ou duplicar recursos ambientais.
- O CI foi atualizado para executar \`integrated-evolution.test.cjs\`; resultado ainda pendente para esta revisão.
- Contrato: \`docs/architecture/INTEGRATED_EVOLUTION_V0.1.md\`; decisão: \`ADR-010\`.

- CI final desta etapa: run \`43934234316\`, conclusão \`success\`, commit \`ffbb81a61181d8d7ee870b07eefe663b216527b2\`.
- Suítes aprovadas neste run: Sprint 3B (3), Population Dynamics (11), Genetic Dynamics (14), Lineage Dynamics (14) e Integrated Evolution (15). Total: 57 testes JavaScript aprovados.
- As primeiras execuções do novo coordenador encontraram duas expectativas incorretas nos testes: desempate lexicográfico e deriva genética estocástica em habitats com frequências inicialmente semelhantes. Os cenários foram corrigidos para refletir o contrato determinístico e para testar frequências realmente invariantes; o run final passou.


## Desenvolvimento adicional — Multi-Species Ecosystem v0.1

Foi implementada uma camada experimental multiespécie separada do Integrated Evolution v0.1, sem alterar o contrato do coordenador anterior.

- Os habitats e seus estoques de recursos são únicos e compartilhados entre as espécies.
- A demanda é agregada por habitat; a satisfação de recursos é calculada uma vez e aplicada a todas as espécies presentes.
- Cada espécie mantém população por habitat, pool genético independente e identidade de linhagem exclusiva.
- Os ticks atualizam genética e registro de linhagens em sincronia; extinção de uma espécie não encerra as demais nem remove o habitat.
- Foram adicionados 10 cenários de teste para recursos compartilhados, competição, separação dos pools genéticos, sincronização de linhagens, extinção específica, determinismo, imutabilidade e validações.
- Contrato: `docs/architecture/MULTI_SPECIES_ECOSYSTEM_V0.1.md`; decisão: `ADR-011`.
- Limites: competição indireta por recurso escalar; sem predação, teias alimentares, dispersão, recolonização ou especiação automática. A partição pós-especiação ainda precisa conservar indivíduos e cópias alélicas sem duplicação.
- A suíte foi adicionada ao GitHub Actions. A aprovação final da CI desta revisão ainda precisa ser observada.
- A integração C#/.NET e os testes NUnit continuam pendentes, conforme decisão anterior.


### Verificação final — Multi-Species Ecosystem v0.1

- CI GitHub Actions run [43937855428](https://github.com/ezequielyumi82-dot/ORIGENS/actions/runs/43937855428): conclusão `success`, commit `4702a20f4fad39d9ae092d949813f95c6ea1955f`.
- O job executou as seis suítes: Sprint 3B (3), Population Dynamics (11), Genetic Dynamics (14), Lineage Dynamics (14), Integrated Evolution (15) e Multi-Species Ecosystem (10). Total: **67 testes JavaScript aprovados**.
- A suíte nova verificou demanda e consumo compartilhados, satisfação ambiental comum, pools genéticos independentes, sincronização do registro de linhagens, extinção de uma espécie sem encerrar as demais, determinismo, imutabilidade e validações.
- Esta aprovação não cobre C#/.NET, NUnit, integração com interface, predação, redes tróficas nem especiação com partição genética.
