const { Router } = require('express')
const {
	validate,
	validateAddTopic,
	validateApproveTopicRequest,
	validateGetProjectRequest,
	validateRejectProjectTopicsRequest,
	validateSaveUpload
} = require('../lib/validator')
const { Response } = require('../lib/utils')
const { readOne, insertMany, exists, save, readMany, updateMany, update } = require('../data')
const { STUDENT, TOPIC, PROJECT, PROPOSED, LECTURER, APPROVED, UPLOAD } = require('../lib/utils/constants')
const { logger } = require('../lib/utils/logger')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const axios = require("axios")

const router = Router()

router.get('/proposal', readSingleProjectForStudent)
// router.get('/proposal/all', readUnapprovedProjects)
router.get('/proposal/pending', readPendingProjects)
// router.get('/proposal/approved', readUnapprovedProjects)
// router.get('/proposal/unapproved', readUnapprovedProjects)
router.post('/proposal/add', addTopics)
router.post('/proposal/approve', approveProject)
router.post('/proposal/reject', rejectPendingTopics)
router.post('/upload', uploadDoc)

module.exports = router

// create a new project for a student and add topics to that project.
// if a project is already associated with student, add the topics to the project.
function addTopics(req, res) {
	const [isValid, errors] = validate(validateAddTopic, req.body)
	if (!isValid) return res.status(400).json(Response.error('Invalid request!', errors))

	const { matricNo, topics } = { ...req.body }

	readOne(STUDENT, { matricNo })
		.then(student => {
			if (student === null)
				return res.status(400).json(Response.error('No such student with that matric number!'))

			// read a project for this student
			readOne(PROJECT, { owner: student.id })
				.then(async project => {
					if (project === null) {
						// project has not yet been created for this student
						// create a new project
						return await save(PROJECT, { owner: student.id, created: new Date() })
					}
					return project
				})
				.then(async project => {
					// if the project is already approved, refuse to add topics
					if (project.approvedTopic)
						return res.status(400).json(Response.error('A topic has already been approved!'))

					const associatedTopics = await readMany(TOPIC, { projectId: project.id, reviewed: false })

					// if the project already contains 3 unreviewed topics, refuse to add it.
					if (associatedTopics.length >= 3)
						return res.status(400).json(Response.error('3 Topics have already been proposed!'))

					// if adding the new topics makes the count more than 3, refuse to add it
					if (associatedTopics.length + topics.length > 3)
						return res
							.status(400)
							.json(
								Response.error(
									`You cannot have more than 3 proposed topics at a time. You already have ${associatedTopics.length} proposed topics!`
								)
							)

					// if one of the topics has previously been proposed, refuse to add it
					const alreadyPoposedTopics = associatedTopics.filter(topic => topics.includes(topic.title))

					if (alreadyPoposedTopics.length > 0)
						return res.status(400).json(
							Response.error('One or more topics have already been proposed!', {
								alreadyPoposedTopics
							})
						)

					const restructuredData = topics.map(topic => ({
						projectId: project.id,
						title: topic,
						reviewed: false
					}))

					// associate the topics with the project
					insertMany(TOPIC, restructuredData)
						.then(topics => {
							res.status(200).json(Response.success('Topics added!', topics))
						})
						.catch(err => {
							logger.error(
								`failed to write topics for student with: ${matricNo} - failed with message - ${err.message}.\n topics - ${topics}`
							)
							res.status(500).json(Response.fatal())
						})
				})
				.catch(err => {
					logger.error(
						`failed to write topics for student with: ${matricNo} - failed with message - ${err.message}.\n topics - ${topics}`
					)
					res.status(500).json(Response.fatal())
				})
		})
		.catch(err => {
			logger.error(`Failed to readStudent with matricNo: ${matricNo} - failed with message - ${err.message}`)
			res.status(500).json(Response.fatal())
		})
}

// Approve a project topic. which also approves the project
async function approveProject(req, res) {
	const [isValid, errors] = validate(validateApproveTopicRequest, req.body)
	if (!isValid) return res.status(400).json(Response.error('Invalid request!', errors))

	const { topicId, lecturerId } = { ...req.body }

	exists(LECTURER, { _id: lecturerId })
		.then(lecturerExists => {
			if (!lecturerExists) return res.status(400).json(Response.error('Unknown LecturerId!'))
			return readOne(TOPIC, { _id: topicId })
		})
		.then(async topic => {
			if (!topic) return res.status(400).json(Response.error('Could not find that topic to approve!'))

			// refuse to approve a topic if a topic was already approved
			try {
				const project = await readOne(PROJECT, { _id: topic.projectId })
				if (project.approvedTopic)
					return res.status(400).json(Response.error('A topic was previously approved for this project!'))
			} catch (error) {
				logger.error(`Failed to read project - failed with message - ${error.message}`)
				return res.status(500).json(Response.fatal())
			}

			// mark all the topics as reviewed
			await updateMany(TOPIC, { projectId: topic.projectId, reviewed: false }, { reviewed: true })

			update(PROJECT, { _id: topic.projectId }, { approvedTopic: topic.id, approvedBy: lecturerId })
				.then(() => {
					res.status(200).json(Response.success('Approved!'))
				})
				.catch(err => {
					logger.error(`Failed to approve topic - failed with message - ${err.message}`)
					res.status(500).json(Response.fatal())
				})
		})
		.catch(err => {
			logger.error(`Failed to approve topic - failed with message - ${err.message}`)
			res.status(500).json(Response.fatal('One of the ID may be invalid'))
		})
}

