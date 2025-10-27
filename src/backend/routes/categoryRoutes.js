const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database');
const { verifyToken } = require('../middleware/auth');

// Obtener categorías del usuario
router.get('/', verifyToken, async (req, res) => {
    try {
        const [categories] = await pool.execute(
            `SELECT c.*, d.nombre_dispositivo, d.estado as dispositivo_estado,
             (SELECT COUNT(*) FROM contactos WHERE categoria_id = c.id) as total_contactos
             FROM categorias c
             LEFT JOIN dispositivos d ON c.dispositivo_id = d.id
             WHERE c.usuario_id = ?
             ORDER BY c.fecha_creacion DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            categories
        });

    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        res.status(500).json({
            error: true,
            message: 'Error al obtener categorías'
        });
    }
});

// Crear categoría
router.post('/', verifyToken, async (req, res) => {
    try {
        const { nombre, descripcion, color, dispositivo_id } = req.body;

        if (!nombre) {
            return res.status(400).json({
                error: true,
                message: 'El nombre es requerido'
            });
        }

        const [result] = await pool.execute(
            'INSERT INTO categorias (usuario_id, dispositivo_id, nombre, descripcion, color) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, dispositivo_id || null, nombre, descripcion || null, color || '#007bff']
        );

        res.json({
            success: true,
            category: {
                id: result.insertId,
                nombre,
                descripcion,
                color,
                dispositivo_id
            }
        });

    } catch (error) {
        console.error('Error creando categoría:', error);
        res.status(500).json({
            error: true,
            message: 'Error al crear categoría'
        });
    }
});

// Actualizar categoría
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { nombre, descripcion, color, dispositivo_id } = req.body;

        // Verificar que la categoría pertenece al usuario
        const [categories] = await pool.execute(
            'SELECT * FROM categorias WHERE id = ? AND usuario_id = ?',
            [categoryId, req.user.id]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Categoría no encontrada'
            });
        }

        await pool.execute(
            'UPDATE categorias SET nombre = ?, descripcion = ?, color = ?, dispositivo_id = ? WHERE id = ?',
            [nombre, descripcion, color, dispositivo_id || null, categoryId]
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

// Eliminar categoría
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const categoryId = req.params.id;

        // Verificar que la categoría pertenece al usuario
        const [categories] = await pool.execute(
            'SELECT * FROM categorias WHERE id = ? AND usuario_id = ?',
            [categoryId, req.user.id]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                error: true,
                message: 'Categoría no encontrada'
            });
        }

        // Los contactos asociados quedarán sin categoría (ON DELETE SET NULL)
        await pool.execute(
            'DELETE FROM categorias WHERE id = ?',
            [categoryId]
        );

        res.json({
            success: true,
            message: 'Categoría eliminada correctamente'
        });

    } catch (error) {
        console.error('Error eliminando categoría:', error);
        res.status(500).json({
            error: true,
            message: 'Error al eliminar categoría'
        });
    }
});

module.exports = router;

