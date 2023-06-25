const { Schema, model, SchemaTypes, pl } = require('mongoose')
const { STUDENT, TOPIC, LECTURER, PROJECT, UPLOAD } = require('../lib/utils/constants')

// define Schemas
const studentSchema = new Schema({
	matricNo: { type: String, required: true, unique: true },
	fullName: String,
	password: String,
	phoneNumber: String,
	departmentName: String,
	subDepartmentName: String,
	semester: Number
})

const lecturerSchema = new Schema({
	email: { type: String, required: true, unique: true },
	fullName: String,
	password: String,
	departmentName: String
})

const projectSchema = new Schema({
	owner: { type: SchemaTypes.ObjectId, ref: STUDENT, required: true },
	approvedTopic: { type: SchemaTypes.ObjectId, ref: TOPIC },
	approvedBy: { type: SchemaTypes.ObjectId, ref: LECTURER },
	created: { type: SchemaTypes.Date },
	updated: { type: SchemaTypes.Date, default: new Date() }
})

const topicSchema = new Schema({
	title: String,
	description: String,
	reviewed: Boolean,
	projectId: { type: SchemaTypes.ObjectId, ref: PROJECT }
})

const uploadSchema = new Schema({
	url: String,
	filename: String,
	size: Number,
	url: String,
	student: { type: SchemaTypes.ObjectId, ref: STUDENT },
	topic: { type: SchemaTypes.ObjectId, ref: TOPIC }
})

// set serialization behaviours
function defaultJSONTransformer(doc, ret) {
	delete ret.__v
	delete ret._id
}

studentSchema.set('toJSON', {
	virtuals: true,
	transform: function (doc, ret) {
		defaultJSONTransformer(doc, ret)
		delete ret.password
	}
})
lecturerSchema.set('toJSON', {
	virtuals: true,
	transform: function (doc, ret) {
		defaultJSONTransformer(doc, ret)
		delete ret.password
	}
})
topicSchema.set('toJSON', {
	virtuals: true,
	transform: defaultJSONTransformer
})
projectSchema.set('toJSON', {
	virtuals: true,
	transform: defaultJSONTransformer
})
uploadSchema.set('toJSON', {
    virtuals: true,
    transform: defaultJSONTransformer
})

// export Models
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
	TopicModel: createModelWithVirtualId(TOPIC, topicSchema),
	UploadModel: createModelWithVirtualId(UPLOAD, uploadSchema)
}
