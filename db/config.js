const mongoose = require('mongoose')

mongoose.set('strictQuery', false)

function connect(cb) {
	if (!cb) throw new Error('missing callback!')
	mongoose.connect(
		`mongodb+srv://projcat:${process.env.DB_PASS}@proj-cat.ejby04i.mongodb.net/project-cataloging?retryWrites=true&w=majority`,
		{},
		cb
	)
}

exports.default = mongoose
module.exports = { connect }
