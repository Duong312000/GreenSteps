const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbUri = process.env.DATABASE_URL;
if (!dbUri) {
  console.error('DATABASE_URL is not set in .env file!');
  process.exit(1);
}

const sequelize = new Sequelize(dbUri, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

module.exports = { sequelize };
