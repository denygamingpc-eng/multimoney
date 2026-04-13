const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota para Registro de Novo Usuário
// POST /api/auth/register
router.post('/register', authController.register);

// Rota para Login
// POST /api/auth/login
router.post('/login', authController.login);

// Rota para Refresh Token (Manter usuário logado)
// POST /api/auth/refresh
router.post('/refresh', authController.refreshToken);

module.exports = router;