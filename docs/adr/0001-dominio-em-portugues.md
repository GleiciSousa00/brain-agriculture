# Domínio nomeado em português, andaime técnico em inglês

As entidades, os campos e a linguagem de negócio usam os termos do agronegócio
brasileiro (`Produtor`, `Propriedade`, `Safra`, `Cultura`, `Plantio`), enquanto o
andaime técnico permanece em inglês (`repository`, `service`, `controller`, `dto`,
`module`). O motivo é que traduzir os termos de negócio perde precisão: "safra" não
tem equivalente único em inglês, e `harvest`, `season` e `crop year` significam
coisas diferentes entre si e nenhuma delas significa exatamente safra.

O glossário em [`CONTEXT.md`](../../CONTEXT.md) é a fonte da verdade sobre qual termo
é canônico e quais sinônimos evitar.

## Consequences

Identificadores mistos aparecem lado a lado, como em `ProdutorRepository` ou
`criarPlantioDto`. Isso é deliberado, não descuido. Reverter a decisão implica
renomear entidades, colunas, migrações, rotas e o contrato OpenAPI de uma vez.
