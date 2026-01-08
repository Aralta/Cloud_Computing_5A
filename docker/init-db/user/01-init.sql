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
-- Utilisateurs de test (mot de passe: test123 pour tous)
-- Hash bcrypt généré avec passlib
-- ============================================
INSERT INTO users (email, password, name) 
VALUES ('test@test.com', '$2b$12$2hPu17so0yeCfdyw6slcROvJbKPWooj1UZfhvmqVQmFzgOx2SzGtm', 'Test User')
ON CONFLICT (email) DO NOTHING;

-- Utilisateur admin (mot de passe: admin123)
INSERT INTO users (email, password, name) 
VALUES ('admin@calendar.com', '$2b$12$2hPu17so0yeCfdyw6slcROvJbKPWooj1UZfhvmqVQmFzgOx2SzGtm', 'Admin')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Utilisateurs supplémentaires (mot de passe: test123 pour tous)
-- ============================================
INSERT INTO users (email, password, name) 
VALUES ('alice@calendar.com', '$2b$12$2hPu17so0yeCfdyw6slcROvJbKPWooj1UZfhvmqVQmFzgOx2SzGtm', 'Alice Martin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, name) 
VALUES ('bob@calendar.com', '$2b$12$2hPu17so0yeCfdyw6slcROvJbKPWooj1UZfhvmqVQmFzgOx2SzGtm', 'Bob Dupont')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, name) 
VALUES ('charlie@calendar.com', '$2b$12$2hPu17so0yeCfdyw6slcROvJbKPWooj1UZfhvmqVQmFzgOx2SzGtm', 'Charlie Bernard')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, name) 
VALUES ('diana@calendar.com', '$2b$12$2hPu17so0yeCfdyw6slcROvJbKPWooj1UZfhvmqVQmFzgOx2SzGtm', 'Diana Leroy')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, name) 
VALUES ('emma@calendar.com', '$2b$12$2hPu17so0yeCfdyw6slcROvJbKPWooj1UZfhvmqVQmFzgOx2SzGtm', 'Emma Moreau')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password, name) 
VALUES ('francois@calendar.com', '$2b$12$2hPu17so0yeCfdyw6slcROvJbKPWooj1UZfhvmqVQmFzgOx2SzGtm', 'François Petit')
ON CONFLICT (email) DO NOTHING;

COMMENT ON TABLE users IS 'Table des utilisateurs de l''application calendrier';
