# Os DTOs são validados com Zod, não com class-validator

A camada `http` define os esquemas de entrada e saída com Zod, expostos como DTOs pelo
`nestjs-zod`, que também alimenta a geração do OpenAPI pelos decoradores do
`@nestjs/swagger`. O par `class-validator` e `class-transformer`, que é o caminho
padrão da documentação do NestJS, não é usado.

O motivo é manutenção. O `class-transformer` está na versão 0.5.1 desde novembro de
2021 e não recebeu nenhuma publicação desde então; o mantenedor abriu uma discussão
pública sobre esgotamento e o repositório passou a receber apenas commits automáticos
de atualização de dependência. O `class-validator` voltou a publicar e está apenas com
manutenção fraca, mas os dois andam juntos: o pipe de validação do NestJS usa o
segundo para converter o corpo da requisição antes de o primeiro validar.

Nenhum dos dois tem vulnerabilidade em aberto. O critério que os reprova não é
segurança, é o de não adotar dependência sem manutenção quando existe alternativa
madura para o mesmo trabalho.

## Considered Options

Manter o par e registrar o risco foi considerado, e é defensável: a superfície usada é
pequena, a API está congelada há anos justamente por não mudar, e é o caminho que um
leitor de NestJS espera encontrar. Foi rejeitado porque a alternativa não é imatura nem
exótica, e adotar hoje custa menos que trocar depois.

## Consequences

O esquema passa a ser a fonte única: o tipo TypeScript do DTO é inferido do esquema Zod,
em vez de ser declarado e depois anotado. Isso elimina a classe de defeito em que o tipo
e as regras de validação divergem.

Serialização de saída perde o `ClassSerializerInterceptor` e os decoradores `@Exclude` e
`@Expose`. O que sai da API passa a ser o que o esquema de saída descreve, montado
explicitamente. Isso é mais verboso e é mais seguro: nada vaza por esquecimento de
anotar, o que importa aqui porque o Documento é dado pessoal cifrado. Ver
[`0002-documento-cifrado-em-repouso.md`](0002-documento-cifrado-em-repouso.md).

O esquema Zod pertence à camada `http` e não desce para o domínio. As regras de negócio
continuam nos objetos de valor e nas entidades, validadas sem biblioteca. Um esquema Zod
diz que o campo é uma string de onze a quatorze caracteres; ele não diz que o Documento
tem dígito verificador válido. A regra de dependência do
[`0005-camadas-isoladas-por-regra-de-dependencia.md`](0005-camadas-isoladas-por-regra-de-dependencia.md)
proíbe `zod` em `domain` exatamente para impedir que essa fronteira se dissolva.

A geração do cliente em `packages/contracts` não muda: o OpenAPI continua saindo dos
decoradores do `@nestjs/swagger` e o cliente continua sendo gerado a partir dele.
