var express = require('express')
var router = express.Router()
const { cleanDB } = require('../data')
const { Response } = require('../lib/utils/index')

/* GET home page. */
router.get('/', function (req, res, next) {
	res.render('index', { title: 'Hello world', co: 'Project Cataloging Service' })
})

router.post('/admin/cleandb', async function (req, res) {
	await cleanDB()
	res.status(200).json(Response.success('done'))
})
module.exports = router
