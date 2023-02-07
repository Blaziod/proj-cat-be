const { Schema, model, SchemaTypes } = require('mongoose')
const { STUDENT, TOPIC, LECTURER } = require('../lib/utils/constants')

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

const topicSchema = new Schema(
	{
		title: String,
		proposedBy: { type: SchemaTypes.ObjectId, ref: STUDENT },
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

module.exports = {
	StudentModel: model(STUDENT, studentSchema),
	LecturerModel: model(LECTURER, lecturerSchema),
	TopicModel: model(TOPIC, topicSchema)
}
