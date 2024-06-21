const query = ` SELECT  A.GB_PONTOS, 
                                            A.GB_DATA_FIM_VALIDADE AS DATA_VALIDADE
                                    FROM BIBI_VRJ_GB_FATO A 
                                    JOIN(
                                        SELECT 	MAX(GB_DATA_FIM_VALIDADE) AS DATA_VALIDADE,
                                                ID_CONSUMIDOR 
                                        FROM BIBI_VRJ_GB_FATO
                                        WHERE ID_CONSUMIDOR = ${conversa.idConsumidor}
                                    GROUP BY ID_CONSUMIDOR
                                    ) B ON A.GB_DATA_FIM_VALIDADE = B.DATA_VALIDADE AND A.ID_CONSUMIDOR = B.ID_CONSUMIDOR`;

          connection.query(query, (err, result) => {
            if (err) {
              let mensagemEnviada =
                "⚠️ Ocorreu um erro ao consultar os dependentes. Por favor, tente novamente mais tarde.";
              message.reply(mensagemEnviada);
              console.error(err);
              return;
            }

            result.rows.forEach((row) => {
              const gbPontos = row[0];
              const gbValidade = formatarDataVertica(row[1]);
              const gifPath = "./public/comemoracao.png";
              const gifBuffer = fs.readFileSync(gifPath);
              const mediaMessage = new MessageMedia(
                "image/png",
                gifBuffer.toString("base64"),
                "png.png"
              );
              const caption = `Ebaaa!! Seu bônus de R$ ${gbPontos} foi ativado aqui na ${conversa.loja}\nVálido até ${gbValidade} 🥳`;
              client.sendMessage(message.from, mediaMessage, {
                caption,
                sendMediaAsSticker: false,
              });
              conversa.estado = null;
              conversa.menuEnviado = false;
              let mensagemEnviada = caption;
              message.reply(mensagemEnviada);
            });
          });