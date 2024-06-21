const { Cliente } = require('../../../models/Cliente.js');
const { Dependente } = require('../../../models/Dependente.js');
const { updateStatus, logConversation, updateCampo } = require('../../../functions/auxiliarFunctions.js');
const { formatarNome, formatarData, removerEspeciais, getFirstName, minusculo } = require("../../../functions/formatarCampos.js")
const { validarEmail, isValidDate, verificarNomeCompleto } = require("../../../functions/validarCampos.js")
const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');

const start = async (client, sendMessage) => {
    sendMessage(client.telefone, `Olá, ${getFirstName(formatarNome(client.nome))}!\nAqui é da Bibi ${client.loja}, ficamos muito felizes com a sua visita! 🧡\n\nAvalie nosso atendimento, é só digitar um número de 1 a 5:\n\n5 - 😁 Muito Bom!\n4 - 🙂 Bom\n3 - 😐 Médio\n2 - 😒 Ruim\n1 - 😤 Muito Ruim`);
    await updateStatus(client.codigo_chave, 'Aguardando resposta de avaliação');

    // await logConversation(client.codigo_chave, 'Início do fluxo 1.');
};

const processResponse = async (client, cli, response, reply) => {

  switch (client.ultimoestado) {
    case 'Aguardando resposta de avaliação':
        /*
        GRAVAR NPS NO BANCO AQUI
        */
        if (parseInt(extrairNumeros(response)) >= 1 && parseInt(extrairNumeros(response)) <= 5) {
            reply('Informamos que sua compra gerou um bônus aqui na loja e para ativar na próxima compra precisamos confirmar alguns dados. Vamos começar?\n\nDigite o número da opção:\n*1* - Sim\n*2* - Não\n\nObs.: Prometo que é rapidinho, leva menos de 1 minuto ☺️');
            await updateStatus(client.codigo_chave, 'Aguardando confirmação de continuidade');
            // await logConversation(client.codigo_chave, response);
        } else {
            reply('Desculpe, não entendi sua resposta. Por favor, responda novamente.');
        }
        
      break;

    case 'Aguardando confirmação de continuidade':
      if (extrairNumeros(response) == '1') {
        reply('Ótimo! Vamos começar:\n\nInforme seu *nome e sobrenome*');
        await updateStatus(client.codigo_chave, 'Cadastrando Nome');
      } else if (extrairNumeros(response) == '2') {
        reply('Você digitou NÃO 😔 tem certeza de sua resposta?\n*1* – Sim, não desejo confirmar meus dados\n*2* – Quero ativar meu bônus');
        await updateStatus(client.codigo_chave, 'Aguardando confirmação de saída');
      } else {
        reply('Desculpe, não entendi sua resposta. Por favor, responda novamente.');
      }
      // await logConversation(client.codigo_chave, response);
      break;
      case 'Cadastrando Nome':
        {
            if (verificarNomeCompleto(response)) {
                await Cliente.query().findById(client.codigo_chave).patch({ nome: response.toUpperCase() });
                
                reply('Certo, informe seu melhor email:');
                await updateStatus(client.codigo_chave, 'Cadastrando Email');
                // await logConversation(client.codigo_chave, `Nome do dependente cadastrado: ${response}`);
            } else {
                reply('⚠️ Por favor, informe *nome e sobrenome*')
            }
            
        }
            break;
    case 'Cadastrando Email':
      {
          if (validarEmail(response)) {
              await Cliente.query().findById(client.codigo_chave).patch({ email: response.toLowerCase() });
              
              reply('Certo, informe sua data de nascimento:');
              await updateStatus(client.codigo_chave, 'Cadastrando Data Nascimento');
              // await logConversation(client.codigo_chave, `Nome do dependente cadastrado: ${response}`);
          } else {
              reply('⚠️ Por favor, informe *nome e sobrenome*')
          }
          
      }
          break;
    case 'Cadastrando Data de Nascimento':
      {
          if (isValidDate(response)) {
              await Cliente.query().findById(client.codigo_chave).patch({ data_nascimento: response });
              const clienteAtualizado = await Cliente.query().findById(client.codigo_chave)
              reply(`Aqui estão seus dados atualizados:\n\n*1* - Nome: ${formatarNome(clienteAtualizado.nome)}\n*2* - Data de Nascimento: ${formatarData(clienteAtualizado.data_nascimento)}\n*3* - Email: ${clienteAtualizado.email.toLowerCase()}\n\nDigite o *número do campo* para atualizar ou digite *"OK"* ☺️`);
              await updateStatus(client.codigo_chave, 'Aguardando atualização de dados');
              // await logConversation(client.codigo_chave, `Data de nascimento atualizada para: ${response}`);
          } else {
              reply('⚠️ Formato de data inválido. Por favor, forneça a data de nascimento no formato correto (exemplo: 01/08/2023).')
          }
          
      }
    
    break;

    case 'Aguardando confirmação de saída':
      if (extrairNumeros(response) == '1') {
        reply('Ah que pena... Até a próxima 😊');
        await updateStatus(client.codigo_chave, 'Saiu');
      } else if (extrairNumeros(response) == '2') {
        reply('Ótimo! Vamos começar:\n\nInforme seu *nome e sobrenome*');
        await updateStatus(client.codigo_chave, 'Cadastrando Nome');
      } else {
        reply('Desculpe, não entendi sua resposta. Por favor, responda novamente.');
      }
      // await logConversation(client.codigo_chave, response);
      break;

    case 'Aguardando atualização de dados':
      if (extrairNumeros(response) == '1') {
        reply('Certo, digite a informação correta para *nome*:');
        await updateStatus(client.codigo_chave, 'Atualizando Nome');

      } else if (extrairNumeros(response) == '2') {
        reply('Certo, digite a informação correta para *data de nascimento* no formato de exemplo: 24/12/2023:');
        await updateStatus(client.codigo_chave, 'Atualizando Data de Nascimento');

      } else if (extrairNumeros(response) == '3') {
        reply('Certo, digite a informação correta para *email*:');
        await updateStatus(client.codigo_chave, 'Atualizando Email');

      } else if (removerEspeciais(response.toLowerCase()) == 'ok') {
        const dependents = await Dependente.query().where({ codigo_chave: client.codigo_chave });
        if (dependents.length > 0) {
          let message = 'Selecione o dependente para atualizar ou cadastre um novo:\n\n*1* - Cadastrar novo dependente\n*2* - Remover dependente\n\n';
          dependents.forEach((dep, index) => {
            message += `*${index + 3}* - ${formatarNome(dep.nome)}\n- Relação: ${dep.relacao.toLowerCase()}\n- Data de Nascimento: ${formatarData(dep.data_nascimento)}\n\n`;
          });
          message += 'Caso todos estejam corretos digite *"OK"* ☺️'
          reply(message);
        } else {
            reply('Não foram encontrados dependentes. Digite *1* para cadastrar um novo dependente ou *"OK"* para continuar.');
        }
        await updateStatus(client.codigo_chave, 'Gerenciando Dependentes');
      } else {
        reply('Desculpe, não entendi sua resposta. Por favor, responda novamente.');
      }
      // await logConversation(client.codigo_chave, response);
      break;

    case 'Atualizando Nome':
        {
            if (verificarNomeCompleto(response)) {
              await Cliente.query().findById(client.codigo_chave).patch({ nome: response.toUpperCase() });
              const clienteAtualizado = await Cliente.query().findById(client.codigo_chave)
              reply(`Aqui estão seus dados atualizados:\n\n*1* - Nome: ${formatarNome(clienteAtualizado.nome)}\n*2* - Data de Nascimento: ${formatarData(clienteAtualizado.data_nascimento)}\n*3* - Email: ${clienteAtualizado.email.toLowerCase()}\n\nDigite o *número do campo* para atualizar ou digite *"OK"* ☺️`);
              await updateStatus(client.codigo_chave, 'Aguardando atualização de dados');
            } else {
              reply('Por favor, informe nome e sobrenome')
            }
            
            // await logConversation(client.codigo_chave, `Nome atualizado para: ${response}`);
        }
      
      break;

    case 'Atualizando Email':
        {
            if (validarEmail(response)) {
                await Cliente.query().findById(client.codigo_chave).patch({ email: response.toLowerCase() });
                const clienteAtualizado = await Cliente.query().findById(client.codigo_chave)
                reply(`Aqui estão seus dados atualizados:\n\n*1* - Nome: ${formatarNome(clienteAtualizado.nome)}\n*2* - Data de Nascimento: ${formatarData(clienteAtualizado.data_nascimento)}\n*3* - Email: ${clienteAtualizado.email.toLowerCase()}\n\nDigite o *número do campo* para atualizar ou digite *"OK"* ☺️`);
                await updateStatus(client.codigo_chave, 'Aguardando atualização de dados');
                // await logConversation(client.codigo_chave, `Email atualizado para: ${response}`);
            } else {
                reply('⚠️ Email inválido. Por favor, informe um email válido. Exemplo: email@gmail.com')
            }
            
        }
      
      break;

    case 'Atualizando Data de Nascimento':
        {
            if (isValidDate(response)) {
                await Cliente.query().findById(client.codigo_chave).patch({ data_nascimento: response });
                const clienteAtualizado = await Cliente.query().findById(client.codigo_chave)
                reply(`Aqui estão seus dados atualizados:\n\n*1* - Nome: ${formatarNome(clienteAtualizado.nome)}\n*2* - Data de Nascimento: ${formatarData(clienteAtualizado.data_nascimento)}\n*3* - Email: ${clienteAtualizado.email.toLowerCase()}\n\nDigite o *número do campo* para atualizar ou digite *"OK"* ☺️`);
                await updateStatus(client.codigo_chave, 'Aguardando atualização de dados');
                // await logConversation(client.codigo_chave, `Data de nascimento atualizada para: ${response}`);
            } else {
                reply('⚠️ Formato de data inválido. Por favor, forneça a data de nascimento no formato correto (exemplo: 01/08/2023).')
            }
            
        }
      
      break;

    case 'Gerenciando Dependentes':
      if (extrairNumeros(response) == '1') {
        reply('Informe *nome e sobrenome* do dependente:');
        await updateStatus(client.codigo_chave, 'Cadastrando Dependente Nome');

      } else if (extrairNumeros(response) == '2') {
        const dependents = await Dependente.query().where({ codigo_chave: client.codigo_chave });
        if (dependents.length > 0) {
          let message = 'Selecione o dependente para remover:\n\n';
          dependents.forEach((dep, index) => {
            message += `*${index + 1}* - ${formatarNome(dep.nome)}\n- Relação: ${dep.relacao.toLowerCase()}\n- Data de Nascimento: ${formatarData(dep.data_nascimento)}\n\n`;
          });
          reply(message);
          await updateStatus(client.codigo_chave, 'Removendo Dependente');
        } else {
            reply('Não foram encontrados dependentes. Digite *1* para cadastrar um novo dependente ou *"OK"* para continuar');
          await updateStatus(client.codigo_chave, 'Gerenciando Dependentes');
        }

      } else if (removerEspeciais(response.toLowerCase()) === 'ok') {
            const dependents = await Dependente.query().where({ codigo_chave: client.codigo_chave });

            let message = `Obrigado 🤩 aqui estão seus dados atualizados:\n\n*Nome:* ${formatarNome(client.nome)}\n*Data de Nascimento:* ${formatarData(client.data_nascimento)}\n*Email:* ${client.email.toLowerCase()}\n\n*Dependentes:*\n\n`

            dependents.forEach((dep) => {
                message += `*${formatarNome(dep.nome)}*\n- Relação: ${dep.relacao.toLowerCase()}\n- Data de Nascimento: ${formatarData(dep.data_nascimento)}\n\n`
            })
            
            message += 'Digite *"OK"* para finalizar!'
            reply(message);
            await updateStatus(client.codigo_chave, 'Finalizar');
      } else {
        const dependents = await Dependente.query().where({ codigo_chave: client.codigo_chave });
        const index = parseInt(extrairNumeros(response));
        if (index > 2 && index <= dependents.length+2) {
          const dependent = dependents[index-3];
          reply(`Digite o *número do campo* para atualizar\n\n*1* - Nome: ${formatarNome(dependent.nome)}\n*2* - Relação: ${dependent.relacao.toLowerCase()}\n*3* - Data de nascimento: ${formatarData(dependent.data_nascimento)}`);
          await updateStatus(client.codigo_chave, 'Atualizando Dependente');
          await Cliente.query().findById(client.codigo_chave).patch({ dependenteselecionado: dependent.identificador });
          console.log(`Dependente selecionado: ${dependent.identificador}`);
        } else {
            reply('Desculpe, não entendi sua resposta. Por favor, responda novamente.');
        }
      }
      // await logConversation(client.codigo_chave, response);
      break;

    case 'Atualizando Dependente':
    {
        if (extrairNumeros(response) == '1') {
            reply('Certo, digite a informação correta para *nome*:');
            await updateStatus(client.codigo_chave, 'Atualizando Nome Dependente');
    
          } else if (extrairNumeros(response) == '2') {
            reply('Certo, selecione uma das opções para *relação*:\n*1* - Filho\n*2* - Neto\n*3* - Sobrinho\n*4* - Afilhado\n*5* - Outros');
            await updateStatus(client.codigo_chave, 'Atualizando Relacao Dependente');
    
          } else if (extrairNumeros(response) == '3') {
            reply('Certo, digite a informação correta para *data de nascimento* no formato de exemplo: 24/12/2023:');
            await updateStatus(client.codigo_chave, 'Atualizando Data de Nascimento Dependente');
    
          } else {
            reply('Desculpe, não entendi sua resposta. Por favor, responda novamente.');
          }
    }
    break;

    case 'Atualizando Nome Dependente':
    {
        if (verificarNomeCompleto(response)) {
            await Dependente.query().findById(client.dependenteselecionado).patch({ nome: response.toUpperCase() });
            const dependenteAtualizado = await Dependente.query().where({ codigo_chave: client.codigo_chave });

            let message = 'Selecione o dependente para atualizar ou cadastre um novo:\n\n*1* - Cadastrar novo dependente\n*2* - Remover dependente\n\n';
            dependenteAtualizado.forEach((dep, index) => {
            message += `*${index + 3}* - ${formatarNome(dep.nome)}\n- Relação: ${dep.relacao.toLowerCase()}\n- Data de Nascimento: ${formatarData(dep.data_nascimento)}\n`;
            });
            message += '\nCaso todos estejam corretos digite *"OK"* ☺️'
            reply(message);
            await updateStatus(client.codigo_chave, 'Gerenciando Dependentes');
        } else {
            reply('⚠️ Por favor, informe *nome e sobrenome*')
        }
        
    }

      break;

    case 'Atualizando Relacao Dependente':
    {
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
            reply(message);
            await updateStatus(client.codigo_chave, 'Gerenciando Dependentes');
        } else {
            reply('Desculpe, não entendi sua resposta. Por favor, responda novamente.');
        }
        
    }
      break;

    case 'Atualizando Data de Nascimento Dependente':
        if (isValidDate(response)) {
            let resposta = response.trim()
            let novaData = resposta.split('/').reverse().join('-')
            console.log(novaData);
        } else {
            reply('⚠️ Formato de data inválido. Por favor, forneça a data de nascimento no formato correto (exemplo: 01/08/2023).')
        }
        
      break;

    case 'Cadastrando Dependente Nome':
    {
        if (verificarNomeCompleto(response)) {
            await Cliente.query().findById(client.codigo_chave).patch({ novodepnome: response.toUpperCase() });
            
            reply('Certo, selecione uma das opções para *relação*:\n*1* - Filho\n*2* - Neto\n*3* - Sobrinho\n*4* - Afilhado\n*5* - Outros');
            await updateStatus(client.codigo_chave, 'Cadastrando Dependente Relacao');
            // await logConversation(client.codigo_chave, `Nome do dependente cadastrado: ${response}`);
        } else {
            reply('⚠️ Por favor, informe *nome e sobrenome*')
        }
        
    }
        break;

    case 'Cadastrando Dependente Relacao':
        const relacoes = ['Filho', 'Neto', 'Sobrinho', 'Afilhado', 'Outros'];
        const relacao = relacoes[parseInt(extrairNumeros(response)) - 1];
        await Cliente.query().findById(client.codigo_chave).patch({ novodeprelacao: relacao.toUpperCase() });
        reply('Certo, digite a informação correta para *data de nascimento* no formato de exemplo: 24/12/2023:');
        await updateStatus(client.codigo_chave, 'Cadastrando Dependente Data de Nascimento');
        // await logConversation(client.codigo_chave, `Relação do dependente cadastrada: ${relacao}`);
        break;

    case 'Cadastrando Dependente Data de Nascimento':
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
            reply(message);
            await updateStatus(client.codigo_chave, 'Gerenciando Dependentes');
        } else {
            reply('⚠️ Formato de data inválido. Por favor, forneça a data de nascimento no formato correto (exemplo: 01/08/2023).')
        }        
        // await logConversation(client.codigo_chave, `Data de nascimento do dependente cadastrada: ${response}`);

        break;

    case 'Removendo Dependente':
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
            reply(message);
            await updateStatus(client.codigo_chave, 'Gerenciando Dependentes');
            } else {
                reply('Você não tem dependentes cadastrados.');
            await updateStatus(client.codigo_chave, 'Gerenciando Dependentes');
            }
        // await logConversation(client.codigo_chave, `Dependente ${dependentToRemove.nome} removido.`);
        } else {
        reply('Desculpe, não entendi sua resposta. Por favor, responda novamente.');
        }
        await updateStatus(client.codigo_chave, 'Gerenciando Dependentes');
        break;
          
    case 'Finalizar':
        const caption = `Ebaaa!! Seu bônus de R$ ${client.valorgb} foi ativado aqui na Bibi ${client.loja}\nVálido até ${formatarData(client.datagb)} 🥳`

        const imagePath = path.resolve(__dirname, '../../../assets/images/comemoracao.png');
        const media = MessageMedia.fromFilePath(imagePath);

        await cli.sendMessage(client.telefone, media, { caption: caption });
        
        await updateStatus(client.codigo_chave, 'Finalizado');
        
        break;
    default: 
        
      break;
  } 
};

module.exports = {
  start,
  processResponse,
};
