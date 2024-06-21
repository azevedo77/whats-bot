if (
    recebido.toLowerCase() === "cancelar" ||
    recebido.toLowerCase() === "sair"
  ) {
    let mensagemEnviada = mensagemCancelar;
    message.reply(mensagemEnviada);
    conversa.estado = null;
    conversa.menuEnviado = false;
  } else {
    const campoSelecionado = parseInt(removerEspeciais(recebido.trim()));
    const campos = ["nome", "relação", "data de nascimento"];
    if (campoSelecionado >= 1 && campoSelecionado <= 3) {
      const campoParaAtualizar = campos[campoSelecionado - 1];

      if (campoParaAtualizar === "relação") {
        const relacoes = ["Filho", "Neto", "Sobrinho", "Outros"];
        let mensagemEnviada = `Certo, selecione uma das opções para *${campoParaAtualizar}*: \n${relacoes.map((opcao, index) => `*${index + 1}* - ${opcao}`).join("\n")}`;
        message.reply(mensagemEnviada);
        conversa.estado = "atualizarDependente";
        conversa.campoDependenteParaAtualizar = campoParaAtualizar;
      } else {
        let mensagemEnviada = `Certo, digite a informação correta para *${campoParaAtualizar}*`;
        message.reply(mensagemEnviada);
        conversa.estado = "atualizarDependente";
        conversa.campoDependenteParaAtualizar = campoParaAtualizar;
      }
    } else if (removerEspeciais(recebido.toLowerCase()) === "ok") {
      let mensagemEnviada = `Obrigado 🤩 aqui estão seus dados atualizados:\n\n*Nome:* ${formatarNome(conversa.nome)}\n*Data de Nascimento:* ${formatarDataVertica(conversa.dataNascimento)}\n*Email:* ${conversa.email.toLowerCase()}\n\n*Dependentes:*\n\n${conversa.dependentes.map((dep) => `*${formatarNome(dep[0])}*\n- Relação: ${dep[1].toLowerCase()}\n- Data de nascimento: ${formatarDataVertica(dep[2])}\n\n`).join("")}Digite *"OK"* para finalizar!`;
      message.reply(mensagemEnviada);
      conversa.estado = "finalizar";
    } else if (
      removerEspeciais(recebido.toLowerCase()) === "cancelar" ||
      recebido.toLowerCase() === "sair"
    ) {
      let mensagemEnviada = mensagemCancelar;
      message.reply(mensagemEnviada);
      conversa.estado = null;
      conversa.menuEnviado = false;
    } else {
      let mensagemEnviada =
        "⚠️ Opção inválida. Por favor, tente novamente.";
      message.reply(mensagemEnviada);
    }
  }