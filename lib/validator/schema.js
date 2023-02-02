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

const loginStudentSchema = {
	type: 'object',
	properties: {
		matricNo: { type: 'string' },
		password: { type: 'string' }
	},
	required: ['matricNo', 'password'],
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

module.exports = {
	registerStudentSchema,
	loginStudentSchema,
	addTopicSchema,
	verifyTopicSchema
}
