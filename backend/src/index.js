const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// ================= CONFIG =================
dotenv.config();

const app = express();

// ================= SECURITY HEADERS =================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// ================= CORS CONFIG (PRODUÇÃO SEGURA) =================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'https://multimoney.onrender.com',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS bloqueado'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ================= PARSE JSON =================
app.use(express.json());

// ================= LOGS =================
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')
);

// ================= RATE LIMIT GLOBAL =================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Muitas requisições. Tente novamente mais tarde.',
  },
});

// ================= RATE LIMIT AUTH =================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: 'Muitas tentativas de login. Tente novamente mais tarde.',
  },
});

app.use('/api/', globalLimiter);

// ================= ROUTES IMPORT =================
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transferRoutes = require('./routes/transferRoutes');
const taxiRoutes = require('./routes/taxiRoutes');
const loanRoutes = require('./routes/loanRoutes');
const pointsRoutes = require('./routes/pointsRoutes');

// ================= BASE ROUTES =================
app.get('/', (req, res) => {
  res.status(200).json({
    app: 'MULTIMONEY API',
    status: 'Operacional',
    region: 'Angola',
    version: '1.0.0',
  });
});

// HEALTH CHECK
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// ================= API ROUTES =================
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/taxi', taxiRoutes);
app.use('/api/loan', loanRoutes);
app.use('/api/points', pointsRoutes);

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
  });
});

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error('🔥 SERVER ERROR:', err.stack);

  res.status(err.status || 500).json({
    error: 'Erro interno no servidor',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Algo deu errado.',
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 MULTIMONEY API rodando na porta ${PORT}`);
  console.log(`🌍 Produção: https://multimoney.onrender.com`);
});
