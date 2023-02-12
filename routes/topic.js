const { Router } = require('express')
const { validate, validateTopicReq } = require('../lib/validator')
const { Response } = require('../lib/utils')
const { logger } = require('../lib/utils/logger')
const { default: axios } = require('axios')

const router = Router()

router.get('/verify', verifyTopic)

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
			res.status(500).json(Response.fatal())
		})
}
