const { Dependente } = require("../../models/Dependente.js");

module.exports = {
  BuscaDependentes: async function () {
    try {
      const dependentes = await Dependente.query()

      return dependentes;
    } catch (error) {
      throw error;
    }
  }
};
