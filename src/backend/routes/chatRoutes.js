const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database');
const { verifyToken } = require('../middleware/auth');

// Obtener chats del usuario
router.get('/', verifyToken, async (req, res) => {
    try {
        const { categoria_id, dispositivo_id } = req.query;

        let query = `SELECT ch.*, c.nombre, c.telefono, cat.nombre as categoria_nombre
                     FROM chats ch
                     JOIN contactos c ON ch.contacto_id = c.id
                     LEFT JOIN categorias cat ON c.categoria_id = cat.id
                     WHERE ch.usuario_id = ?`;
        const params = [req.user.id];

        if (categoria_id) {
            query += ' AND c.categoria_id = ?';
            params.push(categoria_id);
        }

        if (dispositivo_id) {
            query += ' AND ch.dispositivo_id = ?';
            params.push(dispositivo_id);
        }

        query += ' ORDER BY ch.fecha_ultimo_mensaje DESC';

        const [chats] = await pool.execute(query, params);

        res.json({
            success: true,
            chats
        });

    } catch (error) {
        console.error('Error obteniendo chats:', error);
        res.status(500).json({
            error: true,
            message: 'Error al obtener chats'
        });
    }
});

// Obtener mensajes de un chat
router.get('/:chatId/messages', verifyToken, async (req, res) => {
    try {
        const chatId = req.params.chatId;

        // Verificar que el chat pertenece al usuario
        const [chats] = await pool.execute(
            'SELECT * FROM chats WHERE id = ? AND usuario_id = ?',
            [chatId, req.user.id]
        );

        if (chats.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Chat no encontrado'
            });
        }

        // Aquí podrías obtener mensajes de WhatsApp usando whatsappService
        // Por ahora devolvemos estructura básica

        res.json({
            success: true,
            chat: chats[0],
            messages: []
        });

    } catch (error) {
        console.error('Error obteniendo mensajes:', error);
        res.status(500).json({
            error: true,
            message: 'Error al obtener mensajes'
        });
    }
});

module.exports = router;

