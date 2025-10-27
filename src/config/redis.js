const redis = require('redis');
require('dotenv').config();

// Cliente Redis
const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    },
    password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('error', (err) => {
    console.error('✗ Error en Redis:', err);
});

redisClient.on('connect', () => {
    console.log('✓ Conectado a Redis');
});

// Conectar Redis
async function connectRedis() {
    try {
        await redisClient.connect();
        return true;
    } catch (error) {
        console.error('✗ Error al conectar con Redis:', error.message);
        return false;
    }
}

// Funciones helper para Redis
const redisHelper = {
    // Guardar sesión de WhatsApp
    async saveSession(sessionId, data) {
        try {
            await redisClient.set(`session:${sessionId}`, JSON.stringify(data), {
                EX: 86400 // 24 horas
            });
            return true;
        } catch (error) {
            console.error('Error guardando sesión:', error);
            return false;
        }
    },

    // Obtener sesión
    async getSession(sessionId) {
        try {
            const data = await redisClient.get(`session:${sessionId}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error obteniendo sesión:', error);
            return null;
        }
    },

    // Eliminar sesión
    async deleteSession(sessionId) {
        try {
            await redisClient.del(`session:${sessionId}`);
            return true;
        } catch (error) {
            console.error('Error eliminando sesión:', error);
            return false;
        }
    },

    // Agregar mensaje a cola
    async addToQueue(queueName, message) {
        try {
            await redisClient.rPush(`queue:${queueName}`, JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('Error agregando a cola:', error);
            return false;
        }
    },

    // Obtener mensaje de cola
    async getFromQueue(queueName) {
        try {
            const message = await redisClient.lPop(`queue:${queueName}`);
            return message ? JSON.parse(message) : null;
        } catch (error) {
            console.error('Error obteniendo de cola:', error);
            return null;
        }
    },

    // Obtener tamaño de cola
    async getQueueSize(queueName) {
        try {
            return await redisClient.lLen(`queue:${queueName}`);
        } catch (error) {
            console.error('Error obteniendo tamaño de cola:', error);
            return 0;
        }
    },

    // Cache genérico
    async setCache(key, value, ttl = 3600) {
        try {
            await redisClient.set(`cache:${key}`, JSON.stringify(value), {
                EX: ttl
            });
            return true;
        } catch (error) {
            console.error('Error en setCache:', error);
            return false;
        }
    },

    async getCache(key) {
        try {
            const data = await redisClient.get(`cache:${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error en getCache:', error);
            return null;
        }
    }
};

module.exports = { redisClient, connectRedis, redisHelper };

