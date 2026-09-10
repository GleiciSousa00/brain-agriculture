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
escrita os quatro catálogos são buscados de novo, e não apenas o que mudou.

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
de novo depois de uma escrita. Uma base com mais de cem Produtores passa a ter Produtor
que o campo de escolha da Propriedade não oferece; é o teto da API, e resolvê-lo pede
busca por texto na rota de listagem, que não existe.

Nenhum campo é conferido na interface. O Documento inválido, a soma das áreas que não
fecha e a trinca de Plantio repetida são recusados pela API, e a tela mostra o `detail` do
corpo Problem Details sem reescrevê-lo. É o critério de não duplicar texto de erro no
cliente, e o preço é que campo vazio vai para a API como nulo e volta recusado, em vez de
ser barrado antes de sair.

A exclusão pergunta na própria linha, com Confirmar e Cancelar, e não num diálogo do
navegador. `confirm` bloquearia a automação da tela e não se afirma em teste; a pergunta
escrita é onde a cascata do registro 0003 fica dita a quem clica.

O duplo de `fetch` da suíte passou a casar rota por método e por padrão de caminho, e não
só pelo caminho: `POST /api/produtores` e `GET /api/produtores` respondem coisas
diferentes, e `DELETE /api/produtores/:id` precisa do identificador que casou. Os testes
do painel foram ajustados à chave nova.

A seção de Culturas e Safras registra Safra, o que os critérios da issue não pedem. Sem
ela, o campo de escolha de Safra do formulário de Plantio nasce vazio numa base
recém-criada, e nenhum Plantio pode ser registrado pela interface.
