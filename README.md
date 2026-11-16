# ORIGENS

**ORIGENS** é um projeto de simulação evolutiva e emergente, concebido para crescer de ecossistemas locais até sistemas naturais e civilizacionais de maior escala.

Este repositório passa a ser a referência central do projeto. A integração será incremental: o protótipo web existente será preservado, enquanto o núcleo científico em C#/.NET será incorporado como uma camada independente.

## Estado atual do repositório

| Componente | Local | Situação |
|---|---|---|
| Protótipo Alpha 0.1 / Sprint 3B | `ORIGENS-Alpha01-Sprint3B/origens-prototipo/` | Já versionado; preservado |
| Núcleo C#/.NET 8 (Stage 4) | Backup de continuidade de 11/11/2026 | Recuperado e inspecionado; integração no repositório pendente |
| Documentação científica e roadmap geológico | `gemini-code-1785857912392.md` | Preservada como referência estratégica; requer reconciliação com o plano de implementação |
| CI automatizada | `.github/workflows/ci.yml` | Verifica os testes Node.js do protótipo e do módulo experimental de dinâmica populacional |
| Dinâmica populacional experimental | `population-dynamics.js` | Modelo agregado isolado; não integrado à interface nem ao núcleo C# |

> **Integridade do estado:** a solução C# recuperada contém 7 projetos e uma suíte NUnit. O pacote de continuidade informa que build e testes ainda não haviam sido executados por ausência do SDK .NET no ambiente original. Portanto, não se deve considerar o núcleo C# compilado ou validado até que a CI confirme isso após sua integração.

## Executar o protótipo web

Requisitos: Node.js.

```bash
cd ORIGENS-Alpha01-Sprint3B/origens-prototipo
node tests-node.cjs
```

Para explorar a interface, abra `index.html` em um navegador ou sirva a pasta por um servidor HTTP local. A página `tests.html` executa verificações adicionais no navegador.

## Arquitetura-alvo

- **Clientes e protótipos:** interfaces web, desktop e, futuramente, mobile.
- **Simulation Core:** núcleo independente de interface, com regras determinísticas e contratos testáveis.
- **Domínios científicos:** biologia, ecologia, geologia e demais subsistemas, evoluindo em módulos desacoplados.
- **Infraestrutura:** persistência, replay, observabilidade, testes e ferramentas de desenvolvimento.

O protótipo web é uma referência funcional e histórica; não será confundido com o núcleo científico C#. Os dois poderão coexistir enquanto contratos e responsabilidades forem definidos.

## Documentação

- [Protótipo Alpha 0.1](ORIGENS-Alpha01-Sprint3B/origens-prototipo/README-ALPHA01.md)
- [Baseline científico e roadmap geológico](gemini-code-1785857912392.md)
- [Estado da integração de 16/11/2026](docs/continuity/INTEGRATION_STATUS_2026-11-16.md)
- [Estrutura e governança do repositório](docs/architecture/REPOSITORY_STRUCTURE.md)
- [Dinâmica populacional experimental v0.1](docs/architecture/POPULATION_DYNAMICS_V0.1.md)

## Princípios de desenvolvimento

1. Não declarar como implementado o que estiver apenas especificado.
2. Não declarar build, testes, determinismo multiplataforma ou desempenho validados sem evidências reproduzíveis.
3. Preservar histórico e compatibilidade de saves; mudanças de schema exigem migração explícita.
4. Manter o núcleo desacoplado de engines e interfaces.
5. Priorizar testes automatizados, rastreabilidade e documentação atualizada.
