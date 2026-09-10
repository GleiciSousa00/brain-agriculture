# Autenticação e autorização ficam fora do escopo, por decisão

A API não tem login, não tem sessão, não tem token e não tem controle de acesso. Todos
os endpoints são abertos.

O enunciado não pede autenticação. Ele pede cadastro de Produtores, Propriedades,
Safras e Culturas plantadas, as regras de validação de Documento e de soma de áreas, e
um painel. Entregar além do que foi pedido não é generosidade: aumenta a superfície de
revisão, atrasa o que foi pedido e sugere que o requisito não foi lido.

Este registro existe porque a ausência precisa ser visivelmente deliberada. Um painel de
agronegócio normalmente tem login antes do cadastro, e um CRUD aberto se parece com
esquecimento quando ninguém escreveu que foi escolha.

## Consequences

Não existe o conceito de "usuário autorizado a ver o Documento completo". Isso fecha uma
pergunta que ficaria em aberto: como o Documento decifrado seria exposto, e para quem. A
resposta passa a ser simples, e a API mascara o Documento sempre, sem exceção. Ver
[`0002-documento-cifrado-em-repouso.md`](0002-documento-cifrado-em-repouso.md).

Se a autenticação entrar depois, ela entra pela camada `http`, como guard e como módulo
próprio, sem tocar em `domain` nem em `application`. Essa afirmação não é promessa: a
regra de dependência do
[`0005-camadas-isoladas-por-regra-de-dependencia.md`](0005-camadas-isoladas-por-regra-de-dependencia.md)
já proíbe que regra de negócio dependa de camada de entrada, e a pipeline verifica.

O README repete esta decisão em uma seção própria, porque quem avalia a entrega lê o
README e não necessariamente lê os registros de decisão.
