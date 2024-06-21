const { db } = require('../config/db');
const { Model } = require('objection');

Model.knex(db);

class Dependente extends Model {
  static get tableName() {
    return 'bb_dep';
  }
  static get idColumn() {
    return 'identificador';
  } 
}
module.exports.Dependente = Dependente;