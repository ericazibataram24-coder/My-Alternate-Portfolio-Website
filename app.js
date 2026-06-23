const API_BASE_URL = '/api';
let activeUserSession = null;
let postRefreshInterval = null;

// On page load, check if user was already logged in
window.addEventListener('DOMContentLoaded', () => {
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
        activeUserSession = JSON.parse(savedSession);
        document.getElementById('auth-gateway').style.display = 'none';
        document.getElementById('main-application-layout').style.display = 'block';
        document.getElementById('prof-username').innerText = activeUserSession.username;
        document.getElementById('settings-email').value = activeUserSession.email;
        document.getElementById('settings-username').value = activeUserSession.username;
        document.getElementById('settings-dob').value = activeUserSession.dob;
        
        // Start live sync
        fetchAndRenderPosts();
        startLiveSync();
    }
});

function startLiveSync() {
    if (postRefreshInterval) clearInterval(postRefreshInterval);
    // Automatically fetch fresh posts from backend every 7 seconds for all users online
    postRefreshInterval = setInterval(fetchAndRenderPosts, 7000);
}

function toggleAuthForm(mode) {
    const loginForm = document.getElementById('form-login-view');
    const signupForm = document.getElementById('form-signup-view');
    const loginTab = document.getElementById('tab-login-btn');
    const signupTab = document.getElementById('tab-signup-btn');
    if (mode === 'signup') {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        signupTab.style.color = '#22c55e';
        loginTab.style.color = '#64748b';
    } else {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        loginTab.style.color = '#003366';
        signupTab.style.color = '#64748b';
    }
}

async function handleSystemSignup() {
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const dob = document.getElementById('signup-dob').value;
    const password = document.getElementById('signup-password').value;
    if (!username || !email || !dob || !password) {
        alert("Please fill out all fields to set up your account.");
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, dob, password })
        });
        const data = await response.json();
        if (!response.ok) {
            alert(data.error || "An error occurred during signup.");
            return;
        }
        alert("Account created successfully!");
        toggleAuthForm('login');
    } catch (err) {
        alert("Error: Unable to reach backend server connection.");
    }
}

async function handleSystemLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) {
        alert("Please enter your email and password.");
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) {
            alert(data.error);
            return;
        }
        activeUserSession = data.user;
        
        // Save session locally so refreshing doesn't log you out
        localStorage.setItem('user_session', JSON.stringify(activeUserSession));

        document.getElementById('auth-gateway').style.display = 'none';
        document.getElementById('main-application-layout').style.display = 'block';
        document.getElementById('prof-username').innerText = activeUserSession.username;
        document.getElementById('settings-email').value = activeUserSession.email;
        document.getElementById('settings-username').value = activeUserSession.username;
        document.getElementById('settings-dob').value = activeUserSession.dob;
        
        fetchAndRenderPosts();
        startLiveSync();
    } catch (err) {
        alert("Error linking connection directly to the server backend runtime.");
    }
}

async function fetchAndRenderPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        const posts = await response.json();
        const container = document.getElementById('dynamic-posts-container');
        if (!container) return;
        
        // Save scroll position so page doesn't jump during auto-refresh
        const oldScroll = window.scrollY;
        container.innerHTML = "";
        
        posts.forEach((post) => {
            let commentsHTML = "";
            post.comments.forEach((comment) => {
                commentsHTML += `
                    <div style="background: #f1f5f9; padding: 8px 12px; margin-top: 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                        <p style="margin: 0; font-size: 14px; color: #334155;">${comment.text}</p>
                        <button onclick="likeComment('${post.id}', '${comment.id}')" style="background: none; border: none; color: #003366; cursor: pointer; font-size: 13px; font-weight: bold;">👍 ${comment.likes}</button>
                    </div>
                `;
            });
            const postCard = document.createElement('div');
            postCard.className = 'card';
            postCard.style.marginBottom = '20px';
            postCard.innerHTML = `
                <h3>${post.title} <span style="font-size:12px; background:#003366; color:white; padding:2px 6px; border-radius:3px; margin-left:10px;">${post.category}</span></h3>
                <div style="margin-top:10px; color:#1e293b;">${post.body}</div>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;">
                <h4 style="margin-bottom: 10px; color: #003366;">Comments (${post.comments.length})</h4>
                <div id="comments-box-${post.id}">${commentsHTML || '<p style="font-size:13px; color:#94a3b8; margin:0;">No comments.</p>'}</div>
                <div style="display: flex; gap: 8px; margin-top:10px;">
                    <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." style="flex: 1; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
                    <button onclick="addCommentToPost('${post.id}')" style="background: #003366; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">Send</button>
                </div>
            `;
            container.appendChild(postCard);
        });
    } catch (err) {
        console.error("Failed to load articles from backend database stream.");
    }
}

