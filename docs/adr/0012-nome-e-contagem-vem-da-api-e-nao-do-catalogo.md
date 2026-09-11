# O nome do Produtor e a contagem de Propriedades vêm da API, e não do catálogo em memória

O cadastro carregava uma lista de Produtores e uma de Propriedades ao entrar na tela, cada
uma na primeira página do maior tamanho que a API aceita, que é cem. Dessa lista saíam duas
coisas: o nome do Produtor dono de cada Propriedade da tabela e quantas Propriedades cada
Produtor tem. Passando de cem, a lista vinha cortada, e as duas colunas passavam a mentir ou
a se calar. A tela avisava disso com um recado no alto, escrito para ser lido por quem
opera — que é a confissão de que a decisão estava errada, não a solução dela.

**A listagem de Produtores recorta por identificador.** `GET /produtores?ids=…` devolve
exatamente os Produtores pedidos, até o mesmo teto de cem que vale para o tamanho de página.
Quem lista uma página de Propriedades tem em mãos os identificadores dos donos dela, e é com
eles que pede os nomes: uma chamada por página, e não uma por linha. Uma página não passa do
teto, então a lista de identificadores também não.

**A listagem de Produtores diz quantas Propriedades cada um tem.** A contagem sai de uma
agregação só, para os Produtores da página, pela porta que o módulo de Produtor já abre para
o de Propriedade. Ela viaja na linha do Produtor, e por isso vale para qualquer página do
cadastro.

**O dono do recorte é resolvido pelo identificador do endereço.** O rastro, o título da
lista e o formulário que nasce em nome de alguém pedem esse Produtor à API pela mesma rota
recortada por identificador. Enquanto a resposta não chega, o recorte fica sem nome em vez
de ser nomeado com um travessão.

**Produtor deixou de ser catálogo.** O provedor do cadastro guarda Cultura, Safra e
Propriedade, que são listas curtas ou consultadas por inteiro; dos Produtores ele só pergunta
se existe algum, para saber se há em nome de quem registrar. O campo de escolha de Produtor
já procurava no servidor, e nada mais precisava da lista.

## Considered Options

**Devolver o nome do dono junto da Propriedade**, em `GET /propriedades`, é a resposta mais
direta e foi rejeitada pela regra de dependência. A tabela de Produtor pertence ao módulo de
Produtor, e o de Propriedade não a alcança: a entidade de ORM dele nem declara a relação, de
propósito. Servir o nome dali pediria uma porta do módulo de Propriedade para o de Produtor,
e ele já recebe uma no sentido contrário — os dois arquivos de módulo passariam a se importar,
que é o ciclo que o registro
[`0005`](0005-camadas-isoladas-por-regra-de-dependencia.md) proíbe e o `depcruise` recusa.

**Manter o catálogo e aumentar o teto** adiaria o problema pelo preço de uma resposta maior.
O teto existe para a listagem não virar despejo, e qualquer número escolhido continua sendo
um número: o defeito não é onde o corte cai, é a tela depender de um corte.

**Pedir o nome de cada dono por linha**, em `GET /produtores/{id}`, dá o nome exato sem
parâmetro novo. São dez chamadas por página de tabela, que é o N+1 que a paginação existe
para evitar.

## Consequences

Este registro reabre duas decisões do registro
[`0011`](0011-cadastro-navegado-pela-hierarquia.md). A contagem de Propriedades foi rejeitada
lá por atravessar domínio, repositório, caso de uso, apresentador e contrato para alimentar
uma coluna, e porque a contagem do catálogo "já resolve o caso que importa". Ela resolvia
até o centésimo Produtor, e a partir dali a coluna descia sem contar sem que nada na tela
dissesse por quê. A travessia continua sendo o preço, e agora ele se paga. A coluna de
Plantios da lista de Propriedades continua sem contar, pelo motivo que aquele registro deu e
que não mudou: quem clica ali quer ver os Plantios, não sabê-los contados.

Uma página de Propriedades custa duas chamadas: a da fatia e a dos nomes dos donos dela. A
lista recortada por um Produtor continua custando uma, porque a resposta de
`GET /produtores/{id}` já traz o nome de quem recorta.

O recado no alto do cadastro sumiu. Ele existia para explicar a coluna sem nome e a coluna
que parava de contar, e não há mais o que explicar.

`ProdutorDto` não ganhou a contagem: ela está no item da fatia da listagem, que é um esquema
à parte. As rotas de escrita respondem o Produtor que acabou de ser gravado, e não o cadastro
dele, e contar Propriedades ali seria uma consulta a mais em toda escrita.
