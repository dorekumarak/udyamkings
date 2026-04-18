require('dotenv').config();
const path = require('path');

module.exports = {
  development: {
    username: null,
    password: null,
    database: null,
    host: null,
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: console.log
  },
  test: {
    username: null,
    password: null,
    database: null,
    host: null,
    dialect: 'sqlite',
    storage: path.join(__dirname, '../test-database.sqlite'),
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
