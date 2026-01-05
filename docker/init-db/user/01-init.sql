-- Initialisation de la base de données Users (API Utilisateur)
-- Ce script est exécuté automatiquement au premier démarrage de PostgreSQL

-- ============================================
-- Table des utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Index pour les performances
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- Utilisateur de test (mot de passe: test123)
-- Hash bcrypt de "test123"
-- ============================================
INSERT INTO users (email, password_hash, name) 
VALUES ('test@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.JZPPGGLGBFiGHi', 'Test User')
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE users IS 'Table des utilisateurs de l''application calendrier';
