from flask import render_template

def init_app(app, game_state):
    @app.route('/')
    def index():
        return render_template('index.html', 
                               initial_state=game_state.prepare_for_emit(),
                               show_ads=app.config['SHOW_ADS'])

    # Add other routes as needed