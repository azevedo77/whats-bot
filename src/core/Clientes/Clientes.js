const { Cliente } = require("../../models/Cliente.js");

module.exports = {
  BuscaClientes: async function () {
    try {
      const clientes = await Cliente.query();

      return clientes;
    } catch (error) {
      throw error;
    }
  },
};
