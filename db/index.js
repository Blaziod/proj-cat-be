const { STUDENT, TOPIC, LECTURER } = require('../lib/utils/constants')
const { logger } = require('../lib/utils/logger')
const { StudentModel, TopicModel, LecturerModel } = require('./models.js')

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
		if (err) return logger.error(err.message)
		logger.info('DB connected!')
	})
}
// setup a job that periodically gets all the approved topics from the database and stores as cache
// keeping only the title of the topics as opposed to the entire topic object to save memory.
var __jobId = null
function updateGlobalApprovedTopicsCache() {
	readApprovedTopics()
		.then(topics => {
			global.approvedTopics = topics.map(topic => topic.title)
		})
		.catch(err => {
			logger.warn('could not read approved topics - ' + err.message)
		})
		.finally(() => {
			// queue the function to run after 3 seconds
			__jobId = setTimeout(updateGlobalApprovedTopicsCache, 3000)
		})
}

// stop reading the approved Topics
// but also maintain whatever we already have in the cache
function stopUpdateGlobalApprovedTopicsCache() {
	if (__jobId) clearTimeout(__jobId)
}

// ===================

// =========== UTILS

const mapNameToModel = name =>
	({
		[STUDENT]: StudentModel,
		[LECTURER]: LecturerModel,
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
	return await TopicModel.find({ status: 'APPROVED' })
}

async function readMany(modelName, query) {
	const Model = mapNameToModel(modelName)
	return Model.find(query).exec()
}

async function update(modelName, filter, update) {
	const Model = mapNameToModel(modelName)
	return Model.updateOne(filter, update)
}

module.exports = {
	setupAndStart,
	save,
	exists,
	readOne,
	insertMany,
	readApprovedTopics,
	readMany,
	update
}
