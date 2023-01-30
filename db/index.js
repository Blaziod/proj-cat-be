import logger from '../utils/logger.js'
import mongoose, { connect } from './config.js'
import { StudentModel } from './models.js'
mongoose.set('strictQuery', false)

export async function setupAndStart() {
	connect(err => {
		if (err) return console.log(err)
		logger.info('DB connected!')
	})
}

const mapNameToModel = name =>
	({
		student: StudentModel
	}[name.toLowerCase()])

// DB API
export async function save(modelName, data, cb) {
	const Model = mapNameToModel(modelName)

	if (cb) new Model(data).save(cb)
	else await new Model(data).save()
}

export async function exists(modelName, data) {
	const Model = mapNameToModel(modelName)

	const res = await Model.exists(data)
	console.log(res)
	return res !== null
}

export async function readOne(modelName, query) {
	const Model = mapNameToModel(modelName)

	return await Model.findOne(query).exec()
}
