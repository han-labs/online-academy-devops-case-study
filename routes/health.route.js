// routes/health.route.js
import { Router } from 'express';
import db from '../utils/db.js';

const router = Router();

router.get('/healthz', (req, res) => {
    return res.status(200).json({
        status: 'ok',
        service: 'online-academy',
        environment: process.env.NODE_ENV || 'development',
        uptime_seconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

router.get('/readyz', async (req, res) => {
    const requiredEnvVars = [
        'SESSION_SECRET',
        'DB_HOST',
        'DB_PORT',
        'DB_USER',
        'DB_PASSWORD',
        'DB_NAME'
    ];

    const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

    if (missingEnvVars.length > 0) {
        return res.status(503).json({
            status: 'not_ready',
            service: 'online-academy',
            environment: process.env.NODE_ENV || 'development',
            checks: {
                env: {
                    status: 'fail',
                    missing: missingEnvVars
                },
                database: {
                    status: 'skipped'
                }
            },
            timestamp: new Date().toISOString()
        });
    }

    try {
        await db.raw('select 1 as ok');

        return res.status(200).json({
            status: 'ready',
            service: 'online-academy',
            environment: process.env.NODE_ENV || 'development',
            checks: {
                env: {
                    status: 'pass'
                },
                database: {
                    status: 'pass'
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Readiness check failed:', {
            timestamp: new Date().toISOString(),
            message: error.message
        });

        return res.status(503).json({
            status: 'not_ready',
            service: 'online-academy',
            environment: process.env.NODE_ENV || 'development',
            checks: {
                env: {
                    status: 'pass'
                },
                database: {
                    status: 'fail'
                }
            },
            timestamp: new Date().toISOString()
        });
    }
});

export default router;