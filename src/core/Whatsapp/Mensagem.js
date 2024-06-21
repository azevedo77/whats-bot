async function RecebeMensagem(mensagem) {
  console.log(mensagem)
}

async function EnviaMensagem(client, chatId, message) {
  try {
    //await client.sendMessage(chatId, message);
    // console.log(`Mensagem enviada para ${chatId}: ${message}`);
  } catch (error) {
    console.error(`Erro ao enviar mensagem para ${chatId}:`, error);
  }
}

async function reply(mensagem) {
  try {
    await message.reply(mensagem);
    // console.log(`Reply: ${message}`);
  } catch (error) {
    console.error(`Erro ao responder mensagem`, error);
  }
}

module.exports = { RecebeMensagem, EnviaMensagem, reply } 