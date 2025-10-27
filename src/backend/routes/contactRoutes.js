const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database');
const { verifyToken } = require('../middleware/auth');

// Obtener contactos del usuario
router.get('/', verifyToken, async (req, res) => {
    try {
        const { categoria_id } = req.query;

        let query = `SELECT c.*, cat.nombre as categoria_nombre 
                     FROM contactos c
                     LEFT JOIN categorias cat ON c.categoria_id = cat.id
                     WHERE c.usuario_id = ?`;
        const params = [req.user.id];

        if (categoria_id) {
            query += ' AND c.categoria_id = ?';
            params.push(categoria_id);
        }

        query += ' ORDER BY c.fecha_agregado DESC';

        const [contacts] = await pool.execute(query, params);

        res.json({
            success: true,
            contacts
        });

    } catch (error) {
        console.error('Error obteniendo contactos:', error);
        res.status(500).json({
            error: true,
            message: 'Error al obtener contactos'
        });
    }
});

// Crear contacto individual
router.post('/', verifyToken, async (req, res) => {
    try {
        const { nombre, telefono, categoria_id } = req.body;

        if (!telefono) {
            return res.status(400).json({
                error: true,
                message: 'El teléfono es requerido'
            });
        }

        const [result] = await pool.execute(
            'INSERT INTO contactos (usuario_id, categoria_id, nombre, telefono, estado) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, categoria_id || null, nombre || null, telefono, 'pendiente']
        );

        res.json({
            success: true,
            contact: {
                id: result.insertId,
                nombre,
                telefono,
                categoria_id
            }
        });

    } catch (error) {
        console.error('Error creando contacto:', error);
        res.status(500).json({
            error: true,
            message: 'Error al crear contacto'
        });
    }
});

// Actualizar categoría de contacto
router.patch('/:id/categoria', verifyToken, async (req, res) => {
    try {
        const contactId = req.params.id;
        const { categoria_id } = req.body;

        // Verificar que el contacto pertenece al usuario
        const [contacts] = await pool.execute(
            'SELECT * FROM contactos WHERE id = ? AND usuario_id = ?',
            [contactId, req.user.id]
        );

        if (contacts.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Contacto no encontrado'
            });
        }

        // Actualizar categoría
        await pool.execute(
            'UPDATE contactos SET categoria_id = ? WHERE id = ?',
            [categoria_id || null, contactId]
        );

        res.json({
            success: true,
            message: 'Categoría actualizada correctamente'
        });

    } catch (error) {
        console.error('Error actualizando categoría:', error);
        res.status(500).json({
            error: true,
            message: 'Error al actualizar categoría'
        });
    }
});

// Eliminar contacto
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const contactId = req.params.id;

        // Verificar que el contacto pertenece al usuario
        const [contacts] = await pool.execute(
            'SELECT * FROM contactos WHERE id = ? AND usuario_id = ?',
            [contactId, req.user.id]
        );

        if (contacts.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Contacto no encontrado'
            });
        }

        // Eliminar contacto
        await pool.execute(
            'DELETE FROM contactos WHERE id = ?',
            [contactId]
        );

        res.json({
            success: true,
            message: 'Contacto eliminado correctamente'
        });

    } catch (error) {
        console.error('Error eliminando contacto:', error);
        res.status(500).json({
            error: true,
            message: 'Error al eliminar contacto'
        });
    }
});

module.exports = router;

