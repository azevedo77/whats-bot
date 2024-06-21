const { db } = require("../config/db.js");
const clc = require("cli-color");

class BancoDeDadosFactory {
  static async Iniciar() {
    console.log("TENTANDO CONECTAR AO BANCO DE DADOS...");
    await db
      .raw("SELECT 1")
      .then(() => {
        console.log(clc.green("BANCO DE DADOS CONECTADO"));
      })
      .catch((err) => {
        console.error("Erro ao conectar ao banco de dados:", err);
      })
  }
} 

module.exports = BancoDeDadosFactory;
