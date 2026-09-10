// O teste de integração exercita o filtro de erro, então o log de erro é esperado.
// Silenciar mantém a saída da pipeline legível; a asserção olha a resposta, não o log.
process.env.LOG_LEVEL ??= 'silent';
