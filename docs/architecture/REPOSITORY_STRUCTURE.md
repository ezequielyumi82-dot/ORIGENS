# Estrutura e governança do repositório

## Objetivo

Manter um único repositório central sem misturar protótipos, motores científicos e documentação de planejamento em uma única base de código.

## Estrutura-alvo

```text
ORIGENS/
├── .github/
│   └── workflows/
├── docs/
│   ├── architecture/
│   └── continuity/
├── engines/
│   ├── dotnet/
│   │   ├── ORIGENS.sln
│   │   ├── src/
│   │   └── tests/
│   └── geological/
│       └── (especificações e implementação futura)
├── ORIGENS-Alpha01-Sprint3B/
│   └── origens-prototipo/
├── gemini-code-1785857912392.md
└── README.md
```

A pasta `engines/dotnet` é o destino recomendado para o núcleo C#/.NET recuperado. A pasta do protótipo web permanece em seu caminho atual para preservar links, histórico e funcionamento.

## Limites entre componentes

- O protótipo web não deve ser tratado como dependência do núcleo científico.
- O núcleo C# não deve depender de APIs de navegador, DOM ou Unity.
- Adaptadores de interface devem consumir contratos públicos do núcleo.
- Os domínios científicos devem trocar dados por contratos explícitos e versionados.
- Persistência, replay e aleatoriedade determinística precisam ter testes próprios.

## Integração segura

1. Importar a solução C# recuperada sem alterar a lógica funcional durante a cópia.
2. Manter os sete projetos e suas referências.
3. Adicionar workflows .NET 8 para restore, build Release e testes NUnit.
4. Executar e registrar os resultados; corrigir apenas defeitos reproduzíveis.
5. Integrar os domínios científicos em etapas pequenas, com testes e decisões arquiteturais registradas.
6. Reconciliar o roadmap geológico com a arquitetura universal, sem apagar a especificação já existente.

## Regra de mudança

A branch `main` deve receber alterações por pull request. A integração inicial usa uma branch própria, para permitir revisão e evitar substituir o protótipo existente.
