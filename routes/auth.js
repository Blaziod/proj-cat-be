const { Router } = require('express')

const router = Router()

router.use('/login/student', studentLoginHandler)
router.use('/register/student', registerStudentHandler)

module.exports = router

// HANDLERS
const { validate, validateStudentLoginForm, validateStudentRegistrationForm } = require('../lib/validator')
const { encryptPass, validatePass, Response } = require('../lib/utils')
const { exists, readOne, save } = require('../db')
const { STUDENT } = require('../lib/utils/constants')

async function registerStudentHandler(req, res) {
	const [isValid, errors] = validate(validateStudentRegistrationForm, req.body)
	if (!isValid) return res.status(400).json(Response.error('Invalid request!', errors))

	const studentInfo = req.body
	studentInfo.password = await encryptPass(studentInfo.password)

	if (await exists(STUDENT, { matricNo: studentInfo.matricNo }))
		return res.status(400).json(Response.error('Matric number already registered', errors))

	// save the student
	save(STUDENT, studentInfo, err => {
		if (err) return res.status(500).json(Response.error('Something went wrong backstage!'))

		return res.status(200).json(Response.success('Student registered!', studentInfo))
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
