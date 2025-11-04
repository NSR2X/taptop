# 🎮 TapTop - The Ultimate Territory Battle vs AI

![TapTop Banner](https://img.shields.io/badge/TapTop-Epic%20Game-purple?style=for-the-badge)
![Version](https://img.shields.io/badge/version-2.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

**The most INSANE single-player territory battle game you'll ever play!** Battle against 4 different AI personalities, use devastating power-ups, unlock achievements, and dominate all 538 territories!

## 🚀 **[PLAY NOW!](https://yourusername.github.io/taptop/)**

---

## ✨ Features

### 🤖 **4 AI Personalities**

Choose your opponent wisely!

- **😊 Easy (Friendly Bot)** - Slow and random. Perfect for beginners!
- **😐 Medium (Strategic AI)** - Balanced gameplay with smart decisions
- **😤 Hard (Aggressive AI)** - Fast and attacks your territories relentlessly
- **😈 INSANE (DESTROYER 9000)** - God-mode AI with power-ups. Can you survive?

### 💥 **6 Epic Power-Ups**

Earn power-ups every 10 captures and unleash chaos!

| Power-Up | Effect | Description |
|----------|--------|-------------|
| 💣 **Bomb** | Capture 5 territories | Instant territory grab explosion! |
| 🛡️ **Shield** | Protect for 10s | Your territories become invincible! |
| ⚡ **Lightning** | Steal 3 from AI | Electrify and steal enemy lands! |
| 🌀 **Chaos** | Swap 10 territories | Total mayhem on the battlefield! |
| ❄️ **Freeze** | Freeze AI for 5s | Stop your enemy in their tracks! |
| 🌈 **Rainbow** | Capture 8 territories | Multi-colored explosive conquest! |

### 🏆 **Achievement System**

Unlock 6 achievements:

- 🩸 **First Blood** - Capture your first territory
- ⚔️ **Conqueror** - Capture 50 territories
- 💀 **Destroyer** - Capture 100 territories
- 🏃 **Speed Demon** - Achieve a 10 territory streak
- 🔥 **Unstoppable** - Achieve a 20 territory streak
- 🌟 **Combo Master** - Achieve 5x combo multiplier

### 🔥 **Combo System**

Click fast to build massive multipliers!

- 5+ clicks = **2x multiplier** 🔥
- 10+ clicks = **3x multiplier** 🔥🔥
- 15+ clicks = **4x multiplier** 🔥🔥🔥
- 20+ clicks = **5x multiplier** 🔥🔥🔥🔥🔥

Combos reset after 2 seconds of inactivity!

### ✨ **Stunning Visual Effects**

- 🎆 **Particle explosions** on every capture
- 🎊 **Confetti celebration** when you win
- 📳 **Screen shake** on power-up activation
- 🌟 **Glowing protected territories**
- 🎨 **Smooth animations** everywhere
- 🌊 **Animated gradient backgrounds**

### 🎵 **Procedural Sound Effects**

Web Audio API powered sounds:

- 🎹 Capture sounds
- 🎺 Power-up activation
- 🎸 Achievement unlocks
- 🎵 Combo multiplier sounds
- 🔇 Mute toggle available

### 📊 **Real-time Statistics**

Track your performance:

- Your score vs AI score
- Current streak counter
- Combo multiplier display
- Achievements unlocked
- Power-ups earned

---

## 🎯 How to Play

1. **Choose your opponent** - Select difficulty (Easy, Medium, Hard, or Insane)
2. **Click territories** to capture them (You = Red, AI = Blue)
3. **Build combos** by clicking fast for multiplier bonuses
4. **Earn power-ups** every 10 captures
5. **Use power-ups** strategically to dominate
6. **Unlock achievements** as you play
7. **Capture all 538 territories** to win!

### 🎮 Controls

- **Left Click** - Capture territory
- **Power-Up Buttons** - Activate special abilities
- **Sound Toggle** - Mute/unmute sounds
- **Restart** - Start a new game
- **Back** - Return to difficulty selection

---

## 🚀 Deploy to GitHub Pages

### Quick Setup (5 minutes!)

1. **Fork/Clone this repository**
   ```bash
   git clone https://github.com/yourusername/taptop.git
   cd taptop
   ```

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

3. **Enable GitHub Pages**
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "main" branch as source
   - Select "/ (root)" as folder
   - Click "Save"

4. **Done!** 🎉
   Your game will be live at: `https://yourusername.github.io/taptop/`

### Files Structure

```
taptop/
├── index.html          # Main game HTML (all styles embedded)
├── game.js            # Complete game logic + AI
└── README.md          # This file
```

**That's it!** Only 2 files needed. No build process, no dependencies, no backend!

---

## 🎨 Customization

### Change Colors

Edit the CSS gradients in `index.html`:

```css
/* Main background */
background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, ...);

/* Player color (Red) */
.territory.red {
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
}

/* AI color (Blue) */
.territory.blue {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
}
```

### Add More Territories

Change `TERRITORY_COUNT` in `game.js`:

```javascript
const TERRITORY_COUNT = 538; // Change to any number!
```

### Adjust AI Difficulty

Edit AI personalities in `game.js`:

```javascript
const AI_PERSONALITIES = {
    easy: {
        speed: 2000,      // milliseconds between moves
        powerUpChance: 0, // probability of using power-ups
        strategy: 'random'
    },
    // ... customize other difficulties
};
```

---

## 🛠️ Technical Details

### Technologies Used

- **Pure HTML5** - Single page application
- **Vanilla JavaScript** - No frameworks needed
- **CSS3** - Modern animations and gradients
- **Web Audio API** - Procedural sound generation

### Performance

- ⚡ **60 FPS** smooth animations
- 🚀 **Instant loading** - no external dependencies
- 📱 **Mobile responsive** - works on all devices
- 💾 **Lightweight** - Less than 100KB total

### Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers

---

## 🎯 Game Strategies

### Beginner Tips

1. Start on **Easy mode** to learn the mechanics
2. Build combos by clicking rapidly (2 second window)
3. Save power-ups for critical moments
4. Use **Shield** before the AI gets aggressive
5. **Freeze** is great when AI gets ahead

### Advanced Strategies

1. **Bomb + Lightning combo** - Capture and steal simultaneously
2. **Shield before Chaos** - Protect your territories before randomness
3. **Fast clicking** for 5x multiplier = massive score gains
4. **Power-up timing** - Use right before AI's turn
5. **Insane mode** - Be aggressive early, defensive late

### Achievement Hunting

- **Combo Master** - Practice on Easy mode for timing
- **Unstoppable** - Use Shield to maintain streak
- **Destroyer** - Play multiple games (cumulative score)

---

## 📜 License

MIT License - Feel free to modify and use!

---

## 🎉 Credits

Created with ❤️ and lots of ☕

Special thanks to:
- Web Audio API for procedural sounds
- CSS3 for amazing animations
- The concept of simple, addictive gameplay

---

## 🐛 Issues & Suggestions

Found a bug? Have an idea for a new power-up?

- Open an issue on GitHub
- Submit a pull request
- Star the repo if you enjoy the game! ⭐

---

## 🚀 Future Ideas

Want to contribute? Here are some ideas:

- [ ] More AI personalities (Defensive, Chaotic, etc.)
- [ ] Multiplayer mode (peer-to-peer WebRTC)
- [ ] More power-ups (Time Warp, Clone, Blackhole)
- [ ] Custom game modes (Capture the Flag, King of the Hill)
- [ ] Difficulty scaling (AI gets harder over time)
- [ ] Leaderboard (localStorage-based)
- [ ] Territory themes (Hexagons, Circles, etc.)
- [ ] Sound pack selector
- [ ] Tournament mode (best of 5 matches)

---

**Made with 🔥 by passionate game developers**

⭐ **Star this repo if you love it!** ⭐
