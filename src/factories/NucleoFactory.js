const clc = require("cli-color");
const BancoDeDadosFactory = require("./BancoDeDadosFactory.js");
const WhatsappFactory = require("./WhatsappFactory.js")

class CoreFactory {
  static async Iniciar() {
    console.log(clc.green("BACKEND SENDO INICIADO"));
    await BancoDeDadosFactory.Iniciar();
    await WhatsappFactory.Iniciar();
  }
}

module.exports = CoreFactory;
