# O cadastro se reparte em sub-rotas, com um contexto só e listas paginadas na API

O cadastro tem quatro entidades e uma tela. Produtor, Propriedade, Plantio e o catálogo
de Culturas e Safras não cabem numa página só, e as três decisões de como reparti-los não
são evidentes no código.

**As seções são sub-rotas de `/cadastro`.** `/cadastro/produtores`,
`/cadastro/propriedades`, `/cadastro/plantios` e `/cadastro/catalogos` são endereços de
verdade, aninhados sob a rota do cadastro com `Outlet`. Entrar em `/cadastro` sem seção
cai em Produtores, que é a primeira porque Propriedade e Plantio dependem dele para
existir.

**O estado compartilhado é um contexto só, `CadastroProvider`.** Ele guarda os quatro
catálogos que os formulários consomem e é por onde toda escrita passa. Depois de uma
escrita que mexa em catálogo, os quatro são buscados de novo, e não apenas o que mudou.
A escrita de Plantio é a exceção, e não busca nenhum: ela não muda nem Produtor, nem
Propriedade, nem Cultura, nem Safra.

**A tabela de cada seção pagina na API, dez por vez; o campo de escolha pede cem.** São
duas chamadas à mesma rota com tamanhos diferentes, de propósito. Culturas e Safras não
são paginadas na API e aparecem inteiras.

## Considered Options

**Abas guardadas em estado**, com uma rota só, foi considerada: é menos arquivo e menos
roteador. Foi rejeitada pelo mesmo motivo que levou o painel e o cadastro a serem rotas no
registro 0009: recarregar a página voltaria sempre para a primeira aba, e não haveria link
para mandar a alguém.

**Navegação pela hierarquia do domínio** — a lista de Produtores abrindo as Propriedades
de um, e cada Propriedade abrindo os Plantios dela — foi a terceira candidata, e é a que
melhor espelha o domínio. Usaria o detalhe de Produtor, que já devolve uma fatia das
Propriedades dele. Foi rejeitada por custo: são três níveis de rota e três estados de
seleção para entregar os mesmos oito critérios de aceite.

**Um contexto por entidade**, quatro provedores aninhados, daria fronteiras mais nítidas.
Foi rejeitada porque as fronteiras não se sustentariam: o de Propriedade precisaria
alcançar o de Produtor, e o de Plantio alcançaria outros três. O acoplamento existe no
domínio, e reparti-lo em quatro caixas só o esconderia.

**Recarregar só o catálogo que a escrita mudou** foi considerado e rejeitado. Manter a
tabela de quem invalida quem é onde o defeito se esconde: excluir um Produtor apaga as
Propriedades e os Plantios dele em cascata física, pelo registro 0003, então a escrita que
parece tocar um catálogo toca dois. Buscar os quatro é uma chamada a mais e nenhuma
tabela para manter.

**Uma lista só, servindo a tabela e o campo de escolha** pouparia a segunda chamada. Foi
rejeitada porque as duas querem coisas diferentes: a tabela mostra dez e diz quantas
páginas existem, e o campo de escolha precisa oferecer o registro que a tabela não está
mostrando, senão não há como apontar para ele. Paginar o campo de escolha do lado do
cliente faria a tela mentir sobre o tamanho da base.

## Consequences

Entrar no cadastro custa quatro chamadas de catálogo mais a da tabela da seção, e visitar
as quatro seções não repete as quatro: o provedor fica de pé por cima delas e só as busca
de novo depois de uma escrita.

Passando de cem Produtores ou de cem Propriedades, o catálogo vem cortado, e o corte
morde em dois lugares: o campo de escolha deixa de oferecer quem ficou de fora, e a coluna
de Produtor da tabela de Propriedades mostra um travessão onde o nome não pôde ser
resolvido. Resolvê-lo pede busca por texto na rota de listagem, que não existe. Enquanto
não existir, a tela diz que está cortada, com o aviso do alto do cadastro: um número que
não aparece é menos grave do que um número que aparece errado sem avisar.

Nenhum campo é conferido na interface. O Documento inválido, a soma das áreas que não
fecha e a trinca de Plantio repetida são recusados pela API, e a tela mostra o `detail` do
corpo Problem Details sem reescrevê-lo. É o critério de não duplicar texto de erro no
cliente, e o preço é que campo vazio vai para a API como nulo e volta recusado, em vez de
ser barrado antes de sair.

Por isso todo formulário do cadastro leva `noValidate`. Sem ele o navegador barraria o
envio de uma área fora do passo de duas casas com um texto próprio, e a recusa da API
nunca chegaria à tela: seria a duplicação de mensagem de erro entrando pela porta dos
fundos, escrita por quem nem é o cliente.

O status da resposta é conferido além do corpo de erro. Uma recusa sem corpo, como o 502
de um repassador, não produz erro nenhum no cliente gerado, e sem essa conferência uma
exclusão recusada passaria por bem-sucedida: a linha sumiria da tela sem ter sumido do
banco.

A exclusão pergunta na própria linha, com Confirmar e Cancelar, e não num diálogo do
navegador. `confirm` bloquearia a automação da tela e não se afirma em teste; a pergunta
escrita é onde a cascata do registro 0003 fica dita a quem clica. Como a pergunta
substitui o botão que a disparou, o foco vai para o Confirmar, que aponta para ela pelo
`aria-describedby`: é assim que ela é lida em voz alta.

O duplo de `fetch` da suíte passou a casar rota por método e por padrão de caminho, e não
só pelo caminho: `POST /api/produtores` e `GET /api/produtores` respondem coisas
diferentes, e `DELETE /api/produtores/:id` precisa do identificador que casou. Os testes
do painel foram ajustados à chave nova.

A seção de Culturas e Safras registra Safra, o que os critérios da issue não pedem. Sem
ela, o campo de escolha de Safra do formulário de Plantio nasce vazio numa base
recém-criada, e nenhum Plantio pode ser registrado pela interface.
