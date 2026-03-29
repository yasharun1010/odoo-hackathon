from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config
from models import db
import os


def create_app(config_name='development'):
    """Application factory for creating Flask app"""
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    jwt = JWTManager(app)
    
    # Register blueprints
    from routes.auth_routes import auth_bp
    from routes.user_routes import user_bp
    from routes.expense_routes import expense_bp
    from routes.approval_routes import approval_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(expense_bp, url_prefix='/api/expenses')
    app.register_blueprint(approval_bp, url_prefix='/api/approvals')
    
    # Root endpoint
    @app.route('/')
    def index():
        return jsonify({
            'message': 'Reimbursement Management System API',
            'version': '1.0.0'
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return jsonify({'error': 'Missing or invalid token'}), 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token'}), 401
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Revoked token'}), 401
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
