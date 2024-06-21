const { formatarNome, formatarDataVertica, removerEspeciais } = require('../../../../functions/formatarCampos.js');

async function selecionarDependente(body, conversa) {

    let resposta = {
      mensagem: '',
      novoEstado: '',
      depSelecionado: '', 
    };

    const opcaoSelecionada = parseInt(removerEspeciais(body.trim()));

    if (opcaoSelecionada === 1) {

      resposta.mensagem = "Informe *nome e sobrenome* do dependente:";
      resposta.novoEstado = "cadastrarDependente";

    } else if (opcaoSelecionada === 2) {

      resposta.mensagem = 'Selecione o dependente para remover:\n\n';
      dependentes.forEach((dep, index) => {
          resposta.mensagem += `*${index + 3}* - ${formatarNome(dep[0])}\n- Relação: ${dep[1].toLowerCase()} \n- Data de Nascimento: ${formatarDataVertica(dep[2])}\n\n`;
      });

      resposta.novoEstado = "removerDependente";

    } else if (opcaoSelecionada > 2 && opcaoSelecionada <= conversa.dependentes.length + 2) {

      const dep = conversa.dependentes[opcaoSelecionada - 3];

      resposta.mensagem = `Digite o *número do campo* para atualizar\n\n*1* - Nome: ${formatarNome(dep[0])}\n*2* - Relação: ${dep[1].toLowerCase()}\n*3* - Data de nascimento: ${formatarDataVertica(dep[2])}`;
      resposta.novoEstado = "editarDependente";
      resposta.depSelecionado = dep;

    } else if (removerEspeciais(body.toLowerCase()) === "ok") {

      resposta.mensagem = `Obrigado 🤩 aqui estão seus dados atualizados:\n\n*Nome:* ${formatarNome(conversa.nome)}\n*Data de Nascimento:* ${formatarDataVertica(conversa.dataNascimento)}\n*Email:* ${conversa.email.toLowerCase()}\n\n*Dependentes:*\n\n${conversa.dependentes.map((dep) => `*${formatarNome(dep[0])}*\n- Relação: ${dep[1].toLowerCase()}\n- Data de nascimento: ${formatarDataVertica(dep[2])}\n\n`).join("")}Digite *"OK"* para finalizar!`;
      resposta.novoEstado = "finalizar";
    } else {
      resposta.mensagem = "⚠️ Opção inválida. Por favor, tente novamente.";
    }

    return resposta;
}
module.exports.selecionarDependente = selecionarDependente;

