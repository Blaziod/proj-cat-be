import { createLogger, format, transports } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

const transport = new DailyRotateFile({
	filename: 'logs/application-%DATE%.log',
	datePattern: 'YYYY-MM-DD-HH',
	zippedArchive: true,
	maxSize: '20m',
	maxFiles: '14d'
})

const logger = createLogger({
	format: format.combine(format.timestamp(), format.json()),
	transports: [transport, new transports.Console()]
})

export default logger

import fs from 'fs'
import path from 'path'
import morgan from 'morgan'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const accessLogStream = fs.createWriteStream(path.join('logs', 'requests.log'), { flags: 'a' })
export const loggerMiddleware = () => morgan('combined', { stream: accessLogStream })
