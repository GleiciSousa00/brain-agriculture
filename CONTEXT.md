# Cadastro Rural

Contexto único da aplicação: o cadastro de produtores rurais, suas propriedades e o
que cada propriedade planta em cada safra. Existe para responder quem produz, onde,
e o que foi plantado, alimentando um painel de totais e distribuições.

O domínio é nomeado em português. O andaime técnico (`repository`, `service`,
`controller`, `dto`) é nomeado em inglês.

## Language

### Quem produz

**Produtor**:
Pessoa física ou jurídica responsável por zero ou mais Propriedades, identificada
por um Documento.
_Avoid_: Fazendeiro, Agricultor, Cliente, Producer

**Documento**:
O CPF ou o CNPJ que identifica um Produtor de forma única. Um Produtor tem
exatamente um.
_Avoid_: CPF, CNPJ, Identificador Fiscal, Documento Fiscal

### Onde se produz

**Propriedade**:
A unidade de terra registrada em nome de um Produtor, situada em uma cidade e um
estado. É o que o painel conta como fazenda.
_Avoid_: Fazenda, Sítio, Imóvel Rural, Farm, Property

**Área Total**:
A extensão da Propriedade em hectares.
_Avoid_: Área da Fazenda, Tamanho

**Área Agricultável**:
A parcela da Área Total destinada ao cultivo, em hectares.
_Avoid_: Área Plantável, Área Cultivável, Área Produtiva

**Área de Vegetação**:
A parcela da Área Total ocupada por vegetação, em hectares.
_Avoid_: Área de Reserva, Reserva Legal, Área Preservada

**Uso do Solo**:
A repartição da Área Total de uma Propriedade entre Área Agricultável e Área de
Vegetação. É a dimensão de um dos gráficos do painel.
_Avoid_: Ocupação do Solo, Distribuição de Área

### O que se produz

**Safra**:
O ciclo agrícola identificado por um ano, compartilhado por todas as Propriedades.
Não pertence a nenhuma Propriedade em particular.
_Avoid_: Colheita, Temporada, Ciclo, Harvest, Season, Crop Year

**Cultura**:
A espécie cultivada, como Soja, Milho ou Café. Vive em um catálogo, não como texto
livre digitado a cada cadastro.
_Avoid_: Plantação, Cultivo, Crop, Cultura Plantada

**Plantio**:
O registro de uma Cultura em uma Propriedade em uma Safra. É a unidade contada pelo
gráfico por cultura do painel.
_Avoid_: Cultura Plantada, Cultivo, Plantação, Planting
