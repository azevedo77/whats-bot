async function nps(fluxo){
    let resposta = {
        mensagem: '',
        novoEstado: '',
    };

    if (fluxo == '2') {
        resposta.mensagem = 'Informamos que sua compra gerou um bônus aqui na loja e para ativar na próxima compra precisamos confirmar alguns dados. Vamos começar?\n\nDigite o número da opção:\n*1* - Sim\n*2* - Não\n\nObs.: Prometo que é rapidinho, leva menos de 1 minuto ☺️';
        resposta.novoEstado = "confirmarAtualizacao";
    } else {
        resposta.mensagem = 'Obrigado, até logo! 🧡';
        resposta.novoEstado = "naoResponde";
    }    

    return resposta;
}

module.exports.nps = nps;