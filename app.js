// Decoder for obfuscated config values (base64 + rot13)
function decodeConfig(encoded) {
    // ROT13 decode (symmetric operation)
    const rot13decoded = encoded.replace(/[A-Za-z]/g, c =>
        String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)
    );
    // Base64 decode
    return atob(rot13decoded);
}

// Firebase configuration (sensitive values are base64+rot13 encoded)
const firebaseConfig = {
    apiKey: decodeConfig("NUvmnIl6Ouu_m0wWwA0gswY4ot1zMHUnncONKm3mCInyrtONRunfskn=="),
    authDomain: "factionpicker.firebaseapp.com",
    databaseURL: "https://factionpicker-default-rtdb.firebaseio.com",
    projectId: "factionpicker",
    storageBucket: "factionpicker.firebasestorage.app",
    messagingSenderId: decodeConfig("MDk4NTUwMjU0MTQy"),
    appId: decodeConfig("MToyOTg4NTAyNTQxNDI6d2VyOmVvNm5yMTMzYzA1cDMxcXNycTgwNnM="),
    measurementId: decodeConfig("Ry1BETPRRGAMMUg=")
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Global state
let players = [];
let factions = [];
let currentSessionId = null;
let draggedElement = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    const view = urlParams.get('view');

    if (sessionId) {
        currentSessionId = sessionId;
        if (view === 'results') {
            showResults();
        } else {
            showVoting();
        }
    } else {
        showCreateView();
    }
});

// Show different views
function showCreateView() {
    document.getElementById('createView').classList.remove('hidden');
    document.getElementById('linksView').classList.add('hidden');
    document.getElementById('votingView').classList.add('hidden');
    document.getElementById('resultsView').classList.add('hidden');
}

function showLinksView() {
    document.getElementById('createView').classList.add('hidden');
    document.getElementById('linksView').classList.remove('hidden');
    document.getElementById('votingView').classList.add('hidden');
    document.getElementById('resultsView').classList.add('hidden');
}

function showVoting() {
    document.getElementById('createView').classList.add('hidden');
    document.getElementById('linksView').classList.add('hidden');
    document.getElementById('votingView').classList.remove('hidden');
    document.getElementById('resultsView').classList.add('hidden');
    loadSession();
}

function showResults() {
    document.getElementById('createView').classList.add('hidden');
    document.getElementById('linksView').classList.add('hidden');
    document.getElementById('votingView').classList.add('hidden');
    document.getElementById('resultsView').classList.remove('hidden');
    loadResults();
}

// Add/Remove players and factions
function addPlayer() {
    const input = document.getElementById('playerInput');
    const playerName = input.value.trim();

    if (playerName && !players.includes(playerName)) {
        players.push(playerName);
        renderPlayers();
        input.value = '';
    }
}

function removePlayer(playerName) {
    players = players.filter(p => p !== playerName);
    renderPlayers();
}

function renderPlayers() {
    const list = document.getElementById('playersList');
    list.innerHTML = players.map(player =>
        `<span class="item-tag">
            ${player}
            <button onclick="removePlayer('${player}')">×</button>
        </span>`
    ).join('');
}

function addFaction() {
    const input = document.getElementById('factionInput');
    const factionName = input.value.trim();

    if (factionName && !factions.includes(factionName)) {
        factions.push(factionName);
        renderFactions();
        input.value = '';
    }
}

function removeFaction(factionName) {
    factions = factions.filter(f => f !== factionName);
    renderFactions();
}

function renderFactions() {
    const list = document.getElementById('factionsList');
    list.innerHTML = factions.map(faction =>
        `<span class="item-tag">
            ${faction}
            <button onclick="removeFaction('${faction}')">×</button>
        </span>`
    ).join('');
}

// Allow Enter key to add items
document.addEventListener('DOMContentLoaded', () => {
    const playerInput = document.getElementById('playerInput');
    const factionInput = document.getElementById('factionInput');

    if (playerInput) {
        playerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addPlayer();
        });
    }

    if (factionInput) {
        factionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addFaction();
        });
    }
});

