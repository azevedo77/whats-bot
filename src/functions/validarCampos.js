function verificarNomeCompleto(campo) {
  let texto = campo.trim();
  let palavras = texto.split(" ");

  if (palavras.length >= 2) {
    return true;
  } else {
    return false;
  }
}

function isValidDate(dateString) {
  const datePattern = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(\d{4})$/;
  if (!datePattern.test(dateString)) {
    return false;
  }
  const [day, month, year] = dateString.split("/").map(Number);

  if (year < 1000 || year > 9999) {
    return false;
  }

  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  if (day < 1 || day > daysInMonth[month - 1]) {
    return false;
  }

  const inputDate = new Date(year, month - 1, day); // Mês em JavaScript é 0-indexado
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  if (inputDate > currentDate) {
    return false;
  }

  return true;
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function validarEmail(email) {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
}

module.exports = {
    verificarNomeCompleto,
    isValidDate,
    validarEmail
}
