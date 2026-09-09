# Exclusão de Produtor é física e em cascata

Excluir um Produtor apaga o registro do banco e leva consigo suas Propriedades e os
Plantios delas. Não há exclusão lógica, nem coluna de data de remoção, nem
anonimização em vez de remoção.

A razão é o direito à eliminação previsto na LGPD: exclusão lógica preservaria
histórico ao custo de manter o dado pessoal armazenado indefinidamente, o que é
justamente o que o titular pediu para não acontecer.

## Consequences

Não há como desfazer uma exclusão nem auditar o que existia antes dela. Um leitor que
encontre este comportamento pode confundi-lo com descuido e "corrigir" para exclusão
lógica, o que reintroduziria o problema. Este registro existe para impedir isso.
