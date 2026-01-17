# Faction Picker

A simple web app for coordinating faction choices in board games. Players can vote on their preferred factions, and the app will assign factions based on preferences with random tie-breaking.

## Features

- **No server required** - runs entirely in the browser using Firebase
- **Create polls** - Set up a game with player names and faction names
- **Player voting** - Players drag-and-drop to rank factions in order of preference
- **Automatic assignment** - Assigns factions based on preferences with random tie-breaking
- **Real-time updates** - Results page updates as votes come in

## Setup

Firebase is already configured and ready to use! The configuration values are obfuscated (base64 + ROT13) in the code to prevent bot scraping.

### GitHub Pages Deployment

1. Enable GitHub Pages:
   - Go to repository Settings
   - Navigate to "Pages" section
   - Select source branch (usually `main` or `master`)
   - Select root directory
   - Save

2. Access your site at: `https://[username].github.io/[repository-name]/`

## Usage

### Creating a Poll

1. Visit the main page
2. Add player names (one at a time)
3. Add faction names (one at a time)
4. Click "Create Poll"
5. Share the **Player Link** with all players
6. Keep the **Results Link** for yourself

### Voting

1. Open the player link
2. Select your name from the dropdown
3. Drag and drop factions to rank them (top = most preferred)
4. Click "Submit Vote"

### Viewing Results

1. Open the results link
2. Wait for all players to vote (status shown in real-time)
3. Once all votes are in, see the final faction assignments

## How Assignment Works

The app assigns factions using a greedy algorithm with random tie-breaking:

1. Find all player-faction pairs where the player ranked that faction highest
2. If there are ties (multiple players with same preference rank), randomly choose one
3. Assign that pair and remove both from consideration
4. Repeat until all assignments are made

This ensures players get their highest-ranked available faction, with fair random selection when preferences conflict.

## Local Development

Simply open `index.html` in a web browser. No build process required!

Firebase is already configured and ready to use. Just open the page and start creating polls!

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript
- HTML5 Drag and Drop API
- CSS Grid/Flexbox

## License

See LICENSE file for details.
