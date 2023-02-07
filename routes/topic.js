const { Router } = require('express')
const qs = require('querystring')
const { validate, validateTopicReq, validateAddTopic, validateApproveTopicRequest } = require('../lib/validator')
const { Response } = require('../lib/utils')
const { readOne, insertMany, exists, save } = require('../db')
const { STUDENT, TOPIC } = require('../lib/utils/constants')
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

	const similaritiesPromises = cachedTopics.map(approvedTopic => {
		return axios('https://api.dandelion.eu/datatxt/sim/v1', {
			params: {
				token: process.env.AI_TOKEN,
				text1: approvedTopic.title,
				text2: topic,
				lang: 'en'
			}
		})
	})

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

function addTopic(req, res) {
	const [isValid, errors] = validate(validateAddTopic, req.body)
	if (!isValid) return res.status(400).json(Response.error('Invalid request!', errors))

	const { matricNo, topics } = { ...req.body }

	readOne(STUDENT, { matricNo })
		.then(student => {
			if (student === null)
				return res.status(400).json(Response.error('No such student with that matric number!'))

			const restructuredData = topics.map(topic => ({ proposedBy: student._id, title: topic }))

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