// Reject all project topics
async function rejectPendingTopics(req, res) {
	const [isValid, errors] = validate(validateRejectProjectTopicsRequest, req.body)
	if (!isValid) return res.status(400).json(Response.error('Invalid request!', errors))

	const { projectId } = { ...req.body }

	readOne(PROJECT, { _id: projectId })
		.then(project => {
			if (!project) return res.status(400).json(Response.error('Could not find that project to review!'))

			// if a project has been approved
			if (project.approvedTopic)
				return res
					.status(400)
					.json(Response.error('Cannot reject topics on a project that has an approved topic!'))

			updateMany(TOPIC, { projectId: project.id, reviewed: false }, { reviewed: true })
				.then(() => {
					res.status(200).json(Response.success('Project reviewed!'))
				})
				.catch(err => {
					logger.error(`Failed to review project - failed with message - ${err.message}`)
					res.status(500).json(Response.fatal())
				})
		})
		.catch(err => {
			logger.error(`Failed to approve topic - failed with message - ${err.message}`)
			res.status(500).json(Response.fatal('One of the ID may be invalid'))
		})
}

// read topics pending approval
// grouped by projects
function readPendingProjects(_req, res) {
	// read projects pending approval
	readMany(PROJECT, { approvedTopic: null }, { populate: ['owner'] })
		.then(async projects => {
			const projectIds = projects.map(p => p.id.toString())
			// get the associated topics
			return { projects, topics: await readMany(TOPIC, { projectId: { $in: projectIds }, reviewed: false }) }
		})
		.then(data => {
			// group topics by projects
			const { projects, topics } = JSON.parse(JSON.stringify(data))
			const projectMap = projects.reduce((acc, proj) => ({ ...acc, [proj.id]: { ...proj, topics: [] } }), {})

			const grouped = topics.reduce((groupedSoFar, topic) => {
				const associatedProject = topic.projectId
				if (groupedSoFar[associatedProject])
					groupedSoFar[associatedProject].topics = [...groupedSoFar[associatedProject].topics, topic]
				return groupedSoFar
			}, projectMap)

			const filteredGrouped = Object.values(grouped).filter(project => project.topics.length > 0)
			res.status(200).json(Response.success('Done!', filteredGrouped))
		})
		.catch(err => {
			logger.error(`Failed to read unapproved topics - failed with message - ${err.message}`)
			res.status(500).json(Response.fatal())
		})
}

// read all topics for a particular student
function readSingleProjectForStudent(req, res) {
	const [isValid, errors] = validate(validateGetProjectRequest, req.query)
	if (!isValid) return res.status(400).json(Response.error('Invalid request!', errors))

	const { matricNo } = req.query

	readOne(STUDENT, { matricNo })
		.then(student => {
			if (!student) return res.status(400).json(Response.error('No such student with that matric number!'))

			return readOne(PROJECT, { owner: student.id }, { populate: ['approvedBy', 'approvedTopic'] })
		})
		.then(project => {
			readMany(TOPIC, { projectId: project.id }).then(topics => {
				const responseObject = JSON.parse(JSON.stringify(project))
				const topicsList = JSON.parse(JSON.stringify(topics))

				responseObject.topics = topicsList
				res.status(200).json(Response.success('Done.', responseObject))
			})
		})
}

// upload a document associated with a single project
function uploadDoc(req, res) {
    // A0K2ld8g3RVeE5nhJnUz7z - file stack
    const [isValid, errors] = validate(validateSaveUpload, req.body)
	if (!isValid) return res.status(400).json(Response.error('Invalid request!', errors)) 

	const uploadDetails = req.body

	//save upload details to db
	// read a project for this student
	readOne(PROJECT, { id: uploadDetails.projectId })
	.then(async project => {
		if (project === null) {
			// project does not exist for thist student, error out
			return res.status(400).json(Response.error('Could not find project'))
		}

		if (project.approvedTopic === null || project.approvedTopic === undefined) {
			// no approved topic, reject
			return res.status(400).json(Response.error('No topics have been approved yet!'))
		}

		return project
	})
	.then(async project => {
		save(UPLOAD, uploadDetails)
		.then(savedDoc => {
			res.status(200).json(Response.success('Done.', responseObject))
		})
		.catch(err => {
			logger.error(
				`failed to save upload - failed with message - ${err.message}.\n`
			)
			res.status(500).json(Response.fatal())
		})
	})

}
