const { Schema, model, SchemaTypes } = require('mongoose')
const { STUDENT, TOPIC } = require('../lib/utils/constants')

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

const TopicSchema = new Schema(
	{
		title: String,
		proposedBy: { type: SchemaTypes.ObjectId, ref: 'Student' },
		approved: { type: Boolean, default: false }
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
	TopicModel: model(TOPIC, TopicSchema)
}
