const { Cliente } = require('../../models/Cliente.js');
const flowOne = require('./Fluxos/flowOne.js');
const flowTwo = require('./Fluxos/flowTwo.js');
const flowThree = require('./Fluxos/flowThree.js');
const flowFour = require('./Fluxos/flowFour.js');
const flowFive = require('./Fluxos/flowFive.js');
const flowSix = require('./Fluxos/flowSix.js');

class MessageHandler {
    static async handleIncomingMessage(client, message) {
      try {
        const clientData = await Cliente.query().findOne({ telefone: message.from });
        if (clientData) {
          if (clientData.fluxo === '1') {
            await flowOne.processResponse(clientData, client, message.body, (reply) => {
              message.reply(reply);
            });
          }
          else if (clientData.fluxo === '2') {
            await flowTwo.processResponse(clientData, client, message.body, (reply) => {
              message.reply(reply);
            });
          }
          else if (clientData.fluxo === '3') {
            await flowThree.processResponse(clientData, client, message.body, (reply) => {
              message.reply(reply);
            });
          }
          else if (clientData.fluxo === '4') {
            await flowFour.processResponse(clientData, client, message.body, (reply) => {
              message.reply(reply);
            });
          }
          else if (clientData.fluxo === '5') {
            await flowFive.processResponse(clientData, client, message.body, (reply) => {
              message.reply(reply);
            });
          }
          else if (clientData.fluxo === '6') {
            await flowSix.processResponse(clientData, client, message.body, (reply) => {
              message.reply(reply);
            });
          }
        }
      } catch (error) {
        console.error('Erro ao processar mensagem:', error);
      }
    }
  
    static async sendMessage(client, to, content) {
      try {
        await client.sendMessage(to, content);
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
      }
    } 
  }
  
  module.exports = MessageHandler;
  