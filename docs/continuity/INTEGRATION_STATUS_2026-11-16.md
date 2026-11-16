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
- Isso valida apenas o comando `node tests-node.cjs` no protótipo web; não valida o núcleo C#.

## O que esta branch prepara

- README principal com a visão integrada e o estado real dos componentes.
- Estrutura de documentação e regras de integração.
- CI inicial para executar os testes Node.js já existentes no protótipo.
- Preservação dos arquivos e diretórios atuais do protótipo e da baseline geológica.

## Pendências que não devem ser mascaradas

1. O conteúdo da solução C#/.NET ainda precisa ser copiado do backup para `engines/dotnet/`.
2. Não há build .NET nem execução de NUnit confirmados nesta sessão: o ambiente disponível não possui `dotnet`.
3. A contagem de testes (27 no README do backup versus 33 ocorrências NUnit encontradas no arquivo) deve ser apurada pelo runner, não por contagem textual.
4. O roadmap EB-320 e a implementação ecológica Alpha 0.1 precisam ser relacionados por uma arquitetura de domínios, sem assumir que um substitui o outro.
5. Ainda não há prova de determinismo cross-platform, compatibilidade Unity 6/Android ou benchmarks.

## Próxima sequência

1. Importar a solução Stage 4 para `engines/dotnet/`, preservando os sete projetos e os documentos de continuidade.
2. Adicionar CI .NET 8 com restore, build Release e NUnit.
3. Corrigir erros reais de compilação/teste e registrar evidências.
4. Formalizar os contratos de extinção local/global, recuperação populacional, diversidade genética e capacidade de suporte antes de ampliar a simulação.
5. Evoluir a documentação mestre a cada etapa concluída.

## Evidência do ambiente desta retomada

- `dotnet --info`: comando indisponível; SDK .NET não instalado.
- Node.js: versão 22.16.0 disponível no ambiente de trabalho.
- A existência do workflow não será tratada como prova de execução bem-sucedida até que uma execução do GitHub Actions termine com sucesso.
