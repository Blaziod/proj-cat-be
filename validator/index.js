import Ajv from 'ajv'

import { loginStudentSchema, registerStudentSchema } from './schema.js'

const ajv = new Ajv({ allErrors: true, verbose: true })

export const validateStudentRegistrationForm = ajv.compile(registerStudentSchema)
export const validateStudentLoginForm = ajv.compile(loginStudentSchema)

export function validate(validator, data) {
	const isValid = validator(data)
	let errors = null
	if (!isValid)
		errors = validator.errors?.map(
			err =>
				`${err.instancePath.replace('/', '.')} - ${err.message} ${
					err.params?.allowedValues ? JSON.stringify(err.params?.allowedValues) : ''
				}`
		)
	return [isValid, errors]
}
