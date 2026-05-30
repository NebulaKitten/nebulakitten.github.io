// ====== SUPABASE CONFIGURATION ======
// Replace these coordinates with your actual Supabase Project API credentials
const SUPABASE_URL = 'baeclleekyftgvnlqyts';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhZWNsbGVla3lmdGd2bmxxeXRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMzc0OTgsImV4cCI6MjA5NTcxMzQ5OH0.qoFHZ7m813hr1hFZ9oH_89k-75wqep6oS3mY28yGCs4';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====== APPLICATION RUNTIME STATE ======
let state = {
    currentUser: null,
    activeChallenge: null
};

// ====== ROUTING ROUTINES ======
function showPage(pageId) {
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    
    // Asynchronous UI loaders
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
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    
    try {
        // Query database for matching user profile
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('pass', pass)
            .maybeSingle();

        if (error) throw error;

        if (user) {
            authenticateUserSession(user);
        } else {
            alert("Invalid coordinate transmissions (Email/Password mismatch).");
        }
    } catch (err) {
        console.error("Login Matrix Error:", err.message);
        alert("Transmission breakdown connecting to Supabase cloud network.");
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const pass = document.getElementById('signup-pass').value;
    const isAdminChecked = document.getElementById('signup-is-admin').checked;
    
    try {
        // Double check if account handle or email exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) {
            alert("Email already registered inside database matrix.");
            return;
        }

        const newUser = {
            name: name,
            email: email,
            pass: pass, // Note: In production development, use Supabase Auth for encrypted passwords
            role: isAdminChecked ? "admin" : "student",
            xp: 0
        };
        
        const { error } = await supabase.from('users').insert([newUser]);
        if (error) throw error;

        alert("Profile cataloged! Please login with your parameters.");
        toggleAuthMode('login');
    } catch (err) {
        console.error("Signup Matrix Error:", err.message);
        alert("Failed to write user initialization parameters to the cloud cloud.");
    }
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

// ====== REMOTE DATA FETCHING & RENDERING ======

// 1. Leaderboard Data Fetching
async function renderLeaderboard() {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .not('role', 'eq', 'admin')
            .order('xp', { ascending: false });

        if (error) throw error;

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
    } catch (err) {
        console.error("Leaderboard Pull Failed:", err.message);
    }
}

// 2. Student Dashboard Mission Engine
async function renderDashboard() {
    if (!state.currentUser) return;
    
    try {
        // Sync fresh profile data from cloud database for XP updates
        const { data: freshMe } = await supabase
            .from('users')
            .select('xp')
            .eq('id', state.currentUser.id)
            .single();

        document.getElementById('dash-username').innerText = state.currentUser.name;
        document.getElementById('dash-xp').innerText = freshMe ? freshMe.xp : 0;
        
        // Fetch published coding questions
        const { data: challenges, error } = await supabase
            .from('challenges')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const listContainer = document.getElementById('dashboard-challenges-list');
        listContainer.innerHTML = '';
        
        challenges.forEach(ch => {
            const btn = document.createElement('button');
            btn.className = 'challenge-item-btn';
            btn.innerHTML = `<i class="fas fa-satellite"></i> ${ch.title} <span style="float:right; color:var(--cyber-cyan);">${ch.xp} XP</span>`;
            btn.onclick = () => selectChallengeWorkspace(ch);
            listContainer.appendChild(btn);
        });
    } catch (err) {
        console.error("Dashboard Sync Failed:", err.message);
    }
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

async function submitChallengeSolution() {
    const codeText = document.getElementById('student-code-input').value;
    
    const newSubmission = {
        user_id: state.currentUser.id,
        challenge_id: state.activeChallenge.id,
        code: codeText,
        status: "pending"
    };
    
    try {
        const { error } = await supabase.from('submissions').insert([newSubmission]);
        if (error) throw error;

        alert("Code packet deployed to Cloud Admin evaluation console.");
        
        document.getElementById('workspace-placeholder').classList.remove('hidden');
        document.getElementById('challenge-workspace').classList.add('hidden');
        state.activeChallenge = null;
    } catch (err) {
        console.error("Submission Upload Failed:", err.message);
        alert("Failed to push submission file over cloud telemetry.");
    }
}

// ====== ADMIN CONSOLE INTERFACES ======
async function adminCreateChallenge(e) {
    e.preventDefault();
    const title = document.getElementById('admin-ch-title').value;
    const desc = document.getElementById('admin-ch-desc').value;
    const xp = parseInt(document.getElementById('admin-ch-xp').value);
    
    const newChallenge = { title, desc, xp };
    
    try {
        const { error } = await supabase.from('challenges').insert([newChallenge]);
        if (error) throw error;

        alert("New challenge added to global cloud mission directories.");
        e.target.reset();
    } catch (err) {
        console.error("Challenge Creation Failed:", err.message);
    }
}

async function renderAdminPanel() {
    try {
        // Fetch pending submissions joined with user names and challenge descriptions
        const { data: submissions, error } = await supabase
            .from('submissions')
            .select(`
                id, code, status, user_id, challenge_id,
                users ( name ),
                challenges ( title, xp )
            `)
            .eq('status', 'pending');

        if (error) throw error;

        const container = document.getElementById('admin-submissions-queue');
        container.innerHTML = '';
        
        if (!submissions || submissions.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding-top:20px;">All code queues cleared.</p>';
            return;
        }
        
        submissions.forEach(sub => {
            const item = document.createElement('div');
            item.className = 'queue-item';
            item.innerHTML = `
                <div class="queue-header">
                    <strong>${sub.users?.name || 'Unknown Coder'} -> ${sub.challenges?.title || 'Unknown Mission'}</strong>
                    <span style="color:var(--cyber-cyan);">${sub.challenges?.xp || 0} XP Weight</span>
                </div>
                <pre class="queue-code">${escapeHTML(sub.code)}</pre>
                <div class="queue-actions">
                    <button class="btn-approve" onclick="evaluateSubmission('${sub.id}', 'approve', '${sub.user_id}', ${sub.challenges?.xp || 0})"><i class="fas fa-check"></i> Approve & Award XP</button>
                    <button class="btn-reject" onclick="evaluateSubmission('${sub.id}', 'reject')"><i class="fas fa-times"></i> Reject Solution</button>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (err) {
        console.error("Failed to compile admin queue:", err.message);
    }
}

async function evaluateSubmission(subId, decision, studentId, challengeXP) {
    try {
        if (decision === 'approve') {
            // 1. Fetch current student's points total
            const { data: studentProfile } = await supabase
                .from('users')
                .select('xp')
                .eq('id', studentId)
                .single();

            const currentXP = studentProfile ? studentProfile.xp : 0;
            const absoluteNewXP = currentXP + challengeXP;

            // 2. Grant computed XP points balance adjustments
            await supabase
                .from('users')
                .update({ xp: absoluteNewXP })
                .eq('id', studentId);
        }

        // 3. Mark resolution parameter choices directly on the element entry
        const { error } = await supabase
            .from('submissions')
            .update({ status: decision })
            .eq('id', subId);

        if (error) throw error;

        alert(`Solution evaluated and finalized successfully.`);
        renderAdminPanel();
    } catch (err) {
        console.error("Evaluation update operation exception:", err.message);
    }
}

function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
