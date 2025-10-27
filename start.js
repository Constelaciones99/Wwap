/**
 * Script de inicio con manejo de errores
 */

console.log('🚀 Iniciando Sistema de WhatsApp Masivo...\n');

// Verificar que existe .env
const fs = require('fs');
if (!fs.existsSync('.env')) {
    console.error('❌ No se encontró el archivo .env');
    console.error('   Crea el archivo .env basado en .env.example\n');
    process.exit(1);
}

console.log('✅ Archivo .env encontrado');

// Cargar variables de entorno
require('dotenv').config();

console.log('✅ Variables de entorno cargadas');
console.log(`   Puerto: ${process.env.PORT || 3000}`);
console.log(`   Base de datos: ${process.env.DB_NAME}\n`);

// Iniciar servidor
try {
    require('./src/backend/server');
} catch (error) {
    console.error('\n❌ Error al iniciar servidor:');
    console.error(error);
    process.exit(1);
}

