class Response {
	static responseObject(isError = false, body, message = '') {
		return {
			ok: !isError,
			message: message,
			body: body
		}
	}

	static error(errorMessage, body = undefined) {
		return Response.responseObject(true, body, errorMessage)
	}

	static success(successMessage, body = undefined) {
		return Response.responseObject(false, body, successMessage)
	}
}

const path = require('path')
const fs = require('fs')
const logger = require('./logger')

function readstatic(filename) {
	let file
	try {
		file = fs.readFileSync(path.join(__dirname, 'static', filename)).toString()
	} catch (e) {
		logger.error(e.message)
		file = ''
	}
	return file
}

const bcrypt = require('bcrypt')

function encryptPass(pass) {
	return new Promise((resolve, reject) => {
		const saltRounds = parseInt(process.env.SALTROUNDS)
		bcrypt
			.genSalt(saltRounds)
			.then(salt => {
				return bcrypt.hash(pass, salt)
			})
			.then(resolve)
			.catch(reject)
	})
}

function validatePass(pass, hash) {
	return new Promise((resolve, reject) => {
		bcrypt.compare(pass, hash).then(resolve).catch(reject)
	})
}

module.exports = {
	Response,
	readstatic,
	encryptPass,
	validatePass
}
