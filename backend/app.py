from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
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
    age = db.Column(db.Integer)
    fitness_level = db.Column(db.String(20))  # 'beginner', 'intermediate', 'advanced'
    location = db.Column(db.String(200))
    bio = db.Column(db.Text)
    avatar_url = db.Column(db.String(200))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

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
            'users': '/api/users'
        }
    })

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
    """Initialize the database with sample data"""
    with app.app_context():
        db.create_all()
        
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
    app.run(debug=True, host='0.0.0.0', port=5000)

