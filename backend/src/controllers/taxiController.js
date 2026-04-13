const db = require('../config/database');

exports.registerDriver = async (req, res) => {
  const { license_plate } = req.body;
  const userId = req.userId;

  try {
    const result = await db.query(
      'INSERT INTO taxi_drivers (user_id, license_plate, qr_code_token) VALUES ($1, $2, $3) RETURNING *',
      [userId, license_plate, `TAXI-${userId}-${Date.now()}`]
    );
    res.status(201).json({ message: 'Cadastro de motorista concluído', driver: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar motorista.' });
  }
};

exports.payTaxi = async (req, res) => {
  const { driver_id, amount } = req.body;
  const passengerId = req.userId;
  const currency = 'AOA'; // Taxi geralmente em Kwanza

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Validar Saldo Passageiro
    const passWallet = await client.query('SELECT id, balance FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE', [passengerId, currency]);
    if (passWallet.rows[0].balance < amount) throw new Error('Saldo insuficiente para a corrida.');

    // 2. Localizar Carteira Motorista
    const driverWallet = await client.query('SELECT id FROM wallets WHERE user_id = $1 AND currency = $2', [driver_id, currency]);

    // 3. Transferência
    await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [amount, passWallet.rows[0].id]);
    await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [amount, driverWallet.rows[0].id]);

    // 4. Registrar Transação
    await client.query('INSERT INTO transactions (sender_wallet_id, receiver_wallet_id, amount, currency, type, reference) VALUES ($1, $2, $3, $4, $5, $6)',
      [passWallet.rows[0].id, driverWallet.rows[0].id, amount, currency, 'TAXI_PAYMENT', 'Pagamento de Corrida Taxi']);

    // 5. Bonificação em Pontos (Fidelidade)
    await client.query('UPDATE users SET points = points + 10 WHERE id = $1', [passengerId]);

    await client.query('COMMIT');
    res.status(200).json({ message: 'Corrida paga com sucesso! Você ganhou 10 pontos.' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

exports.getDriverHistory = async (req, res) => {
    const userId = req.userId;
    try {
        const result = await db.query(
            `SELECT t.* FROM transactions t
             JOIN wallets w ON t.receiver_wallet_id = w.id
             WHERE w.user_id = $1 AND t.type = 'TAXI_PAYMENT' ORDER BY t.created_at DESC`,
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar histórico do motorista.' });
    }
};