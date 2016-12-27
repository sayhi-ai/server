import ENV_VARS from './ENV_VARS';
import winston from 'winston';
require('winston-daily-rotate-file');
winston.emitErrs = true;

const transport = new winston.transports.DailyRotateFile({
  filename: ENV_VARS.CONSTANTS.SERVER_LOG_FILE,
  datePattern: 'yyyy-MM-dd.',
  prepend: true,
  level: 'info'
});

const transports = [
  transport,
  new winston.transports.Console({
    level: 'debug',
    json: false,
    colorize: true
  })
];

const logger = new winston.Logger({
  transports: transports,
  exitOnError: false
});

winston.handleExceptions(transports);

export default logger;
