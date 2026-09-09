# Documento guardado cifrado, com HMAC separado para unicidade

O CPF ou CNPJ de um Produtor é dado pessoal e não é armazenado em claro. A
persistência guarda duas colunas derivadas dele: o valor cifrado em AES-256-GCM,
usado apenas para exibição, e um HMAC-SHA-256 com segredo da aplicação, usado para a
restrição de unicidade e para busca por valor exato. A API devolve o documento sempre
mascarado, sem endpoint que exponha o valor completo, e o logger tem regra de redação
que impede o valor de aparecer em qualquer linha de log.

Duas colunas são necessárias porque o AES-GCM usa nonce aleatório: o mesmo documento
cifrado duas vezes gera bytes diferentes, o que impossibilita uma restrição de
unicidade sobre a coluna cifrada. E o valor determinístico precisa ser HMAC, não um
hash simples, porque o espaço de CPFs válidos é pequeno o suficiente para ser
percorrido por força bruta em minutos caso a coluna vaze sem um segredo envolvido.

## Considered Options

Guardar em claro com restrição de unicidade direta seria mais simples e é o que o
enunciado do desafio permitiria. Foi rejeitado porque o enunciado aponta
explicitamente para a LGPD neste campo, e porque os vazamentos reais de CPF acontecem
por dump de banco, backup e log, exatamente o que a cifra em repouso mitiga.

Cifra em envelope com serviço gerenciado de chaves, rotação automática e trilha de
auditoria de leitura foi considerada e rejeitada como desproporcional ao escopo.

## Consequences

**Não existe busca por documento parcial.** Nenhum filtro, nenhuma ordenação e nenhum
`LIKE` sobre o documento são possíveis; apenas igualdade, calculando o HMAC do valor
informado. Isso não colide com nenhum requisito, porque busca por documento não é
pedida.

A chave de cifra e o segredo do HMAC passam a ser dependências operacionais: perdê-los
significa perder a capacidade de exibir os documentos já gravados, e trocá-los obriga
a recifrar e recalcular todas as linhas.

A proteção vale contra quem tem acesso ao banco, ao backup ou aos logs. **Não vale
contra o comprometimento da própria aplicação**, que necessariamente detém a chave.
