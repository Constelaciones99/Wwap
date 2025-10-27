/**
 * Script para inicializar/verificar la base de datos
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
    let connection;
    
    try {
        console.log('🔍 Conectando a MySQL...\n');

        // Conectar sin especificar base de datos
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true
        });

        console.log('✅ Conectado a MySQL\n');

        // Leer y ejecutar el schema
        console.log('📄 Leyendo schema SQL...');
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('⚙️  Ejecutando script SQL...\n');
        await connection.query(schema);

        console.log('✅ Base de datos creada correctamente\n');

        // Verificar tablas
        await connection.query(`USE ${process.env.DB_NAME || 'whatsapp_masivo'}`);
        const [tables] = await connection.query('SHOW TABLES');

        console.log('📊 Tablas creadas:');
        tables.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`   ${index + 1}. ${tableName}`);
        });

        console.log('\n🎉 ¡Base de datos lista para usar!\n');
        console.log('Credenciales por defecto:');
        console.log('   Usuario: admin');
        console.log('   Password: admin123\n');

        await connection.end();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n⚠️  Error de autenticación:');
            console.error('   Verifica DB_USER y DB_PASSWORD en el archivo .env\n');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('\n⚠️  No se puede conectar a MySQL:');
            console.error('   ¿Está MySQL corriendo?\n');
        }

        if (connection) {
            await connection.end();
        }
        process.exit(1);
    }
}

initDatabase();

