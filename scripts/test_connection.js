/**
 * Script para verificar conexiones a MySQL y Redis
 * Uso: node scripts/test_connection.js
 */

const mysql = require('mysql2/promise');
const redis = require('redis');
require('dotenv').config();

async function testMySQL() {
    try {
        console.log('🔍 Probando conexión MySQL...');
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'whatsapp_masivo',
            port: process.env.DB_PORT || 3306
        });

        await connection.execute('SELECT 1');
        console.log('✅ MySQL: Conexión exitosa\n');
        
        await connection.end();
        return true;
    } catch (error) {
        console.error('❌ MySQL: Error de conexión');
        console.error('   Mensaje:', error.message);
        console.error('   Verifica tu archivo .env\n');
        return false;
    }
}

async function testRedis() {
    try {
        console.log('🔍 Probando conexión Redis...');
        
        const client = redis.createClient({
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379
            },
            password: process.env.REDIS_PASSWORD || undefined
        });

        await client.connect();
        await client.ping();
        
        console.log('✅ Redis: Conexión exitosa\n');
        
        await client.quit();
        return true;
    } catch (error) {
        console.error('❌ Redis: Error de conexión');
        console.error('   Mensaje:', error.message);
        console.error('   ¿Redis está ejecutándose? Ejecuta: redis-server\n');
        return false;
    }
}

async function runTests() {
    console.log('\n=== Test de Conexiones ===\n');
    
    const mysqlOk = await testMySQL();
    const redisOk = await testRedis();

    console.log('=== Resumen ===');
    console.log(`MySQL: ${mysqlOk ? '✅' : '❌'}`);
    console.log(`Redis: ${redisOk ? '✅' : '❌'}`);
    
    if (mysqlOk && redisOk) {
        console.log('\n🎉 ¡Todas las conexiones funcionan correctamente!\n');
    } else {
        console.log('\n⚠️  Hay problemas con las conexiones. Revisa la configuración.\n');
    }

    process.exit(mysqlOk && redisOk ? 0 : 1);
}

runTests();

