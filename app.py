from flask import Flask
from flask_socketio import SocketIO
try:
    from flask_wtf.csrf import CSRFProtect
except ImportError:
    print("Warning: Flask-WTF not installed. CSRF protection is disabled.")
    CSRFProtect = None
from config import config
from models import GameState
import routes
import events

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    if CSRFProtect is not None:
        csrf = CSRFProtect(app)
    else:
        print("CSRF protection is disabled. Install Flask-WTF for enhanced security.")
    
    socketio = SocketIO(app)
    
    game_state = GameState(538)  # Initialize with 538 territories
    
    routes.init_app(app, game_state)
    events.init_app(socketio, game_state)
    
    return app, socketio

# Use this to run with ads disabled (development mode)
app, socketio = create_app('development')

# Or use this to run with ads enabled (production mode)
# app, socketio = create_app('production')

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)