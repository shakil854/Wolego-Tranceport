import Sequelize from "sequelize";
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

// Initialize Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,    // Database name
  process.env.DB_USER,    // Database username
  process.env.DB_PASSWORD, // Database password
  {
    host: process.env.DB_HOST || 'localhost', // Database host
    dialect: 'mysql',                         // Dialect for MySQL
    port: process.env.DB_PORT || 3306,        // Database port
    logging: false,                           // Disable SQL query logging
    timezone: '+05:30',  // Set timezone to Asia/Kolkata (IST)
    dialectOptions: {
      timezone: 'local',  // Ensures MySQL stores timestamps in local time
    },
    pool: {
      max: 5,  // Maximum number of connections in pool
      min: 0,  // Minimum number of connections in pool
      acquire: 30000, // Maximum time (ms) to acquire a connection
      idle: 10000     // Maximum time (ms) a connection can be idle
    },
  }
);

sequelize
.authenticate()
.then(() => console.log('Database connected successfully'))
.catch((err) => console.error('Unable to connect to the database:', err));

export default sequelize;
