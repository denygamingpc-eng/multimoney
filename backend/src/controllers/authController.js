const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const saltRounds = 12; // Nível alto de segurança para hash

exports.register = async (req, res) => {
  const { full_name, email, phone, password, bi_number } = req.body;

  // Validação básica (Zod seria usado aqui em produção real, mas faremos direto para agilidade)
  if (!full_name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN'); // Iniciar transação (ou cria tudo ou nada)

    // 1. Verificar se usuário já existe
    const userCheck = await client.query('SELECT id FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email ou telefone já cadastrados.' });
    }

    // 2. Hash da senha
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 3. Inserir usuário
    const newUser = await client.query(
      'INSERT INTO users (full_name, email, phone, password_hash, bi_number) VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email',
      [full_name, email, phone, password_hash, bi_number]
    );

    const userId = newUser.rows[0].id;

    // 4. CRIAR CARTEIRAS MULTIMOEDA AUTOMATICAMENTE
    const currencies = ['AOA', 'USD', 'EUR', 'BRL'];
    for (const curr of currencies) {
      await client.query(
        'INSERT INTO wallets (user_id, currency, balance) VALUES ($1, $2, $3)',
        [userId, curr, 0.00]
      );
    }

    await client.query('COMMIT'); // Finalizar transação com sucesso

    // 5. Gerar Tokens
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'multimoney_super_secret_key', { expiresIn: '1d' });

    res.status(201).json({
      message: 'Usuário registrado com sucesso e carteiras configuradas.',
      user: newUser.rows[0],
      token
    });

  } catch (error) {
    await client.query('ROLLBACK'); // Cancelar tudo em caso de erro
    console.error('Erro no Registro:', error);
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  } finally {
    client.release();
  }
};

exports.login = async (req, res) => {
  const { login_credential, password } = req.body; // login_credential pode ser email ou phone

  try {
    // Buscar usuário
    const result = await db.query(
      'SELECT id, full_name, email, password_hash FROM users WHERE email = $1 OR phone = $1',
      [login_credential]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const user = result.rows[0];

    // Verificar senha
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Gerar JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'multimoney_super_secret_key', { expiresIn: '1d' });

    res.status(200).json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email
      },
      token
    });

  } catch (error) {
    console.error('Erro no Login:', error);
    res.status(500).json({ error: 'Erro ao processar login.' });
  }
};

exports.refreshToken = async (req, res) => {
  // Lógica simples de renovação de token
  const { token } = req.body;
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'multimoney_super_secret_key');
    const newToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET || 'multimoney_super_secret_key', { expiresIn: '1d' });
    res.status(200).json({ token: newToken });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};