// Create poll
async function createPoll() {
    if (players.length === 0) {
        alert('Please add at least one player');
        return;
    }

    if (factions.length === 0) {
        alert('Please add at least one faction');
        return;
    }

    const sessionId = generateSessionId();
    const sessionData = {
        players: players,
        factions: factions,
        votes: {},
        createdAt: Date.now()
    };

    try {
        await database.ref('sessions/' + sessionId).set(sessionData);

        const baseUrl = window.location.origin + window.location.pathname;
        const playerLink = `${baseUrl}?session=${sessionId}`;
        const resultsLink = `${baseUrl}?session=${sessionId}&view=results`;

        document.getElementById('playerLink').value = playerLink;
        document.getElementById('resultsLink').value = resultsLink;

        showLinksView();
    } catch (error) {
        console.error('Error creating poll:', error);
        alert('Error creating poll. Please check your Firebase configuration.');
    }
}

function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function copyLink(elementId) {
    const input = document.getElementById(elementId);
    input.select();
    document.execCommand('copy');

    const button = input.nextElementSibling;
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    setTimeout(() => {
        button.textContent = originalText;
    }, 2000);
}

// Load session for voting
async function loadSession() {
    try {
        const snapshot = await database.ref('sessions/' + currentSessionId).once('value');
        const sessionData = snapshot.val();

        if (!sessionData) {
            alert('Session not found');
            window.location.href = 'index.html';
            return;
        }

        // Populate player select
        const playerSelect = document.getElementById('playerSelect');
        playerSelect.innerHTML = '<option value="">-- Select Player --</option>';
        sessionData.players.forEach(player => {
            playerSelect.innerHTML += `<option value="${player}">${player}</option>`;
        });

        // Store factions for voting
        window.sessionFactions = sessionData.factions;
        window.sessionVotes = sessionData.votes || {};
    } catch (error) {
        console.error('Error loading session:', error);
        alert('Error loading session');
    }
}

// Enable voting section after player selection
function enableVoting() {
    const playerSelect = document.getElementById('playerSelect');
    const selectedPlayer = playerSelect.value;

    if (!selectedPlayer) return;

    // Check if player already voted
    if (window.sessionVotes && window.sessionVotes[selectedPlayer]) {
        alert('You have already voted!');
        document.getElementById('votingSection').classList.add('hidden');
        document.getElementById('voteConfirmation').classList.remove('hidden');
        return;
    }

    document.getElementById('votingSection').classList.remove('hidden');
    renderRankingList();
}

// Render draggable ranking list
function renderRankingList() {
    const rankingList = document.getElementById('rankingList');
    rankingList.innerHTML = '';

    window.sessionFactions.forEach((faction, index) => {
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.draggable = true;
        item.dataset.faction = faction;
        item.innerHTML = `
            <div class="rank-number">${index + 1}</div>
            <div class="faction-name">${faction}</div>
            <div class="drag-handle">⋮⋮</div>
        `;

        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);

        rankingList.appendChild(item);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (draggedElement !== this) {
        const allItems = [...document.querySelectorAll('.ranking-item')];
        const draggedIndex = allItems.indexOf(draggedElement);
        const targetIndex = allItems.indexOf(this);

        if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedElement, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedElement, this);
        }

        updateRankNumbers();
    }

    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function updateRankNumbers() {
    const items = document.querySelectorAll('.ranking-item');
    items.forEach((item, index) => {
        item.querySelector('.rank-number').textContent = index + 1;
    });
}

// Submit vote
async function submitVote() {
    const playerSelect = document.getElementById('playerSelect');
    const selectedPlayer = playerSelect.value;

    if (!selectedPlayer) {
        alert('Please select your name');
        return;
    }

    const rankingItems = document.querySelectorAll('.ranking-item');
    const ranking = Array.from(rankingItems).map(item => item.dataset.faction);

    try {
        await database.ref(`sessions/${currentSessionId}/votes/${selectedPlayer}`).set(ranking);

        // Check if this was the last vote and calculate results if needed
        const sessionSnapshot = await database.ref(`sessions/${currentSessionId}`).once('value');
        const sessionData = sessionSnapshot.val();

        if (sessionData) {
            const allVoted = sessionData.players.every(player =>
                sessionData.votes && sessionData.votes[player]
            );

            // If all votes are in and results don't exist, calculate and store them
            if (allVoted && !sessionData.results) {
                const assignments = calculateAssignments(
                    sessionData.players,
                    sessionData.factions,
                    sessionData.votes
                );
                await database.ref(`sessions/${currentSessionId}/results`).set(assignments);
            }
        }

        document.getElementById('votingSection').classList.add('hidden');
        document.getElementById('voteConfirmation').classList.remove('hidden');
    } catch (error) {
        console.error('Error submitting vote:', error);
        alert('Error submitting vote. Please try again.');
    }
}

