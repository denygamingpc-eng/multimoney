-- Habilitar UUID para IDs mais seguros
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    kyc_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, VERIFIED, REJECTED
    bi_number VARCHAR(20) UNIQUE,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE CARTEIRAS (Multimoeda)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(3) NOT NULL, -- AOA, USD, EUR, BRL
    balance DECIMAL(20, 2) DEFAULT 0.00,
    UNIQUE(user_id, currency)
);

-- TABELA DE TRANSAÇÕES
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_wallet_id UUID REFERENCES wallets(id),
    receiver_wallet_id UUID REFERENCES wallets(id),
    amount DECIMAL(20, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    type VARCHAR(20) NOT NULL, -- TRANSFER, DEPOSIT, WITHDRAW, TAXI_PAYMENT, LOAN_PAYMENT
    status VARCHAR(20) DEFAULT 'COMPLETED',
    reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE MOTORISTAS DE TAXI
CREATE TABLE IF NOT EXISTS taxi_drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) UNIQUE,
    license_plate VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    qr_code_token TEXT UNIQUE
);

-- TABELA DE EMPRÉSTIMOS P2P
CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES users(id),
    lender_id UUID REFERENCES users(id),
    amount DECIMAL(20, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'REQUESTED', -- REQUESTED, ACTIVE, PAID, OVERDUE
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABELA DE REFERÊNCIA/INDICAÇÕES
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES users(id),
    referred_id UUID REFERENCES users(id) UNIQUE,
    reward_points INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TRIGGERS PARA ATUALIZAR O updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();