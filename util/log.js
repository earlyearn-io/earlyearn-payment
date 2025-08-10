const winston = require('winston');
require('winston-daily-rotate-file');

const transports = [];
if (process.env.NODE_ENV === 'development') {
    transports.push(new winston.transports.File({ filename: 'error.log', level: 'error' }));
    transports.push(new winston.transports.File({ filename: 'combined.log' }));
    transports.push(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp }) => {
                let formattedMessage = message;
                if (message instanceof Error) {
                    formattedMessage = message.stack;
                } else if (typeof message === 'object') {
                    formattedMessage = JSON.stringify(message);
                }
                const sessionId = global.sessionId ? `[${global.sessionId}]` : '';
                return `[${timestamp}] ${level}: ${sessionId} ${formattedMessage}`;
            })
        )
    }));
} else {
    transports.push(new winston.transports.DailyRotateFile({        
        filename: `fs/logs/error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxFiles: '30d'
    }));
    transports.push(new winston.transports.DailyRotateFile({
        filename: `fs/logs/log-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxFiles: '30d'
    }));
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp }) => {
            let formattedMessage = message;
            if (message instanceof Error) {
                formattedMessage = message.stack;
            } else if (typeof message === 'object') {
                formattedMessage = JSON.stringify(message);
            }
            const sessionId = global.sessionId ? `[${global.sessionId}]` : '';
            return `[${timestamp}] ${level}: ${sessionId} ${formattedMessage}`;
        })
    ),
    transports,
});

module.exports = logger;
