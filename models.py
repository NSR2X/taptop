from collections import defaultdict
from datetime import datetime, timedelta
import random

class GameState:
    def __init__(self, territory_count):
        self.territory_count = territory_count
        self.red = defaultdict(bool)
        self.blue = defaultdict(bool)
        self.chat = []
        self.players = {}
        self.superpowers = {}
        self.game_started = False
        self.game_start_time = None
        self.player_streaks = {}
        self.leaderboard = []

        # New features
        self.power_ups = {}  # player_id: {type: str, count: int, active_until: datetime}
        self.achievements = {}  # player_id: [achievement_ids]
        self.combos = {}  # player_id: {count: int, multiplier: float, last_click: datetime}
        self.game_mode = 'classic'  # classic, time_attack, king_of_the_hill
        self.game_end_time = None  # For time attack mode
        self.golden_territories = set()  # For king of the hill mode
        self.protected_territories = {}  # territory_id: {team, expires_at}
        self.last_event_time = None
        self.active_effects = []  # List of active visual effects

    def prepare_for_emit(self):
        emit_state = {
            'red': dict(self.red),
            'blue': dict(self.blue),
            'chat': self.chat,
            'players': {
                pid: {
                    'team': pdata['team'],
                    'nickname': pdata['nickname'],
                    'score': pdata['score'],
                    'longest_streak': pdata.get('longest_streak', 0),
                    'avatar': pdata.get('avatar', 'default'),
                    'badges': self.achievements.get(pid, [])
                } for pid, pdata in self.players.items()
            },
            'superpowers': self.superpowers,
            'game_started': self.game_started,
            'game_start_time': self.game_start_time.isoformat() if self.game_start_time else None,
            'game_end_time': self.game_end_time.isoformat() if self.game_end_time else None,
            'leaderboard': self.leaderboard,
            'stats': {
                'red_score': sum(self.red.values()),
                'blue_score': sum(self.blue.values()),
                'total_territories': self.territory_count,
                'unclaimed_territories': self.territory_count - sum(self.red.values()) - sum(self.blue.values()),
                'total_players': len(self.players),
                'game_in_progress': self.game_started
            },
            'power_ups': {
                pid: {
                    'bomb': pdata.get('bomb', 0),
                    'shield': pdata.get('shield', 0),
                    'lightning': pdata.get('lightning', 0),
                    'chaos': pdata.get('chaos', 0),
                    'freeze': pdata.get('freeze', 0),
                    'rainbow': pdata.get('rainbow', 0)
                } for pid, pdata in self.power_ups.items()
            },
            'combos': self.combos,
            'game_mode': self.game_mode,
            'golden_territories': list(self.golden_territories),
            'protected_territories': {
                tid: {'team': pdata['team'], 'expires_at': pdata['expires_at'].isoformat()}
                for tid, pdata in self.protected_territories.items()
                if pdata['expires_at'] > datetime.now()
            },
            'active_effects': self.active_effects
        }
        return emit_state

    # Power-up methods
    def grant_power_up(self, player_id, power_type):
        """Grant a power-up to a player"""
        if player_id not in self.power_ups:
            self.power_ups[player_id] = {
                'bomb': 0, 'shield': 0, 'lightning': 0,
                'chaos': 0, 'freeze': 0, 'rainbow': 0
            }
        self.power_ups[player_id][power_type] = self.power_ups[player_id].get(power_type, 0) + 1

    def use_power_up(self, player_id, power_type):
        """Use a power-up if available"""
        if player_id in self.power_ups and self.power_ups[player_id].get(power_type, 0) > 0:
            self.power_ups[player_id][power_type] -= 1
            return True
        return False

    # Achievement methods
    def grant_achievement(self, player_id, achievement_id):
        """Grant an achievement to a player"""
        if player_id not in self.achievements:
            self.achievements[player_id] = []
        if achievement_id not in self.achievements[player_id]:
            self.achievements[player_id].append(achievement_id)
            return True
        return False

    def check_achievements(self, player_id):
        """Check and grant achievements for a player"""
        if player_id not in self.players:
            return []

        player = self.players[player_id]
        new_achievements = []

        # First Blood - First capture
        if player['score'] == 1 and self.grant_achievement(player_id, 'first_blood'):
            new_achievements.append({'id': 'first_blood', 'name': 'First Blood', 'description': 'Captured your first territory'})

        # Conqueror - 50 captures
        if player['score'] >= 50 and self.grant_achievement(player_id, 'conqueror'):
            new_achievements.append({'id': 'conqueror', 'name': 'Conqueror', 'description': 'Captured 50 territories'})

        # Destroyer - 100 captures
        if player['score'] >= 100 and self.grant_achievement(player_id, 'destroyer'):
            new_achievements.append({'id': 'destroyer', 'name': 'Destroyer', 'description': 'Captured 100 territories'})

        # Unstoppable - 20 streak
        if player.get('longest_streak', 0) >= 20 and self.grant_achievement(player_id, 'unstoppable'):
            new_achievements.append({'id': 'unstoppable', 'name': 'Unstoppable', 'description': 'Achieved a 20 territory streak'})

        # Speed Demon - 10 streak
        if player.get('longest_streak', 0) >= 10 and self.grant_achievement(player_id, 'speed_demon'):
            new_achievements.append({'id': 'speed_demon', 'name': 'Speed Demon', 'description': 'Achieved a 10 territory streak'})

        return new_achievements

    # Combo methods
    def update_combo(self, player_id):
        """Update combo for a player"""
        now = datetime.now()

        if player_id not in self.combos:
            self.combos[player_id] = {'count': 1, 'multiplier': 1.0, 'last_click': now}
        else:
            time_since_last = (now - self.combos[player_id]['last_click']).total_seconds()

            # Reset combo if more than 2 seconds since last click
            if time_since_last > 2:
                self.combos[player_id] = {'count': 1, 'multiplier': 1.0, 'last_click': now}
            else:
                # Increment combo
                self.combos[player_id]['count'] += 1
                self.combos[player_id]['last_click'] = now

                # Calculate multiplier (max 5x)
                combo_count = self.combos[player_id]['count']
                if combo_count >= 20:
                    self.combos[player_id]['multiplier'] = 5.0
                elif combo_count >= 15:
                    self.combos[player_id]['multiplier'] = 4.0
                elif combo_count >= 10:
                    self.combos[player_id]['multiplier'] = 3.0
                elif combo_count >= 5:
                    self.combos[player_id]['multiplier'] = 2.0
                else:
                    self.combos[player_id]['multiplier'] = 1.0

        return self.combos[player_id]

    def reset_combo(self, player_id):
        """Reset combo for a player"""
        if player_id in self.combos:
            del self.combos[player_id]

    # Game mode methods
    def set_game_mode(self, mode):
        """Set the game mode"""
        self.game_mode = mode

        if mode == 'time_attack':
            # 5 minute time limit
            self.game_end_time = datetime.now() + timedelta(minutes=5)
        elif mode == 'king_of_the_hill':
            # Spawn 10 golden territories
            available_territories = [f'territory-{i}' for i in range(self.territory_count)]
            self.golden_territories = set(random.sample(available_territories, 10))

    def check_time_attack_end(self):
        """Check if time attack mode has ended"""
        if self.game_mode == 'time_attack' and self.game_end_time:
            return datetime.now() >= self.game_end_time
        return False