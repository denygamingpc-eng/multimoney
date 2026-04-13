const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// ================= CONFIG =================
dotenv.config();

const app = express();

// ================= SEGURANÇA =================

// Helmet (proteção headers)
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// CORS seguro (ajustar domínios em produção)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'https://multimoney.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ================= MIDDLEWARES =================
app.use(express.json());

// Logs (dev vs prod)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ================= RATE LIMIT =================

// Limite geral
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Muitas requisições. Tente novamente mais tarde.'
  }
});

// Limite mais restrito para auth (anti brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'Muitas tentativas de login. Tente novamente mais tarde.'
  }
});

// Aplicar rate limit
app.use('/api/', globalLimiter);

// ================= IMPORTAÇÃO DE ROTAS =================
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transferRoutes = require('./routes/transferRoutes');
const taxiRoutes = require('./routes/taxiRoutes');
const loanRoutes = require('./routes/loanRoutes');
const pointsRoutes = require('./routes/pointsRoutes');

// ================= ROTAS BASE =================

// Root
app.get('/', (req, res) => {
  res.status(200).json({
    app: "MULTIMONEY API",
    status: "Operacional",
    region: "Angola",
    version: "1.0.0"
  });
});

// Healthcheck (produção)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// ================= ROTAS PRINCIPAIS =================
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/taxi', taxiRoutes);
app.use('/api/loan', loanRoutes);
app.use('/api/points', pointsRoutes);

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada'
  });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error('🔥 ERROR:', err.stack);

  res.status(err.status || 500).json({
    error: 'Erro interno no servidor',
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Algo deu errado.'
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 MULTIMONEY API rodando na porta ${PORT}`);
  console.log(`🌍 Produção: https://multimoney.onrender.com`);
});
