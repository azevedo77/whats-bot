const { BuscaClientes } = require('./Clientes.js');
const { BuscaDependentes } = require('./Dependentes.js'); // Ajuste o caminho conforme necessário

async function contatos() {
  try {
    const clientes = await BuscaClientes();
    const dependentes = await BuscaDependentes();

    // Map para associar dependentes aos clientes
    clientes.forEach(cliente => {
      cliente.dependentes = dependentes.filter(dependente => dependente.codigo_chave === cliente.codigo_chave);
    });

    // Transformar número de telefone
    clientes.forEach(cliente => {
      const numeroStr = cliente.telefone.toString();
      const parte1 = numeroStr.substring(0, 4);
      let parte2 = numeroStr.substring(4);

      const caracteresParte2 = parte2.length;

      if (caracteresParte2 === 8) {
        cliente.telefoneAlternativo = `${parte1}9${parte2}@c.us`;
      } else if (caracteresParte2 === 9) {
        cliente.telefoneAlternativo = `${parte1}${parte2.substring(1)}@c.us`;
      } else {
        cliente.telefoneAlternativo = `${numeroStr}@c.us`;
      }

      cliente.telefoneOriginal = `${numeroStr}@c.us`;
      cliente.telefone = { 
        original: cliente.telefoneOriginal,
        alternativo: cliente.telefoneAlternativo
      };

      delete cliente.telefoneOriginal;
      delete cliente.telefoneAlternativo;
    });

    return clientes;

  } catch (error) {
    console.error('Erro ao buscar contatos:', error);
    throw error;
  }
}

module.exports.contatos = contatos;
