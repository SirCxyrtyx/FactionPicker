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
            // No validation - arrays can be empty (means "no preference for any faction")
          }
        },

        "votedStatus": {
          "$playerId": {
            // Allow setting voted status once per player
            ".write": "!data.exists()",

            // Validate that it's a boolean true value
            ".validate": "newData.val() === true"
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

**Added separate `votedStatus` tracking:**
- Uses a boolean flag (`votedStatus/{playerId}: true`) to track who has voted
- This avoids relying on vote data existence, which can be problematic with empty arrays
- Votes can be empty arrays (no preferences) or arrays with faction names (preferences)
- The `votedStatus` flag is set atomically with the vote submission
- All "has voted" checks use `votedStatus` instead of checking if votes exist

**Vote validation:**
- No validation on votes - arrays can be empty (represents "no preference for any faction")
- `votedStatus` must be exactly `true` (boolean validation)

## What These Rules Allow

**Session Level:**
- Anyone can create new sessions
- Sessions are immutable after creation (players/factions can't be changed)

**Votes Level:**
- Each player can submit their vote once
- Votes can be empty arrays (no preferences) or contain faction names
- Votes cannot be modified after submission

**Voted Status Level:**
- Each player can set their voted status once (to `true`)
- This flag indicates the player has completed voting
- Cannot be modified after being set

**Results Level:**
- Results can only be written once (when all players have voted)
- Results must contain data (assignments object)
- Prevents recalculation and ensures consistent random tie-breaking

## To Apply

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `factionpicker` project
3. Navigate to **Realtime Database** → **Rules** tab
4. Paste the rules above
5. Click **Publish**
