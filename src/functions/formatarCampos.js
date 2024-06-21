function formatarNome(nomeCompleto) {
  let partesDoNome = nomeCompleto.split(" ");
  let nomeFormatado = "";

  for (let i = 0; i < partesDoNome.length; i++) {
    let parteAtual = partesDoNome[i];
    parteAtual =
      parteAtual.charAt(0).toUpperCase() + parteAtual.slice(1).toLowerCase();
    nomeFormatado += parteAtual + " ";
  }

  nomeFormatado = nomeFormatado.trim();

  return nomeFormatado;
}

function formatarData(dataIso) {
  const data = new Date(dataIso);
  const dia = String(data.getUTCDate()).padStart(2, '0');
  const mes = String(data.getUTCMonth() + 1).padStart(2, '0'); // Janeiro é 0
  const ano = data.getUTCFullYear();

  return `${dia}/${mes}/${ano}`;
}

function extrairNumeros(response) {
  var campo = response
  var numeros = campo.replace(/\D/g, '');
  return numeros;
}

function removerEspeciais(str) {
  const comAcento = "ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÑñÇç";
  const semAcento = "AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOOooooooUUUUuuuuNnCc";
  const regexAcento = /[ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖØòóôõöøÙÚÛÜùúûüÑñÇç]/g;
  str = str.replace(regexAcento, function (match) {
    return semAcento.charAt(comAcento.indexOf(match));
  });
  str = str.replace(/['"\\`´^~!@#$%^&*()_+=|<>?{}\[\]\/:.,\-]/g, "");

  return str;
}

function getFirstName(fullName) {
  if (typeof fullName !== 'string' || fullName.trim() === '') {
    return '';
  }

  const firstName = fullName.trim().split(' ')[0];
  return firstName;
}

function minusculo(msg) {
  const min = msg.toLowerCase()
  return min;
}


module.exports = {
  formatarNome,
  formatarData,
  removerEspeciais,
  getFirstName,
  minusculo,
  extrairNumeros,
};
