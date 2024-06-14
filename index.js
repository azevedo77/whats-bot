const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const speakeasy = require('speakeasy')
const vertica = require('vertica')
const mysql = require('mysql2')
const { Pool } = require('pg')
const fs = require('fs')

// Configurações para conectar ao banco de dados
const pool = new Pool({
  user: 'prisma',
  host: 'databasefranquias.bibi.com.br',
  database: 'bibi',
  password: 'prisma@2018',
  port: 5432, // Porta padrão do PostgreSQL
})

pool.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err)
        return
    }
    console.log('Postgre conectado')
})

const connectMysql = mysql.createConnection({
    host: '10.0.0.64',
    user: 'adminmoodle',
    password: 'Bibi@adminmoodle2023',
    database: 'moodle'
})

connectMysql.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err)
        return
    }
    console.log('Mysql conectado')
})

const config = {
    host: '10.0.0.91',
    port: 5433,
    user: 'dbadmin',
    password: 'prisma',
    database: 'PRISMA'
}

const connection = vertica.connect(config)

vertica.connect(config, err => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err)
        return
    }
    console.log('Vertica conectado')
})

const client = new Client({
    authStrategy: new LocalAuth(),
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        rejectUnauthorized: false
    } 
})

client.on('qr', qr => {
    qrcode.generate(qr, { small: true })
})

client.on('ready', () => {
    console.log('WhatsApp pronto')
})

let conversasAtivas = {}
const intervaloEntreCodigos = 30 * 1000

// Função para gravar mensagem enviada
async function gravarMensagem(sender, receiver, content) {
    try {
      await connectMysql.promise().execute(
        'INSERT INTO BB_WHATSAPP (REMETENTE, DESTINO, MENSAGEM, DATA_ENVIO) VALUES (?, ?, ?, CURRENT_TIME())',
        [sender, receiver, content]
      );
      console.log('Mensagem enviada gravada no MySQL.');
    } catch (error) {
      console.error('Erro ao gravar mensagem enviada:', error);
    }
}
  

function formatarNome(nomeCompleto) {
    var partesDoNome = nomeCompleto.split(" ")
    var nomeFormatado = ""

    for (var i = 0; i < partesDoNome.length; i++) {
        var parteAtual = partesDoNome[i]
        parteAtual = parteAtual.charAt(0).toUpperCase() + parteAtual.slice(1).toLowerCase()
        nomeFormatado += parteAtual + " "
    }

    nomeFormatado = nomeFormatado.trim()

    return nomeFormatado
}

function verificarNomeCompleto(campo) {
    var texto = campo.trim()
    
    var palavras = texto.split(" ")
    
    if (palavras.length >= 2) {
        return true
    } else {
        return false
    }
}

function formatarDataVertica(data) {
    const dataTexto = String(data)
    return dataTexto.split('-').reverse().join('/')
}

