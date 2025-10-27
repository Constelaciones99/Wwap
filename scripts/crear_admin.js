const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function crearAdmin() {
    try {
        console.log('🔐 Creando usuario admin...\n');

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'whatsapp_masivo'
        });

        // Generar hash de la contraseña
        const password = 'admin123';
        const hash = bcrypt.hashSync(password, 10);
        
        console.log('Hash generado para "admin123":', hash.substring(0, 20) + '...\n');

        // Intentar insertar o actualizar
        try {
            await connection.execute(
                'DELETE FROM usuarios WHERE username = ?',
                ['admin']
            );
            console.log('✓ Usuario anterior eliminado (si existía)');
        } catch (e) {
            // No importa si no existía
        }

        await connection.execute(
            `INSERT INTO usuarios (username, password, nombre_completo, email, rol, activo) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['admin', hash, 'Administrador', 'admin@sistema.com', 'admin', 1]
        );

        console.log('✅ Usuario admin creado correctamente\n');
        console.log('Credenciales:');
        console.log('   Usuario: admin');
        console.log('   Password: admin123\n');

        // Verificar
        const [users] = await connection.execute(
            'SELECT id, username, rol, activo FROM usuarios WHERE username = ?',
            ['admin']
        );

        if (users.length > 0) {
            console.log('✓ Verificado en base de datos:');
            console.log('   ID:', users[0].id);
            console.log('   Username:', users[0].username);
            console.log('   Rol:', users[0].rol);
            console.log('   Activo:', users[0].activo ? 'Sí' : 'No');
        }

        await connection.end();
        console.log('\n🎉 ¡Listo! Ahora intenta hacer login\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

crearAdmin();

