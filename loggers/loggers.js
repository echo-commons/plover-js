const winston = require('winston');
require('winston-daily-rotate-file');

module.exports = winston.loggers.add('PLOVER', {
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: 'PLOVER' },
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `${timestamp} [::PLOVER] [${level}]: ${message} ${metaStr}`;
        })
    ),
    transports: [
        new winston.transports.DailyRotateFile({
        filename: './logs/plover/PLOVER-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d'
        }),
        new winston.transports.Console()
    ]
});