// Load and display results
async function loadResults() {
    try {
        const sessionRef = database.ref('sessions/' + currentSessionId);

        // Listen for changes to update in real-time
        sessionRef.on('value', async (snapshot) => {
            const sessionData = snapshot.val();

            if (!sessionData) {
                alert('Session not found');
                window.location.href = 'index.html';
                return;
            }

            const players = sessionData.players;
            const votes = sessionData.votes || {};
            const votedPlayers = Object.keys(votes);

            // Update voting status
            const statusDiv = document.getElementById('votingStatus');
            statusDiv.innerHTML = players.map(player => {
                const voted = votedPlayers.includes(player);
                return `<div class="status-item ${voted ? 'voted' : 'pending'}">
                    ${player}: ${voted ? '✓ Voted' : 'Waiting...'}
                </div>`;
            }).join('');

            // Check if all players voted
            if (votedPlayers.length === players.length) {
                document.getElementById('loadingMessage').classList.add('hidden');
                document.getElementById('resultsSection').classList.remove('hidden');

                // Check if results already exist in database
                if (sessionData.results) {
                    // Use stored results
                    displayAssignments(sessionData.results, votes);
                } else {
                    // Calculate results for the first time and store them
                    const assignments = calculateAssignments(players, sessionData.factions, votes);
                    try {
                        await database.ref(`sessions/${currentSessionId}/results`).set(assignments);
                        displayAssignments(assignments, votes);
                    } catch (error) {
                        // If write fails (e.g., someone else already wrote), just display what we calculated
                        console.log('Results may have been calculated by another client');
                        displayAssignments(assignments, votes);
                    }
                }
            } else {
                document.getElementById('loadingMessage').classList.remove('hidden');
                document.getElementById('resultsSection').classList.add('hidden');
            }
        });
    } catch (error) {
        console.error('Error loading results:', error);
        alert('Error loading results');
    }
}

// Calculate faction assignments
function calculateAssignments(players, factions, votes) {
    const assignments = {};
    const availableFactions = [...factions];
    const unassignedPlayers = [...players];

    // Create preference matrix
    const preferences = {};
    players.forEach(player => {
        preferences[player] = votes[player] || [];
    });

    // Assign factions iteratively
    while (unassignedPlayers.length > 0 && availableFactions.length > 0) {
        let bestMatch = null;
        let bestRank = Infinity;
        let tiedMatches = [];

        // Find the best preference rank among all unassigned players
        unassignedPlayers.forEach(player => {
            const playerPrefs = preferences[player];

            availableFactions.forEach(faction => {
                const rank = playerPrefs.indexOf(faction);
                const effectiveRank = rank === -1 ? playerPrefs.length : rank;

                if (effectiveRank < bestRank) {
                    bestRank = effectiveRank;
                    tiedMatches = [{ player, faction }];
                } else if (effectiveRank === bestRank) {
                    tiedMatches.push({ player, faction });
                }
            });
        });

        // Break ties randomly
        const chosen = tiedMatches[Math.floor(Math.random() * tiedMatches.length)];

        if (chosen) {
            assignments[chosen.player] = chosen.faction;
            unassignedPlayers.splice(unassignedPlayers.indexOf(chosen.player), 1);
            availableFactions.splice(availableFactions.indexOf(chosen.faction), 1);
        } else {
            break;
        }
    }

    // Assign remaining players to remaining factions randomly
    unassignedPlayers.forEach((player, index) => {
        if (availableFactions[index]) {
            assignments[player] = availableFactions[index];
        }
    });

    return assignments;
}

// Display assignments and votes
function displayAssignments(assignments, votes) {
    const assignmentsList = document.getElementById('assignmentsList');
    assignmentsList.innerHTML = Object.entries(assignments)
        .map(([player, faction]) =>
            `<div class="assignment-item">
                <strong>${player}</strong> → ${faction}
            </div>`
        ).join('');

    const allVotesList = document.getElementById('allVotesList');
    allVotesList.innerHTML = Object.entries(votes)
        .map(([player, ranking]) =>
            `<div class="vote-item">
                <h4>${player}'s Rankings</h4>
                <ol>
                    ${ranking.map(faction => `<li>${faction}</li>`).join('')}
                </ol>
            </div>`
        ).join('');
}
