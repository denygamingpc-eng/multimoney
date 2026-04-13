const db = require('../config/database');

exports.requestLoan = async (req, res) => {
  const { amount, interest_rate, due_date } = req.body;
  const requesterId = req.userId;

  try {
    const result = await db.query(
      'INSERT INTO loans (requester_id, amount, interest_rate, due_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [requesterId, amount, interest_rate, due_date, 'REQUESTED']
    );
    res.status(201).json({ message: 'Solicitação de empréstimo publicada.', loan: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao solicitar empréstimo.' });
  }
};

exports.acceptLoan = async (req, res) => {
  const { loan_id } = req.body;
  const lenderId = req.userId;
  const currency = 'AOA';

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Buscar detalhes do empréstimo
    const loan = await client.query('SELECT * FROM loans WHERE id = $1 AND status = $2 FOR UPDATE', [loan_id, 'REQUESTED']);
    if (loan.rows.length === 0) throw new Error('Empréstimo não disponível.');

    const amount = loan.rows[0].amount;
    const requesterId = loan.rows[0].requester_id;

    // 2. Verificar saldo do emprestador (Lender)
    const lenderWallet = await client.query('SELECT id, balance FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE', [lenderId, currency]);
    if (lenderWallet.rows[0].balance < amount) throw new Error('Saldo insuficiente para emprestar.');

    // 3. Executar transferência do empréstimo
    const requesterWallet = await client.query('SELECT id FROM wallets WHERE user_id = $1 AND currency = $2', [requesterId, currency]);

    await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [amount, lenderWallet.rows[0].id]);
    await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [amount, requesterWallet.rows[0].id]);

    // 4. Atualizar status do empréstimo
    await client.query('UPDATE loans SET lender_id = $1, status = $2 WHERE id = $3', [lenderId, 'ACTIVE', loan_id]);

    // 5. Log da transação
    await client.query('INSERT INTO transactions (sender_wallet_id, receiver_wallet_id, amount, currency, type, reference) VALUES ($1, $2, $3, $4, $5, $6)',
      [lenderWallet.rows[0].id, requesterWallet.rows[0].id, amount, currency, 'TRANSFER', 'Empréstimo P2P MULTIMONEY']);

    await client.query('COMMIT');
    res.status(200).json({ message: 'Você concedeu o empréstimo com sucesso!' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};