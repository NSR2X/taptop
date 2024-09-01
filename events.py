from flask import request
from flask_socketio import emit
from datetime import datetime
import random
from nickname_components import nickname_types  # Make sure this import is correct

def init_app(socketio, game_state):
    @socketio.on('connect')
    def handle_connect():
        player_id = request.sid
        if player_id in game_state.players:
            # Player reconnecting, send their current state
            emit('reconnect', {
                'team': game_state.players[player_id]['team'],
                'nickname': game_state.players[player_id]['nickname'],
                'game_state': game_state.prepare_for_emit(),
                'game_start_time': game_state.game_start_time.isoformat() if game_state.game_start_time else None,
            })
        else:
            # New player, send initial game state
            emit('game_state_update', {'game_state': game_state.prepare_for_emit()})

    @socketio.on('join')
    def handle_join(data):
        team = data['team']
        player_id = request.sid
        
        # Check if the player already has a nickname for this team
        if player_id in game_state.players and game_state.players[player_id]['team'] == team:
            nickname = game_state.players[player_id]['nickname']
        else:
            nickname = generate_nickname()
        
        # Remove any existing entries for this player
        if player_id in game_state.players:
            del game_state.players[player_id]
        
        game_state.players[player_id] = {'team': team, 'nickname': nickname, 'score': 0, 'territories': {}}
        
        update_leaderboard(game_state)
        
        emit('team_assigned', {
            'team': team,
            'nickname': nickname,
            'game_state': game_state.prepare_for_emit(),
            'game_start_time': game_state.game_start_time.isoformat() if game_state.game_start_time else None,
        })
        
        # Broadcast the updated game state to all clients
        emit('state_update', game_state.prepare_for_emit(), broadcast=True)

    @socketio.on('update')
    def handle_update(data):
        team = data['team']
        territory_id = data['territoryId']
        action = data['action']
        player_id = request.sid
        
        if action == 'claim':
            if not game_state.game_started:
                game_state.game_started = True
                game_state.game_start_time = datetime.now()
                emit('game_started', {'start_time': game_state.game_start_time.isoformat()}, broadcast=True)
            
            opponent_team = 'blue' if team == 'red' else 'red'
            if game_state.red[territory_id] if opponent_team == 'red' else game_state.blue[territory_id]:
                if opponent_team == 'red':
                    game_state.red[territory_id] = False
                else:
                    game_state.blue[territory_id] = False
                for pid, pdata in game_state.players.items():
                    if pdata['team'] == opponent_team and territory_id in pdata['territories']:
                        pdata['score'] -= 1
                        del pdata['territories'][territory_id]
                        break
            
            if team == 'red':
                game_state.red[territory_id] = True
            else:
                game_state.blue[territory_id] = True
            game_state.players[player_id]['score'] += 1
            game_state.players[player_id]['territories'][territory_id] = True
            
            # Update player streak
            game_state.players[player_id]['current_streak'] = game_state.players[player_id].get('current_streak', 0) + 1
            game_state.players[player_id]['longest_streak'] = max(
                game_state.players[player_id].get('longest_streak', 0),
                game_state.players[player_id]['current_streak']
            )
            
            # Reset other players' current streaks
            for pid in game_state.players:
                if pid != player_id:
                    game_state.players[pid]['current_streak'] = 0
            
        elif action == 'unclaim':
            if (team == 'red' and game_state.red[territory_id]) or (team == 'blue' and game_state.blue[territory_id]):
                if team == 'red':
                    game_state.red[territory_id] = False
                else:
                    game_state.blue[territory_id] = False
                if territory_id in game_state.players[player_id]['territories']:
                    game_state.players[player_id]['score'] -= 1
                    del game_state.players[player_id]['territories'][territory_id]
            
            # Reset current streak on unclaim
            game_state.players[player_id]['current_streak'] = 0
        
        update_leaderboard(game_state)
        check_game_end(game_state, socketio)
        emit('state_update', game_state.prepare_for_emit(), broadcast=True)

    @socketio.on('leave')
    def handle_leave():
        player_id = request.sid
        if player_id in game_state.players:
            del game_state.players[player_id]
            update_leaderboard(game_state)
            emit('state_update', game_state.prepare_for_emit(), broadcast=True)

    @socketio.on('disconnect')
    def handle_disconnect():
        handle_leave()  # Reuse the leave logic for disconnects

    @socketio.on('request_game_state')
    def handle_request_game_state():
        emit('game_state_update', {'game_state': game_state.prepare_for_emit()})

    @socketio.on('chat')
    def handle_chat(data):
        player_id = request.sid
        if player_id in game_state.players:
            message = {
                'team': game_state.players[player_id]['team'],
                'nickname': game_state.players[player_id]['nickname'],
                'message': data['message']
            }
            game_state.chat.append(message)
            emit('chat_update', game_state.chat, broadcast=True)

def update_leaderboard(game_state):
    sorted_players = sorted(game_state.players.items(), key=lambda x: x[1]['score'], reverse=True)
    game_state.leaderboard = [
        {
            'nickname': player_data['nickname'],
            'score': player_data['score'],
            'team': player_data['team']
        }
        for _, player_data in sorted_players[:5]  # Top 5 players
    ]

def check_game_end(game_state, socketio):
    red_score = sum(game_state.red.values())
    blue_score = sum(game_state.blue.values())
    
    if red_score == game_state.territory_count or blue_score == game_state.territory_count:
        winner = 'red' if red_score == game_state.territory_count else 'blue'
        game_duration = datetime.now() - game_state.game_start_time
        
        duration_str = str(game_duration)
        
        win_message = f"Team {winner.capitalize()} wins! Game lasted {duration_str}. The game will now restart."
        game_state.chat.append({'team': 'system', 'nickname': 'System', 'message': win_message})
        
        # Reset game state
        game_state.red.clear()
        game_state.blue.clear()
        game_state.game_started = False
        game_state.game_start_time = None
        for player in game_state.players.values():
            player['score'] = 0
            player['territories'] = {}
        
        # Emit events in this order
        socketio.emit('chat_update', game_state.chat)
        socketio.emit('game_end', {'winner': winner, 'duration': duration_str})
        socketio.emit('state_update', game_state.prepare_for_emit())

def generate_nickname():
    nickname_type = random.choice(nickname_types)
    return f"{random.choice(nickname_type[0])} {random.choice(nickname_type[1])}"