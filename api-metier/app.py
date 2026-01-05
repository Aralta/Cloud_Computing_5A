#!/usr/bin/env python3
"""
API Métier - Gestion des événements calendrier
"""

import os
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///events.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# ============================================
# Modèles
# ============================================
class Event(db.Model):
    __tablename__ = 'events'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    viewers = db.Column(db.JSON, default=[])
    editors = db.Column(db.JSON, default=[])
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'start': self.start_date.isoformat(),
            'end': self.end_date.isoformat(),
            'user_id': self.user_id,
            'viewers': self.viewers or [],
            'editors': self.editors or [],
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


# ============================================
# Routes
# ============================================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'api-metier', 'timestamp': datetime.utcnow().isoformat()})


@app.route('/api/events', methods=['GET'])
def get_events():
    """Liste des événements"""
    user_id = request.args.get('user_id', type=int)
    
    if user_id:
        events = Event.query.filter(
            (Event.user_id == user_id) |
            (Event.viewers.contains([user_id])) |
            (Event.editors.contains([user_id]))
        ).all()
    else:
        events = Event.query.all()
    
    return jsonify([e.to_dict() for e in events])


@app.route('/api/events', methods=['POST'])
def create_event():
    """Créer un événement"""
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('start') or not data.get('end'):
        return jsonify({'error': 'Champs requis manquants'}), 400
    
    event = Event(
        title=data['title'],
        description=data.get('description', ''),
        start_date=datetime.fromisoformat(data['start'].replace('Z', '+00:00')),
        end_date=datetime.fromisoformat(data['end'].replace('Z', '+00:00')),
        user_id=data.get('user_id', 1),
        viewers=data.get('viewers', []),
        editors=data.get('editors', [])
    )
    
    db.session.add(event)
    db.session.commit()
    
    return jsonify(event.to_dict()), 201


@app.route('/api/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    """Détails d'un événement"""
    event = Event.query.get_or_404(event_id)
    return jsonify(event.to_dict())


@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    """Modifier un événement"""
    event = Event.query.get_or_404(event_id)
    data = request.get_json()
    
    if 'title' in data:
        event.title = data['title']
    if 'description' in data:
        event.description = data['description']
    if 'start' in data:
        event.start_date = datetime.fromisoformat(data['start'].replace('Z', '+00:00'))
    if 'end' in data:
        event.end_date = datetime.fromisoformat(data['end'].replace('Z', '+00:00'))
    if 'viewers' in data:
        event.viewers = data['viewers']
    if 'editors' in data:
        event.editors = data['editors']
    
    db.session.commit()
    
    return jsonify(event.to_dict())


@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    """Supprimer un événement"""
    event = Event.query.get_or_404(event_id)
    db.session.delete(event)
    db.session.commit()
    
    return '', 204


# ============================================
# Main
# ============================================
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    port = int(os.getenv('PORT', 3001))
    debug = os.getenv('DEBUG', '0') == '1'
    
    print(f"\n{'='*50}")
    print(f"🚀 API Métier démarrée sur http://0.0.0.0:{port}")
    print(f"{'='*50}\n")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
