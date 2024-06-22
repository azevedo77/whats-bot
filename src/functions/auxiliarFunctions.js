const { Cliente } = require('../models/Cliente.js');
const { db } = require('../config/db.js');

const updateStatus = async (codigo_chave, status) => {
  console.log(`Atulizando cliente: ${codigo_chave}\nStatus: ${status}`);
  const pegaClienteBanco = await Cliente.query().findById(codigo_chave);

  if(!pegaClienteBanco){
    throw "Cliente nao encontrado!"
  }

  await pegaClienteBanco.$query().patchAndFetch({
    ultimoestado: status
  })
};

const logConversation = async (phone , message, state) => {
  await db('bb_conversas').insert({
    telefone: phone,
    mensagem: message,
    status: state
  });
};

module.exports = {
  updateStatus,
  logConversation,
};
