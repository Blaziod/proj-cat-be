var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Hello world', co: 'Project Cataloging Service' });
});

module.exports = router;


