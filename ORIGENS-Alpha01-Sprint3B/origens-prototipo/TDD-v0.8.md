# ORIGENS — TDD v0.8 / Alpha 0.1
## Projeto Semente — contratos validados no protótipo web

### Escopo desta entrega
- Hub central com navegação entre Início, Anatomia, Ciclo, Laboratório, Mente, Observatório e Semente.
- Estado global persistido no navegador (`localStorage`, chave `origens.alpha01.state`).
- Registro de visitas, ações e progresso por módulo.
- `SeedCore`: EventBus com unsubscribe, relógios escaláveis, RNG determinístico, WorldManager e SaveDelta restaurável.
- `Evolution`, `Life` e `Mind`: geradores pseudoaleatórios reproduzíveis por seed, preservando as APIs dos módulos.
- Cena Semente: distribuição inicial de alimento e predadores derivada do RNG do mundo.
- Testes de integração executáveis em `tests.html`, sem bibliotecas externas.

## Contratos
1. `ORIGENSApp.setState(module)` aceita apenas módulos conhecidos e registra visitas.
2. `ORIGENSApp.recordAction(module, action, payload)` mantém histórico limitado e descobertas.
3. `ORIGENSApp.updateProgress(patch)` atualiza o estado compartilhado sem apagar outros módulos.
4. `SeedCore.SeededRandom(seed)` gera a mesma sequência para a mesma seed.
5. `EventBus.on` retorna uma função de cancelamento; `emit` não altera a lista durante a iteração.
6. `DeltaSave.snapshot()` e `DeltaSave.restore()` preservam seed e deltas.
7. `WorldManager.commit` converte ações de domínio em estado e evento.
8. `Evolution.setSeed(seed)`, `Life.world(seed)` e `Mind.world(seed)` reproduzem os estados iniciais.
9. O Observatório reinicializa a seed evolutiva antes de gerar espécies planetárias.

## Execução dos testes
1. Extraia o ZIP.
2. Abra `tests.html` em um navegador moderno.
3. Confirme os doze resultados aprovados.
4. Abra `index.html` e navegue pelos módulos; visitas e progresso ficam no mesmo navegador.

> Para testar corretamente módulos com `localStorage`, recomenda-se servir a pasta por um servidor HTTP local. A execução por `file://` pode ter restrições de armazenamento conforme o navegador.

## Critérios de aceite Alpha 0.1
- [x] Navegação centralizada e links cruzados entre os módulos.
- [x] Estado compartilhado persistido entre páginas.
- [x] Núcleo com relógios, eventos, RNG determinístico e delta.
- [x] Contratos de integração cobertos por testes de navegador (doze verificações).
- [x] Laboratório, Anatomia, Ciclo, Mente, Observatório e Semente publicam progresso.
- [ ] Persistência em IndexedDB / migração de versões futuras.
- [ ] Converter contratos para interfaces e testes C# na Unity.
- [ ] LOD de população com reidratação validada em testes de longa duração.

## Sprint 3B — Identidade genética e hereditariedade
- `genetic-core.js` define identidade genética serializável, versão do genoma, fenótipo derivado e relações parentais.
- Anatomia publica o genoma atual no estado global; Laboratório pode importá-lo e aplicá-lo ao DNA evolutivo.
- Reprodução combina características parentais com RNG determinístico e possibilidade de mutação.
- A linhagem, o organismo ativo e eventos recentes são persistidos em `progress.genetics` no localStorage.
- O Laboratório restaura a linhagem ativa ao reabrir a página.

### Critérios de aceite Sprint 3B
- [x] Identidade genética e versão do genoma serializáveis.
- [x] Fenótipo calculado a partir das escolhas anatômicas.
- [x] Laboratório aplica anatomia ao DNA evolutivo.
- [x] Descendentes registram vínculos parentais e geração.
- [x] Reprodução determinística para a mesma seed.
- [x] Histórico recente e organismo ativo salvos no estado global.
- [ ] Testes executados em navegador real e validação de persistência após recarga.
- [ ] Cruzamento entre duas linhagens distintas e migração de saves antigos.

## Próxima sequência — Sprint 3C
1. Executar os doze testes em navegador e corrigir eventuais diferenças entre navegadores.
2. Implementar cruzamento entre linhagens diferentes e seleção de ancestral no Laboratório.
3. Migrar o histórico genético para SaveDelta e validar restauração após recarga.
4. Preparar contratos equivalentes em C# para a futura versão Unity.