function removerEspeciais(str) {
    const comAcento = "ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÑñÇç"
    const semAcento = "AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOOooooooUUUUuuuuNnCc"
    const regexAcento = /[ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÑñÇç]/g
    str = str.replace(regexAcento, function(match) {
        return semAcento.charAt(comAcento.indexOf(match))
    })
    // eslint-disable-next-line no-useless-escape
    str = str.replace(/['"\\`´^~!@#$%^&*()_+=|<>?{}\[\]\/:.,\-]/g, "")

    return str
}

function isValidDate(dateString) {
    // Verifica se a data está no formato DD/MM/YYYY
    const datePattern = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(\d{4})$/
    if (!datePattern.test(dateString)) {
        return false
    }

    // Separa a data em dia, mês e ano
    const [day, month, year] = dateString.split('/').map(Number)

    // Verifica se o ano é válido (não permitir anos com mais de 4 dígitos)
    if (year < 1000 || year > 9999) {
        return false
    }

    // Verifica o número de dias em cada mês
    const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if (day < 1 || day > daysInMonth[month - 1]) {
        return false
    }

    // Verifica se a data é maior que a data atual
    const inputDate = new Date(year, month - 1, day) // Mês em JavaScript é 0-indexado
    const currentDate = new Date()
    
    // Zerar horas, minutos, segundos e milissegundos para comparar apenas a data
    currentDate.setHours(0, 0, 0, 0)

    if (inputDate > currentDate) {
        return false
    }

    return true
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

function validarEmail(email) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailPattern.test(email)
}


client.on('message', async message => {
    const contact = await message.getContact()
    const contactName = contact.pushname || contact.name || contact.number
    const firstName = contactName.split(' ')[0]
    const recebido = message.body
    const destino = message.from
    const eu = message.to
    const mensagemCancelar = '⛔ Procedimento cancelado\nObrigado por utilizar nossos serviços. Até mais!'

    console.log(`${contactName}:${message.body}`);

    let conversa = conversasAtivas[message.from]

    if (!conversa) {
        conversa = {
            menuEnviado: false,
            estado: null,
            ultimoCodigoGerado: 0,
            cpf: null,
            idConsumidor: null,
            nome: null,
            email: null,
            dataNascimento: null,
            dependentes: [],
            novoDependente: {
                nome: null,
                relacao: null,
                dataNascimento: null
            },
            loja: null
        }
        conversasAtivas[message.from] = conversa
    }

    if (removerEspeciais(recebido.toLowerCase()) === 'menu') {
        let mensagemEnviada = '⚙️ Menu de opções:\n\n🔒 *1*. Código aleatório\n🔓 *2*. Dados do consumidor\n🔒 *3*. Pedido rápido\n🔓 *4*. Sair'
        message.reply(mensagemEnviada)
        conversa.menuEnviado = true
        conversa.estado = null
        return
    } 

    switch (conversa.estado) {
        case 'esperandoCPF':
            {
                if (recebido.toLowerCase()  === 'cancelar' || recebido.toLowerCase() === 'sair') {
                    let mensagemEnviada = mensagemCancelar
                    message.reply(mensagemEnviada)
                    conversa.estado = null
                    conversa.menuEnviado = false
                } else {
                    let cpf = removerEspeciais(recebido.trim())
                    cpf = cpf.replace(/\D/g, '')
            
                    if (cpf.length !== 11) {
                        let mensagemEnviada = '⚠️ CPF inválido. Por favor, digite um CPF válido de 11 dígitos.'
                        message.reply(mensagemEnviada)
                        return
                    }
            
                    const query = `SELECT C.NOME_COMPLETO, C.EMAIL, C.DATA_NASCIMENTO, C.ID_CONSUMIDOR, L.LOJA FROM VRJ_CONSUMIDOR C JOIN AG_VW_BI_VRJ_LOJA L ON L.ID_LOJA = C.LOJA_ULTIMA_COMPRA WHERE C.CPF = '${cpf}'`
            
                    connection.query(query, (err, result) => {
                        if (err) {
                            let mensagemEnviada = '⚠️ Ocorreu um erro ao consultar os dados do consumidor. Por favor, tente novamente mais tarde.'
                            message.reply(mensagemEnviada)
                            console.error(err)
                            return
                        }
            
                        if (!result || result.rows.length === 0) {
                            let mensagemEnviada = '⚠️ Não foram encontrados dados para o CPF fornecido.'
                            message.reply(mensagemEnviada)
                            return
                        }
            
                        result.rows.forEach(row => {
                            conversa.cpf = cpf
                            conversa.nome = formatarNome(row[0])
                            conversa.email = row[1] || ""
                            conversa.dataNascimento = formatarDataVertica(row[2])
                            conversa.idConsumidor = row[3]
                            conversa.loja = formatarNome(row[4])
                        })

                        setTimeout(() => {
                            let mensagemEnviada = `Olá, ${conversa.nome.split(' ')[0]}!\nAqui é da Bibi ${conversa.loja}🧡\n\nFicamos muito felizes com a sua visita!😎\n\nAproveitamos para lembrar que a sua compra gerou um bônus no valor de até *R$ 22,00* para usar aqui na loja.💸\n\nPara que possamos ativar o bônus para a próxima compra, precisamos confirmar alguns dados com você.\n\nVamos começar? (Responda *SIM* ou *NÃO*)\n\nObs.: Prometo que é rapidinho, são somente 3 etapas ☺️`
                            message.reply(mensagemEnviada)
                            conversa.estado = 'confirmarAtualizacao'
                        }, 100)
                    })
        
                }

                break
            }
        case 'confirmarAtualizacao':
            {
                if (recebido.toLowerCase() === 'cancelar' || recebido.toLowerCase() === 'sair') {
                    let mensagemEnviada = mensagemCancelar
                    message.reply(mensagemEnviada)
                    conversa.estado = null
                    conversa.menuEnviado = false
                } else {
                    if (removerEspeciais(recebido.toLowerCase()) === 'sim') {
                        let mensagemEnviada = `Ótimo! Vamos dar uma olhada nos seus dados:🧐\n\n*1* - Nome Completo: ${formatarNome(conversa.nome)}\n*2* - Data de Nascimento: ${conversa.dataNascimento}\n*3* - Endereço de Email: ${conversa.email.toLowerCase()}\n\nSe alguma informação estiver incorreta, informe o número correspondente. Ou então *"OK"* para prosseguir ☺️`
                        message.reply(mensagemEnviada)
                        conversa.estado = 'verificarDados'
                    } else if (removerEspeciais(recebido.toLowerCase()) === 'nao') {
                        let mensagemEnviada = mensagemCancelar
                        message.reply(mensagemEnviada)
                        conversa.estado = null
                        conversa.menuEnviado = false
                    } else {
                        let mensagemEnviada = '⚠️ Resposta inválida. Tente novamente.'
                        message.reply(mensagemEnviada)
                    }
                }
                break
            }
        case 'verificarDados':
            {
                if (recebido.toLowerCase() === 'cancelar' || recebido.toLowerCase() === 'sair') {
                    let mensagemEnviada = mensagemCancelar
                    message.reply(mensagemEnviada)
                    conversa.estado = null
                    conversa.menuEnviado = false
                } else {
                    const campoSelecionado = parseInt(recebido.trim())
                    if (removerEspeciais(recebido.toLowerCase()) === 'ok') {
                        const query = `SELECT CC.DESCRICAO AS NOME, CC.DESC_TIPO_CONTATO AS RELACAO, CC.DATA_NASCIMENTO FROM VRJ_CONSUMIDOR_CONTATO CC WHERE CC.ID_CONSUMIDOR = ${conversa.idConsumidor} ORDER BY CC.ID_CONSUMIDOR_CONTATO`

                        connection.query(query, (err, result) => {
                            if (err) {
                                let mensagemEnviada = '⚠️ Ocorreu um erro ao consultar os dependentes. Por favor, tente novamente mais tarde.'
                                message.reply(mensagemEnviada)
                                console.error(err)
                                return
                            }

                            if (!result || result.rows.length === 0) {
                                let mensagemEnviada = '😕 Não foram encontrados dependentes. Digite *1* para cadastrar um novo dependente ou *"OK"* para continuar.'
                                message.reply(mensagemEnviada)
                                conversa.estado = 'selecionarDependente'
                                return
                            }

                            let resposta = '👼 Selecione ou crie um novo dependente:\n\n*1* - Cadastrar novo dependente\n\n'
                            result.rows.forEach((row, index) => {
                                resposta += `*${index + 2} - ${formatarNome(row[0])}*\n- Relação: ${row[1].toLowerCase()} \n- Data de Nascimento: ${formatarDataVertica(row[2])}\n\n`
                            })
                            let mensagemEnviada = resposta += 'Caso todos estejam corretos digite *"OK"* ☺️'
                            message.reply(mensagemEnviada)

                            conversa.estado = 'selecionarDependente'
                            conversa.dependentes = result.rows
                        }) 
                    } else if ([1, 2, 3].includes(campoSelecionado)) {
                        const campos = ['nome', 'data de nascimento', 'email']
                        conversa.campoParaAtualizar = campos[campoSelecionado - 1]
                        if (conversa.campoParaAtualizar == 'data de nascimento') {
                            let mensagemEnviada = `✏️ Certo, digite a informação correta para *${conversa.campoParaAtualizar}* no formato de exemplo: 24/12/2023`
                            message.reply(mensagemEnviada)
                        } else {
                            let mensagemEnviada = `✏️ Certo, digite a informação correta para *${conversa.campoParaAtualizar}*`
                            message.reply(mensagemEnviada)
                        }
                        conversa.estado = 'atualizarCampo'
                    } else if (removerEspeciais(recebido.toLowerCase()) === 'cancelar' || recebido.toLowerCase() === 'sair') {
                        let mensagemEnviada = mensagemCancelar
                        message.reply(mensagemEnviada)
                        conversa.estado = null
                        conversa.menuEnviado = false
                    } else {
                        let mensagemEnviada = '⚠️ Opção inválida. Informe o *número do campo* desejado ou digite *"OK"*'
                        message.reply(mensagemEnviada)
                    }
                }
                break
            }
        case 'selecionarDependente':
            {
                if (recebido.toLowerCase() === 'cancelar' || recebido.toLowerCase() === 'sair') {
                    let mensagemEnviada = mensagemCancelar
                    message.reply(mensagemEnviada)
                    conversa.estado = null
                    conversa.menuEnviado = false
                } else {
                    const opcaoSelecionada = parseInt(removerEspeciais(recebido.trim()))
                    if (opcaoSelecionada === 1) {
                        let mensagemEnviada = '👼 Informe *nome e sobrenome* do dependente:'
                        message.reply(mensagemEnviada)
                        conversa.estado = 'cadastrarDependente'
                    } else if (opcaoSelecionada > 1 && opcaoSelecionada <= conversa.dependentes.length + 1) {
                        const dependente = conversa.dependentes[opcaoSelecionada - 2]
                        let mensagemEnviada = `👼 Digite o *número do campo* para atualizar ou digite *"OK"*\n\n*1* - Nome: ${formatarNome(dependente[0])}\n*2* - Relação: ${dependente[1].toLowerCase()}\n*3* - Data de nascimento: ${formatarDataVertica(dependente[2])}`
                        message.reply(mensagemEnviada)
                        conversa.estado = 'editarDependente'
                        conversa.dependenteSelecionado = dependente
                    } else if (removerEspeciais(recebido.toLowerCase()) === 'ok') {
                        let mensagemEnviada = `😎 Certo, aqui está um resumo dos seus dados:\n\n*Nome:* ${formatarNome(conversa.nome)}\n*Data de Nascimento:* ${formatarDataVertica(conversa.dataNascimento)}\n*Email:* ${conversa.email.toLowerCase()}\n\n👼 *Dependentes:*\n\n${conversa.dependentes.map((dep) => `*${formatarNome(dep[0])}*\n- Relação: ${dep[1].toLowerCase()}\n- Data de nascimento: ${formatarDataVertica(dep[2])}\n\n`).join('')}Digite *"OK"* para finalizar! 🤩`
                        message.reply(mensagemEnviada)
                        conversa.estado = 'finalizar'
                    } else if (removerEspeciais(recebido.toLowerCase()) === 'cancelar' || recebido.toLowerCase() === 'sair') {
                        let mensagemEnviada = mensagemCancelar
                        message.reply(mensagemEnviada)
                        conversa.estado = null
                        conversa.menuEnviado = false
                    } else {
                        let mensagemEnviada = '⚠️ Opção inválida. Por favor, tente novamente.'
                        message.reply(mensagemEnviada)
                    }
                }
                break
            }
        case 'editarDependente':
            {
                if (recebido.toLowerCase() === 'cancelar' || recebido.toLowerCase() === 'sair') {
                    let mensagemEnviada = mensagemCancelar
                    message.reply(mensagemEnviada)
                    conversa.estado = null
                    conversa.menuEnviado = false
                } else {
                    const campoSelecionado = parseInt(removerEspeciais(recebido.trim()))
                    const campos = ['nome', 'relação', 'data de nascimento']
                    if (campoSelecionado >= 1 && campoSelecionado <= 3) {
                        const campoParaAtualizar = campos[campoSelecionado - 1]
                        
                        if (campoParaAtualizar === 'relação') {
                            const relacoes = ['Filho', 'Neto', 'Sobrinho', 'Outros']
                            let mensagemEnviada = `✏️ Certo, selecione uma das opções para *${campoParaAtualizar}*: \n${relacoes.map((opcao, index) => `*${index + 1}* - ${opcao}`).join('\n')}`
                            message.reply(mensagemEnviada)
                            conversa.estado = 'atualizarDependente'
                            conversa.campoDependenteParaAtualizar = campoParaAtualizar
                        } else {
                            let mensagemEnviada = `✏️ Certo, digite a informação correta para *${campoParaAtualizar}*`
                            message.reply(mensagemEnviada)
                            conversa.estado = 'atualizarDependente'
                            conversa.campoDependenteParaAtualizar = campoParaAtualizar
                        }
                    } else if (removerEspeciais(recebido.toLowerCase()) === 'ok') {
                        let mensagemEnviada = `😎 Certo, aqui está um resumo dos seus dados:\n\n*Nome:* ${formatarNome(conversa.nome)}\n*Data de Nascimento:* ${formatarDataVertica(conversa.dataNascimento)}\n*Email:* ${conversa.email.toLowerCase()}\n\n👼 *Dependentes:*\n\n${conversa.dependentes.map((dep) => `*${formatarNome(dep[0])}*\n- Relação: ${dep[1].toLowerCase()}\n- Data de nascimento: ${formatarDataVertica(dep[2])}\n\n`).join('')}Digite *"OK"* para finalizar! 🤩`
                        message.reply(mensagemEnviada)
                        conversa.estado = 'finalizar'
                    } else if (removerEspeciais(recebido.toLowerCase()) === 'cancelar' || recebido.toLowerCase() === 'sair') {
                        let mensagemEnviada = mensagemCancelar
                        message.reply(mensagemEnviada)
                        conversa.estado = null
                        conversa.menuEnviado = false
                    } else {
                        let mensagemEnviada = '⚠️ Opção inválida. Por favor, tente novamente.'
                        message.reply(mensagemEnviada)
                    }
                }
                break
            }
        case 'atualizarDependente':
            {
                if (recebido.toLowerCase() === 'cancelar' || recebido.toLowerCase() === 'sair') {
                    let mensagemEnviada = mensagemCancelar
                    message.reply(mensagemEnviada)
                    conversa.estado = null
                    conversa.menuEnviado = false
                } else {
                    const valorNovo = recebido.trim()
                    let campoBD
                    let dataNova
                    
                    if (removerEspeciais(recebido.toLowerCase()) === 'cancelar' || recebido.toLowerCase() === 'sair') {
                        let mensagemEnviada = mensagemCancelar
                        message.reply(mensagemEnviada)
                        conversa.estado = null
                        conversa.menuEnviado = false
                    } else {
                        switch (conversa.campoDependenteParaAtualizar) {
                            case 'nome':
                                { campoBD = 'DESCRICAO'
                                // conversa.dependenteSelecionado[0] = valorNovo
                                const updateQuery = `UPDATE VRJ_CONSUMIDOR_CONTATO SET ${campoBD} = '${valorNovo.toUpperCase()}' WHERE ID_CONSUMIDOR = ${conversa.idConsumidor} AND DESCRICAO = '${conversa.dependenteSelecionado[0]}'`

                                connection.query(updateQuery, (err) => {
                                    if (err) {
                                        let mensagemEnviada = '⚠️ Ocorreu um erro ao atualizar os dados do dependente. Por favor, tente novamente mais tarde.'
                                        message.reply(mensagemEnviada)
                                        console.error(err)
                                        return
                                    }
                
                                    connection.query('COMMIT', (err) => {
                                        if (err) {
                                            console.error('Erro ao confirmar a transação:', err)
                                            return
                                        }
                                        console.log(`Atualizado dependente:\n${campoBD} = ${valorNovo.toUpperCase()}`)
                                    })
                                })
                                break }
                            case 'relação':
                                { campoBD = 'DESC_TIPO_CONTATO'
                                const opcao = parseInt(removerEspeciais(valorNovo))
                                const relacoes = ['Filho', 'Neto', 'Sobrinho', 'Outros']

                                if (opcao >= 1 && opcao <= relacoes.length) {
                                    const relacaoSelecionada = relacoes[opcao - 1]
                                    conversa.dependenteSelecionado[1] = relacaoSelecionada
                                    const updateQuery = `UPDATE VRJ_CONSUMIDOR_CONTATO SET ${campoBD} = '${relacaoSelecionada.toUpperCase()}' WHERE ID_CONSUMIDOR = ${conversa.idConsumidor} AND DESCRICAO = '${conversa.dependenteSelecionado[0]}'`
                                
                                    connection.query(updateQuery, (err) => {
                                        if (err) {
                                            let mensagemEnviada = '⚠️ Ocorreu um erro ao atualizar os dados do dependente. Por favor, tente novamente mais tarde.'
                                            message.reply(mensagemEnviada)
                                            console.error(err)
                                            return
                                        }
                    
                                        connection.query('COMMIT', (err) => {
                                            if (err) {
                                                console.error('Erro ao confirmar a transação:', err)
                                                return
                                            }
                                            console.log('Transação confirmada.')
                                        })
                                    })
                                } else {
                                    let mensagemEnviada = '⚠️ Opção inválida'
                                    message.reply(mensagemEnviada)
                                }
                                break }
                            case 'data de nascimento':
                                { campoBD = 'DATA_NASCIMENTO'

                                if (isValidDate(valorNovo)) {
                                    const partesData = valorNovo.split('/').reverse().join('-')
                                    dataNova = partesData
                                    conversa.dependenteSelecionado[2] = dataNova

                                    const updateQuery = `UPDATE VRJ_CONSUMIDOR_CONTATO SET ${campoBD} = '${dataNova}' WHERE ID_CONSUMIDOR = ${conversa.idConsumidor} AND DESCRICAO = '${conversa.dependenteSelecionado[0]}'`
                                
                                    connection.query(updateQuery, (err) => {
                                        if (err) {
                                            let mensagemEnviada = '⚠️ Ocorreu um erro ao atualizar os dados do dependente. Por favor, tente novamente mais tarde.'
                                            message.reply(mensagemEnviada)
                                            console.error(err)
                                            return
                                        }
                    
                                        connection.query('COMMIT', (err) => {
                                            if (err) {
                                                console.error('Erro ao confirmar a transação:', err)
                                                return
                                            }
                                            console.log('Transação confirmada.')
                                        })
                                    })
                                } else {
                                    let mensagemEnviada = '⚠️ Formato de data inválido. Por favor, forneça a data de nascimento no formato correto (exemplo: 01/08/2023).'
                                    message.reply(mensagemEnviada)
                                    return
                                }   
                                
                                break }
                        }
                        const query = `SELECT CC.DESCRICAO AS NOME, CC.DESC_TIPO_CONTATO AS RELACAO, CC.DATA_NASCIMENTO FROM VRJ_CONSUMIDOR_CONTATO CC WHERE CC.ID_CONSUMIDOR = ${conversa.idConsumidor} ORDER BY CC.ID_CONSUMIDOR_CONTATO`

                        connection.query(query, (err, result) => {
                            if (err) {
                                let mensagemEnviada = '⚠️ Ocorreu um erro ao consultar os dependentes. Por favor, tente novamente mais tarde.'
                                message.reply(mensagemEnviada)
                                console.error(err)
                                return
                            }

                            if (!result || result.rows.length === 0) {
                                let mensagemEnviada = '😕 Não foram encontrados dependentes. Digite *1* para cadastrar um novo dependente ou *"OK"* para continuar'
                                message.reply(mensagemEnviada)
                                conversa.estado = 'selecionarDependente'
                                return
                            }

                            let resposta = '👼 Selecione ou crie um novo dependente:\n\n*1* - Cadastrar novo dependente\n\n'
                            result.rows.forEach((row, index) => {
                                resposta += `*${index + 2} - ${formatarNome(row[0])}*\n- Relação: ${row[1].toLowerCase()}\n- Data de nascimento: ${formatarDataVertica(row[2])}\n\n`
                            })
                            
                            let mensagemEnviada = resposta += 'Caso todos estejam corretos digite *"OK"* ☺️'
                            message.reply(mensagemEnviada)

                            conversa.estado = 'selecionarDependente'
                            conversa.dependentes = result.rows
                        })
                    }
                }
                break
            }      
        case 'atualizarCampo':
            {
                if (recebido.toLowerCase() === 'cancelar' || recebido.toLowerCase() === 'sair') {
                    let mensagemEnviada = mensagemCancelar
                    message.reply(mensagemEnviada)
                    conversa.estado = null
                    conversa.menuEnviado = false
                } else {
                    const valorNovo = recebido.trim()
                    let campoBD
                    let valorNovoBD 
                    
                    if (removerEspeciais(recebido.toLowerCase()) === 'cancelar' || recebido.toLowerCase() === 'sair') {
                        let mensagemEnviada = mensagemCancelar
                        message.reply(mensagemEnviada)
                        conversa.estado = null
                        conversa.menuEnviado = false
                    } else {
                        switch (conversa.campoParaAtualizar) {
                            case 'nome':
                                campoBD = 'NOME'
                                conversa.nome = removerEspeciais(valorNovo.toUpperCase())
                                valorNovoBD = valorNovo
                                break
                            case 'data de nascimento':
                                { campoBD = 'DATA_NASCIMENTO'
                                if (isValidDate(valorNovo)) {
                                    const partesData = valorNovo.split('/').reverse().join('-')
                                    valorNovoBD = partesData
                                    conversa.dataNascimento = valorNovoBD 
                                } else {
                                    let mensagemEnviada = '⚠️ Formato de data inválido. Por favor, forneça a data de nascimento no formato correto (exemplo: 01/08/2023).'
                                    message.reply(mensagemEnviada)
                                    return
                                }
                                break }
                            case 'email':
                                campoBD = 'EMAIL'
                                if (validarEmail(valorNovo)) {
                                    valorNovoBD = valorNovo.toUpperCase()
                                    conversa.email = valorNovo
                                } else {
                                    let mensagemEnviada = '⚠️ Email inválido. Por favor, informe um email válido. Exemplo: email@gmail.com'
                                    message.reply(mensagemEnviada)
                                    return
                                }
                                
                                break
                            default:
                                { let mensagemEnviada = '⚠️ Campo inválido. Por favor, informe um campo válido.'
                                message.reply(mensagemEnviada)
                                return }
                        }
                        const queryAtualizar = `UPDATE VRJ_CONSUMIDOR SET ${campoBD} = '${valorNovoBD}' WHERE ID_CONSUMIDOR = ${conversa.idConsumidor}`
            
                        connection.query(queryAtualizar, (err) => {
                            if (err) {
                                let mensagemEnviada = '⚠️ Ocorreu um erro ao atualizar os dados do consumidor. Por favor, tente novamente mais tarde.'
                                message.reply(mensagemEnviada)
                                console.error(err)
                                return
                            }

                            connection.query('COMMIT', (err) => {
                                if (err) {
                                    console.error('Erro ao confirmar a transação:', err)
                                    return
                                }
                                console.log('Transação confirmada.')
                            })
                            let mensagemEnviada = `😎 Aqui estão seus dados atualizados:\n\n*1* - Nome: ${formatarNome(conversa.nome)}\n*2* - Data de Nascimento: ${formatarDataVertica(conversa.dataNascimento)}\n*3* - Email: ${conversa.email.toLowerCase()}\n\nDigite o *número do campo* para atualizar ou digite *"OK"* ☺️`
                            message.reply(mensagemEnviada)
                            conversa.estado = 'verificarDados'
                        })
                    }
                }
                break
            }
        case 'cadastrarDependente':
            {
                if (recebido.toLowerCase() === 'cancelar' || recebido.toLowerCase() === 'sair') {
                    let mensagemEnviada = mensagemCancelar
                    message.reply(mensagemEnviada)
                    conversa.estado = null
                    conversa.menuEnviado = false
                } else {
                    if (!conversa.novoDependente.nome) {
                        if (removerEspeciais(recebido.toLowerCase()) === 'cancelar' || recebido.toLowerCase() === 'sair') {
                            let mensagemEnviada = mensagemCancelar
                            message.reply(mensagemEnviada)
                            conversa.estado = null
                            conversa.menuEnviado = false
                        }else if (verificarNomeCompleto(removerEspeciais(recebido.trim()))){
                            conversa.novoDependente.nome = removerEspeciais(recebido.trim())
                            const relacoes = ['Filho', 'Neto', 'Sobrinho', 'Outros']
                            let mensagemEnviada = `✏️ Informe a *relação*:\n\n${relacoes.map((opcao, index) => `*${index + 1}* - ${opcao}`).join('\n')}`
                            message.reply(mensagemEnviada)
                        } else {
                            let mensagemEnviada = '⚠️ Por favor, informe *nome e sobrenome*'
                            message.reply(mensagemEnviada)
                        }
                    } else if (!conversa.novoDependente.relacao) {
                        if (removerEspeciais(recebido.toLowerCase()) === 'cancelar' || recebido.toLowerCase() === 'sair') {
                            let mensagemEnviada = mensagemCancelar
                            message.reply(mensagemEnviada)
                            conversa.estado = null
                            conversa.menuEnviado = false
                        } else if (parseInt(removerEspeciais(recebido.trim())) >= 1 && parseInt(removerEspeciais(recebido.trim())) <= 4) {
                            const opcao = parseInt(removerEspeciais(recebido.trim()))
                            const relacoes = ['Filho', 'Neto', 'Sobrinho', 'Outros']
                            const relacaoSelecionada = relacoes[opcao - 1]
                            conversa.novoDependente.relacao = relacaoSelecionada
                            let mensagemEnviada = '✏️ Informe a *data de nascimento* do dependente (exemplo: 01/08/2023).'
                            message.reply(mensagemEnviada)
                        } else {
                            let mensagemEnviada = 'Opção inválida!'
                            message.reply(mensagemEnviada)
                        }
                    } else if (!conversa.novoDependente.dataNascimento) {
                        if (recebido.toLowerCase() === 'cancelar' || recebido.toLowerCase() === 'sair') {
                            let mensagemEnviada = mensagemCancelar
                            message.reply(mensagemEnviada)
                            conversa.estado = null
                            conversa.menuEnviado = false
                        } else {
                            if (isValidDate(recebido.trim())){
                                const dataNascimento = recebido.trim()
                                const partesData = dataNascimento.split('/').reverse().join('-')
                                conversa.novoDependente.dataNascimento = partesData
                                const queryAdicionarDependente = `INSERT INTO VRJ_CONSUMIDOR_CONTATO (ID_CONSUMIDOR, DESCRICAO, DESC_TIPO_CONTATO, DATA_NASCIMENTO, ID_CONSUMIDOR_CONTATO, ID_TIPO_CONTATO, USUARIO_CADASTRO, DATA_CADASTRO) VALUES (${conversa.idConsumidor}, '${conversa.novoDependente.nome.toUpperCase()}', '${conversa.novoDependente.relacao.toUpperCase()}', '${conversa.novoDependente.dataNascimento}', SQ_VRJ_CONSUMIDOR_CONTATO.NEXTVAL, 2, 'BOT', SYSDATE)`
                                connection.query(queryAdicionarDependente, (err) => {
                                    if (err) { 
                                        let mensagemEnviada = '⚠️ Ocorreu um erro ao cadastrar o dependente. Por favor, tente novamente mais tarde.'
                                        message.reply(mensagemEnviada)
                                        console.error(err) 
                                        return
                                    }
                                    connection.query('COMMIT', (err) => {
                                        if (err) {
                                            console.error('Erro ao confirmar a transação:', err)
                                            return
                                        }
                                        console.log('Transação confirmada.')
                                    })
                                    // message.reply(`👼 Dependente cadastrado com sucesso:\n\n*Nome:* ${conversa.novoDependente.nome}\n*Relação:* ${conversa.novoDependente.relacao.toLowerCase()}\n*Data de Nascimento:* ${formatarDataVertica(conversa.novoDependente.dataNascimento)}`)
                                    conversa.dependentes.push(conversa.novoDependente)
                                    conversa.novoDependente = { nome: null, relacao: null, dataNascimento: null }
                                })
                                const query = `SELECT CC.DESCRICAO AS NOME, CC.DESC_TIPO_CONTATO AS RELACAO, CC.DATA_NASCIMENTO FROM VRJ_CONSUMIDOR_CONTATO CC WHERE CC.ID_CONSUMIDOR = ${conversa.idConsumidor}`
        
                                connection.query(query, (err, result) => {
                                    if (err) {
                                        let mensagemEnviada = '⚠️ Ocorreu um erro ao consultar os dependentes. Por favor, tente novamente mais tarde.'
                                        message.reply(mensagemEnviada)
                                        console.error(err)
                                        return
                                    }
        
                                    if (!result || result.rows.length === 0) {
                                        let mensagemEnviada = '😕 Não foram encontrados dependentes. Digite *1* para cadastrar um novo dependente ou *"OK"* para continuar'
                                        message.reply(mensagemEnviada)
                                        return
                                    }
        
                                    let resposta = '👼 Selecione ou crie um novo dependente:\n\n*1* - Cadastrar novo dependente\n\n'
                                    result.rows.forEach((row, index) => {
                                        resposta += `*${index + 2} - ${formatarNome(row[0])}*\n- Relação: ${row[1].toLowerCase()} \n- Data de Nascimento: ${formatarDataVertica(row[2])}\n\n`
                                    })
                                    let mensagemEnviada = resposta += 'Caso todos estejam corretos digite *"OK"* ☺️'
                                    message.reply(mensagemEnviada)
        
                                    conversa.estado = 'selecionarDependente'
                                    conversa.dependentes = result.rows
                                })
                            } else {
                                let mensagemEnviada = '⚠️ Formato de data inválido. Por favor, forneça a data de nascimento no formato correto (exemplo: 01/08/2023).'
                                message.reply(mensagemEnviada)
                            }
                        }
                    } else {
                        let mensagemEnviada = '⚠️ Opção inválida'
                        message.reply(mensagemEnviada)
                    }
                }
                break
            }
        case 'finalizar':
            {
                const gifPath = './public/comemoracao.png'
                const gifBuffer = fs.readFileSync(gifPath)
                const mediaMessage = new MessageMedia('image/png', gifBuffer.toString('base64'), 'png.png')
                const caption = `Parabéns! O seu bônus de até R$ 22,00 está *ATIVO* 🥳\n\nSeu saldo é válido dentro de 90 dias, aproveite! 🤩`
                await client.sendMessage(message.from, mediaMessage, { caption, sendMediaAsSticker: false })
                conversa.estado = null
                conversa.menuEnviado = false
                let mensagemEnviada = caption
                break
            }
        default: 
        if (!conversa.menuEnviado) {
            let mensagemEnviada = `Olá ${firstName} ☺️\nBem-vindo ao ambiente de testes da TD!🤟\nDigite *MENU* para ver as opções disponíveis 😎`
            message.reply(mensagemEnviada)
          } else {
            const opcao = parseInt(recebido.trim())
            switch (opcao) {
              case 1:
                { const agora = Date.now()
                if (agora - conversa.ultimoCodigoGerado < intervaloEntreCodigos) {
                  const tempoRestante = Math.ceil((intervaloEntreCodigos - (agora - conversa.ultimoCodigoGerado)) / 1000)
                  message.reply(`Por favor, aguarde ${tempoRestante} segundos antes de gerar um novo código.`)
                  return
                }
    
                const codigo = speakeasy.generateSecret({ length: 10 }).base32
                conversa.ultimoCodigoGerado = agora
                message.reply(`> Seu código aleatório é: ${codigo}`)
                break }
              case 2:
                { let mensagemEnviada = '✍️ Por favor, digite seu CPF:'
                message.reply(mensagemEnviada)
                conversa.estado = 'esperandoCPF'
                break }
              case 3:
                message.reply('> Disponível em breve 🙌')
                break
              case 4:
                { let mensagemEnviada = '🙌 Obrigado por utilizar nossos serviços. Até mais!'
                message.reply(mensagemEnviada)
                conversa.estado = null
                conversa.menuEnviado = false
                break }
              default:
                { let mensagemEnviada = '⚠️ Opção inválida. Digite "menu" para ver as opções disponíveis.'
                message.reply(mensagemEnviada)
                break }
            }
          }
          break
    }
})

client.on('message_create', (msg) => {
    if (msg.fromMe) {
        console.log(`Eu: ${msg.body}`);
    }
});

client.initialize()