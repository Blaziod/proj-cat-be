const { createLogger, format, transports } = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')

// cannot use this in prod because file storage isn't allowed.
// Enable it when file storage is allowed

/* 
const transport = new DailyRotateFile({
	filename: 'logs/application-%DATE%.log',
	datePattern: 'YYYY-MM-DD-HH',
	zippedArchive: true,
	maxSize: '20m',
	maxFiles: '14d'
})
*/

const logger = createLogger({
	format: format.combine(format.timestamp(), format.json()),
	transports: [new transports.Console()]
	// transports: [transport, new transports.Console()]
})

const fs = require('fs')
const path = require('path')
const morgan = require('morgan')

// Enable only when file storage is enabled in prod
/*
const accessLogStream = fs.createWriteStream(path.join('logs', 'requests.log'), { flags: 'a' })
*/
module.exports = {
	logger,
	loggerMiddleware: () => {
		return process.env.NODE_ENV === 'production' ? morgan('combined') : morgan('dev')
		// return process.env.NODE_ENV === 'production' ? morgan('combined', { stream: accessLogStream }) : morgan('dev')
	}
}
