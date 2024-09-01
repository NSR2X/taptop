from collections import defaultdict

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
                    'longest_streak': pdata.get('longest_streak', 0)
                } for pid, pdata in self.players.items()
            },
            'superpowers': self.superpowers,
            'game_started': self.game_started,
            'game_start_time': self.game_start_time.isoformat() if self.game_start_time else None,
            'leaderboard': self.leaderboard,
            'stats': {
                'red_score': sum(self.red.values()),
                'blue_score': sum(self.blue.values()),
                'total_territories': self.territory_count,
                'unclaimed_territories': self.territory_count - sum(self.red.values()) - sum(self.blue.values()),
                'total_players': len(self.players),
                'game_in_progress': self.game_started
            }
        }
        return emit_state

    # Add methods for game state manipulation here