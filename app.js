// ====== SYSTEM CORE DATABASE INITIALIZATION ======
const DB_PREFIX = "nebulakitten_";

function getDB(key, defaultVal = []) {
    const data = localStorage.getItem(DB_PREFIX + key);
    return data ? JSON.parse(data) : defaultVal;
}

function setDB(key, data) {
    localStorage.setItem(DB_PREFIX + key, JSON.stringify(data));
}

// Seed Mock Starting Data if Empty
if (getDB('users').length === 0) {
    // Standard Admin Seed Account
    const defaultUsers = [
        { id: "u1", name: "Commander Meow", email: "admin@nebula.com", pass: "admin123", role: "admin", xp: 9999 },
        { id: "u2", name: "SpacePaws", email: "student@nebula.com", pass: "student123", role: "student", xp: 250 },
        { id: "u3", name: "CyberCat", email: "cyber@nebula.com", pass: "password", role: "student", xp: 120 }
    ];
    // Standard Challenges Seed
    const defaultChallenges = [
        { id: "c1", title: "The Hyperdrive Inversion", desc: "Write a function solve(str) that reverses an engineering sequence code array string. Input: 'nebula' -> Output: 'aluben'", xp: 100 },
        { id: "c2", title: "Solar Flare Filter", desc: "Write a function solve(arr) that filters out all radiation array integers that scale above 500 lumens.", xp: 150 }
    ];
    // Queue System Seed
    const defaultSubmissions = [
        { id: "s1", userId: "u3", userName: "CyberCat", challengeId: "c1", challengeTitle: "The Hyperdrive Inversion", code: "function solve(str) {\n  return str.split('').reverse().join('');\n}", status: "pending" }
    ];

    setDB('users', defaultUsers);
    setDB('challenges', defaultChallenges);
    setDB('submissions', defaultSubmissions);
}

// ====== APPLICATION RUNTIME STATE ======
let state = {
    currentUser: null,
    activeChallenge: null
};

// ====== ROUTING ROUTINES ======
function showPage(pageId) {
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    
    // Custom View Lifecycle Actions
    if (pageId === 'leaderboard') renderLeaderboard();
    if (pageId === 'dashboard') renderDashboard();
    if (pageId === 'admin') renderAdminPanel();
}

function toggleAuthMode(mode) {
    if (mode === 'login') {
        document.getElementById('tab-login').classList.add('active');
        document.getElementById('tab-signup').classList.remove('active');
        document.getElementById('form-login').classList.remove('hidden');
        document.getElementById('form-signup').classList.add('hidden');
    } else {
        document.getElementById('tab-signup').classList.add('active');
        document.getElementById('tab-login').classList.remove('active');
        document.getElementById('form-signup').classList.remove('hidden');
        document.getElementById('form-login').classList.add('hidden');
    }
}

// ====== USER AUTHENTICATION CONTROLLERS ======
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    
    const users = getDB('users');
    const user = users.find(u => u.email === email && u.pass === pass);
    
    if (user) {
        authenticateUserSession(user);
    } else {
        alert("Invalid coordinate transmissions (Email/Password mismatch). Try admin@nebula.com / admin123");
    }
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const pass = document.getElementById('signup-pass').value;
    const isAdminChecked = document.getElementById('signup-is-admin').checked;
    
    const users = getDB('users');
    if (users.some(u => u.email === email)) {
        alert("Email already registered inside database matrix.");
        return;
    }

    const newUser = {
        id: "u_" + Date.now(),
        name: name,
        email: email,
        pass: pass,
        role: isAdminChecked ? "admin" : "student",
        xp: 0
    };
    
    users.push(newUser);
    setDB('users', users);
    alert("Profile cataloged! Please login with your parameters.");
    toggleAuthMode('login');
}

function authenticateUserSession(user) {
    state.currentUser = user;
    document.getElementById('nav-auth').style.display = 'none';
    document.getElementById('nav-user').style.display = 'flex';
    document.getElementById('user-display-name').innerText = user.name;
    
    if (user.role === 'admin') {
        document.getElementById('nav-admin').style.display = 'block';
        document.getElementById('nav-dash').style.display = 'none';
        showPage('admin');
    } else {
        document.getElementById('nav-dash').style.display = 'block';
        document.getElementById('nav-admin').style.display = 'none';
        showPage('dashboard');
    }
}

function logout() {
    state.currentUser = null;
    document.getElementById('nav-auth').style.display = 'block';
    document.getElementById('nav-user').style.display = 'none';
    document.getElementById('nav-dash').style.display = 'none';
    document.getElementById('nav-admin').style.display = 'none';
    showPage('home');
}

