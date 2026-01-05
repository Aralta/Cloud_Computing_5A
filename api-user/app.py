#!/usr/bin/env python3
"""
API Utilisateur - Authentification et gestion des utilisateurs
"""

import os
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import bcrypt
import jwt

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///users.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET'] = os.getenv('JWT_SECRET', 'dev_secret_key')
app.config['JWT_EXPIRATION'] = int(os.getenv('JWT_EXPIRATION', 3600))

db = SQLAlchemy(app)


# ============================================
# Modèles
# ============================================
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self, include_email=False):
        data = {
            'id': self.id,
            'name': self.name,
            'created_at': self.created_at.isoformat()
        }
        if include_email:
            data['email'] = self.email
        return data


# ============================================
# Helpers
# ============================================
def generate_token(user):
    payload = {
        'user_id': user.id,
        'email': user.email,
        'name': user.name,
        'exp': datetime.utcnow() + timedelta(seconds=app.config['JWT_EXPIRATION'])
    }
    return jwt.encode(payload, app.config['JWT_SECRET'], algorithm='HS256')


def verify_token(token):
    try:
        payload = jwt.decode(token, app.config['JWT_SECRET'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_current_user():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header[7:]
    payload = verify_token(token)
    
    if not payload:
        return None
    
    return User.query.get(payload['user_id'])


# ============================================
# Routes - Auth
# ============================================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'api-user', 'timestamp': datetime.utcnow().isoformat()})


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Connexion utilisateur"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email et mot de passe requis'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Identifiants invalides'}), 401
    
    token = generate_token(user)
    
    return jsonify({
        'token': token,
        'user': user.to_dict(include_email=True),
        'expires_in': app.config['JWT_EXPIRATION']
    })


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Déconnexion (côté client)"""
    return jsonify({'message': 'Déconnecté'})


@app.route('/api/auth/me', methods=['GET'])
def get_me():
    """Informations utilisateur courant"""
    user = get_current_user()
    
    if not user:
        return jsonify({'error': 'Non authentifié'}), 401
    
    return jsonify(user.to_dict(include_email=True))


# ============================================
# Routes - Users
# ============================================
@app.route('/api/users', methods=['GET'])
def get_users():
    """Liste des utilisateurs"""
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])


@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Détails d'un utilisateur"""
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())


@app.route('/api/users', methods=['POST'])
def create_user():
    """Créer un utilisateur (inscription)"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'error': 'Champs requis manquants'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email déjà utilisé'}), 409
    
    user = User(
        email=data['email'],
        name=data['name']
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    token = generate_token(user)
    
    return jsonify({
        'token': token,
        'user': user.to_dict(include_email=True)
    }), 201


# ============================================
# Main
# ============================================
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Créer un utilisateur de test si la DB est vide
        if not User.query.first():
            test_user = User(email='test@test.com', name='Test User')
            test_user.set_password('test123')
            db.session.add(test_user)
            db.session.commit()
            print("✓ Utilisateur de test créé: test@test.com / test123")
    
    port = int(os.getenv('PORT', 3000))
    debug = os.getenv('DEBUG', '0') == '1'
    
    print(f"\n{'='*50}")
    print(f"🚀 API Utilisateur démarrée sur http://0.0.0.0:{port}")
    print(f"{'='*50}\n")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
