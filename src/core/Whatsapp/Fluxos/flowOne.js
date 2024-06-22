const { Cliente } = require('../../../models/Cliente.js');
const { Dependente } = require('../../../models/Dependente.js');
const { updateStatus, logConversation } = require('../../../functions/auxiliarFunctions.js');
const { formatarNome, formatarData, removerEspeciais, getFirstName, extrairNumeros } = require("../../../functions/formatarCampos.js")
const { validarEmail, isValidDate, verificarNomeCompleto } = require("../../../functions/validarCampos.js")
const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');

const start = async (client, sendMessage) => {
    let mensagem = `Olá, ${getFirstName(formatarNome(client.nome))}!\nAqui é da Bibi ${client.loja}, ficamos muito felizes com a sua visita! 🧡\n\nAvalie nosso atendimento, é só digitar um número de 1 a 5:\n\n5 - 😁 Muito Bom!\n4 - 🙂 Bom\n3 - 😐 Médio\n2 - 😒 Ruim\n1 - 😤 Muito Ruim`
    let status = 'Aguardando resposta de avaliação'
    sendMessage(client.telefone, status);
    await updateStatus(client.codigo_chave, status);
    await logConversation('me', mensagem, status);
};

const processResponse = async (client, cli, response, reply) => {

  switch (client.ultimoestado) {
    case 'Aguardando resposta de avaliação':
    {
      let status = 'Aguardando resposta de avaliação'
      let mensagem
      if (parseInt(extrairNumeros(response)) >= 1 && parseInt(extrairNumeros(response)) <= 5) {
          await Cliente.query().findById(client.codigo_chave).patch({ nps: extrairNumeros(response) });
          mensagem = 'Informamos que sua compra gerou um bônus aqui na loja e para ativar na próxima compra precisamos confirmar alguns dados. Vamos começar?\n\nDigite o número da opção:\n*1* - Sim\n*2* - Não\n\nObs.: Prometo que é rapidinho, leva menos de 1 minuto ☺️'
          reply(mensagem);
          await updateStatus(client.codigo_chave, 'Aguardando confirmação de continuidade');
          await logConversation('me', mensagem, status);
      } else {
          mensagem = 'Desculpe, não entendi sua resposta. Por favor, responda novamente.'
          reply(mensagem);
          await logConversation('me', mensagem, status);
      }

      await logConversation(client.telefone, response, status);
      break;
    }
    case 'Aguardando confirmação de continuidade':
    {
      let status = 'Aguardando confirmação de continuidade'
      let mensagem
      if (extrairNumeros(response) == '1') {
        mensagem = `Ótimo! Esses são seus dados cadastrados:\n\n*1* - Nome Completo: ${formatarNome(client.nome)}\n*2* - Data de Nascimento: ${formatarData(client.data_nascimento)}\n*3* - Endereço de Email: ${client.email.toLowerCase()}\n\nSe alguma informação estiver incorreta, informe o número correspondente para ajustar.\nOu então *"OK"* para prosseguir ☺️`
        reply(mensagem);
        await updateStatus(client.codigo_chave, 'Aguardando atualização de dados');
        await logConversation('me', mensagem, status);
      } else if (extrairNumeros(response) == '2') {
        mensagem = 'Você digitou NÃO 😔 tem certeza de sua resposta?\n*1* – Sim, não desejo confirmar meus dados\n*2* – Quero ativar meu bônus'
        reply(mensagem);
        await updateStatus(client.codigo_chave, 'Aguardando confirmação de saída');
        await logConversation('me', mensagem, status);
      } else {
        mensagem = 'Desculpe, não entendi sua resposta. Por favor, responda novamente.'
        reply(mensagem);
        await logConversation('me', mensagem, status);
      }

      await logConversation(client.telefone, response, status);
      break;
    }
    case 'Aguardando confirmação de saída':
    {
      let status = 'Aguardando confirmação de saída'
      let mensagem 
      if (extrairNumeros(response) == '1') {
        mensagem = 'Ah que pena... Até a próxima 😊'
        reply(mensagem);
        await updateStatus(client.codigo_chave, 'Saiu');
        await logConversation('me', mensagem, status);
      } else if (extrairNumeros(response) == '2') {
        mensagem = `Ótimo! Esses são seus dados cadastrados:\n\n*1* - Nome Completo: ${formatarNome(client.nome)}\n*2* - Data de Nascimento: ${formatarData(client.data_nascimento)}\n*3* - Endereço de Email: ${client.email.toLowerCase()}\n\nSe alguma informação estiver incorreta, informe o número correspondente para ajustar. Ou então *"OK"* para prosseguir ☺️`
        reply(mensagem);
        await updateStatus(client.codigo_chave, 'Aguardando atualização de dados');
        await logConversation('me', mensagem, status);
      } else {
        mensagem = 'Desculpe, não entendi sua resposta. Por favor, responda novamente.'
        reply(mensagem);
        await logConversation('me', mensagem, status);
      }

      await logConversation(client.telefone, response, status);
      break;
    }
    case 'Aguardando atualização de dados':
    {
      let status = 'Aguardando atualização de dados'
      let mensagem 
      if (extrairNumeros(response) == '1') {
        mensagem = 'Certo, digite a informação correta para *nome*:'
        reply(mensagem);
        await updateStatus(client.codigo_chave, 'Atualizando Nome');
        await logConversation('me', mensagem, status);
      } else if (extrairNumeros(response) == '2') {
        mensagem = 'Certo, digite a informação correta para *data de nascimento* no formato de exemplo: 24/12/2023:'
        reply(mensagem);
        await updateStatus(client.codigo_chave, 'Atualizando Data de Nascimento');
        await logConversation('me', mensagem, status);
      } else if (extrairNumeros(response) == '3') {
        mensagem = 'Certo, digite a informação correta para *email*:'
        reply(mensagem);
        await updateStatus(client.codigo_chave, 'Atualizando Email');
        await logConversation('me', mensagem, status);
      } else if (removerEspeciais(response.toLowerCase()) === 'ok') {
        const dependents = await Dependente.query().where({ codigo_chave: client.codigo_chave });
        if (dependents.length > 0) {
          let message = 'Selecione o dependente para atualizar ou cadastre um novo:\n\n*1* - Cadastrar novo dependente\n*2* - Remover dependente\n\n';
          dependents.forEach((dep, index) => {
            message += `*${index + 3}* - ${formatarNome(dep.nome)}\n- Relação: ${dep.relacao.toLowerCase()}\n- Data de Nascimento: ${formatarData(dep.data_nascimento)}\n\n`;
          });
          message += 'Caso todos estejam corretos digite *"OK"* ☺️'
          mensagem = message
          reply(mensagem);
          await logConversation('me', mensagem, status);
        } else {
            mensagem = 'Não foram encontrados dependentes. Digite *1* para cadastrar um novo dependente ou *"OK"* para continuar.'
            reply(mensagem);
            await logConversation('me', mensagem, status);
        }
        await updateStatus(client.codigo_chave, 'Gerenciando Dependentes');
      } else {
        mensagem = 'Desculpe, não entendi sua resposta. Por favor, responda novamente.'
        reply(mensagem);
        await logConversation('me', mensagem, status);
      }

      await logConversation(client.telefone, response, status);
      break;
    }
    case 'Atualizando Nome':
    {
      let status = 'Atualizando Nome'
      let mensagem 
      if (verificarNomeCompleto(response)) {
        await Cliente.query().findById(client.codigo_chave).patch({ nome: response.toUpperCase() });
        const clienteAtualizado = await Cliente.query().findById(client.codigo_chave)

        mensagem = `Aqui estão seus dados atualizados:\n\n*1* - Nome: ${formatarNome(clienteAtualizado.nome)}\n*2* - Data de Nascimento: ${formatarData(clienteAtualizado.data_nascimento)}\n*3* - Email: ${clienteAtualizado.email.toLowerCase()}\n\nDigite o *número do campo* para atualizar ou digite *"OK"* ☺️`
        reply(mensagem);
        await updateStatus(client.codigo_chave, 'Aguardando atualização de dados');
        await logConversation('me', mensagem, status);
      } else {
        mensagem = 'Por favor, informe nome e sobrenome.'
        reply(mensagem)
        await logConversation('me', mensagem, status);
      }   

      await logConversation(client.telefone, response, status);
      break;
    }
    case 'Atualizando Email':
    {
      let status = 'Atualizando Email'
      let mensagem
      if (validarEmail(response)) {
          await Cliente.query().findById(client.codigo_chave).patch({ email: response.toLowerCase() });
          const clienteAtualizado = await Cliente.query().findById(client.codigo_chave)
          mensagem = `Aqui estão seus dados atualizados:\n\n*1* - Nome: ${formatarNome(clienteAtualizado.nome)}\n*2* - Data de Nascimento: ${formatarData(clienteAtualizado.data_nascimento)}\n*3* - Email: ${clienteAtualizado.email.toLowerCase()}\n\nDigite o *número do campo* para atualizar ou digite *"OK"* ☺️`
          reply(mensagem);
          await updateStatus(client.codigo_chave, 'Aguardando atualização de dados');
          await logConversation('me', mensagem, status);
      } else {
          mensagem = '⚠️ Email inválido. Por favor, informe um email válido. Exemplo: email@gmail.com'
          reply(mensagem)
          await logConversation('me', mensagem, status);
      }
        
      await logConversation(client.telefone, response, status);
      break;
    }
    case 'Atualizando Data de Nascimento':
    {
      let status = 'Atualizando Data de Nascimento'
      let mensagem 
      if (isValidDate(response)) {
          await Cliente.query().findById(client.codigo_chave).patch({ data_nascimento: response });
          const clienteAtualizado = await Cliente.query().findById(client.codigo_chave)
          mensagem = `Aqui estão seus dados atualizados:\n\n*1* - Nome: ${formatarNome(clienteAtualizado.nome)}\n*2* - Data de Nascimento: ${formatarData(clienteAtualizado.data_nascimento)}\n*3* - Email: ${clienteAtualizado.email.toLowerCase()}\n\nDigite o *número do campo* para atualizar ou digite *"OK"* ☺️`
          reply(mensagem);
          await updateStatus(client.codigo_chave, 'Aguardando atualização de dados');
          await logConversation('me', mensagem, status);
      } else {
          mensagem = '⚠️ Formato de data inválido. Por favor, forneça a data de nascimento no formato correto (exemplo: 01/08/2023).'
          reply(mensagem)
          await logConversation('me', mensagem, status);
      }
      await logConversation(client.telefone, response, status);
      break;
    }
    case 'Gerenciando Dependentes':
    {
      let status = 'Gerenciando Dependentes'
      let mensagem
      if (extrairNumeros(response) == '1') {
        mensagem = 'Informe *nome e sobrenome* do dependente:'
        reply(mensagem);
        await updateStatus(client.codigo_chave, 'Cadastrando Dependente Nome');
        await logConversation('me', mensagem, status);
      } else if (extrairNumeros(response) == '2') {
        const dependents = await Dependente.query().where({ codigo_chave: client.codigo_chave });
        if (dependents.length > 0) {
          let message = 'Selecione o dependente para remover:\n\n';
          dependents.forEach((dep, index) => {
            message += `*${index + 1}* - ${formatarNome(dep.nome)}\n- Relação: ${dep.relacao.toLowerCase()}\n- Data de Nascimento: ${formatarData(dep.data_nascimento)}\n\n`;
          });
          mensagem = message
          reply(mensagem);
          await updateStatus(client.codigo_chave, 'Removendo Dependente');
          await logConversation('me', mensagem, status);
        } else {
            mensagem = 'Não foram encontrados dependentes. Digite *1* para cadastrar um novo dependente ou *"OK"* para continuar'
            reply(mensagem);
            await updateStatus(client.codigo_chave, 'Gerenciando Dependentes');
            await logConversation('me', mensagem, status);
        }
      } else if (removerEspeciais(response.toLowerCase()) === 'ok') {
          const dependents = await Dependente.query().where({ codigo_chave: client.codigo_chave });

          let message = `Obrigado 🤩 aqui estão seus dados atualizados:\n\n*Nome:* ${formatarNome(client.nome)}\n*Data de Nascimento:* ${formatarData(client.data_nascimento)}\n*Email:* ${client.email.toLowerCase()}\n\n*Dependentes:*\n\n`

          dependents.forEach((dep) => {
              message += `*${formatarNome(dep.nome)}*\n- Relação: ${dep.relacao.toLowerCase()}\n- Data de Nascimento: ${formatarData(dep.data_nascimento)}\n\n`
          })
          
          message += 'Digite *"OK"* para finalizar!'

          mensagem = message
          reply(mensagem);
          await updateStatus(client.codigo_chave, 'Finalizar');
          await logConversation('me', mensagem, status);
      } else {
        const dependents = await Dependente.query().where({ codigo_chave: client.codigo_chave });
        const index = parseInt(extrairNumeros(response));
        if (index > 2 && index <= dependents.length+2) {
          const dependent = dependents[index-3];
          mensagem = `Digite o *número do campo* para atualizar\n\n*1* - Nome: ${formatarNome(dependent.nome)}\n*2* - Relação: ${dependent.relacao.toLowerCase()}\n*3* - Data de nascimento: ${formatarData(dependent.data_nascimento)}`
          reply(mensagem);
          await updateStatus(client.codigo_chave, 'Atualizando Dependente');
          await Cliente.query().findById(client.codigo_chave).patch({ dependenteselecionado: dependent.identificador });
          await logConversation('me', mensagem, status);
        } else {
            mensagem = 'Desculpe, não entendi sua resposta. Por favor, responda novamente.'
            reply(mensagem);
            await logConversation('me', mensagem, status);
        }
      }
      await logConversation(client.telefone, response, status);
      break;
    }
    case 'Atualizando Dependente':
    {
      let status = 'Atualizando Dependente'
      let mensagem 

      if (extrairNumeros(response) == '1') {
          mensagem = 'Certo, digite a informação correta para *nome*:'
          reply(mensagem);
          await updateStatus(client.codigo_chave, 'Atualizando Nome Dependente');
          await logConversation('me', mensagem, status);
        } else if (extrairNumeros(response) == '2') {
          mensagem = 'Certo, selecione uma das opções para *relação*:\n*1* - Filho\n*2* - Neto\n*3* - Sobrinho\n*4* - Afilhado\n*5* - Outros'
          reply(mensagem);
          await updateStatus(client.codigo_chave, 'Atualizando Relacao Dependente');
          await logConversation('me', mensagem, status);
        } else if (extrairNumeros(response) == '3') {
          mensagem = 'Certo, digite a informação correta para *data de nascimento* no formato de exemplo: 24/12/2023:'
          reply(mensagem);
          await updateStatus(client.codigo_chave, 'Atualizando Data de Nascimento Dependente');
          await logConversation('me', mensagem, status);
        } else {
          mensagem = 'Desculpe, não entendi sua resposta. Por favor, responda novamente.'
          reply(mensagem);
          await logConversation('me', mensagem, status);
        }
      await logConversation(client.telefone, response, status);
      break;
    }
    case 'Atualizando Nome Dependente':
    {
      let status = 'Atualizando Nome Dependente'
      let mensagem

      if (verificarNomeCompleto(response)) {
          await Dependente.query().findById(client.dependenteselecionado).patch({ nome: response.toUpperCase() });
          const dependenteAtualizado = await Dependente.query().where({ codigo_chave: client.codigo_chave });

          let message = 'Selecione o dependente para atualizar ou cadastre um novo:\n\n*1* - Cadastrar novo dependente\n*2* - Remover dependente\n\n';
          dependenteAtualizado.forEach((dep, index) => {
          message += `*${index + 3}* - ${formatarNome(dep.nome)}\n- Relação: ${dep.relacao.toLowerCase()}\n- Data de Nascimento: ${formatarData(dep.data_nascimento)}\n`;
          });
          message += '\nCaso todos estejam corretos digite *"OK"* ☺️'

          mensagem = message
          reply(mensagem);
          await updateStatus(client.codigo_chave, 'Gerenciando Dependentes');
          await logConversation('me', mensagem, status);
      } else {
          mensagem = '⚠️ Por favor, informe *nome e sobrenome*'
          reply(mensagem)
          await logConversation('me', mensagem, status);
      }
    
      await logConversation(client.telefone, response, status);
      break;
    }
    case 'Atualizando Relacao Dependente':
    {
      let status = 'Atualizando Relacao Dependente'
      let mensagem

      if (parseInt(extrairNumeros(response)) >= 1 && parseInt(extrairNumeros(response)) <= 5) {
          const relacoes = ['Filho', 'Neto', 'Sobrinho', 'Afilhado', 'Outros'];
          const relacao = relacoes[parseInt(extrairNumeros(response)) - 1];

          await Dependente.query().findById(client.dependenteselecionado).patch({ relacao: relacao.toUpperCase() });
          const dependenteAtualizado = await Dependente.query().where({ codigo_chave: client.codigo_chave });

          let message = 'Selecione o dependente para atualizar ou cadastre um novo:\n\n*1* - Cadastrar novo dependente\n*2* - Remover dependente\n\n';
          dependenteAtualizado.forEach((dep, index) => {
          message += `*${index + 3}* - ${formatarNome(dep.nome)}\n- Relação: ${dep.relacao.toLowerCase()}\n- Data de Nascimento: ${formatarData(dep.data_nascimento)}\n`;
          });
          message += 'Caso todos estejam corretos digite *"OK"* ☺️'

          mensagem = message
          reply(mensagem);
          await updateStatus(client.codigo_chave, 'Gerenciando Dependentes');
          await logConversation('me', mensagem, status);
      } else {
          mensagem = 'Desculpe, não entendi sua resposta. Por favor, responda novamente.'
          reply(mensagem);
          await logConversation('me', mensagem, status);
      }

      await logConversation(client.telefone, response, status);
      break;
    }
    case 'Atualizando Data de Nascimento Dependente':
    {
      let status = 'Atualizando Data de Nascimento Dependente'
      let mensagem

      if (isValidDate(response)) {
          let resposta = response.trim()
          let novaData = resposta.split('/').reverse().join('-')

          await Dependente.query().findById(client.dependenteselecionado).patch({ data_nascimento: novaData });
          const dependenteAtualizado = await Dependente.query().where({ codigo_chave: client.codigo_chave });
          
          let message = 'Selecione o dependente para atualizar ou cadastre um novo:\n\n*1* - Cadastrar novo dependente\n*2* - Remover dependente\n\n';
          dependenteAtualizado.forEach((dep, index) => {
          message += `*${index + 3}* - ${formatarNome(dep.nome)}\n- Relação: ${dep.relacao.toLowerCase()}\n- Data de Nascimento: ${formatarData(dep.data_nascimento)}\n`;
          });
          message += 'Caso todos estejam corretos digite *"OK"* ☺️'

          mensagem = message
          reply(mensagem);
          await updateStatus(client.codigo_chave, 'Gerenciando Dependentes');
          await logConversation('me', mensagem, status);
      } else {
          mensagem = '⚠️ Formato de data inválido. Por favor, forneça a data de nascimento no formato correto (exemplo: 01/08/2023).'
          reply(mensagem)
          await logConversation('me', mensagem, status);
      }

      await logConversation(client.telefone, response, status);
      break;
    }
    case 'Cadastrando Dependente Nome':
    {
      let status = 'Cadastrando Dependente Nome'
      let mensagem

      if (verificarNomeCompleto(response)) {
          await Cliente.query().findById(client.codigo_chave).patch({ novodepnome: response.toUpperCase() });
          mensagem = 'Certo, selecione uma das opções para *relação*:\n*1* - Filho\n*2* - Neto\n*3* - Sobrinho\n*4* - Afilhado\n*5* - Outros'
          reply(mensagem);
          await updateStatus(client.codigo_chave, 'Cadastrando Dependente Relacao');
          await logConversation('me', mensagem, status);
      } else {
          mensagem = '⚠️ Por favor, informe *nome e sobrenome*'
          reply(mensagem)
          await logConversation('me', mensagem, status);
      }

      await logConversation(client.telefone, response, status);
      break;
    }
    case 'Cadastrando Dependente Relacao':
    {
      let status = 'Cadastrando Dependente Relacao'
      let mensagem

      const relacoes = ['Filho', 'Neto', 'Sobrinho', 'Afilhado', 'Outros'];
      const relacao = relacoes[parseInt(extrairNumeros(response)) - 1];
      await Cliente.query().findById(client.codigo_chave).patch({ novodeprelacao: relacao.toUpperCase() });
      mensagem = 'Certo, digite a informação correta para *data de nascimento* no formato de exemplo: 24/12/2023:'
      reply(mensagem);
      await updateStatus(client.codigo_chave, 'Cadastrando Dependente Data de Nascimento');

      await logConversation(client.telefone, response, status);
      break;
    }
    case 'Cadastrando Dependente Data de Nascimento':
    {
      let status = 'Cadastrando Dependente Data de Nascimento'
      let mensagem

      if (isValidDate(response)) {
          const resposta = response.trim()
          const novaData = resposta.split('/').reverse().join('-')

          const row = await Dependente.query().where({ codigo_chave: client.codigo_chave }).count()
          const count = parseInt(row[0].count);
          const id = `${client.codigo_chave}_${count+1}`

          await Dependente.query().insert({ identificador: id,  codigo_chave: client.codigo_chave, nome: client.novodepnome, relacao: client.novodeprelacao, data_nascimento: novaData });

          await Cliente.query().findById(client.codigo_chave).patch({ novodepnome: null });
          await Cliente.query().findById(client.codigo_chave).patch({ novodeprelacao: null });

          const dependents = await Dependente.query().where({ codigo_chave: client.codigo_chave });
          let message = 'Selecione o dependente para atualizar ou cadastre um novo:\n\n*1* - Cadastrar novo dependente\n*2* - Remover dependente\n\n';
              dependents.forEach((dep, index) => {
              message += `*${index + 3}* - ${formatarNome(dep.nome)}\n- Relação: ${dep.relacao.toLowerCase()}\n- Data de Nascimento: ${formatarData(dep.data_nascimento)}\n\n`;
          });
          message += 'Caso todos estejam corretos digite *"OK"* ☺️'

          mensagem = message
          reply(mensagem);
          await logConversation('me', mensagem, status);
          await updateStatus(client.codigo_chave, 'Gerenciando Dependentes');
      } else {
          mensagem = '⚠️ Formato de data inválido. Por favor, forneça a data de nascimento no formato correto (exemplo: 01/08/2023).'
          reply(mensagem)
          await logConversation('me', mensagem, status);
      }        

      await logConversation(client.telefone, response, status);
      break;
    }
    case 'Removendo Dependente':
    {
      let status = 'Removendo Dependente'
      let mensagem

      const dependentsToRemove = await Dependente.query().where({ codigo_chave: client.codigo_chave });
      const dependentIndex = parseInt(extrairNumeros(response)) - 1;
      if (dependentIndex >= 0 && dependentIndex < dependentsToRemove.length) {
        const dependentToRemove = dependentsToRemove[dependentIndex];
        await Dependente.query().deleteById(dependentToRemove.identificador);
        const dependents = await Dependente.query().where({ codigo_chave: client.codigo_chave });
        if (dependents.length > 0) {
          const dependents = await Dependente.query().where({ codigo_chave: client.codigo_chave });
          let message = 'Selecione o dependente para atualizar ou cadastre um novo:\n\n*1* - Cadastrar novo dependente\n*2* - Remover dependente\n\n';
              dependents.forEach((dep, index) => {
              message += `*${index + 3}* - ${formatarNome(dep.nome)}\n- Relação: ${dep.relacao.toLowerCase()}\n- Data de Nascimento: ${formatarData(dep.data_nascimento)}\n\n`;
          });
          message += 'Caso todos estejam corretos digite *"OK"* ☺️'
          mensagem = message
          reply(mensagem);
          await updateStatus(client.codigo_chave, 'Gerenciando Dependentes');
          await logConversation('me', mensagem, status);
        } else {
            mensagem = 'Você não tem dependentes cadastrados.'
            reply(mensagem);
            await logConversation('me', mensagem, status);
            await updateStatus(client.codigo_chave, 'Gerenciando Dependentes');
        }
      } else {
        mensagem = 'Desculpe, não entendi sua resposta. Por favor, responda novamente.'
        reply(mensagem);
      }

      await logConversation(client.telefone, response, status);
      break;
    }
    case 'Finalizar':
    {
      let status = 'Finalizar'
      let mensagem

      const caption = `Ebaaa!! Seu bônus de R$ ${client.valorgb} foi ativado aqui na Bibi ${client.loja}\nVálido até ${formatarData(client.datagb)} 🥳`

      const imagePath = path.resolve(__dirname, '../../../assets/images/comemoracao.png');
      const media = MessageMedia.fromFilePath(imagePath);

      await cli.sendMessage(client.telefone, media, { caption: caption });
      await updateStatus(client.codigo_chave, 'Finalizado');

      mensagem = caption
      await logConversation('me', mensagem, status);    
      
      await logConversation(client.telefone, response, status);
      break;
    }
    default: 
        
      break;
  } 
};

module.exports = {
  start,
  processResponse,
};
