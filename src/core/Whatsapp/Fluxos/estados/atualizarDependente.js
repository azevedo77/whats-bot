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
    let dataNova;

    if (
      removerEspeciais(recebido.toLowerCase()) === "cancelar" ||
      recebido.toLowerCase() === "sair"
    ) {
      let mensagemEnviada = mensagemCancelar;
      message.reply(mensagemEnviada);
      conversa.estado = null;
      conversa.menuEnviado = false;
    } else {
      switch (conversa.campoDependenteParaAtualizar) {
        case "nome": {
          campoBD = "DESCRICAO";
          // conversa.dependenteSelecionado[0] = valorNovo
          const updateQuery = `UPDATE VRJ_CONSUMIDOR_CONTATO SET ${campoBD} = '${valorNovo.toUpperCase()}' WHERE ID_CONSUMIDOR = ${conversa.idConsumidor} AND DESCRICAO = '${conversa.dependenteSelecionado[0]}'`;

          connection.query(updateQuery, (err) => {
            if (err) {
              let mensagemEnviada =
                "⚠️ Ocorreu um erro ao atualizar os dados do dependente. Por favor, tente novamente mais tarde.";
              message.reply(mensagemEnviada);
              console.error(err);
              return;
            }

            connection.query("COMMIT", (err) => {
              if (err) {
                console.error("Erro ao confirmar a transação:", err);
                return;
              }
              console.log(
                `Atualizado dependente:\n${campoBD} = ${valorNovo.toUpperCase()}`
              );
            });
          });
          break;
        }
        case "relação": {
          campoBD = "DESC_TIPO_CONTATO";
          const opcao = parseInt(removerEspeciais(valorNovo));
          const relacoes = ["Filho", "Neto", "Sobrinho", "Outros"];

          if (opcao >= 1 && opcao <= relacoes.length) {
            const relacaoSelecionada = relacoes[opcao - 1];
            conversa.dependenteSelecionado[1] = relacaoSelecionada;
            const updateQuery = `UPDATE VRJ_CONSUMIDOR_CONTATO SET ${campoBD} = '${relacaoSelecionada.toUpperCase()}' WHERE ID_CONSUMIDOR = ${conversa.idConsumidor} AND DESCRICAO = '${conversa.dependenteSelecionado[0]}'`;

            connection.query(updateQuery, (err) => {
              if (err) {
                let mensagemEnviada =
                  "⚠️ Ocorreu um erro ao atualizar os dados do dependente. Por favor, tente novamente mais tarde.";
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
            });
          } else {
            let mensagemEnviada = "⚠️ Opção inválida";
            message.reply(mensagemEnviada);
          }
          break;
        }
        case "data de nascimento": {
          campoBD = "DATA_NASCIMENTO";

          if (isValidDate(valorNovo)) {
            const partesData = valorNovo.split("/").reverse().join("-");
            dataNova = partesData;
            conversa.dependenteSelecionado[2] = dataNova;

            const updateQuery = `UPDATE VRJ_CONSUMIDOR_CONTATO SET ${campoBD} = '${dataNova}' WHERE ID_CONSUMIDOR = ${conversa.idConsumidor} AND DESCRICAO = '${conversa.dependenteSelecionado[0]}'`;

            connection.query(updateQuery, (err) => {
              if (err) {
                let mensagemEnviada =
                  "⚠️ Ocorreu um erro ao atualizar os dados do dependente. Por favor, tente novamente mais tarde.";
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
            });
          } else {
            let mensagemEnviada =
              "⚠️ Formato de data inválido. Por favor, forneça a data de nascimento no formato correto (exemplo: 01/08/2023).";
            message.reply(mensagemEnviada);
            return;
          }

          break;
        }
      }
      const query = `SELECT CC.DESCRICAO AS NOME, CC.DESC_TIPO_CONTATO AS RELACAO, CC.DATA_NASCIMENTO FROM VRJ_CONSUMIDOR_CONTATO CC WHERE CC.ID_CONSUMIDOR = ${conversa.idConsumidor} ORDER BY CC.ID_CONSUMIDOR_CONTATO`;

      connection.query(query, (err, result) => {
        if (err) {
          let mensagemEnviada =
            "⚠️ Ocorreu um erro ao consultar os dependentes. Por favor, tente novamente mais tarde.";
          message.reply(mensagemEnviada);
          console.error(err);
          return;
        }

        if (!result || result.rows.length === 0) {
          let mensagemEnviada =
            'Não foram encontrados dependentes. Digite *1* para cadastrar um novo dependente ou *"OK"* para continuar';
          message.reply(mensagemEnviada);
          conversa.estado = "selecionarDependente";
          return;
        }

        let resposta =
          "Selecione o dependente para atualizar ou cadastre um novo:\n\n*1* - Cadastrar novo dependente\n*2* - Remover dependente\n\n";
        result.rows.forEach((row, index) => {
          resposta += `*${index + 3} - ${formatarNome(row[0])}*\n- Relação: ${row[1].toLowerCase()}\n- Data de nascimento: ${formatarDataVertica(row[2])}\n\n`;
        });

        let mensagemEnviada = (resposta +=
          'Caso todos estejam corretos digite *"OK"* ☺️');
        message.reply(mensagemEnviada);

        conversa.estado = "selecionarDependente";
        conversa.dependentes = result.rows;
      });
    }
  }