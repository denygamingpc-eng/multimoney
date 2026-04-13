const express = require('express');
const router = express.Router();
const taxiController = require('../controllers/taxiController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Usuário paga o taxista lendo o QR Code do carro
// POST /api/taxi/pay
router.post('/pay', taxiController.payTaxi);

// Motorista consulta suas corridas recebidas
// GET /api/taxi/history
router.get('/history', taxiController.getDriverHistory);

// Tornar-se motorista (Cadastro de Taxi)
// POST /api/taxi/register-driver
router.post('/register-driver', taxiController.registerDriver);

module.exports = router;