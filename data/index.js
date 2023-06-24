const { STUDENT, TOPIC, LECTURER, PROJECT, UPLOAD } = require('../lib/utils/constants')
const { logger } = require('../lib/utils/logger')
const { StudentModel, TopicModel, LecturerModel, ProjectModel, UploadModel } = require('./models.js')

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
		.then(approvedProjects => {
			const approvedSoFar = approvedProjects.map(approvedProject => approvedProject.approvedTopic.title)

			// remove this part
			if (JSON.stringify(approvedSoFar) !== JSON.stringify(global.approvedTopics))
				console.log(approvedSoFar)

			global.approvedTopics = approvedSoFar
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

const modelMap = {
	[STUDENT]: StudentModel,
	[LECTURER]: LecturerModel,
	[PROJECT]: ProjectModel,
	[TOPIC]: TopicModel,
	[UPLOAD]: UploadModel
}

const mapNameToModel = name => modelMap[name.toLowerCase()]

// DB API
async function save(modelName, data, cb) {
	const Model = mapNameToModel(modelName)

	if (cb) new Model(data).save(cb)
	else return await new Model(data).save()
}

async function exists(modelName, filter) {
	const Model = mapNameToModel(modelName)

	const res = await Model.exists(filter)
	return res !== null
}

async function readOne(modelName, filter, config) {
	const Model = mapNameToModel(modelName)

	let finalQuery = Model.findOne(filter)

	//attach populate
	if (config && config.populate && Array.isArray(config.populate)) {
		config.populate.forEach(populateField => (finalQuery = finalQuery.populate(populateField)))
	}

	return await finalQuery.exec()
}

async function insertMany(modelName, objs) {
	const Model = mapNameToModel(modelName)
	const docs = objs.map(data => new Model(data))

	return await Model.insertMany(docs)
}

async function readApprovedTopics() {
	return await ProjectModel.find({ approvedTopic: { $ne: null } }).populate('approvedTopic')
}

async function readMany(modelName, filter, config) {
	const Model = mapNameToModel(modelName)

	let finalQuery = Model.find(filter)

	//attach populate
	if (config && config.populate && Array.isArray(config.populate)) {
		config.populate.forEach(populateField => (finalQuery = finalQuery.populate(populateField)))
	}

	return finalQuery.exec()
}

async function update(modelName, filter, update) {
	const Model = mapNameToModel(modelName)
	return Model.updateOne(filter, update)
}

async function updateMany(modelName, filter, update) {
	const Model = mapNameToModel(modelName)
	return Model.updateMany(filter, update)
}

async function cleanDB() {
	const Models = Object.values(modelMap)
	Models.forEach(Model => {
		Model.deleteMany((err, count) => {
			console.log('err', err)
			console.log('count', count)
		})
	})
}

module.exports = {
	setupAndStart,
	save,
	exists,
	readOne,
	insertMany,
	readApprovedTopics,
	readMany,
	update,
	updateMany,
	cleanDB
}
