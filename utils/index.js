export class Response {
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

import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

export function readstatic(filename) {
	const __filename = fileURLToPath(import.meta.url)
	const __dirname = dirname(__filename)
	let file
	try {
		file = fs.readFileSync(path.join(__dirname, 'static', filename)).toString()
	} catch (e) {
		console.log(e.message)
		file = ''
	}
	return file
}

import bcrypt from 'bcrypt'

export function encryptPass(pass) {
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

export function validatePass(pass, hash) {
	return new Promise((resolve, reject) => {
		bcrypt.compare(pass, hash).then(resolve).catch(reject)
	})
}
