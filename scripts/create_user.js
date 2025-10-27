/**
 * Script para crear usuarios desde línea de comandos
 * Uso: node scripts/create_user.js
 */

const bcrypt = require('bcryptjs');
const readline = require('readline');
const mysql = require('mysql2/promise');
require('dotenv').config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createUser() {
    try {
        console.log('\n=== Crear Nuevo Usuario ===\n');

        const username = await question('Username: ');
        const password = await question('Password: ');
        const nombre_completo = await question('Nombre completo: ');
        const email = await question('Email: ');
        const rol = await question('Rol (admin/operador): ');

        if (!username || !password) {
            console.error('❌ Username y password son requeridos');
            rl.close();
            return;
        }

        // Hash password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Conectar a BD
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'whatsapp_masivo'
        });

        // Insertar usuario
        const [result] = await connection.execute(
            'INSERT INTO usuarios (username, password, nombre_completo, email, rol) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, nombre_completo, email, rol || 'operador']
        );

        console.log('\n✅ Usuario creado correctamente!');
        console.log(`ID: ${result.insertId}`);
        console.log(`Username: ${username}`);
        console.log(`Rol: ${rol || 'operador'}\n`);

        await connection.end();
        rl.close();

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        rl.close();
    }
}

createUser();

