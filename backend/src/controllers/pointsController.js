const db = require('../config/database');

exports.getPoints = async (req, res) => {
  try {
    const result = await db.query('SELECT points FROM users WHERE id = $1', [req.userId]);
    res.status(200).json({ points: result.rows[0].points });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pontos.' });
  }
};

exports.convertPoints = async (req, res) => {
  const { points_to_convert } = req.body; // Ex: 100 pontos = 100 AOA
  const userId = req.userId;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const user = await client.query('SELECT points FROM users WHERE id = $1 FOR UPDATE', [userId]);
    if (user.rows[0].points < points_to_convert) throw new Error('Pontos insuficientes.');

    // Deduz pontos
    await client.query('UPDATE users SET points = points - $1 WHERE id = $2', [points_to_convert, userId]);

    // Adiciona saldo (AOA)
    await client.query('UPDATE wallets SET balance = balance + $1 WHERE user_id = $2 AND currency = $3', [points_to_convert, userId, 'AOA']);

    await client.query('COMMIT');
    res.status(200).json({ message: 'Pontos convertidos em saldo Kwanza!' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};