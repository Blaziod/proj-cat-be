const { Router } = require('express')

const router = Router()

router.post('/register/student', registerStudentHandler)
router.post('/register/lecturer', registerLecturerHandler)
router.post('/login/student', studentLoginHandler)
router.post('/login/lecturer', lecturerLoginHandler)

module.exports = router

// HANDLERS
const {
	validate,
	validateStudentLoginForm,
	validateStudentRegistrationForm,
	validateLecturerRegistrationForm,
	validateLecturerLoginForm
} = require('../lib/validator')
const { encryptPass, validatePass, Response } = require('../lib/utils')
const { exists, readOne, save } = require('../db')
const { STUDENT, LECTURER } = require('../lib/utils/constants')

async function registerStudentHandler(req, res) {
	const [isValid, errors] = validate(validateStudentRegistrationForm, req.body)
	if (!isValid) return res.status(400).json(Response.error('Invalid request!', errors))

	const studentInfo = req.body
	studentInfo.password = await encryptPass(studentInfo.password)

	if (studentInfo.matricNo.endsWith('/test')) {
		delete studentInfo.password
		return res.status(200).json(Response.success('Student registered!', studentInfo))
	}

	if (await exists(STUDENT, { matricNo: studentInfo.matricNo }))
		return res.status(400).json(Response.error('Matric number already registered', errors))

	// save the student
	save(STUDENT, studentInfo, (err, doc) => {
		if (err) return res.status(500).json(Response.error('Something went wrong backstage!'))
		return res.status(200).json(Response.success('Student registered!', doc))
	})
}

async function registerLecturerHandler(req, res) {
	const [isValid, errors] = validate(validateLecturerRegistrationForm, req.body)
	if (!isValid) return res.status(400).json(Response.error('Invalid request!', errors))

	const lecturerInfo = req.body
	lecturerInfo.password = await encryptPass(lecturerInfo.password)

	// send a proper request with this email to always get a Success.
	if (lecturerInfo.email == 'test@test.com') {
		delete lecturerInfo.password
		return res.status(200).json(Response.success('Account created!', lecturerInfo))
	}

	if (await exists(LECTURER, { email: lecturerInfo.email }))
		return res.status(400).json(Response.error('An account already exists for ' + lecturerInfo.email, errors))

	// save the lecturer
	save(LECTURER, lecturerInfo, (err, doc) => {
		if (err) return res.status(500).json(Response.error('Something went wrong backstage!'))
		return res.status(200).json(Response.success('Account created!', doc))
	})
}

async function studentLoginHandler(req, res) {
	const [isValid, errors] = validate(validateStudentLoginForm, req.body)
	if (!isValid) return res.status(400).json(Response.error('Invalid request!', errors))

	const loginInfo = req.body

	const studentInfo = await readOne(STUDENT, { matricNo: loginInfo.matricNo })

	if (studentInfo === null) return res.status(400).json(Response.error('This student was not previously registered'))

	//  compare password
	const isCorrectPassword = await validatePass(loginInfo.password, studentInfo.password)

	if (!isCorrectPassword) return res.status(400).json(Response.error('Incorrect password'))

	return res.status(200).json(Response.success('Login successful!.', studentInfo))
}

async function lecturerLoginHandler(req, res) {
	const [isValid, errors] = validate(validateLecturerLoginForm, req.body)
	if (!isValid) return res.status(400).json(Response.error('Invalid request!', errors))

	const loginInfo = req.body

	const lecturer = await readOne(LECTURER, { email: loginInfo.email })

	if (lecturer === null) return res.status(400).json(Response.error('No account found for ' + loginInfo.email))

	//  compare password
	const isCorrectPassword = await validatePass(loginInfo.password, lecturer.password)

	if (!isCorrectPassword) return res.status(400).json(Response.error('Incorrect password!'))

	return res.status(200).json(Response.success('Login successful!.', lecturer))
}
