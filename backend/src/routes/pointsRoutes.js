// pointsRoutes.js
const express = require('express');
const router = express.Router();
const pointsController = require('../controllers/pointsController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);
router.get('/', pointsController.getPoints);
router.post('/convert', pointsController.convertPoints);
module.exports = router;