const Ajv = require('ajv')

const { loginStudentSchema, registerStudentSchema } = require('./schema.js')

const ajv = new Ajv({ allErrors: true, verbose: true })

const validateStudentRegistrationForm = ajv.compile(registerStudentSchema)
const validateStudentLoginForm = ajv.compile(loginStudentSchema)

function validate(validator, data) {
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

module.exports = {
	validateStudentRegistrationForm,
	validateStudentLoginForm,
	validate
}
