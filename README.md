# Faction Picker

A simple web app for coordinating faction choices in board games. Players can vote on their preferred factions, and the app will assign factions based on preferences with random tie-breaking.

## Features

- **No server required** - runs entirely in the browser using Firebase
- **Create polls** - Set up a game with player names and faction names
- **Player voting** - Players drag-and-drop to rank factions in order of preference
- **Automatic assignment** - Assigns factions based on preferences with random tie-breaking
- **Real-time updates** - Results page updates as votes come in

## Setup

### 1. Firebase Configuration

You'll need to create a Firebase project and configure the Realtime Database:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Realtime Database**:
   - In the Firebase console, go to "Realtime Database"
   - Click "Create Database"
   - Start in **test mode** (for development) or configure security rules as needed
   - Note the database URL

4. Get your Firebase config:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web icon (`</>`) to create a web app
   - Copy the configuration object

5. Update `app.js`:
   - Open `app.js`
   - Replace the `firebaseConfig` object with your own configuration:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 2. Security Rules (Optional but Recommended)

For production use, update your Firebase Realtime Database rules:

```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": "!data.exists() || !data.child('votes').exists() || !data.child('votes').child(newData.child('votes').val()).exists()",
        "votes": {
          "$playerId": {
            ".write": "!data.exists()"
          }
        }
      }
    }
  }
}
```

This allows:
- Anyone to read sessions
- Creating new sessions
- Players to vote once (prevents duplicate votes)

### 3. GitHub Pages Deployment

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

For local testing with Firebase:
- Make sure your Firebase configuration is set up
- Open the browser's developer console to see any errors
- You can use the same Firebase project for both local and production

## Browser Compatibility

Works in all modern browsers that support:
- ES6 JavaScript
- HTML5 Drag and Drop API
- CSS Grid/Flexbox

## License

See LICENSE file for details.
