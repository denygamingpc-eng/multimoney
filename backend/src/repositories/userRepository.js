const db = require('../config/database');

class UserRepository {
    async findByEmailOrPhone(identifier) {
        const query = 'SELECT * FROM users WHERE email = $1 OR phone = $1';
        const result = await db.query(query, [identifier]);
        return result.rows[0];
    }

    async findById(id) {
        const query = 'SELECT id, full_name, email, phone, points, kyc_status FROM users WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    async create(userData) {
        const { full_name, email, phone, password_hash, bi_number } = userData;
        const query = `
            INSERT INTO users (full_name, email, phone, password_hash, bi_number)
            VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email
        `;
        const result = await db.query(query, [full_name, email, phone, password_hash, bi_number]);
        return result.rows[0];
    }

    async updatePoints(userId, points, client = db) {
        const query = 'UPDATE users SET points = points + $1 WHERE id = $2';
        return client.query(query, [points, userId]);
    }
}

module.exports = new UserRepository();