// ====== RENDER PROCEDURES: LEADERBOARD ======
function renderLeaderboard() {
    const users = getDB('users').filter(u => u.role !== 'admin');
    // Sort descending by total XP
    users.sort((a, b) => b.xp - a.xp);
    
    const container = document.getElementById('leaderboard-rows');
    container.innerHTML = '';
    
    users.forEach((user, index) => {
        let title = "Stellar Cadet";
        if (user.xp >= 500) title = "Nebula Specialist";
        if (user.xp >= 1500) title = "Cosmic Architect";
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${index + 1}</strong></td>
            <td><i class="fas fa-cat accent-text"></i> ${user.name}</td>
            <td><span class="role-badge" style="background:rgba(255, 0, 127, 0.1); color:var(--neon-pink);">${title}</span></td>
            <td><span class="accent-text">${user.xp} XP</span></td>
        `;
        container.appendChild(tr);
    });
}

// ====== RENDER PROCEDURES: STUDENT DASHBOARD ======
function renderDashboard() {
    if (!state.currentUser) return;
    document.getElementById('dash-username').innerText = state.currentUser.name;
    
    // Sync current XP status
    const users = getDB('users');
    const currentMe = users.find(u => u.id === state.currentUser.id);
    document.getElementById('dash-xp').innerText = currentMe ? currentMe.xp : 0;
    
    const challenges = getDB('challenges');
    const listContainer = document.getElementById('dashboard-challenges-list');
    listContainer.innerHTML = '';
    
    challenges.forEach(ch => {
        const btn = document.createElement('button');
        btn.className = 'challenge-item-btn';
        btn.innerHTML = `<i class="fas fa-satellite"></i> ${ch.title} <span style="float:right; color:var(--cyber-cyan);">${ch.xp} XP</span>`;
        btn.onclick = () => selectChallengeWorkspace(ch);
        listContainer.appendChild(btn);
    });
}

function selectChallengeWorkspace(challenge) {
    state.activeChallenge = challenge;
    document.getElementById('workspace-placeholder').classList.add('hidden');
    document.getElementById('challenge-workspace').classList.remove('hidden');
    
    document.getElementById('work-title').innerText = challenge.title;
    document.getElementById('work-desc').innerText = challenge.desc;
    document.getElementById('work-xp').innerText = challenge.xp;
    document.getElementById('student-code-input').value = `// Mission Solution Structure\nfunction solve() {\n    // Code here\n}`;
}

function submitChallengeSolution() {
    const codeText = document.getElementById('student-code-input').value;
    const submissions = getDB('submissions');
    
    const newSubmission = {
        id: "s_" + Date.now(),
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        challengeId: state.activeChallenge.id,
        challengeTitle: state.activeChallenge.title,
        code: codeText,
        status: "pending"
    };
    
    submissions.push(newSubmission);
    setDB('submissions', submissions);
    alert("Code packet deployed to Admin evaluation console.");
    
    // Return view state
    document.getElementById('workspace-placeholder').classList.remove('hidden');
    document.getElementById('challenge-workspace').classList.add('hidden');
    state.activeChallenge = null;
}

// ====== RENDER PROCEDURES: ADMIN PANEL CONTROL ======
function adminCreateChallenge(e) {
    e.preventDefault();
    const title = document.getElementById('admin-ch-title').value;
    const desc = document.getElementById('admin-ch-desc').value;
    const xp = parseInt(document.getElementById('admin-ch-xp').value);
    
    const challenges = getDB('challenges');
    challenges.push({
        id: "c_" + Date.now(),
        title: title,
        desc: desc,
        xp: xp
    });
    
    setDB('challenges', challenges);
    alert("New challenge added to global mission directories.");
    e.target.reset();
    renderDashboard();
}

function renderAdminPanel() {
    const submissions = getDB('submissions').filter(s => s.status === 'pending');
    const container = document.getElementById('admin-submissions-queue');
    container.innerHTML = '';
    
    if (submissions.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding-top:20px;">All code queues cleared.</p>';
        return;
    }
    
    submissions.forEach(sub => {
        const item = document.createElement('div');
        item.className = 'queue-item';
        item.innerHTML = `
            <div class="queue-header">
                <strong>${sub.userName} -> ${sub.challengeTitle}</strong>
                <span style="color:var(--cyber-cyan);">Pending Evaluation</span>
            </div>
            <pre class="queue-code">${escapeHTML(sub.code)}</pre>
            <div class="queue-actions">
                <button class="btn-approve" onclick="evaluateSubmission('${sub.id}', 'approve')"><i class="fas fa-check"></i> Approve & Award XP</button>
                <button class="btn-reject" onclick="evaluateSubmission('${sub.id}', 'reject')"><i class="fas fa-times"></i> Reject Solution</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function evaluateSubmission(subId, decision) {
    let submissions = getDB('submissions');
    let users = getDB('users');
    const targetSub = submissions.find(s => s.id === subId);
    
    if (!targetSub) return;
    
    if (decision === 'approve') {
        const challenges = getDB('challenges');
        const originalChallenge = challenges.find(c => c.id === targetSub.challengeId);
        const addedXP = originalChallenge ? originalChallenge.xp : 50;
        
        // Find student and add XP
        users = users.map(u => {
            if (u.id === targetSub.userId) {
                return { ...u, xp: (u.xp || 0) + addedXP };
            }
            return u;
        });
        setDB('users', users);
        alert(`Solution Approved! Granted XP to ${targetSub.userName}.`);
    } else {
        alert(`Solution rejected.`);
    }
    
    // Remove or change status of processed records
    submissions = submissions.map(s => s.id === subId ? { ...s, status: decision } : s);
    setDB('submissions', submissions);
    
    renderAdminPanel();
}

function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
