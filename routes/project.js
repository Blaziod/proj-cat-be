const { Router } = require('express')
const { validate, validateTopicReq, validateAddTopic, validateApproveTopicRequest } = require('../lib/validator')
const { Response } = require('../lib/utils')
const { readOne, insertMany, exists, save, readMany } = require('../db')
const { STUDENT, TOPIC, PROJECT } = require('../lib/utils/constants')
const { logger } = require('../lib/utils/logger')
const { default: axios } = require('axios')

const router = Router()

router.get('/verify', verifyTopic)
router.post('/approve', approveTopic)
router.post('/add', addTopic)
router.get('/unapproved', readUnapprovedTopics)

module.exports = router

function verifyTopic(req, res) {
	const queryObj = req.query
	const [isValid, errors] = validate(validateTopicReq, queryObj)
	if (!isValid) return res.status(400).json(Response.error('Invalid request!', errors))

	// verify this topic against each of the cached verified topics
	const { topic } = queryObj
	const cachedTopics = global.approvedTopics

	if (cachedTopics.includes(topic))
		return res
			.status(200)
			.json(Response.success('This topic or a similar one already exists!', { isDuplicate: true }))

	const similaritiesPromises = cachedTopics.map(approvedTopic =>
		axios('https://api.dandelion.eu/datatxt/sim/v1', {
			params: {
				token: process.env.AI_TOKEN,
				text1: approvedTopic.title,
				text2: topic,
				lang: 'en'
			}
		})
	)

	Promise.allSettled(similaritiesPromises)
		.then(results => {
			// check if any of the approved topics have a similarity score
			// of over 90% and report that this topic is invalid
			const matchesAtLeastOne = results.some(result => {
				if (result.status === 'rejected') return false
				const similarityScore = result.value.data.similarity
				return similarityScore >= 0.9
			})

			if (matchesAtLeastOne)
				res.status(200).json(
					Response.success('This topic or a similar one already exists!', { isDuplicate: true })
				)
			else res.status(200).json(Response.success('No matches found! All clear.', { isDuplicate: false }))
		})
		.catch(err => {
			logger.error(`Failed while verifying topics - failed with message - ${err.message}`)
			res.status(500).json(Response.error('Something went wrong!'))
		})
}

// create a new project for a student and add topics to that project
// if project is already associated with student, add the topic to the project.
function addTopic(req, res) {
	const [isValid, errors] = validate(validateAddTopic, req.body)
	if (!isValid) return res.status(400).json(Response.error('Invalid request!', errors))

	const { matricNo, topics } = { ...req.body }

	readOne(STUDENT, { matricNo })
		.then(student => {
			if (student === null)
				return res.status(400).json(Response.error('No such student with that matric number!'))

			// read a project for this student
			readOne(PROJECT, { ownerId: student.id })
				.then(async project => {
					if (project === null) {
						// project has not yet been created for this student
						// create a new project
						return await save(PROJECT, { ownerId: student.id })
					}
					return project
				})
				.then(async project => {
					// if the project already contains 3 'PROPOSED' topics, refuse to add it.
					const associatedTopic = await readMany(TOPIC, { projectId: project.id, status: 'PROPOSED' })

					console.log(associatedTopic)

					if (associatedTopic.length >= 3)
						return res.status(400).json(Response.error('3 Topics have already been proposed!'))

					const restructuredData = topics.map(topic => ({ projectId: project.id, title: topic }))

					// associate the topics with the project
					insertMany(TOPIC, restructuredData)
						.then(topics => {
							res.status(200).json(Response.success('Topics added!', topics))
						})
						.catch(err => {
							logger.error(
								`failed to write topics for student with: ${matricNo} - failed with message - ${err.message}.\n topics - ${topics}`
							)
							res.status(500).json(Response.error('Something went wrong!'))
						})
				})
				.catch()
		})
		.catch(err => {
			logger.error(`Failed to readStudent with matricNo: ${matricNo} - failed with message - ${err.message}`)
			res.status(500).json(Response.error('Something went wrong!'))
		})
}

function readUnapprovedTopics(req, res) {
	readMany(TOPIC, { approved: false })
		.then(topics => {
			res.status(200).json(Response.success('Done!', topics))
		})
		.catch(err => {
			logger.error(`Failed to read unapproved topics - failed with message - ${err.message}`)
			res.status(500).json(Response.error('Something went wrong!'))
		})
}

async function approveTopic(req, res) {
	const [isValid, errors] = validate(validateApproveTopicRequest, req.body)
	if (!isValid) return res.status(400).json(Response.error('Invalid request!', errors))

	const { id } = { ...req.body }

	const topicExists = await exists(TOPIC, { id })

	if (!topicExists) return res.status(400).json(Response.error('Could not find that topic to approve!'))

	update({ id }, { approved: true })
		.then(() => {
			res.status(200).json(Response.success('Approved!'))
		})
		.catch(() => {
			logger.error(`Failed to approve topic - failed with message - ${err.message}`)
			res.status(500).json(Response.error('Something went wrong!'))
		})
}
