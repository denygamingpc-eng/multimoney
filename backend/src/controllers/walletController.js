const db = require('../config/database');

exports.getBalances = async (req, res) => {
  try {
    const userId = req.userId;

    // Busca todas as carteiras do usuário
    const result = await db.query(
      'SELECT currency, balance FROM wallets WHERE user_id = $1 ORDER BY currency ASC',
      [userId]
    );

    res.status(200).json({
      status: 'success',
      data: result.rows // Retorna array: [{currency: 'AOA', balance: 500}, {currency: 'USD', balance: 10}...]
    });
  } catch (error) {
    console.error('Erro ao buscar saldos:', error);
    res.status(500).json({ error: 'Erro ao processar consulta de saldo.' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.userId;

    // Busca transações onde o usuário é o remetente OU o destinatário
    // Faz join com as carteiras para saber os nomes envolvidos
    const query = `
      SELECT
        t.id,
        t.amount,
        t.currency,
        t.type,
        t.status,
        t.created_at,
        t.reference,
        CASE
          WHEN sw.user_id = $1 THEN 'OUTGOING'
          ELSE 'INCOMING'
        END as direction
      FROM transactions t
      JOIN wallets sw ON t.sender_wallet_id = sw.id
      JOIN wallets rw ON t.receiver_wallet_id = rw.id
      WHERE sw.user_id = $1 OR rw.user_id = $1
      ORDER BY t.created_at DESC
      LIMIT 20
    `;

    const result = await db.query(query, [userId]);

    res.status(200).json({
      status: 'success',
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro ao carregar histórico.' });
  }
};

exports.getStatistics = async (req, res) => {
  try {
    const userId = req.userId;

    // Query simplificada para gerar o gráfico semanal (Mock de lógica para produção)
    // Em um cenário real, usaríamos GROUP BY date_trunc('day', created_at)
    const statsQuery = `
      SELECT
        EXTRACT(DOW FROM created_at) as day_of_week,
        SUM(CASE WHEN type = 'DEPOSIT' OR (type = 'TRANSFER' AND receiver_wallet_id IN (SELECT id FROM wallets WHERE user_id = $1)) THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'WITHDRAW' OR (type = 'TRANSFER' AND sender_wallet_id IN (SELECT id FROM wallets WHERE user_id = $1)) THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY day_of_week
    `;

    const result = await db.query(statsQuery, [userId]);

    res.status(200).json({
      status: 'success',
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao processar estatísticas.' });
  }
};