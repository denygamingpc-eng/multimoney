const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// --- CONFIG ---
dotenv.config();

const app = express();

// --- IMPORTAÇÃO DE ROTAS (SEM DUPLICAÇÃO) ---
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transferRoutes = require('./routes/transferRoutes');
const taxiRoutes = require('./routes/taxiRoutes');
const loanRoutes = require('./routes/loanRoutes');
const pointsRoutes = require('./routes/pointsRoutes');

// --- MIDDLEWARES DE SEGURANÇA ---
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- RATE LIMIT ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: {
    error: 'Muitas requisições vindas deste IP, tente novamente mais tarde.'
  }
});

app.use('/api/', limiter);

// --- ROTA BASE ---
app.get('/', (req, res) => {
  res.status(200).json({
    app: "MULTIMONEY API",
    status: "Operacional",
    region: "Angola",
    version: "1.0.0"
  });
});

// --- ROTAS PRINCIPAIS ---
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/taxi', taxiRoutes);
app.use('/api/loan', loanRoutes);
app.use('/api/points', pointsRoutes);

// --- TRATAMENTO GLOBAL DE ERROS ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: 'Erro interno no servidor',
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Algo deu errado.'
  });
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 MULTIMONEY Server rodando na porta ${PORT}`);
  console.log(`🌍 Endpoint: https://multimoney.onrender.com`);
});