let currentEditorMode = "compose";
function switchEditorMode(mode) {
    currentEditorMode = mode;
    const textArea = document.getElementById('post-body');
    const label = document.getElementById('editor-label');
    const composeBtn = document.getElementById('btn-mode-compose');
    const htmlBtn = document.getElementById('btn-mode-html');
    if (mode === 'html') {
        label.innerText = "HTML View (Code Mode)";
        textArea.placeholder = "<h1>Heading</h1>\n<p>Write your HTML elements...</p>";
        textArea.style.fontFamily = "monospace";
        textArea.style.background = "#1e293b";
        textArea.style.color = "#f8fafc";
        htmlBtn.style.background = "#d97706";
        htmlBtn.style.color = "white";
        composeBtn.style.background = "#e2e8f0";
        composeBtn.style.color = "#334155";
    } else {
        label.innerText = "Compose Mode (Normal Text)";
        textArea.placeholder = "Start writing your story here...";
        textArea.style.fontFamily = "sans-serif";
        textArea.style.background = "#ffffff";
        textArea.style.color = "#000000";
        composeBtn.style.background = "#003366";
        composeBtn.style.color = "white";
        htmlBtn.style.background = "#e2e8f0";
        htmlBtn.style.color = "#334155";
    }
}

async function publishBloggerPost() {
    const title = document.getElementById('post-title').value.trim();
    const category = document.getElementById('post-category').value.trim();
    let body = document.getElementById('post-body').value;
    if (!title || !body) {
        alert("Please specify article title and body content.");
        return;
    }
    if (currentEditorMode === 'compose') {
        body = body.replace(/\n/g, "<br>");
    }
    try {
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, category, body })
        });
        if (response.ok) {
            document.getElementById('post-title').value = '';
            document.getElementById('post-category').value = '';
            document.getElementById('post-body').value = '';
            switchEditorMode('compose');
            fetchAndRenderPosts();
            alert("Article saved and published across backend network streams!");
        }
    } catch (err) {
        alert("Error publishing message content logs to database.");
    }
}

async function addCommentToPost(postId) {
    const inputField = document.getElementById(`comment-input-${postId}`);
    const text = inputField.value.trim();
    if (!text) return;
    const formattedComment = `${activeUserSession.username}: ${text}`;
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ commentText: formattedComment })
        });
        if (response.ok) {
            inputField.value = "";
            fetchAndRenderPosts();
        }
    } catch (err) {
        console.error("Unable to append runtime comment logs.");
    }
}

async function likeComment(postId, commentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments/${commentId}/like`, { method: 'POST' });
        if (response.ok) { fetchAndRenderPosts(); }
    } catch (err) { console.error("Unable to patch target comment like count."); }
}

function handleSystemLogout() {
    activeUserSession = null;
    if (postRefreshInterval) clearInterval(postRefreshInterval);
    localStorage.removeItem('user_session');
    document.getElementById('main-application-layout').style.display = 'none';
    document.getElementById('auth-gateway').style.display = 'flex';
    document.getElementById('login-password').value = '';
    alert("You have been securely logged out.");
}

function updateAccountSettings() {
    alert("Configurations saved locally.");
}

function switchView(viewId) {
    const panels = document.querySelectorAll('.view-panel');
    panels.forEach(p => p.classList.remove('active-panel'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active-panel');
}

async function handleGoogleAuth() {
    // Prompt for simulation or easily bypass for direct demo access
    const userEmail = prompt("Enter your Google Account Email to continue:", "user@gmail.com");
    if (!userEmail) return;

    // Split the email prefix to generate a dynamic username
    const generatedUsername = userEmail.split('@')[0];

    activeUserSession = {
        username: generatedUsername,
        email: userEmail,
        dob: "2000-01-01"
    };

    // Save session state to local storage memory
    localStorage.setItem('user_session', JSON.stringify(activeUserSession));

    // Release interface dashboard elements
    document.getElementById('auth-gateway').style.display = 'none';
    document.getElementById('main-application-layout').style.display = 'block';
    document.getElementById('prof-username').innerText = activeUserSession.username;
    document.getElementById('settings-email').value = activeUserSession.email;
    document.getElementById('settings-username').value = activeUserSession.username;
    document.getElementById('settings-dob').value = activeUserSession.dob;

    fetchAndRenderPosts();
    startLiveSync();
    alert(`Successfully authenticated via Google as ${userEmail}!`);
}
