const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'whatsapp_masivo',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// Verificar conexión
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✓ Conexión MySQL establecida correctamente');
        connection.release();
        return true;
    } catch (error) {
        console.error('✗ Error al conectar con MySQL:', error.message);
        return false;
    }
}

module.exports = { pool, testConnection };

