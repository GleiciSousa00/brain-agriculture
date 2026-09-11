# A Propriedade escolhida vem da API, e Propriedade deixa de ser catálogo

O cadastro carregava uma lista de Propriedades ao entrar na tela, na primeira página do
maior tamanho que a API aceita, que é cem. Dela saíam duas coisas na seção de Plantios: o
nome, a cidade e a área da Propriedade escolhida, e o degrau da Propriedade no rastro.
Passando de cem, a escolha existia e não podia ser nomeada: o campo mostrava o texto fixo
"Propriedade fora do catálogo" no lugar do nome, e o rastro parava no Produtor.

O campo de escolha já procurava no servidor, então a Propriedade era encontrada e escolhida
sem problema. Quem não a alcançava era só quem tinha de nomeá-la depois.

**A listagem de Propriedades recorta por identificador.** `GET /propriedades?ids=…` devolve
exatamente as Propriedades pedidas, até o mesmo teto de cem que vale para o tamanho de
página. É o desenho que o registro [`0012`](0012-nome-e-contagem-vem-da-api-e-nao-do-catalogo.md)
abriu para Produtor, aplicado ao último lugar onde ele ainda não valia.

**A Propriedade escolhida é resolvida pelo identificador do endereço.** O campo de escolha,
o detalhe de cidade e área, o título da lista de Plantios e o rastro pedem essa Propriedade à
API por esse identificador. Enquanto a resposta não chega, a tela fica sem o nome em vez de
o inventar, e os Plantios são listados assim mesmo: eles vêm de outra chamada, que pede o
identificador e não o nome.

**Propriedade deixou de ser catálogo.** O provedor do cadastro guarda Cultura e Safra, que
são listas curtas oferecidas por inteiro nos campos de escolha. De Propriedade ele só
pergunta se existe alguma, para saber se há onde plantar, do mesmo jeito que já perguntava de
Produtor.

## Considered Options

**Uma rota `GET /propriedades/{id}`** dá o registro exato sem parâmetro novo, e foi rejeitada
por criar um segundo jeito de pedir a mesma coisa. O recorte por identificador já existe na
listagem de Produtores e já é o que a interface sabe consumir; repetir o desenho custa menos
do que somar uma rota, um caso de uso e um erro de não encontrado.

**Devolver a Propriedade junto da lista de Plantios**, em
`GET /propriedades/{id}/plantios`, resolveria a seção de Plantios e não o rastro, que é
montado fora dela. Também misturaria na fatia de Plantio um registro que não é Plantio.

**Manter o catálogo e aumentar o teto** adiaria o problema pelo preço de uma resposta maior,
pelo mesmo motivo que o registro `0012` já deu: o defeito não é onde o corte cai, é a tela
depender de um corte.

## Consequences

A seção de Plantios custa uma chamada a mais quando há Propriedade escolhida, e nenhuma
quando não há. Em troca, a primeira carga do cadastro deixa de trazer cem Propriedades para
usar uma.

O texto "Propriedade fora do catálogo" sumiu. Ele existia para explicar um nome que não podia
ser resolvido, e não há mais o que explicar: ou o nome ainda está em voo, e o campo fica com
o texto de campo vazio, ou a Propriedade não existe mais, e o que restou na tela são os
Plantios buscados pelo identificador.

Este registro reabre uma decisão do registro
[`0011`](0011-cadastro-navegado-pela-hierarquia.md). Lá, o campo de escolha dizia que a
Propriedade estava fora do catálogo em vez de fingir que ninguém escolheu nada, e isso
resolvia metade do problema: a tela não mentia sobre haver escolha, mas continuava sem dizer
qual. A outra metade se resolve nomeando a escolhida. O que não mudou é que os Plantios
continuam sendo buscados pelo identificador, e não pela Propriedade resolvida: é isso que
mantém de pé o link que vem da coluna Plantios.

A falha ao resolver a escolhida fica calada, como já ficava a do nome do Produtor do recorte.
Emprestar o aviso do alto da tela acusaria de quebrado o que está funcionando, e um
identificador malformado no endereço renderia dois avisos dizendo a mesma coisa.
