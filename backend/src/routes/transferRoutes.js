const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const authMiddleware = require('../middlewares/authMiddleware');

// Proteção global para transferências
router.use(authMiddleware);

// Enviar dinheiro (por Telefone ou Email)
// POST /api/transfer/send
router.post('/send', transferController.sendMoney);

// Pagamento via QR Code (Geral)
// POST /api/transfer/qr-pay
router.post('/qr-pay', transferController.payViaQRCode);

module.exports = router;