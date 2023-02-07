const Ajv = require('ajv')

const {
	loginStudentSchema,
	registerStudentSchema,
	addTopicSchema,
	verifyTopicSchema,
	registerLecturerSchema,
	loginLecturerSchema,
	approveTopicSchema
} = require('./schema.js')

const ajv = new Ajv({ allErrors: true, verbose: true })

const validateStudentRegistrationForm = ajv.compile(registerStudentSchema)
const validateLecturerRegistrationForm = ajv.compile(registerLecturerSchema)
const validateStudentLoginForm = ajv.compile(loginStudentSchema)
const validateLecturerLoginForm = ajv.compile(loginLecturerSchema)
const validateTopicReq = ajv.compile(verifyTopicSchema)
const validateApproveTopicRequest = ajv.compile(approveTopicSchema)
const validateAddTopic = ajv.compile(addTopicSchema)

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
	validateLecturerRegistrationForm,
	validateStudentLoginForm,
	validateLecturerLoginForm,
	validateTopicReq,
	validateAddTopic,
	validateApproveTopicRequest,
	validate
}
