//Brings in environment info
require('dotenv').config();

//exports migrationsDirectory, driver, and connectionString to use in other files
module.exports = {
    "migrationsDirectory": "migrations",
    "driver": "pg",
    "connectionString": (process.env.NODE_ENV === 'test')
        ? process.env.TEST_DB_URL
        : process.env.DB_URL
}

