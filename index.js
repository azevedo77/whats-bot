const CoreFactory = require("./src/factories/NucleoFactory.js");

try {
  CoreFactory.Iniciar();
} catch (error) {
  console.error(error);
}
