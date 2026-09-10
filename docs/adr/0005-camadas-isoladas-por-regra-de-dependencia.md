# As camadas se isolam por uma regra de dependência verificada na pipeline

Cada módulo do domínio (`produtores`, `propriedades`, `safras`, `culturas`, `painel`)
se divide em quatro camadas, e as dependências entre elas apontam sempre para dentro:

- `domain` guarda entidades, objetos de valor, erros de domínio e as **portas**, que são
  as interfaces de repositório. É TypeScript puro, sem framework e sem biblioteca.
- `application` guarda os casos de uso. Recebe portas, orquestra o domínio e devolve
  resultado. Não sabe que existe banco nem que existe HTTP.
- `infrastructure` implementa as portas com TypeORM, e contém as entidades do ORM, os
  tradutores entre elas e as entidades de domínio, as migrações e os adaptadores de
  cifra e de hash.
- `http` contém as controllers, os DTOs de entrada e saída, os decoradores do OpenAPI e
  o filtro de erro. É a porta de entrada, não a de saída.

O arquivo de módulo (`<modulo>.module.ts`) fica na raiz do módulo, fora das quatro
camadas, e é o único lugar autorizado a enxergar todas elas. É ali que a implementação
de repositório é ligada à porta que o caso de uso recebe.

Ele também é a única face que o módulo mostra para fora. Quem está fora do módulo, como a
raiz de composição que monta o catálogo do ORM, importa o arquivo de módulo e o que ele
publica, nunca um arquivo de dentro de uma das quatro camadas.

A razão não é purismo. Este projeto é um módulo de um sistema maior e precisa poder
crescer. O que impede crescimento não é falta de engenharia, é acoplamento instalado
cedo: regra de negócio que só roda com o Postgres de pé, entidade de domínio que é
também o desenho da tabela, caso de uso que só existe dentro de uma requisição HTTP.
Isolar as camadas hoje custa pouco e evita que qualquer uma dessas três coisas aconteça.

## Regra de dependência

| Camada | Pode importar | Está proibida de importar |
|---|---|---|
| `domain` | `domain` do próprio módulo, `shared/domain`, `domain` de outro módulo | `application`, `infrastructure`, `http`, `@nestjs/*`, `typeorm`, `pg`, `zod`, `nestjs-zod` |
| `application` | `domain`, `shared/domain`, `shared/application` | `infrastructure`, `http`, e as mesmas bibliotecas acima |
| `infrastructure` | `domain`, `application`, `typeorm`, `pg`, `@nestjs/*` | `http` |
| `http` | `application`, `domain`, `@nestjs/*`, `zod`, `nestjs-zod` | `infrastructure` |
| `shared/<camada>` | o que a camada de mesmo nome pode | o que ela não pode, mais qualquer módulo |
| `shared/logging` | `@nestjs/*`, `pino` | qualquer módulo |
| fora de um módulo | o `<modulo>.module.ts` e o que ele publica | qualquer camada de dentro do módulo |
| `<modulo>.module.ts` | tudo | nada |
| `apps/web` | `packages/contracts` | `apps/api` |

`shared` repete as mesmas quatro camadas e obedece às mesmas restrições: `shared/domain`
é TypeScript puro, `shared/http` não enxerga infraestrutura, e assim por diante. Fora
delas mora o que atravessa a aplicação inteira sem pertencer a camada nenhuma, hoje só
`shared/logging`. A seta aponta num sentido só: os módulos usam `shared`, e `shared` não
conhece módulo algum.

Entre módulos, só `domain` é território comum. Um módulo nunca importa a `application`,
a `infrastructure` ou o `http` de outro. Quando um caso de uso precisa de algo que vive
noutro módulo, declara uma porta no próprio domínio e a infraestrutura a implementa.

A regra vale para o código que vai para a imagem. Os testes estão de fora dela de
propósito: um teste alcança a camada que precisa afirmar, e obrigar cada módulo a publicar
o que só o teste usa inflaria o arquivo de módulo sem proteger nada.

A tabela acima é a versão legível. A versão executável é a configuração do
`dependency-cruiser`, que roda como portão obrigatório da pipeline e falha o build.
Divergência entre as duas é defeito, e quem valer é a configuração.

## Considered Options

Usar a entidade do TypeORM como entidade de domínio elimina os tradutores e é bem mais
rápido de escrever. Foi rejeitado porque amarra a regra de negócio ao desenho da tabela:
mudar o esquema passa a mexer no domínio, e testar o domínio passa a exigir banco. É a
primeira coisa a ser cortada se o tempo apertar, e o corte implica reescrever este
registro.

Permitir `@nestjs/common` na `application`, só pelos decoradores `@Injectable` e
`@Inject`, é o arranjo mais comum em projetos NestJS e dispensa registrar cada caso de
uso à mão. Foi rejeitado porque a economia é de poucas linhas por caso de uso, enquanto
a perda é a única propriedade que torna a camada realmente portátil.

## Consequences

Existem mais arquivos e existe tradução entre representações. O registro de cada caso
de uso no contêiner de injeção é escrito à mão, com fábrica, no arquivo de módulo.

Em compensação, o teste de `domain` e de `application` roda sem Postgres, sem Nest e sem
subir aplicação, o que é justamente onde o limite de cobertura é exigido.
