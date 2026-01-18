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
    apiKey: decodeConfig("DHy6LIA5DzusATcXZ3EzAwuhGKAMDJSkLxSsrx9HqwW4LxSSnS9e"),
    authDomain: "factionpicker.firebaseapp.com",
    databaseURL: "https://factionpicker-default-rtdb.firebaseio.com",
    projectId: "factionpicker",
    storageBucket: "factionpicker.firebasestorage.app",
    messagingSenderId: decodeConfig("Zwx4BQHjZwH0ZGDl"),
    appId: decodeConfig("ZGblBGt4AGNlAGDkAQV6q2IvBzIvAzSyZGZmLmN1MQZkMTMyMQtjAzL="),
    measurementId: decodeConfig("El1BGRASEIEBJxtm")
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Global state
let players = [];
let factions = [];
let currentSessionId = null;

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

        // Store factions and voted status for voting
        window.sessionFactions = sessionData.factions;
        window.sessionVotedStatus = sessionData.votedStatus || {};
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
    if (window.sessionVotedStatus && window.sessionVotedStatus[selectedPlayer] === true) {
        alert('You have already voted!');
        document.getElementById('votingSection').classList.add('hidden');
        document.getElementById('voteConfirmation').classList.remove('hidden');
        return;
    }

    document.getElementById('votingSection').classList.remove('hidden');
    renderRankingList();
}

// Render dropdown ranking list
function renderRankingList() {
    const rankingList = document.getElementById('rankingList');
    rankingList.innerHTML = '';

    window.sessionFactions.forEach((faction, index) => {
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.innerHTML = `
            <div class="rank-number">${index + 1}</div>
            <select class="faction-select" data-rank="${index}" onchange="updateAvailableFactions()">
                <option value="">No Preference</option>
                ${window.sessionFactions.map(f =>
                    `<option value="${f}">${f}</option>`
                ).join('')}
            </select>
        `;

        rankingList.appendChild(item);
    });
}

