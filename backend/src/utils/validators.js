const { z } = require('zod');

const registerSchema = z.object({
    full_name: z.string().min(3),
    email: z.string().email(),
    phone: z.string().min(9),
    password: z.string().min(6),
    bi_number: z.string().optional()
});

const transferSchema = z.object({
    recipient_identifier: z.string(),
    amount: z.number().positive(),
    currency: z.enum(['AOA', 'USD', 'EUR', 'BRL']),
    reference: z.string().max(100).optional()
});

module.exports = { registerSchema, transferSchema };