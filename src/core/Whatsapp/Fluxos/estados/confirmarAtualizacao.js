function confirmarAtualizacao(body, conversa){
    let resposta = {
        mensagem: '',
        novoEstado: '',
    };

    if (body == "1") {
        resposta.mensagem = `Ótimo! Esses são seus dados cadastrados:\n\n*1* - Nome Completo: ${conversa.nome}\n*2* - Data de Nascimento: ${conversa.dataNascimento}\n*3* - Endereço de Email: ${conversa.email}\n\nSe alguma informação estiver incorreta, informe o número correspondente para ajustar. Ou então *"OK"* para prosseguir ☺️`;
        resposta.novoEstado = "verificarDados";
    } else if (body == "2") {
        resposta.mensagem = "Você digitou NÃO 😔 tem certeza de sua resposta?\n*1* – Sim, não desejo confirmar meus dados\n*2* – Quero ativar meu bônus";
        resposta.novoEstado = "temCerteza";
    } else {
        resposta.mensagem = "⚠️ Resposta inválida. Tente novamente.";
    }

    return resposta;
}

module.exports.confirmarAtualizacao = confirmarAtualizacao;