/**
 * Helper para operaciones con Redis
 */

const redisClient = require('../../config/redis');

class RedisHelper {
    async setCache(key, value, expirationSeconds = 3600) {
        try {
            if (!redisClient || !redisClient.isOpen) {
                console.warn('⚠️ Redis no disponible, saltando cache');
                return false;
            }

            const fullKey = `cache:${key}`;
            await redisClient.setEx(fullKey, expirationSeconds, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('❌ Error guardando en Redis:', error.message);
            return false;
        }
    }

    async getCache(key) {
        try {
            if (!redisClient || !redisClient.isOpen) {
                return null;
            }

            const fullKey = `cache:${key}`;
            const data = await redisClient.get(fullKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('❌ Error obteniendo de Redis:', error.message);
            return null;
        }
    }

    async deleteCache(key) {
        try {
            if (!redisClient || !redisClient.isOpen) {
                return false;
            }

            const fullKey = `cache:${key}`;
            await redisClient.del(fullKey);
            return true;
        } catch (error) {
            console.error('❌ Error eliminando de Redis:', error.message);
            return false;
        }
    }

    async clearCachePattern(pattern) {
        try {
            if (!redisClient || !redisClient.isOpen) {
                return false;
            }

            const fullPattern = `cache:${pattern}`;
            const keys = await redisClient.keys(fullPattern);
            
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error limpiando cache:', error.message);
            return false;
        }
    }
}

module.exports = new RedisHelper();

