const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const MessageHandler = require('../core/Whatsapp/MessageHandler');
const { Cliente } = require('../models/Cliente');
const flowOne = require('../core/Whatsapp/Fluxos/flowOne');
const flowTwo = require('../core/Whatsapp/Fluxos/flowTwo');
const flowThree = require('../core/Whatsapp/Fluxos/flowThree');
const flowFour = require('../core/Whatsapp/Fluxos/flowFour');
const flowFive = require('../core/Whatsapp/Fluxos/flowFive');
const flowSix = require('../core/Whatsapp/Fluxos/flowSix');

class WhatsappFactory {
  static async Iniciar() {
    const client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    client.on('qr', (qr) => {
      qrcode.generate(qr, { small: true });
    });1


    client.on('ready', async () => {
      console.log('WhatsApp pronto');
      const clients = await Cliente.query();
      clients.forEach(async (clientData) => {
        if (clientData.fluxo === '1' && clientData.codigo_chave === '1874299') {
          await flowOne.start(clientData, (to, content) => {
            MessageHandler.sendMessage(client, to, content);
          });
        }
        else if (clientData.fluxo === '2' ) {
          await flowTwo.start(clientData, (to, content) => {
            MessageHandler.sendMessage(client, to, content);
          });
        }
        else if (clientData.fluxo === '3' && clientData.codigo_chave === '1874299') {
          await flowThree.start(clientData, (to, content) => {
            MessageHandler.sendMessage(client, to, content);
          });
        }
        else if (clientData.fluxo === '4' && clientData.codigo_chave === '1874299') {
          await flowFour.start(clientData, (to, content) => {
            MessageHandler.sendMessage(client, to, content);
          });
        }
        else if (clientData.fluxo === '5' && clientData.codigo_chave === '1874299') {
          await flowFive.start(clientData, (to, content) => {
            MessageHandler.sendMessage(client, to, content);
          });
        }
        else if (clientData.fluxo === '6' && clientData.codigo_chave === '1874299') {
          await flowSix.start(clientData, (to, content) => {
            MessageHandler.sendMessage(client, to, content);
          });
        }
      });
    }); 

    client.on('message', async (message) => {
      await MessageHandler.handleIncomingMessage(client, message);
    });

    client.initialize();
  }
}

module.exports = WhatsappFactory;
