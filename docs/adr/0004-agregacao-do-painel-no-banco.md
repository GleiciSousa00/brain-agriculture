# A agregação do painel acontece no banco, nunca na aplicação

Os números do painel (contagem de Propriedades, soma de hectares, distribuição por
estado, por Cultura e por Uso do Solo) são calculados por consultas de agregação com
`GROUP BY`, escritas no QueryBuilder do TypeORM. O banco devolve apenas as linhas do
resultado. Em nenhum ponto a aplicação carrega Propriedades ou Plantios para somar em
memória.

O motivo é volume: somar em JavaScript exige transferir toda a base do Postgres para o
processo Node a cada abertura do painel, o que degrada de forma linear com o número de
Plantios e é indiferente a qualquer índice.

## Considered Options

Carregar as entidades com suas relações e reduzir em JavaScript é o caminho que o ORM
torna mais confortável e foi rejeitado pelo motivo acima.

SQL escrito à mão via `dataSource.query` foi considerado e rejeitado por ora. Ele só
ganharia do QueryBuilder para reunir todos os números do painel em uma única ida ao
banco, com expressões de tabela comuns. Fica como saída caso a medição mostre que as
consultas separadas incomodam, e não antes disso.

## Consequences

As colunas que o painel agrupa precisam de índice, e alterar as agregações passa a
exigir pensar em SQL, não apenas em objetos. Um leitor pode achar o `GROUP BY` menos
limpo que um `find` com relações e trocar por ele; este registro existe para impedir
essa troca.
