const { formatarNome, formatarDataVertica } = require('../../../../functions/formatarCampos.js'); // Ajuste o caminho conforme necessário

async function verificarDados(body, conversa) {
    let resposta = {
        mensagem: '',
        novoEstado: '',
    };
    const campoSelecionado = parseInt(body.trim())

    if (!conversa.dependentes || conversa.dependentes.length === 0) {
        resposta.mensagem = 'Não foram encontrados dependentes. Digite *1* para cadastrar um novo dependente ou *"OK"* para continuar.';
        resposta.novoEstado = "selecionarDependente";
    } else if ([1, 2, 3].includes(campoSelecionado)) {

        const campos = ['nome', 'data de nascimento', 'email']
        conversa.campoParaAtualizar = campos[campoSelecionado - 1]
        if (conversa.campoParaAtualizar == 'data de nascimento') {
            resposta.mensagem = `Certo, digite a informação correta para *${conversa.campoParaAtualizar}* no formato de exemplo: 24/12/2023`
        } else {
            resposta.mensagem = `Certo, digite a informação correta para *${conversa.campoParaAtualizar}*`
        }
        resposta.novoEstado = 'atualizarCampo'

    } else if (removerEspeciais(body.toLowerCase()) === 'ok'){
        resposta.mensagem = 'Selecione o dependente para atualizar ou cadastre um novo:\n\n*1* - Cadastrar novo dependente\n*2* – Remover dependente\n\n';
        conversa.dependentes.forEach((dep, index) => {
            resposta.mensagem += `*${index + 3}* - ${formatarNome(dep[0])}\n- Relação: ${dep[1].toLowerCase()} \n- Data de Nascimento: ${formatarDataVertica(dep[2])}\n\n`;
        });
        resposta.mensagem += 'Caso todos estejam corretos digite *"OK"* ☺️';
        resposta.novoEstado = "selecionarDependente";
    } else {
        resposta.mensagem = '⚠️ Opção inválida. Informe o *número do campo* desejado ou digite *"OK"*'
    }

    return resposta;
}

module.exports.verificarDados = verificarDados;
