# O cadastro é navegado pela hierarquia, e o gráfico é SVG escrito à mão

O cadastro tem quatro seções que se listavam lado a lado, cada uma com o formulário aberto
por cima da tabela. Funcionava, e escondia a única coisa que o domínio tem de estrutura:
uma Propriedade pertence a um Produtor, e um Plantio acontece em uma Propriedade. Quem
operava tinha de guardar de cabeça em nome de quem estava registrando.

**O recorte mora no endereço.** `/cadastro/propriedades?produtor=<id>` são as Propriedades
de um Produtor, e `/cadastro/plantios?propriedade=<id>` são os Plantios de uma
Propriedade. É a mesma razão que fez as seções serem sub-rotas no registro
[`0010`](0010-cadastro-em-sub-rotas-com-um-contexto-so.md): recarregar a página e mandar o
link do recorte a alguém precisam funcionar. A trilha das seções carrega o recorte de uma
para a outra, e o rastro acima da lista diz de onde se veio.

**Quem recorta é a API, onde ela recorta.** As Propriedades de um Produtor vêm de
`GET /produtores/{id}`, que já as pagina. Recortar do lado do navegador só recortaria a
página que já veio, e mentiria sobre o total.

**A coluna que desce conta pelo catálogo, e cala quando ele não dá para contar.** A lista
de Produtores diz quantas Propriedades cada um tem, contando o catálogo que já está em
memória para os campos de escolha. A API não devolve essa contagem, e pedi-la por linha
seria uma chamada por linha. Passando do teto de cem o catálogo vem cortado, e aí um zero
pode ser só o que não veio: oferecer "registrar a primeira" a quem já tem Propriedade
seria uma mentira com botão, então a coluna passa a descer sem contar. A de Plantios, na
lista de Propriedades, nunca conta pelo mesmo motivo — sem contagem que não seja
inventada, é melhor não escrever número nenhum.

**Um link nunca aponta para tela sem saída.** A coluna de Plantios sai da lista paginada,
que alcança qualquer Propriedade, e o catálogo para no centésimo registro. Os Plantios,
por isso, são buscados pelo identificador e não pela Propriedade resolvida: quem chega
pelo link vê a lista mesmo quando o nome não pode ser resolvido, e o campo de escolha diz
que aquela Propriedade está fora do catálogo em vez de fingir que ninguém escolheu nada.

**Os formulários nascem fechados.** Cada lista tem uma faixa com o que ela mostra, quanto
existe e o botão que abre o registro. Aberto por padrão, o formulário empurrava a lista
para fora da tela de quem só veio consultar.

**Gráfico: SVG escrito à mão, e o Recharts sai.** As três distribuições viraram roscas de
um `<circle>` por fatia, com `stroke-dasharray` marcando o arco. O Uso do Solo é medido
contra a Área Total, e não contra a soma das duas fatias: elas repartem a área e podem não
cobri-la inteira, e fechar a volta com duas fatias que somam menos do que o número escrito
no furo esconderia justamente o que a repartição não alcança. O registro
[`0009`](0009-interface-web-roteador-grafico-e-mesma-origem.md) escolheu o Recharts e
rejeitou o SVG à mão por trabalho manual em três lugares; o componente único que já existia
resolveu isso, e a legenda em texto — que nunca foi do Recharts — continua sendo o que o
teste afirma e o que um leitor de tela lê. Sai uma dependência de gráfico do pacote, e com
ela a ressalva de que o Recharts não desenha em ambiente sem tamanho.

## Considered Options

**Guardar o recorte em estado, e não no endereço**, foi considerado: é menos código e não
mexe em rota nenhuma. Foi rejeitado porque as Propriedades de um Produtor deixariam de ter
link, e é justamente esse link que a coluna da lista de Produtores oferece.

**Acrescentar as contagens à API**, um número de Propriedades no `ProdutorDto` e um de
Plantios no `PropriedadeDto`, daria a contagem exata em todos os casos. Foi rejeitado
porque atravessa domínio, repositório, caso de uso, apresentador e contrato em dois
módulos para alimentar duas colunas — e porque a contagem do catálogo já resolve o caso
que importa, que é distinguir o Produtor sem Propriedade nenhuma.

**Contar os Plantios por linha com `tamanho=1`**, lendo o total de cada
`GET /propriedades/{id}/plantios`, foi a outra saída para a coluna de Plantios. São dez
chamadas por página de tabela, e o número que elas comprariam não muda decisão nenhuma:
quem clica ali quer ver os Plantios, não sabê-los contados.

**Manter o Recharts** foi considerado, já que ele estava de pé e testado. Foi rejeitado
porque a rosca com o total no furo não sai dele sem sobreposição manual, e manter uma
dependência de gráfico para desenhar seis arcos deixou de se pagar.

## Consequences

O campo de Estado passou a ser uma lista de siglas, com as vinte e sete copiadas em
`apps/web/src/paginas/cadastro/unidades-federativas.ts`. Quem decide o que é unidade
federativa continua sendo a API: a lista só existe para que a sigla se aponte em vez de se
digitar, e uma cópia atrasada esconde uma sigla que a API aceita, nunca o contrário.

A seção de Propriedades se remonta inteira quando o recorte muda, por `key`. Sem isso o
formulário continuaria em nome do Produtor anterior e a página em que se estava valeria
para um recorte que não tem nada a ver com ela. Fechar o formulário não remonta nada: ele
tira do endereço o pedido de abertura, para que recarregar a página ou voltar pelo
histórico não o traga de volta a quem acabou de fechá-lo.

A tipografia passou a ser a Albert Sans, e os dois arquivos variáveis dela ficam em
`apps/web/src/fontes`, empacotados pelo Vite. Vir do Google Fonts custaria uma folha de
estilo de terceiro bloqueando a primeira pintura, contra o que o registro `0009` decidiu
sobre a interface falar só com a própria origem — num ambiente sem saída para a internet,
a tela esperaria a requisição falhar antes de pintar. São 55 KB no pacote, e a pilha de
sistema continua como reserva. A fonte é SIL Open Font License 1.1, e a licença fica em
`apps/web/src/fontes/OFL.txt`: redistribuir os arquivos sem ela é o que a licença proíbe.
