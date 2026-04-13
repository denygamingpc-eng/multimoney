const db = require('../config/database');

class WalletRepository {
    async getBalancesByUserId(userId) {
        const query = 'SELECT currency, balance FROM wallets WHERE user_id = $1 ORDER BY currency';
        const result = await db.query(query, [userId]);
        return result.rows;
    }

    async findWalletForUpdate(userId, currency, client) {
        const query = 'SELECT id, balance FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE';
        const result = await client.query(query, [userId, currency]);
        return result.rows[0];
    }

    async updateBalance(walletId, amount, client) {
        const query = 'UPDATE wallets SET balance = balance + $1 WHERE id = $2';
        return client.query(query, [amount, walletId]);
    }
}

module.exports = new WalletRepository();