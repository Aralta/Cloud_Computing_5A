-- Initialisation de la base de données Users (API Utilisateur)
-- Ce script est exécuté automatiquement au premier démarrage de PostgreSQL

-- ============================================
-- Table des utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
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
-- Hash bcrypt généré avec passlib
-- ============================================
INSERT INTO users (email, password, name) 
VALUES ('test@test.com', '$2b$12$2hPu17so0yeCfdyw6slcROvJbKPWooj1UZfhvmqVQmFzgOx2SzGtm', 'Test User')
ON CONFLICT (email) DO NOTHING;

-- Utilisateur admin (mot de passe: admin123)
INSERT INTO users (email, password, name) 
VALUES ('admin@calendar.com', '$2b$12$2hPu17so0yeCfdyw6slcROvJbKPWooj1UZfhvmqVQmFzgOx2SzGtm', 'Admin')
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE users IS 'Table des utilisateurs de l''application calendrier';
