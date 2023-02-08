const { Schema, model, SchemaTypes } = require('mongoose')
const { STUDENT, TOPIC, LECTURER, PROJECT } = require('../lib/utils/constants')

const studentSchema = new Schema(
	{
		matricNo: { type: String, required: true, unique: true },
		fullName: String,
		password: String,
		phoneNumber: String,
		departmentName: String,
		subDepartmentName: String,
		semester: Number
	},
	{
		toJSON: {
			transform: function (doc, ret) {
				ret.id = ret._id
				delete ret._id
				delete ret.__v
				delete ret.password
			}
		}
	}
)

const lecturerSchema = new Schema(
	{
		email: { type: String, required: true, unique: true },
		fullName: String,
		password: String,
		departmentName: String
	},
	{
		toJSON: {
			transform: function (doc, ret) {
				ret.id = ret._id
				delete ret._id
				delete ret.__v
				delete ret.password
			}
		}
	}
)

const projectSchema = new Schema(
	{
		ownerId: { type: SchemaTypes.ObjectId, ref: STUDENT, required: true },
		approvedBy: { type: SchemaTypes.ObjectId, ref: LECTURER },
		approvedDate: { type: SchemaTypes.Date, default: new Date() },
		status: { type: String, default: 'PROPOSED' } // valid states are PROPOSED | APPROVED | REJECTED
	},
	{
		toJSON: {
			transform: function (doc, ret) {
				delete ret.__v
				ret.id = ret._id
				delete ret._id
			}
		}
	}
)

const topicSchema = new Schema(
	{
		title: String,
		projectId: { type: SchemaTypes.ObjectId, ref: PROJECT },
		status: { type: String, default: 'PROPOSED' } // valid states are PROPOSED | APPROVED | REJECTED
	},
	{
		toJSON: {
			transform: function (doc, ret) {
				delete ret.__v
				ret.id = ret._id
				delete ret._id
			}
		}
	}
)

function createModelWithVirtualId(modelName, schema) {
	schema.virtual('id').get(function () {
		return this._id
	})
	return model(modelName, schema)
}

module.exports = {
	StudentModel: createModelWithVirtualId(STUDENT, studentSchema),
	LecturerModel: createModelWithVirtualId(LECTURER, lecturerSchema),
	ProjectModel: createModelWithVirtualId(PROJECT, projectSchema),
	TopicModel: createModelWithVirtualId(TOPIC, topicSchema)
}
