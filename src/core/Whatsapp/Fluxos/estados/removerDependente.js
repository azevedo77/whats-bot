const dependente =
            conversa.dependentes[parseInt(removerEspeciais(recebido.trim())) - 1];
          const removeDependente = `DELETE FROM VRJ_CONSUMIDOR_CONTATO WHERE ID_CONSUMIDOR = ${conversa.idConsumidor} AND ID_CONSUMIDOR_CONTATO = '${dependente[3]}'`;
          connection.query(removeDependente, (err) => {
            if (err) {
              let mensagemEnviada =
                "⚠️ Ocorreu um erro ao remover os dependentes. Por favor, tente novamente mais tarde.";
              message.reply(mensagemEnviada);
              console.error(err);
              return;
            }
            connection.query("COMMIT");
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
                  'Não foram encontrados dependentes. Digite *1* para cadastrar um novo dependente ou *"OK"* para continuar.';
                message.reply(mensagemEnviada);
                conversa.estado = "selecionarDependente";
                return;
              }

              let resposta =
                "Selecione o dependente para atualizar ou cadastre um novo:\n\n*1* - Cadastrar novo dependente\n*2* – Remover dependente\n\n";
              result.rows.forEach((row, index) => {
                resposta += `*${index + 3} - ${formatarNome(row[0])}*\n- Relação: ${row[1].toLowerCase()} \n- Data de Nascimento: ${formatarDataVertica(row[2])}\n\n`;
              });
              let mensagemEnviada = (resposta +=
                'Caso todos estejam corretos digite *"OK"* ☺️');
              message.reply(mensagemEnviada);

              conversa.estado = "selecionarDependente";
              conversa.dependentes = result.rows;
            });
          });