from flask import request
from flask_socketio import emit
from datetime import datetime, timedelta
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
            # Check if territory is already owned by this team
            already_owned = (team == 'red' and game_state.red[territory_id]) or \
                          (team == 'blue' and game_state.blue[territory_id])

            if already_owned:
                # Can't claim your own territory
                return

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
            # Calculate score with combo multiplier
            combo_data = game_state.update_combo(player_id)
            points = int(1 * combo_data['multiplier'])

            # Golden territory bonus (King of the Hill mode)
            if territory_id in game_state.golden_territories:
                points *= 10

            game_state.players[player_id]['score'] += points
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

            # Check and grant achievements
            new_achievements = game_state.check_achievements(player_id)
            if new_achievements:
                emit('achievement_unlocked', {'achievements': new_achievements}, room=player_id)

            # Grant random power-ups on milestones
            if game_state.players[player_id]['score'] % 10 == 0:
                power_types = ['bomb', 'shield', 'lightning', 'chaos', 'freeze', 'rainbow']
                power_type = random.choice(power_types)
                game_state.grant_power_up(player_id, power_type)
                emit('power_up_granted', {'type': power_type}, room=player_id)
            
        elif action == 'unclaim':
            if (team == 'red' and game_state.red[territory_id]) or (team == 'blue' and game_state.blue[territory_id]):
                if team == 'red':
                    game_state.red[territory_id] = False
                else:
                    game_state.blue[territory_id] = False
                if territory_id in game_state.players[player_id]['territories']:
                    game_state.players[player_id]['score'] -= 1
                    del game_state.players[player_id]['territories'][territory_id]
            
            # Reset current streak and combo on unclaim
            game_state.players[player_id]['current_streak'] = 0
            game_state.reset_combo(player_id)
        
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

    @socketio.on('use_power_up')
    def handle_use_power_up(data):
        player_id = request.sid
        power_type = data['type']

        if player_id not in game_state.players:
            return

        if not game_state.use_power_up(player_id, power_type):
            emit('error', {'message': f'No {power_type} power-up available'}, room=player_id)
            return

        team = game_state.players[player_id]['team']

        # Execute power-up effect
        if power_type == 'bomb':
            # Capture 5 random unclaimed territories
            unclaimed = [f'territory-{i}' for i in range(game_state.territory_count)
                        if not game_state.red[f'territory-{i}'] and not game_state.blue[f'territory-{i}']]
            targets = random.sample(unclaimed, min(5, len(unclaimed)))
            for tid in targets:
                if team == 'red':
                    game_state.red[tid] = True
                else:
                    game_state.blue[tid] = True
                game_state.players[player_id]['score'] += 1
                game_state.players[player_id]['territories'][tid] = True

            emit('power_up_effect', {
                'type': 'bomb',
                'territories': targets,
                'player': game_state.players[player_id]['nickname']
            }, broadcast=True)

        elif power_type == 'shield':
            # Protect player's territories for 10 seconds
            for tid in list(game_state.players[player_id]['territories'].keys()):
                game_state.protected_territories[tid] = {
                    'team': team,
                    'expires_at': datetime.now() + timedelta(seconds=10)
                }

            emit('power_up_effect', {
                'type': 'shield',
                'player': game_state.players[player_id]['nickname']
            }, broadcast=True)

        elif power_type == 'lightning':
            # Capture 3 random enemy territories
            opponent_team = 'blue' if team == 'red' else 'red'
            opponent_territories = [tid for tid, owned in (game_state.red if opponent_team == 'red' else game_state.blue).items() if owned]
            targets = random.sample(opponent_territories, min(3, len(opponent_territories)))

            for tid in targets:
                # Remove from opponent
                if opponent_team == 'red':
                    game_state.red[tid] = False
                else:
                    game_state.blue[tid] = False

                # Find and update opponent player score
                for pid, pdata in game_state.players.items():
                    if pdata['team'] == opponent_team and tid in pdata['territories']:
                        pdata['score'] -= 1
                        del pdata['territories'][tid]
                        break

                # Add to current player
                if team == 'red':
                    game_state.red[tid] = True
                else:
                    game_state.blue[tid] = True
                game_state.players[player_id]['score'] += 1
                game_state.players[player_id]['territories'][tid] = True

            emit('power_up_effect', {
                'type': 'lightning',
                'territories': targets,
                'player': game_state.players[player_id]['nickname']
            }, broadcast=True)

        elif power_type == 'chaos':
            # Randomly swap 10 territories between teams
            red_territories = [tid for tid, owned in game_state.red.items() if owned]
            blue_territories = [tid for tid, owned in game_state.blue.items() if owned]

            swap_count = min(10, len(red_territories), len(blue_territories))
            red_targets = random.sample(red_territories, swap_count)
            blue_targets = random.sample(blue_territories, swap_count)

            for red_tid, blue_tid in zip(red_targets, blue_targets):
                # Swap ownership
                game_state.red[red_tid] = False
                game_state.blue[red_tid] = True
                game_state.blue[blue_tid] = False
                game_state.red[blue_tid] = True

                # Update player territories and scores
                for pid, pdata in game_state.players.items():
                    if pdata['team'] == 'red' and red_tid in pdata['territories']:
                        pdata['score'] -= 1
                        del pdata['territories'][red_tid]
                    if pdata['team'] == 'blue' and blue_tid in pdata['territories']:
                        pdata['score'] -= 1
                        del pdata['territories'][blue_tid]

            emit('power_up_effect', {
                'type': 'chaos',
                'swapped': list(zip(red_targets, blue_targets)),
                'player': game_state.players[player_id]['nickname']
            }, broadcast=True)

        elif power_type == 'freeze':
            # Freeze opponent team for 5 seconds (handled client-side)
            emit('power_up_effect', {
                'type': 'freeze',
                'target_team': 'blue' if team == 'red' else 'red',
                'duration': 5,
                'player': game_state.players[player_id]['nickname']
            }, broadcast=True)

        elif power_type == 'rainbow':
            # Capture 8 random territories (any)
            all_territories = [f'territory-{i}' for i in range(game_state.territory_count)]
            available = [tid for tid in all_territories if not (game_state.red[tid] or game_state.blue[tid])]
            targets = random.sample(available, min(8, len(available)))

            for tid in targets:
                if team == 'red':
                    game_state.red[tid] = True
                else:
                    game_state.blue[tid] = True
                game_state.players[player_id]['score'] += 1
                game_state.players[player_id]['territories'][tid] = True

            emit('power_up_effect', {
                'type': 'rainbow',
                'territories': targets,
                'player': game_state.players[player_id]['nickname']
            }, broadcast=True)

        update_leaderboard(game_state)
        emit('state_update', game_state.prepare_for_emit(), broadcast=True)

    @socketio.on('set_game_mode')
    def handle_set_game_mode(data):
        mode = data.get('mode', 'classic')
        game_state.set_game_mode(mode)

        message = {
            'team': 'system',
            'nickname': 'System',
            'message': f'Game mode changed to {mode.replace("_", " ").title()}'
        }
        game_state.chat.append(message)

        emit('game_mode_changed', {'mode': mode}, broadcast=True)
        emit('chat_update', game_state.chat, broadcast=True)
        emit('state_update', game_state.prepare_for_emit(), broadcast=True)

    @socketio.on('trigger_random_event')
    def handle_trigger_random_event():
        """Trigger a random game event"""
        events = ['meteor_shower', 'gold_rush', 'territory_shuffle']
        event_type = random.choice(events)

        if event_type == 'meteor_shower':
            # Randomly flip 20 territories
            all_territories = [f'territory-{i}' for i in range(game_state.territory_count)]
            targets = random.sample(all_territories, 20)

            for tid in targets:
                if game_state.red[tid]:
                    game_state.red[tid] = False
                    game_state.blue[tid] = True
                elif game_state.blue[tid]:
                    game_state.blue[tid] = False
                    game_state.red[tid] = True
                else:
                    # Unclaimed, randomly assign
                    if random.choice([True, False]):
                        game_state.red[tid] = True
                    else:
                        game_state.blue[tid] = True

            message = {
                'team': 'system',
                'nickname': 'System',
                'message': '☄️ METEOR SHOWER! 20 territories have been randomly affected!'
            }

        elif event_type == 'gold_rush':
            # Double points for 30 seconds (handled client-side)
            message = {
                'team': 'system',
                'nickname': 'System',
                'message': '💰 GOLD RUSH! Double points for 30 seconds!'
            }

        elif event_type == 'territory_shuffle':
            # Shuffle all unclaimed territories
            unclaimed = [tid for tid, _ in enumerate(range(game_state.territory_count))
                        if not game_state.red[f'territory-{tid}'] and not game_state.blue[f'territory-{tid}']]

            message = {
                'team': 'system',
                'nickname': 'System',
                'message': '🌪️ TERRITORY SHUFFLE! The map has been reorganized!'
            }

        game_state.chat.append(message)
        emit('random_event', {'type': event_type}, broadcast=True)
        emit('chat_update', game_state.chat, broadcast=True)
        emit('state_update', game_state.prepare_for_emit(), broadcast=True)

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