const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middlewares/authMiddleware');

// Aplicar proteção em todas as rotas de carteira
router.use(authMiddleware);

// Retornar todos os saldos (AOA, USD, EUR, BRL)
// GET /api/wallet/balances
router.get('/balances', walletController.getBalances);

// Retornar histórico de transações recente/completo
// GET /api/wallet/transactions
router.get('/transactions', walletController.getTransactions);

// Retornar estatísticas para o gráfico (Ganhos/Gastos da semana)
// GET /api/wallet/statistics
router.get('/statistics', walletController.getStatistics);

module.exports = router;