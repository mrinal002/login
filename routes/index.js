const express = require("express");
//check erro const router =  Router()
const router = express.Router();

router.get('/', (req, res) => res.render('welcome'));

module.exports = router;