if (
    recebido.toLowerCase() === "cancelar" ||
    recebido.toLowerCase() === "sair"
  ) {
    let mensagemEnviada = mensagemCancelar;
    message.reply(mensagemEnviada);
    conversa.estado = null;
    conversa.menuEnviado = false;
  } else {
    const valorNovo = recebido.trim();
    let campoBD;
    let valorNovoBD;

    if (
      removerEspeciais(recebido.toLowerCase()) === "cancelar" ||
      recebido.toLowerCase() === "sair"
    ) {
      let mensagemEnviada = mensagemCancelar;
      message.reply(mensagemEnviada);
      conversa.estado = null;
      conversa.menuEnviado = false;
    } else {
      switch (conversa.campoParaAtualizar) {
        case "nome":
          campoBD = "NOME";
          conversa.nome = removerEspeciais(valorNovo.toUpperCase());
          valorNovoBD = valorNovo;
          break;
        case "data de nascimento": {
          campoBD = "DATA_NASCIMENTO";
          if (isValidDate(valorNovo)) {
            const partesData = valorNovo.split("/").reverse().join("-");
            valorNovoBD = partesData;
            conversa.dataNascimento = valorNovoBD;
          } else {
            let mensagemEnviada =
              "⚠️ Formato de data inválido. Por favor, forneça a data de nascimento no formato correto (exemplo: 01/08/2023).";
            message.reply(mensagemEnviada);
            return;
          }
          break;
        }
        case "email":
          campoBD = "EMAIL";
          if (validarEmail(valorNovo)) {
            valorNovoBD = valorNovo.toUpperCase();
            conversa.email = valorNovo;
          } else {
            let mensagemEnviada =
              "⚠️ Email inválido. Por favor, informe um email válido. Exemplo: email@gmail.com";
            message.reply(mensagemEnviada);
            return;
          }

          break;
        default: {
          let mensagemEnviada =
            "⚠️ Campo inválido. Por favor, informe um campo válido.";
          message.reply(mensagemEnviada);
          return;
        }
      }
      const queryAtualizar = `UPDATE VRJ_CONSUMIDOR SET ${campoBD} = '${valorNovoBD}' WHERE ID_CONSUMIDOR = ${conversa.idConsumidor}`;

      connection.query(queryAtualizar, (err) => {
        if (err) {
          let mensagemEnviada =
            "⚠️ Ocorreu um erro ao atualizar os dados do consumidor. Por favor, tente novamente mais tarde.";
          message.reply(mensagemEnviada);
          console.error(err);
          return;
        }

        connection.query("COMMIT", (err) => {
          if (err) {
            console.error("Erro ao confirmar a transação:", err);
            return;
          }
          console.log("Transação confirmada.");
        });
        let mensagemEnviada = `Aqui estão seus dados atualizados:\n\n*1* - Nome: ${formatarNome(conversa.nome)}\n*2* - Data de Nascimento: ${formatarDataVertica(conversa.dataNascimento)}\n*3* - Email: ${conversa.email.toLowerCase()}\n\nDigite o *número do campo* para atualizar ou digite *"OK"* ☺️`;
        message.reply(mensagemEnviada);
        conversa.estado = "verificarDados";
      });
    }
  }