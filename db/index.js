const { STUDENT, TOPIC } = require('../lib/utils/constants')
const { logger } = require('../lib/utils/logger')
const { StudentModel, TopicModel } = require('./models.js')

// ======= DB SETUP

const mongoose = require('mongoose')

mongoose.set('strictQuery', false)
mongoose.connection.on('connected', updateGlobalApprovedTopicsCache)
mongoose.connection.on('reconnected', updateGlobalApprovedTopicsCache)
mongoose.connection.on('error', stopUpdateGlobalApprovedTopicsCache)
mongoose.connection.on('disconnected', stopUpdateGlobalApprovedTopicsCache)

function connect(cb) {
	if (!cb) throw new Error('missing callback!')
	mongoose.connect(
		`mongodb+srv://projcat:${process.env.DB_PASS}@proj-cat.ejby04i.mongodb.net/project-cataloging?retryWrites=true&w=majority`,
		{},
		cb
	)
}

global.approvedTopics = []

async function setupAndStart(cb) {
	connect(err => {
		if (err) return console.log(err)
		logger.info('DB connected!')
	})
}

var __jobId = null
function updateGlobalApprovedTopicsCache() {
	readApprovedTopics()
		.then(topics => {
			global.approvedTopics = topics
		})
		.catch(err => {
			logger.warn('could not read approved topics - ' + err.message)
		})
		.finally(() => {
			__jobId = setTimeout(updateGlobalApprovedTopicsCache, 3000)
		})
}

function stopUpdateGlobalApprovedTopicsCache() {
	if (__jobId) clearTimeout(__jobId)
}

// ===================

// =========== UTILS

const mapNameToModel = name =>
	({
		[STUDENT]: StudentModel,
		[TOPIC]: TopicModel
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

async function insertMany(modelName, objs) {
	const Model = mapNameToModel(modelName)
	const docs = objs.map(data => new Model(data))

	return await Model.insertMany(docs)
}

async function readApprovedTopics() {
	return await TopicModel.find({ approved: true })
}

module.exports = {
	setupAndStart,
	save,
	exists,
	readOne,
	insertMany,
	readApprovedTopics
}
