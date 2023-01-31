const { logger } = require('../lib/utils/logger')
const { connect } = require('./config.js')
const { StudentModel } = require('./models.js')

async function setupAndStart() {
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
async function save(modelName, data, cb) {
	const Model = mapNameToModel(modelName)

	if (cb) new Model(data).save(cb)
	else await new Model(data).save()
}

async function exists(modelName, data) {
	const Model = mapNameToModel(modelName)

	const res = await Model.exists(data)
	console.log(res)
	return res !== null
}

async function readOne(modelName, query) {
	const Model = mapNameToModel(modelName)

	return await Model.findOne(query).exec()
}

module.exports = {
	setupAndStart,
	save,
	exists,
	readOne
}
