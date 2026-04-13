const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const db = require('../config/database');

class AuthService {
    async registerUser(data) {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const password_hash = await bcrypt.hash(data.password, 12);
            const user = await userRepository.create({ ...data, password_hash });

            // Criação das carteiras iniciais
            const currencies = ['AOA', 'USD', 'EUR', 'BRL'];
            for (const curr of currencies) {
                await client.query('INSERT INTO wallets (user_id, currency, balance) VALUES ($1, $2, 0)', [user.id, curr]);
            }

            await client.query('COMMIT');
            return user;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    async generateToken(userId) {
        return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'multimoney_super_secret_key', { expiresIn: '1d' });
    }
}

module.exports = new AuthService();