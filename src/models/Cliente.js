const { db } = require('../config/db');
const { Model } = require('objection');

Model.knex(db);

class Cliente extends Model {
  static get tableName() {
    return 'bb_cli';
  }
  static get idColumn() {
    return 'codigo_chave';
  } 
}
module.exports.Cliente = Cliente;