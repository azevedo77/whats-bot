require('dotenv').config();

module.exports = {
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST_P,
      user: process.env.DB_USER_P,
      password: process.env.DB_PASSWORD_P,
      database: process.env.DB_DATABASE_P,
    },
  },
};
