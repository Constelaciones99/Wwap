const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database');
const { verifyToken } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: true,
                message: 'Usuario y contraseña son requeridos'
            });
        }

        // Buscar usuario
        const [users] = await pool.execute(
            'SELECT * FROM usuarios WHERE username = ? AND activo = TRUE',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                error: true,
                message: 'Credenciales inválidas'
            });
        }

        const user = users[0];

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({
                error: true,
                message: 'Credenciales inválidas'
            });
        }

        // Actualizar última conexión
        await pool.execute(
            'UPDATE usuarios SET ultima_conexion = NOW() WHERE id = ?',
            [user.id]
        );

        // Generar token JWT
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username,
                rol: user.rol
            },
            process.env.JWT_SECRET || 'secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                nombre_completo: user.nombre_completo,
                email: user.email,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            error: true,
            message: 'Error al iniciar sesión'
        });
    }
});

// Verificar token
router.get('/verify', verifyToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// Logout
router.post('/logout', verifyToken, (req, res) => {
    res.json({
        success: true,
        message: 'Sesión cerrada correctamente'
    });
});

module.exports = router;

