const db = require('../config/database');

exports.sendMoney = async (req, res) => {
  const { recipient_identifier, amount, currency, reference } = req.body;
  const senderId = req.userId;

  // Validação básica
  if (!recipient_identifier || !amount || amount <= 0 || !currency) {
    return res.status(400).json({ error: 'Dados de transferência inválidos.' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN'); // INÍCIO DA TRANSAÇÃO ATÔMICA

    // 1. Localizar destinatário (por telefone ou email)
    const receiverRes = await client.query(
      'SELECT id FROM users WHERE phone = $1 OR email = $1',
      [recipient_identifier]
    );

    if (receiverRes.rows.length === 0) {
      throw new Error('Destinatário não encontrado.');
    }

    const receiverId = receiverRes.rows[0].id;

    if (receiverId === senderId) {
      throw new Error('Você não pode enviar dinheiro para si mesmo.');
    }

    // 2. Verificar saldo e bloquear linha da carteira do remetente (FOR UPDATE evita Double Spending)
    const senderWalletRes = await client.query(
      'SELECT id, balance FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE',
      [senderId, currency]
    );

    if (senderWalletRes.rows.length === 0 || senderWalletRes.rows[0].balance < amount) {
      throw new Error('Saldo insuficiente na carteira selecionada.');
    }

    const senderWalletId = senderWalletRes.rows[0].id;

    // 3. Localizar carteira do destinatário
    const receiverWalletRes = await client.query(
      'SELECT id FROM wallets WHERE user_id = $1 AND currency = $2',
      [receiverId, currency]
    );

    if (receiverWalletRes.rows.length === 0) {
      throw new Error('Destinatário não possui uma carteira nesta moeda.');
    }

    const receiverWalletId = receiverWalletRes.rows[0].id;

    // 4. EXECUTAR DÉBITO E CRÉDITO
    await client.query(
      'UPDATE wallets SET balance = balance - $1 WHERE id = $2',
      [amount, senderWalletId]
    );

    await client.query(
      'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
      [amount, receiverWalletId]
    );

    // 5. REGISTRAR NO HISTÓRICO
    const transactionRecord = await client.query(
      `INSERT INTO transactions
      (sender_wallet_id, receiver_wallet_id, amount, currency, type, reference, status)
      VALUES ($1, $2, $3, $4, 'TRANSFER', $5, 'COMPLETED') RETURNING id`,
      [senderWalletId, receiverWalletId, amount, currency, reference || 'Transferência MULTIMONEY']
    );

    await client.query('COMMIT'); // FINALIZA COM SUCESSO

    res.status(200).json({
      message: 'Transferência realizada com sucesso!',
      transaction_id: transactionRecord.rows[0].id,
      amount,
      currency
    });

  } catch (error) {
    await client.query('ROLLBACK'); // CANCELA TUDO SE ALGO FALHAR
    console.error('Erro na transferência:', error.message);
    res.status(400).json({ error: error.message || 'Falha ao processar transferência.' });
  } finally {
    client.release();
  }
};

exports.payViaQRCode = async (req, res) => {
  // Lógica similar ao sendMoney, mas decodificando o QR Token
  // Em Angola, isso será usado para pagar em lojas e taxistas
  // (Implementação resumida para este lote, seguindo a mesma lógica ACID acima)
  res.status(501).json({ message: "Processamento de QR Code em homologação." });
};