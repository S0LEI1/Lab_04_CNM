const path = require('path');
const express = require('express');
const homeController = require('../controller/home');
const router = express.Router();


router.get('/',homeController.getAll);
router.post('/save', homeController.addCourse);
router.post('/delete', homeController.deleteCourse)
module.exports = router;