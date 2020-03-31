import * as winston from 'winston';

const alignColorsAndTime = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.label({ label: '[LOGGER]' }),
  winston.format.timestamp({ format: 'YY-MM-DD HH:MM:SS' }),
  winston.format.printf(line => ` ${line.label}  ${line.timestamp}  ${line.level} : ${line.message}`)
);

const consoleLogger = new winston.transports.Console({
  format: winston.format.combine(winston.format.colorize(), alignColorsAndTime)
});

const logger = winston.createLogger({
  transports: [ consoleLogger ]
});

logger.exitOnError = false;

export default logger;