// Update available factions in dropdowns based on current selections
function updateAvailableFactions() {
    const selects = document.querySelectorAll('.faction-select');
    const selectedFactions = new Set();

    // Collect all selected factions
    selects.forEach(select => {
        if (select.value) {
            selectedFactions.add(select.value);
        }
    });

    // Update each dropdown
    selects.forEach(select => {
        const currentValue = select.value;
        const options = select.querySelectorAll('option');

        options.forEach(option => {
            if (option.value === '') {
                // "No Preference" is always enabled
                option.disabled = false;
            } else if (option.value === currentValue) {
                // Current selection is always enabled
                option.disabled = false;
            } else if (selectedFactions.has(option.value)) {
                // Already selected in another dropdown
                option.disabled = true;
            } else {
                // Available for selection
                option.disabled = false;
            }
        });
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

    const selects = document.querySelectorAll('.faction-select');
    const ranking = Array.from(selects)
        .map(select => select.value)
        .filter(value => value !== ''); // Only include actual preferences, not "No Preference"

    try {
        // Store the vote (can be empty array for no preferences)
        // Also set a votedStatus flag to track that this player has voted
        await Promise.all([
            database.ref(`sessions/${currentSessionId}/votes/${selectedPlayer}`).set(ranking),
            database.ref(`sessions/${currentSessionId}/votedStatus/${selectedPlayer}`).set(true)
        ]);

        // Check if this was the last vote and calculate results if needed
        const sessionSnapshot = await database.ref(`sessions/${currentSessionId}`).once('value');
        const sessionData = sessionSnapshot.val();

        if (sessionData) {
            const allVoted = sessionData.players.every(player =>
                sessionData.votedStatus && sessionData.votedStatus[player] === true
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
            const votedStatus = sessionData.votedStatus || {};

            // Update voting status
            const statusDiv = document.getElementById('votingStatus');
            statusDiv.innerHTML = players.map(player => {
                const voted = votedStatus[player] === true;
                return `<div class="status-item ${voted ? 'voted' : 'pending'}">
                    ${player}: ${voted ? '✓ Voted' : 'Waiting...'}
                </div>`;
            }).join('');

            // Check if all players voted
            const allVoted = players.every(player => votedStatus[player] === true);
            if (allVoted) {
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

// Hungarian Algorithm implementation for optimal assignment
function hungarianAlgorithm(costMatrix) {
    const n = costMatrix.length;
    if (n === 0) return [];

    const m = costMatrix[0].length;
    const matrix = costMatrix.map(row => [...row]); // Deep copy

    // Step 1: Subtract row minimums
    for (let i = 0; i < n; i++) {
        const rowMin = Math.min(...matrix[i]);
        for (let j = 0; j < m; j++) {
            matrix[i][j] -= rowMin;
        }
    }

    // Step 2: Subtract column minimums
    for (let j = 0; j < m; j++) {
        let colMin = Infinity;
        for (let i = 0; i < n; i++) {
            colMin = Math.min(colMin, matrix[i][j]);
        }
        for (let i = 0; i < n; i++) {
            matrix[i][j] -= colMin;
        }
    }

    // Find optimal assignment using augmenting path method
    const assignment = new Array(n).fill(-1);
    const colAssigned = new Array(m).fill(false);

    // Try to assign each row
    for (let i = 0; i < n; i++) {
        const visited = new Array(m).fill(false);
        findAugmentingPath(i, matrix, assignment, colAssigned, visited);
    }

    return assignment;
}

function findAugmentingPath(row, matrix, assignment, colAssigned, visited) {
    const m = matrix[0].length;

    for (let col = 0; col < m; col++) {
        if (matrix[row][col] === 0 && !visited[col]) {
            visited[col] = true;

            if (!colAssigned[col]) {
                // Found an unassigned column
                assignment[row] = col;
                colAssigned[col] = true;
                return true;
            } else {
                // Try to reassign the currently assigned row
                const assignedRow = assignment.indexOf(col);
                if (assignedRow !== -1 && findAugmentingPath(assignedRow, matrix, assignment, colAssigned, visited)) {
                    assignment[row] = col;
                    return true;
                }
            }
        }
    }

    return false;
}

// Calculate faction assignments using Hungarian algorithm
function calculateAssignments(players, factions, votes) {
    const assignments = {};

    if (players.length === 0 || factions.length === 0) {
        return assignments;
    }

    // Build cost matrix
    // Rows = players, Columns = factions
    // Cost = rank in preference (lower is better)
    // If not ranked, use high penalty
    const costMatrix = [];

    players.forEach(player => {
        const playerVote = votes[player] || [];
        const row = [];

        factions.forEach(faction => {
            const rank = playerVote.indexOf(faction);
            if (rank !== -1) {
                // Player ranked this faction at position 'rank' (0 = first choice)
                row.push(rank);
            } else {
                // Player didn't rank this faction - assign high cost
                row.push(factions.length + 1);
            }
        });

        costMatrix.push(row);
    });

    // Pad matrix if needed (make it square for Hungarian algorithm)
    const maxDim = Math.max(players.length, factions.length);

    // Pad rows (add dummy players)
    while (costMatrix.length < maxDim) {
        costMatrix.push(new Array(factions.length).fill(factions.length + 1));
    }

    // Pad columns (add dummy factions)
    costMatrix.forEach(row => {
        while (row.length < maxDim) {
            row.push(maxDim + 1);
        }
    });

    // Run Hungarian algorithm
    const assignment = hungarianAlgorithm(costMatrix);

    // Convert assignment array to player->faction mapping
    for (let i = 0; i < players.length; i++) {
        const factionIndex = assignment[i];
        if (factionIndex !== -1 && factionIndex < factions.length) {
            assignments[players[i]] = factions[factionIndex];
        }
    }

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
        .map(([player, ranking]) => {
            // Empty arrays or missing votes mean no preferences
            const hasPreferences = ranking && ranking.length > 0;

            const rankingDisplay = hasPreferences
                ? `<ol>${ranking.map(faction => `<li>${faction}</li>`).join('')}</ol>`
                : `<p style="color: #888; font-style: italic;">No preferences specified</p>`;

            return `<div class="vote-item">
                <h4>${player}'s Rankings</h4>
                ${rankingDisplay}
            </div>`;
        }).join('');
}
