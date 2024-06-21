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

const updateCampo = async (codigo_chave, campo) => {
  console.log(`Atulizando cliente: ${codigo_chave}\Campo: ${campo}`);
  const pegaClienteBanco = await Cliente.query().findById(codigo_chave);

  if(!pegaClienteBanco){
    throw "Cliente nao encontrado!"
  }

  await pegaClienteBanco.$query().patchAndFetch({
    camposelecionado: campo
  })
};

const logConversation = async (codigo_chave, message) => {
  await db('conversas').insert({
    codigo_chave,
    mensagem: message,
    data: new Date()
  });
};

module.exports = {
  updateStatus,
  logConversation,
  updateCampo,
};
