/**
 * Script para generar hash de contraseñas
 * Uso: node scripts/hash_password.js mi_password
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
    console.error('❌ Uso: node scripts/hash_password.js <password>');
    process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

console.log('\n✅ Hash generado:\n');
console.log(hash);
console.log('\nPuedes usar este hash en la base de datos MySQL.');
console.log('Ejemplo SQL:');
console.log(`UPDATE usuarios SET password = '${hash}' WHERE username = 'admin';\n`);

