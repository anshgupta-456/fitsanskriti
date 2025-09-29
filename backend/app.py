from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import json
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "fitness_app.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')

db = SQLAlchemy(app)

# Models
class Gym(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    rating = db.Column(db.Float, default=0.0)
    review_count = db.Column(db.Integer, default=0)
    distance = db.Column(db.Float, default=0.0)
    price_per_month = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(200))
    phone = db.Column(db.String(20))
    website = db.Column(db.String(200))
    description = db.Column(db.Text)
    is_open = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    amenities = db.relationship('GymAmenity', backref='gym', lazy=True, cascade='all, delete-orphan')
    operating_hours = db.relationship('GymOperatingHours', backref='gym', lazy=True, cascade='all, delete-orphan')
    equipment = db.relationship('GymEquipment', backref='gym', lazy=True, cascade='all, delete-orphan')
    classes = db.relationship('GymClass', backref='gym', lazy=True, cascade='all, delete-orphan')

class GymAmenity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gym_id = db.Column(db.Integer, db.ForeignKey('gym.id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)

class GymOperatingHours(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gym_id = db.Column(db.Integer, db.ForeignKey('gym.id'), nullable=False)
    day_of_week = db.Column(db.String(10), nullable=False)  # 'weekdays' or 'weekends'
    open_time = db.Column(db.String(10), nullable=False)  # 'HH:MM' format
    close_time = db.Column(db.String(10), nullable=False)  # 'HH:MM' format

class GymEquipment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gym_id = db.Column(db.Integer, db.ForeignKey('gym.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)

class GymClass(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gym_id = db.Column(db.Integer, db.ForeignKey('gym.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    username = db.Column(db.String(100), unique=True)
    password_hash = db.Column(db.String(255))
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    height = db.Column(db.Float)
    weight = db.Column(db.Float)
    fitness_level = db.Column(db.String(20))  # 'beginner', 'intermediate', 'advanced'
    location = db.Column(db.String(200))
    bio = db.Column(db.Text)
    avatar_url = db.Column(db.String(200))
    goals = db.Column(db.Text)  # JSON array string
    preferred_workout_time = db.Column(db.String(50))
    availability_schedule = db.Column(db.Text)  # JSON object string
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_active = db.Column(db.DateTime, default=datetime.utcnow)

class ScheduledWorkout(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # in minutes
    workout_type = db.Column(db.String(50), nullable=False)
    partner_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    location = db.Column(db.String(200))
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='scheduled')  # 'scheduled', 'completed', 'cancelled'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref='scheduled_workouts')
    partner = db.relationship('User', foreign_keys=[partner_id], backref='partner_workouts')

class Exercise(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 'strength', 'cardio', 'flexibility'
    duration = db.Column(db.Integer, nullable=False)  # in minutes
    difficulty = db.Column(db.String(20), nullable=False)  # 'beginner', 'intermediate', 'advanced'
    description = db.Column(db.Text)
    equipment = db.Column(db.Text)  # JSON string of equipment list
    muscle_groups = db.Column(db.Text)  # JSON string of muscle groups
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Partner/Connections models
class FitnessPartner(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    partner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, declined, blocked
    compatibility_score = db.Column(db.Float)
    match_factors = db.Column(db.Text)  # JSON array string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_interaction = db.Column(db.DateTime)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'partner_id', name='uq_user_partner'),
    )

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(50), default='text')
    is_read = db.Column(db.Boolean, default=False)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)
    read_at = db.Column(db.DateTime)

class PartnerPreference(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    min_age = db.Column(db.Integer)
    max_age = db.Column(db.Integer)
    preferred_fitness_levels = db.Column(db.Text)  # JSON array
    max_distance_km = db.Column(db.Integer)
    preferred_workout_times = db.Column(db.Text)  # JSON array
    preferred_goals = db.Column(db.Text)  # JSON array
    gender_preference = db.Column(db.String(20))
    language_preferences = db.Column(db.Text)  # JSON array
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# API Routes

@app.route('/')
def index():
    return jsonify({
        'message': 'FitSanskriti API',
        'version': '1.0.0',
        'endpoints': {
            'gyms': '/api/gyms',
            'workouts': '/api/workouts',
            'exercises': '/api/exercises',
            'users': '/api/users',
            'auth_register': '/api/auth/register',
            'auth_login': '/api/auth/login',
            'profile': '/api/profile',
            'partners_recommendations': '/api/partners/recommendations',
            'partners_search': '/api/partners/search',
            'partners_connect': '/api/partners/connect'
        }
    })

# -------- AUTH ---------
def _generate_token(user_id: int):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    required = ['name', 'email', 'password']
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({'success': False, 'error': f'Missing fields: {", ".join(missing)}'}), 400

    # Optional smart-connection fields
    username = data.get('username') or data['email']
    if User.query.filter((User.email == data['email']) | (User.username == username)).first():
        return jsonify({'success': False, 'error': 'User already exists'}), 400

    user = User(
        name=data['name'],
        email=data['email'],
        username=username,
        password_hash=generate_password_hash(data['password']),
        gender=data.get('gender'),
        height=data.get('height'),
        weight=data.get('weight'),
        age=data.get('age'),
        fitness_level=data.get('fitness_level'),
        location=data.get('location'),
        bio=data.get('bio'),
        avatar_url=data.get('avatar_url'),
        goals=json.dumps(data.get('goals', [])) if isinstance(data.get('goals'), list) else data.get('goals'),
        preferred_workout_time=data.get('preferred_workout_time'),
        availability_schedule=json.dumps(data.get('availability_schedule', {})) if isinstance(data.get('availability_schedule'), dict) else data.get('availability_schedule'),
        last_active=datetime.utcnow(),
    )
    db.session.add(user)
    db.session.commit()

    token = _generate_token(user.id)
    return jsonify({'success': True, 'token': token, 'user_id': user.id})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = data.get('email') or data.get('username')
    password = data.get('password')
    if not identifier or not password:
        return jsonify({'success': False, 'error': 'Email/username and password required'}), 400

    user = User.query.filter((User.email == identifier) | (User.username == identifier)).first()
    if not user or not user.password_hash or not check_password_hash(user.password_hash, password):
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

    user.last_active = datetime.utcnow()
    db.session.commit()
    token = _generate_token(user.id)
    return jsonify({'success': True, 'token': token, 'user': {
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'username': user.username,
        'fitness_level': user.fitness_level,
    }})

@app.route('/api/profile', methods=['GET', 'PUT'])
def profile():
    # Simple token in Authorization: Bearer <token>
    auth_header = request.headers.get('Authorization', '')
    token = auth_header.replace('Bearer ', '') if auth_header.startswith('Bearer ') else None
    if not token:
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
    except Exception:
        return jsonify({'success': False, 'error': 'Invalid token'}), 401

    user = User.query.get(payload.get('user_id'))
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    if request.method == 'GET':
        return jsonify({'success': True, 'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'username': user.username,
            'age': user.age,
            'gender': user.gender,
            'height': user.height,
            'weight': user.weight,
            'fitness_level': user.fitness_level,
            'location': user.location,
            'bio': user.bio,
            'avatar_url': user.avatar_url,
            'goals': json.loads(user.goals) if user.goals else [],
            'preferred_workout_time': user.preferred_workout_time,
            'availability_schedule': json.loads(user.availability_schedule) if user.availability_schedule else {},
        }})

    # PUT update
    data = request.get_json() or {}
    for field in ['name','age','gender','height','weight','fitness_level','location','bio','avatar_url','preferred_workout_time']:
        if field in data:
            setattr(user, field, data[field])
    if 'goals' in data:
        user.goals = json.dumps(data['goals']) if isinstance(data['goals'], list) else data['goals']
    if 'availability_schedule' in data:
        user.availability_schedule = json.dumps(data['availability_schedule']) if isinstance(data['availability_schedule'], dict) else data['availability_schedule']
    user.last_active = datetime.utcnow()
    db.session.commit()
    return jsonify({'success': True})

# -------- PARTNERS ---------
@app.route('/api/partners/search', methods=['GET'])
def partners_search():
    # filters: q, fitness_level, min_age, max_age, location
    q = request.args.get('q', '').strip().lower()
    fitness_level = request.args.get('fitness_level')
    min_age = request.args.get('min_age', type=int)
    max_age = request.args.get('max_age', type=int)
    location = request.args.get('location')

    query = User.query.filter(User.is_active == True)
    if q:
        query = query.filter(db.or_(User.name.ilike(f"%{q}%"), User.username.ilike(f"%{q}%"), User.email.ilike(f"%{q}%")))
    if fitness_level:
        query = query.filter(User.fitness_level == fitness_level)
    if min_age is not None:
        query = query.filter(User.age >= min_age)
    if max_age is not None:
        query = query.filter(User.age <= max_age)
    if location:
        query = query.filter(User.location.ilike(f"%{location}%"))

    users = query.order_by(User.last_active.desc()).limit(50).all()
    results = []
    for u in users:
        results.append({
            'id': u.id,
            'name': u.name,
            'username': u.username,
            'fitness_level': u.fitness_level,
            'goals': json.loads(u.goals) if u.goals else [],
            'location': u.location,
            'bio': u.bio,
            'last_active': u.last_active.isoformat() if u.last_active else None,
            'avatar_url': u.avatar_url,
        })
    return jsonify({'success': True, 'partners': results})

@app.route('/api/partners/connect', methods=['POST'])
def partners_connect():
    data = request.get_json() or {}
    user_id = data.get('user_id')
    partner_id = data.get('partner_id')
    if not user_id or not partner_id or user_id == partner_id:
        return jsonify({'success': False, 'error': 'Invalid user/partner'}), 400

    existing = FitnessPartner.query.filter_by(user_id=user_id, partner_id=partner_id).first()
    if existing:
        return jsonify({'success': False, 'error': f'Connection already {existing.status}'}), 400

    fp = FitnessPartner(user_id=user_id, partner_id=partner_id, status='pending')
    db.session.add(fp)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Connection request sent'})

@app.route('/api/partners/recommendations', methods=['GET'])
def partners_recommendations():
    # Simple recommendations: top recent active users
    limit = request.args.get('limit', 10, type=int)
    users = User.query.filter_by(is_active=True).order_by(User.last_active.desc()).limit(limit).all()
    recs = []
    for u in users:
        recs.append({
            'id': u.id,
            'name': u.name,
            'username': u.username,
            'fitness_level': u.fitness_level,
            'goals': json.loads(u.goals) if u.goals else [],
            'location': u.location,
            'bio': u.bio,
            'last_active': u.last_active.isoformat() if u.last_active else None,
            'avatar_url': u.avatar_url,
        })
    return jsonify({'success': True, 'recommendations': recs})

@app.route('/api/partners/connections', methods=['GET'])
def partners_connections():
    try:
        user_id = request.args.get('user_id', type=int)
        status = request.args.get('status', 'accepted')
        if not user_id:
            return jsonify({'success': False, 'error': 'user_id is required'}), 400

        # Fetch connections where the user is either requester or partner
        q = FitnessPartner.query.filter(
            db.or_(
                FitnessPartner.user_id == user_id,
                FitnessPartner.partner_id == user_id
            )
        )
        if status:
            q = q.filter(FitnessPartner.status == status)

        fps = q.order_by(FitnessPartner.updated_at.desc()).limit(100).all()

        partners = []
        for fp in fps:
            # Determine the other user's id
            other_id = fp.partner_id if fp.user_id == user_id else fp.user_id
            other = User.query.get(other_id)
            if not other:
                continue
            partners.append({
                'id': other.id,
                'name': other.name,
                'username': other.username,
                'fitness_level': other.fitness_level,
                'goals': json.loads(other.goals) if other.goals else [],
                'location': other.location,
                'bio': other.bio,
                'last_active': other.last_active.isoformat() if other.last_active else None,
                'avatar_url': other.avatar_url,
            })

        return jsonify({'success': True, 'connections': partners})
    except Exception as e:
        logger.error(f"Error fetching connections: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/partners/requests', methods=['GET'])
def partners_requests():
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'success': False, 'error': 'user_id is required'}), 400

        # Pending requests sent TO this user
        fps = FitnessPartner.query.filter_by(partner_id=user_id, status='pending').order_by(FitnessPartner.created_at.desc()).all()
        reqs = []
        for fp in fps:
            sender = User.query.get(fp.user_id)
            if not sender:
                continue
            reqs.append({
                'id': fp.id,
                'from': {
                    'id': sender.id,
                    'name': sender.name,
                    'username': sender.username,
                    'avatar_url': sender.avatar_url,
                    'fitness_level': sender.fitness_level,
                },
                'message': 'Wants to connect',
                'timestamp': fp.created_at.isoformat(),
            })

        return jsonify({'success': True, 'requests': reqs})
    except Exception as e:
        logger.error(f"Error fetching partner requests: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/partners/accept', methods=['POST'])
def partners_accept():
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        partner_id = data.get('partner_id')
        if not user_id or not partner_id:
            return jsonify({'success': False, 'error': 'user_id and partner_id are required'}), 400

        fp = FitnessPartner.query.filter_by(user_id=partner_id, partner_id=user_id, status='pending').first()
        if not fp:
            return jsonify({'success': False, 'error': 'No pending request found'}), 404

        fp.status = 'accepted'
        fp.updated_at = datetime.utcnow()

        # Optional: ensure reciprocal record exists for easier querying
        reciprocal = FitnessPartner.query.filter_by(user_id=user_id, partner_id=partner_id).first()
        if not reciprocal:
            reciprocal = FitnessPartner(user_id=user_id, partner_id=partner_id, status='accepted', created_at=datetime.utcnow(), updated_at=datetime.utcnow())
            db.session.add(reciprocal)
        else:
            reciprocal.status = 'accepted'
            reciprocal.updated_at = datetime.utcnow()

        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error accepting partner request: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/partners/decline', methods=['POST'])
def partners_decline():
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        partner_id = data.get('partner_id')
        if not user_id or not partner_id:
            return jsonify({'success': False, 'error': 'user_id and partner_id are required'}), 400

        fp = FitnessPartner.query.filter_by(user_id=partner_id, partner_id=user_id, status='pending').first()
        if not fp:
            return jsonify({'success': False, 'error': 'No pending request found'}), 404

        fp.status = 'declined'
        fp.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Error declining partner request: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# Gym endpoints
@app.route('/api/gyms', methods=['GET'])
def get_gyms():
    try:
        # Get query parameters
        search = request.args.get('search', '')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        min_rating = request.args.get('min_rating', type=float)
        amenity = request.args.get('amenity', '')
        sort_by = request.args.get('sort_by', 'distance')
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)

        # Build query
        query = Gym.query

        # Apply filters
        if search:
            query = query.filter(
                db.or_(
                    Gym.name.contains(search),
                    Gym.city.contains(search),
                    Gym.address.contains(search)
                )
            )

        if min_price is not None:
            query = query.filter(Gym.price_per_month >= min_price)

        if max_price is not None:
            query = query.filter(Gym.price_per_month <= max_price)

        if min_rating is not None:
            query = query.filter(Gym.rating >= min_rating)

        if amenity:
            query = query.join(GymAmenity).filter(GymAmenity.name == amenity)

        # Apply sorting
        if sort_by == 'rating':
            query = query.order_by(Gym.rating.desc())
        elif sort_by == 'price':
            query = query.order_by(Gym.price_per_month.asc())
        elif sort_by == 'name':
            query = query.order_by(Gym.name.asc())
        else:  # distance
            query = query.order_by(Gym.distance.asc())

        # Apply pagination
        total = query.count()
        gyms = query.offset(offset).limit(limit).all()

        # Format response
        gyms_data = []
        for gym in gyms:
            gym_data = {
                'id': gym.id,
                'name': gym.name,
                'address': gym.address,
                'city': gym.city,
                'rating': gym.rating,
                'review_count': gym.review_count,
                'distance': gym.distance,
                'price_per_month': gym.price_per_month,
                'image_url': gym.image_url,
                'phone': gym.phone,
                'website': gym.website,
                'description': gym.description,
                'is_open': gym.is_open,
                'amenities': [amenity.name for amenity in gym.amenities],
                'operating_hours': {
                    'weekdays': next((h.open_time + ' - ' + h.close_time for h in gym.operating_hours if h.day_of_week == 'weekdays'), ''),
                    'weekends': next((h.open_time + ' - ' + h.close_time for h in gym.operating_hours if h.day_of_week == 'weekends'), '')
                },
                'equipment': [eq.name for eq in gym.equipment],
                'classes': [cls.name for cls in gym.classes]
            }
            gyms_data.append(gym_data)

        return jsonify({
            'success': True,
            'gyms': gyms_data,
            'total': total,
            'offset': offset,
            'limit': limit
        })

    except Exception as e:
        logger.error(f"Error fetching gyms: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/gyms/<int:gym_id>', methods=['GET'])
def get_gym(gym_id):
    try:
        gym = Gym.query.get_or_404(gym_id)
        
        gym_data = {
            'id': gym.id,
            'name': gym.name,
            'address': gym.address,
            'city': gym.city,
            'rating': gym.rating,
            'review_count': gym.review_count,
            'distance': gym.distance,
            'price_per_month': gym.price_per_month,
            'image_url': gym.image_url,
            'phone': gym.phone,
            'website': gym.website,
            'description': gym.description,
            'is_open': gym.is_open,
            'amenities': [amenity.name for amenity in gym.amenities],
            'operating_hours': {
                'weekdays': next((h.open_time + ' - ' + h.close_time for h in gym.operating_hours if h.day_of_week == 'weekdays'), ''),
                'weekends': next((h.open_time + ' - ' + h.close_time for h in gym.operating_hours if h.day_of_week == 'weekends'), '')
            },
            'equipment': [eq.name for eq in gym.equipment],
            'classes': [cls.name for cls in gym.classes]
        }

        return jsonify({
            'success': True,
            'gym': gym_data
        })

    except Exception as e:
        logger.error(f"Error fetching gym {gym_id}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Workout scheduling endpoints
@app.route('/api/workouts', methods=['GET'])
def get_workouts():
    try:
        user_id = request.args.get('user_id', type=int)
        date = request.args.get('date')
        
        query = ScheduledWorkout.query
        
        if user_id:
            query = query.filter(ScheduledWorkout.user_id == user_id)
        
        if date:
            query = query.filter(ScheduledWorkout.date == datetime.strptime(date, '%Y-%m-%d').date())
        
        workouts = query.order_by(ScheduledWorkout.date, ScheduledWorkout.time).all()
        
        workouts_data = []
        for workout in workouts:
            workout_data = {
                'id': workout.id,
                'title': workout.title,
                'date': workout.date.isoformat(),
                'time': workout.time.strftime('%H:%M'),
                'duration': workout.duration,
                'workout_type': workout.workout_type,
                'partner_id': workout.partner_id,
                'partner_name': workout.partner.name if workout.partner else None,
                'location': workout.location,
                'notes': workout.notes,
                'status': workout.status,
                'created_at': workout.created_at.isoformat()
            }
            workouts_data.append(workout_data)
        
        return jsonify({
            'success': True,
            'workouts': workouts_data
        })
        
    except Exception as e:
        logger.error(f"Error fetching workouts: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/workouts', methods=['POST'])
def create_workout():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'title', 'date', 'time', 'duration', 'workout_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        # Create new workout
        workout = ScheduledWorkout(
            user_id=data['user_id'],
            title=data['title'],
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            time=datetime.strptime(data['time'], '%H:%M').time(),
            duration=data['duration'],
            workout_type=data['workout_type'],
            partner_id=data.get('partner_id'),
            location=data.get('location'),
            notes=data.get('notes'),
            status=data.get('status', 'scheduled')
        )
        
        db.session.add(workout)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Workout scheduled successfully',
            'workout_id': workout.id
        })
        
    except Exception as e:
        logger.error(f"Error creating workout: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/workouts/<int:workout_id>', methods=['PUT'])
def update_workout(workout_id):
    try:
        workout = ScheduledWorkout.query.get_or_404(workout_id)
        data = request.get_json()
        
        # Update fields
        if 'title' in data:
            workout.title = data['title']
        if 'date' in data:
            workout.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        if 'time' in data:
            workout.time = datetime.strptime(data['time'], '%H:%M').time()
        if 'duration' in data:
            workout.duration = data['duration']
        if 'workout_type' in data:
            workout.workout_type = data['workout_type']
        if 'partner_id' in data:
            workout.partner_id = data['partner_id']
        if 'location' in data:
            workout.location = data['location']
        if 'notes' in data:
            workout.notes = data['notes']
        if 'status' in data:
            workout.status = data['status']
        
        workout.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Workout updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error updating workout {workout_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/workouts/<int:workout_id>', methods=['DELETE'])
def delete_workout(workout_id):
    try:
        workout = ScheduledWorkout.query.get_or_404(workout_id)
        db.session.delete(workout)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Workout deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Error deleting workout {workout_id}: {str(e)}")
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

# Exercise endpoints
@app.route('/api/exercises', methods=['GET'])
def get_exercises():
    try:
        exercise_type = request.args.get('type')
        difficulty = request.args.get('difficulty')
        
        query = Exercise.query
        
        if exercise_type:
            query = query.filter(Exercise.type == exercise_type)
        
        if difficulty:
            query = query.filter(Exercise.difficulty == difficulty)
        
        exercises = query.all()
        
        exercises_data = []
        for exercise in exercises:
            exercise_data = {
                'id': exercise.id,
                'name': exercise.name,
                'type': exercise.type,
                'duration': exercise.duration,
                'difficulty': exercise.difficulty,
                'description': exercise.description,
                'equipment': exercise.equipment.split(',') if exercise.equipment else [],
                'muscle_groups': exercise.muscle_groups.split(',') if exercise.muscle_groups else []
            }
            exercises_data.append(exercise_data)
        
        return jsonify({
            'success': True,
            'exercises': exercises_data
        })
        
    except Exception as e:
        logger.error(f"Error fetching exercises: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Initialize database
def init_db():
    """Initialize the database with sample data and ensure columns exist"""
    with app.app_context():
        db.create_all()

        # Lightweight column additions for existing SQLite DBs
        def _ensure_column(table: str, column: str, type_sql: str):
            try:
                res = db.session.execute(text(f"PRAGMA table_info({table})"))
                cols = [row[1] for row in res.fetchall()]
                if column not in cols:
                    db.session.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {type_sql}"))
                    db.session.commit()
                    logger.info(f"Added column {table}.{column}")
            except Exception as e:
                logger.warning(f"Skip adding column {table}.{column}: {e}")

        _ensure_column('user', 'username', 'VARCHAR(100)')
        _ensure_column('user', 'password_hash', 'VARCHAR(255)')
        _ensure_column('user', 'goals', 'TEXT')
        _ensure_column('user', 'preferred_workout_time', 'VARCHAR(50)')
        _ensure_column('user', 'availability_schedule', 'TEXT')
        _ensure_column('user', 'last_active', 'DATETIME')
        _ensure_column('user', 'gender', 'VARCHAR(20)')
        _ensure_column('user', 'height', 'FLOAT')
        _ensure_column('user', 'weight', 'FLOAT')
        
        # Check if data already exists
        if Gym.query.first():
            logger.info("Database already initialized")
            return
        
        # Create sample gyms
        gym1 = Gym(
            name="FitZone Premium",
            address="123 Main Street",
            city="New York, NY",
            rating=4.8,
            review_count=1247,
            distance=0.8,
            price_per_month=89.0,
            phone="+1 (555) 123-4567",
            website="www.fitzonepremium.com",
            description="Premium fitness center with state-of-the-art equipment and expert trainers.",
            is_open=True
        )
        
        gym2 = Gym(
            name="PowerFit Gym",
            address="456 Oak Avenue",
            city="San Francisco, CA",
            rating=4.6,
            review_count=892,
            distance=1.2,
            price_per_month=65.0,
            phone="+1 (555) 987-6543",
            website="www.powerfitgym.com",
            description="Community-focused gym with friendly atmosphere and affordable membership.",
            is_open=True
        )
        
        db.session.add(gym1)
        db.session.add(gym2)
        db.session.commit()
        
        # Add amenities
        amenities1 = [
            GymAmenity(gym_id=gym1.id, name="Parking"),
            GymAmenity(gym_id=gym1.id, name="Locker Rooms"),
            GymAmenity(gym_id=gym1.id, name="Showers"),
            GymAmenity(gym_id=gym1.id, name="WiFi"),
            GymAmenity(gym_id=gym1.id, name="Cafe")
        ]
        
        amenities2 = [
            GymAmenity(gym_id=gym2.id, name="Parking"),
            GymAmenity(gym_id=gym2.id, name="Locker Rooms"),
            GymAmenity(gym_id=gym2.id, name="Showers"),
            GymAmenity(gym_id=gym2.id, name="WiFi")
        ]
        
        for amenity in amenities1 + amenities2:
            db.session.add(amenity)
        
        # Add operating hours
        hours1 = [
            GymOperatingHours(gym_id=gym1.id, day_of_week="weekdays", open_time="05:00", close_time="23:00"),
            GymOperatingHours(gym_id=gym1.id, day_of_week="weekends", open_time="06:00", close_time="22:00")
        ]
        
        hours2 = [
            GymOperatingHours(gym_id=gym2.id, day_of_week="weekdays", open_time="06:00", close_time="22:00"),
            GymOperatingHours(gym_id=gym2.id, day_of_week="weekends", open_time="07:00", close_time="21:00")
        ]
        
        for hour in hours1 + hours2:
            db.session.add(hour)
        
        # Add equipment
        equipment1 = [
            GymEquipment(gym_id=gym1.id, name="Cardio Machines"),
            GymEquipment(gym_id=gym1.id, name="Weight Training"),
            GymEquipment(gym_id=gym1.id, name="Functional Training"),
            GymEquipment(gym_id=gym1.id, name="Swimming Pool")
        ]
        
        equipment2 = [
            GymEquipment(gym_id=gym2.id, name="Cardio Machines"),
            GymEquipment(gym_id=gym2.id, name="Weight Training"),
            GymEquipment(gym_id=gym2.id, name="Functional Training")
        ]
        
        for eq in equipment1 + equipment2:
            db.session.add(eq)
        
        # Add classes
        classes1 = [
            GymClass(gym_id=gym1.id, name="Yoga"),
            GymClass(gym_id=gym1.id, name="Pilates"),
            GymClass(gym_id=gym1.id, name="HIIT"),
            GymClass(gym_id=gym1.id, name="CrossFit"),
            GymClass(gym_id=gym1.id, name="Zumba")
        ]
        
        classes2 = [
            GymClass(gym_id=gym2.id, name="Yoga"),
            GymClass(gym_id=gym2.id, name="HIIT"),
            GymClass(gym_id=gym2.id, name="Strength Training")
        ]
        
        for cls in classes1 + classes2:
            db.session.add(cls)
        
        # Add sample exercises
        exercises = [
            Exercise(
                name="Push-ups",
                type="strength",
                duration=10,
                difficulty="beginner",
                description="Classic bodyweight exercise for chest, shoulders, and triceps",
                equipment="None",
                muscle_groups="Chest,Shoulders,Triceps"
            ),
            Exercise(
                name="Squats",
                type="strength",
                duration=15,
                difficulty="beginner",
                description="Fundamental lower body exercise",
                equipment="None",
                muscle_groups="Quadriceps,Glutes,Hamstrings"
            ),
            Exercise(
                name="Running",
                type="cardio",
                duration=30,
                difficulty="intermediate",
                description="Cardiovascular exercise for endurance",
                equipment="None",
                muscle_groups="Legs,Core"
            ),
            Exercise(
                name="Deadlifts",
                type="strength",
                duration=20,
                difficulty="advanced",
                description="Compound movement for posterior chain",
                equipment="Barbell,Weight Plates",
                muscle_groups="Hamstrings,Glutes,Back"
            )
        ]
        
        for exercise in exercises:
            db.session.add(exercise)
        
        db.session.commit()
        logger.info("Database initialized with sample data")

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5001)

