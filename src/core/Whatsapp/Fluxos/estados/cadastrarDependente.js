
async function cadastrarDependente(body, conversa) {
  let resposta = {
    mensagem: '',
    novoEstado: '',
  };

if (!conversa.novoDependente.nome) {
  if (verificarNomeCompleto(removerEspeciais(body.trim()))) {
    conversa.novoDependente.nome = removerEspeciais(body.trim());
    const relacoes = ["Filho", "Neto", "Sobrinho", "Outros"];
    resposta.mensagem = `Informe a *relação*:\n\n${relacoes.map((opcao, index) => `*${index + 1}* - ${opcao}`).join("\n")}`;
  } else {
    resposta.mensagem = "⚠️ Por favor, informe *nome e sobrenome*";
  }
} else if (!conversa.novoDependente.relacao) {
  if (parseInt(removerEspeciais(body.trim())) >= 1 && parseInt(removerEspeciais(body.trim())) <= 4) {
    const opcao = parseInt(removerEspeciais(body.trim()));
    const relacoes = ["Filho", "Neto", "Sobrinho", "Outros"];
    const relacaoSelecionada = relacoes[opcao - 1];
    conversa.novoDependente.relacao = relacaoSelecionada;
    resposta.mensagem =
      "Informe a *data de nascimento* do dependente (exemplo: 01/08/2023).";
  } else {
    resposta.mensagem = "Opção inválida!";
  }
} else if (!conversa.novoDependente.dataNascimento) {
  if (isValidDate(body.trim())) {
    const dataNascimento = body.trim();
    const partesData = dataNascimento.split("/").reverse().join("-");
    conversa.novoDependente.dataNascimento = partesData;


    const queryAdicionarDependente = `INSERT INTO VRJ_CONSUMIDOR_CONTATO (ID_CONSUMIDOR, DESCRICAO, DESC_TIPO_CONTATO, DATA_NASCIMENTO, ID_CONSUMIDOR_CONTATO, ID_TIPO_CONTATO, USUARIO_CADASTRO, DATA_CADASTRO) VALUES (${conversa.idConsumidor}, '${conversa.novoDependente.nome.toUpperCase()}', '${conversa.novoDependente.relacao.toUpperCase()}', '${conversa.novoDependente.dataNascimento}', SQ_VRJ_CONSUMIDOR_CONTATO.NEXTVAL, 2, 'BOT', SYSDATE)`;
    connection.query(queryAdicionarDependente, (err) => {
      if (err) {
        resposta.mensagem =
          "⚠️ Ocorreu um erro ao cadastrar o dependente. Por favor, tente novamente mais tarde.";
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
      conversa.dependentes.push(conversa.novoDependente);
      conversa.novoDependente = {
        nome: null,
        relacao: null,
        dataNascimento: null,
      };
    });

    resposta.mensagem = 'Selecione o dependente para atualizar ou cadastre um novo:\n\n*1* - Cadastrar novo dependente\n*2* – Remover dependente\n\n';
    conversa.dependentes.forEach((dep, index) => {
        resposta.mensagem += `*${index + 3}* - ${formatarNome(dep[0])}\n- Relação: ${dep[1].toLowerCase()} \n- Data de Nascimento: ${formatarDataVertica(dep[2])}\n\n`;
    });
    resposta.mensagem += 'Caso todos estejam corretos digite *"OK"* ☺️';
    resposta.novoEstado = "selecionarDependente";

  } else {
    resposta.mensagem = "⚠️ Formato de data inválido. Por favor, forneça a data de nascimento no formato correto (exemplo: 01/08/2023).";
  }
}
}
