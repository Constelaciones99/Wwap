const cron = require('node-cron');
const { pool } = require('../../config/database');
const moment = require('moment');

class SchedulerService {
    constructor(campaignService) {
        this.campaignService = campaignService;
        this.tasks = new Map();
        this.startScheduler();
    }

    // Iniciar verificación periódica de campañas agendadas
    startScheduler() {
        // Ejecutar cada minuto
        cron.schedule('* * * * *', async () => {
            await this.checkScheduledCampaigns();
        });

        console.log('✓ Servicio de agendamiento iniciado');
    }

    // Verificar campañas agendadas
    async checkScheduledCampaigns() {
        try {
            const now = moment().format('YYYY-MM-DD HH:mm:00');

            // Buscar campañas agendadas para ejecutar
            const [campaigns] = await pool.execute(
                `SELECT * FROM campanas 
                 WHERE estado = 'agendada' 
                 AND fecha_agendada <= ?`,
                [now]
            );

            for (const campaign of campaigns) {
                console.log(`🕐 Ejecutando campaña agendada: ${campaign.nombre} (ID: ${campaign.id})`);
                
                try {
                    await this.campaignService.startCampaign(campaign.id);
                } catch (error) {
                    console.error(`Error ejecutando campaña ${campaign.id}:`, error);
                    
                    // Marcar como error
                    await pool.execute(
                        'UPDATE campanas SET estado = ? WHERE id = ?',
                        ['cancelada', campaign.id]
                    );
                }
            }

        } catch (error) {
            console.error('Error en verificación de agendamiento:', error);
        }
    }

    // Agendar campaña manualmente
    async scheduleCampaign(campaignId, scheduledDate) {
        try {
            const dateFormatted = moment(scheduledDate).format('YYYY-MM-DD HH:mm:ss');

            await pool.execute(
                'UPDATE campanas SET estado = ?, fecha_agendada = ? WHERE id = ?',
                ['agendada', dateFormatted, campaignId]
            );

            console.log(`✓ Campaña ${campaignId} agendada para ${dateFormatted}`);

            return {
                success: true,
                campaignId,
                scheduledDate: dateFormatted
            };

        } catch (error) {
            console.error('Error agendando campaña:', error);
            throw error;
        }
    }

    // Cancelar agendamiento
    async unscheduleCampaign(campaignId) {
        try {
            await pool.execute(
                'UPDATE campanas SET estado = ?, fecha_agendada = NULL WHERE id = ?',
                ['borrador', campaignId]
            );

            return { success: true };

        } catch (error) {
            console.error('Error cancelando agendamiento:', error);
            throw error;
        }
    }

    // Obtener campañas agendadas
    async getScheduledCampaigns(userId) {
        try {
            const [campaigns] = await pool.execute(
                `SELECT * FROM campanas 
                 WHERE usuario_id = ? AND estado = 'agendada'
                 ORDER BY fecha_agendada ASC`,
                [userId]
            );

            return campaigns;

        } catch (error) {
            console.error('Error obteniendo campañas agendadas:', error);
            throw error;
        }
    }
}

module.exports = SchedulerService;

