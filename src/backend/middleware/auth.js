const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');

// Middleware para verificar JWT
async function verifyToken(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                error: true,
                message: 'Token no proporcionado'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
        
        // Verificar si el usuario existe y está activo
        const [users] = await pool.execute(
            'SELECT id, username, nombre_completo, email, rol FROM usuarios WHERE id = ? AND activo = TRUE',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                error: true,
                message: 'Usuario no válido o inactivo'
            });
        }

        req.user = users[0];
        next();
    } catch (error) {
        console.error('Error en verificación de token:', error);
        return res.status(401).json({
            error: true,
            message: 'Token inválido o expirado'
        });
    }
}

// Middleware para verificar rol de administrador
function requireAdmin(req, res, next) {
    if (req.user && req.user.rol === 'admin') {
        next();
    } else {
        res.status(403).json({
            error: true,
            message: 'Acceso denegado. Se requieren permisos de administrador'
        });
    }
}

module.exports = { verifyToken, requireAdmin };

