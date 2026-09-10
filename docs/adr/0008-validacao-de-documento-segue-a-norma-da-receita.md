# A validação de Documento segue a norma da Receita, não as bibliotecas de npm

O objeto de valor `Documento` implementa o algoritmo publicado pela Receita Federal,
não o comportamento das bibliotecas populares de validação. Onde os dois divergem,
vale a norma.

A divergência é real e tem pelo menos dois casos. Um CNPJ com todos os caracteres
repetidos é **válido** para a Receita, e a maioria das bibliotecas de npm o rejeita
por analogia com o CPF. E um CNPJ com letras só é aceito por biblioteca atualizada
para o formato alfanumérico, que passou a ser emitido em 31 de julho de 2026.

## O formato alfanumérico

A Instrução Normativa RFB 2.229/2024 acrescentou o Anexo XV à IN 2.119/2022 e criou o
CNPJ alfanumérico. O primeiro foi emitido em 31 de julho de 2026. Os dois formatos
coexistem: uma inscrição nova pode sair numérica ou alfanumérica, então a presença de
letra não indica que o documento é recente, e a ausência não indica que é antigo.

São sempre catorze posições. As doze primeiras aceitam dígitos e letras maiúsculas. Os
dois dígitos verificadores são sempre numéricos. A máscara não muda.

O cálculo é o módulo 11 de sempre, com uma única diferença: cada caractere vale o seu
código na tabela ASCII menos quarenta e oito. O dígito `0` vale zero, a letra `A` vale
dezessete e a letra `Z` vale quarenta e dois. Para um documento só de dígitos o
resultado é idêntico ao do algoritmo clássico, o que era requisito declarado da
Receita.

Os pesos, da esquerda para a direita, são `[5,4,3,2,9,8,7,6,5,4,3,2]` para o primeiro
dígito e `[6,5,4,3,2,9,8,7,6,5,4,3,2]` para o segundo. Resto de zero ou um gera dígito
zero; nos demais casos o dígito é onze menos o resto.

## Regras que não estão no cálculo

Estas vêm do código de referência da Receita e não do módulo 11. Sem elas a
implementação diverge do oficial.

**Todo o alfabeto de A a Z é aceito.** A exclusão das letras I, O, U, Q e F circula em
material de terceiros e não existe na norma. O próprio teste do código de referência
afirma que `ABCDEFGHIJKL80` é válido, e ele contém I.

**Letra minúscula é recusada.** A validação não normaliza. Se a entrada vier de
formulário, a normalização acontece antes, na borda.

**O CNPJ zerado é recusado por regra escrita à parte.** `00.000.000/0000-00` passa pelo
módulo 11 e ainda assim é inválido. É a única sequência repetida que o oficial exclui.

**Caractere repetido é válido no resto dos casos.** `11.111.111/1111-80` é um CNPJ
válido. Este é o ponto que mais provoca "correção" indevida, porque contraria o
costume e contraria as bibliotecas.

**Os caracteres de máscara são ponto, barra e hífen.** Eles são removidos antes da
verificação de formato.

## Um caminho de código, e o que isso quer dizer

Não existe ramo condicional que pergunte se um caractere é letra ou dígito. O mesmo
laço atende CNPJ numérico e alfanumérico, porque a conversão por código ASCII já
unifica os dois.

CPF e CNPJ continuam sendo dois cálculos diferentes, com comprimentos e pesos
diferentes. A separação entre eles é por comprimento, onze ou catorze, nunca por tipo
de caractere. E a assimetria permanece: sequência repetida invalida CPF e não invalida
CNPJ.

## Considered Options

Usar uma biblioteca de npm foi rejeitado. O problema cabe numa função com teste, e as
bibliotecas populares divergem do oficial justamente nos casos que este registro
enumera. Adotar uma delas significaria herdar a divergência sem perceber.

## Consequences

Os vetores de teste saem do próprio código de referência da Receita, não de exemplos
encontrados em artigo. São válidos `12.ABC.345/01DE-35`, `ABCDEFGHIJKL80` e
`00.000.000/0001-91`. São inválidos `ABCDEFGHIJKL81` por dígito errado,
`12.ABc.345/01DE-35` por minúscula, `00.000.000/0000-00` por ser zerado, e
`000000000001P1` por letra em posição de dígito verificador.

Quem ler o teste que afirma `11.111.111/1111-80` válido vai achar que é defeito. O
teste leva comentário apontando para este registro, e o registro existe para impedir a
correção.

Há um erro conhecido na fonte oficial: a cartilha de perguntas e respostas da Receita
traz um exemplo cujo dígito verificador não fecha pelo algoritmo que ela mesma
descreve. Exemplo de cartilha não vira vetor de teste; o código de referência vira.

## Fontes

- IN RFB 2.229/2024 e o Anexo XV, que criam o formato alfanumérico.
- Código de referência e manual de cálculo do dígito verificador, publicados pela
  Receita em Java, Python e TypeScript, em
  https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/documentos-tecnicos/cnpj
- Anúncio da implantação em 31 de julho de 2026, em
  https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/cnpj-alfanumerico
