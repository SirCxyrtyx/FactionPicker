# Firebase Realtime Database Rules

Use these rules for the FactionPicker Firebase Realtime Database:

```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        // Anyone can read sessions (needed for voting and viewing results)
        ".read": true,

        // Allow creating new sessions (writes entire session object at once)
        ".write": "!data.exists()",

        "votes": {
          "$playerId": {
            // Allow each player to vote once (prevents duplicate voting)
            ".write": "!data.exists()"
            // No validation - empty arrays are valid (means "no preference for any faction")
          }
        },

        "results": {
          // Allow writing results once (prevents recalculation)
          ".write": "!data.exists()",

          // Validate that results is an object with player-faction mappings
          ".validate": "newData.hasChildren()"
        }
      }
    }
  }
}
```

## Key Changes

**Removed validation on votes:**
- Previously had `.validate: "newData.hasChildren()"` which rejected null values and empty arrays
- Now allows `null` values, which represent "no preference for any faction"
- Note: Firebase Realtime Database doesn't store empty arrays - they're converted to null automatically
- Votes can be: an array of faction names (preferences) or `null` (no preferences)
- This is a valid vote state and needs to be recorded so results can be calculated

## What These Rules Allow

**Session Level:**
- Anyone can create new sessions
- Sessions are immutable after creation (players/factions can't be changed)

**Votes Level:**
- Each player can vote exactly once
- Votes can be empty arrays (all "No Preference")
- Votes cannot be modified after submission

**Results Level:**
- Results can only be written once
- Results must contain data (assignments object)

## To Apply

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `factionpicker` project
3. Navigate to **Realtime Database** → **Rules** tab
4. Paste the rules above
5. Click **Publish**
