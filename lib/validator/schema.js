const registerStudentSchema = {
	type: 'object',
	properties: {
		matricNo: { type: 'string' },
		fullName: { type: 'string' },
		password: { type: 'string' },
		phoneNumber: { type: 'string', maxLength: 11 },
		departmentName: { type: 'string' },
		subDepartmentName: { type: 'string' },
		semester: { type: 'number', enum: [1, 2, 3, 4, 5, 6, 7, 8] }
	},
	required: ['matricNo', 'fullName', 'password', 'phoneNumber', 'departmentName', 'semester'],
	additionalProperties: false
}

const registerLecturerSchema = {
	type: 'object',
	properties: {
		email: { type: 'string' },
		fullName: { type: 'string' },
		password: { type: 'string' },
		phoneNumber: { type: 'string', maxLength: 11 },
		departmentName: { type: 'string' }
	},
	required: ['email', 'fullName', 'password', 'departmentName'],
	additionalProperties: false
}

const loginStudentSchema = {
	type: 'object',
	properties: {
		matricNo: { type: 'string' },
		password: { type: 'string' }
	},
	required: ['matricNo', 'password'],
	additionalProperties: false
}

const loginLecturerSchema = {
	type: 'object',
	properties: {
		email: { type: 'string' },
		password: { type: 'string' }
	},
	required: ['email', 'password'],
	additionalProperties: false
}

const addTopicSchema = {
	type: 'object',
	properties: {
		topics: { type: 'array', items: { type: 'string' }, maxItems: 3, minItems: 1 },
		matricNo: { type: 'string' }
	},
	required: ['matricNo', 'topics'],
	additionalProperties: false
}

const verifyTopicSchema = {
	type: 'object',
	properties: {
		topic: { type: 'string' }
	},
	required: ['topic']
}

const approveTopicSchema = {
	type: 'object',
	properties: {
		id: { type: 'string' }
	},
	required: ['id']
}

module.exports = {
	registerStudentSchema,
	registerLecturerSchema,
	loginLecturerSchema,
	loginStudentSchema,
	addTopicSchema,
	verifyTopicSchema,
	approveTopicSchema
}
