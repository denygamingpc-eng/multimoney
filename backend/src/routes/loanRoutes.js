// loanRoutes.js
const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);
router.post('/request', loanController.requestLoan);
router.post('/accept', loanController.acceptLoan);
module.exports = router;