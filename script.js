const BACKEND_SERVICE = window.location.origin + "/api";
let sessionToken = null;
let profileInstance = null;
let activeEditorMode = "standard";

document.addEventListener("DOMContentLoaded", () => {
    fetchDataCollections();
});

function toggleDrawer() { document.getElementById('sideDrawer').classList.toggle('open'); }
function openAuthModal() { document.getElementById('authModal').style.display = 'flex'; }
function closeAuthModal() { document.getElementById('authModal').style.display = 'none'; }

function navigate(viewId) {
    document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    toggleDrawer();
}

function setEditorMode(mode) {
    activeEditorMode = mode;
    document.getElementById('tab-standard').classList.remove('active');
    document.getElementById('tab-html').classList.remove('active');
    document.getElementById('postContent').style.display = 'none';
    document.getElementById('postHtmlContent').style.display = 'none';

    if (mode === 'standard') {
        document.getElementById('tab-standard').classList.add('active');
        document.getElementById('postContent').style.display = 'block';
    } else {
        document.getElementById('tab-html').classList.add('active');
        document.getElementById('postHtmlContent').style.display = 'block';
    }
}

function toggleAuthForm(target) {
    document.getElementById('toggle-login-btn').classList.remove('active');
    document.getElementById('toggle-signup-btn').classList.remove('active');
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('signupForm').classList.remove('active');

    if (target === 'login') {
        document.getElementById('toggle-login-btn').classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        document.getElementById('toggle-signup-btn').classList.add('active');
        document.getElementById('signupForm').classList.add('active');
    }
}

document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        email: document.getElementById('signupEmail').value,
        dob: document.getElementById('signupDob').value,
        password: document.getElementById('signupPassword').value
    };
    const res = await fetch(`${BACKEND_SERVICE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (res.ok) { alert("Registration successful! You can now log in."); toggleAuthForm('login'); }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };
    const res = await fetch(`${BACKEND_SERVICE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (res.ok) {
        sessionToken = result.token;
        profileInstance = result.user;

        document.getElementById('navAuthBtn').innerText = profileInstance.role === 'admin' ? "👑 Admin Profile" : "👤 Reader Profile";
        document.getElementById('settingsEmail').value = profileInstance.email;
        document.getElementById('settingsDob').value = profileInstance.dob;
        
        if (profileInstance.role === 'admin') {
            document.getElementById('adminComposeNav').style.display = 'block';
        }
        
        document.getElementById('settingsNav').style.display = 'block';
        document.getElementById('drawerLogoutBtn').style.display = 'block';
        closeAuthModal();
        fetchDataCollections(); 
        alert("Logged in successfully!");
    } else {
        alert(result.error);
    }
});

document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const articleBody = (activeEditorMode === 'standard') ? document.getElementById('postContent').value : document.getElementById('postHtmlContent').value;
    
    const payload = {
        title: document.getElementById('postTitle').value,
        privacy: document.getElementById('postPrivacy').value,
        label: document.getElementById('postLabel').value,
        content: articleBody,
        editorType: activeEditorMode
    };

    const res = await fetch(`${BACKEND_SERVICE}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionToken}` },
        body: JSON.stringify(payload)
    });
    if (res.ok) {
        alert("Broadcast live to main registry network!");
        document.getElementById('postForm').reset();
        fetchDataCollections();
    }
});

async function fetchDataCollections() {
    const res = await fetch(`${BACKEND_SERVICE}/posts`);
    const posts = await res.json();
    
    const feedGrid = document.getElementById('feedGrid');
    const archiveGrid = document.getElementById('archiveGrid');
    const labelsGrid = document.getElementById('labelsGrid');
    
    feedGrid.innerHTML = ''; archiveGrid.innerHTML = ''; labelsGrid.innerHTML = '';

    posts.forEach(post => {
        const itemCard = document.createElement('div');
        itemCard.className = 'card';
        
        let lockElement = '';
        if (post.privacy === 'private') {
            lockElement = `<span class="lock-badge">🔒 Locked Document</span>`;
        }

        itemCard.innerHTML = `
            <div>
                ${lockElement}
                <span class="badge">${post.label.toUpperCase()}</span>
                <h3>${post.title}</h3>
            </div>
            <button class="read-btn" onclick="requestDocumentAccess('${post.id}', '${post.privacy}')">Read Document</button>
        `;

        feedGrid.appendChild(itemCard.cloneNode(true));
        archiveGrid.appendChild(itemCard.cloneNode(true));
        labelsGrid.appendChild(itemCard.cloneNode(true));
    });
}

async function requestDocumentAccess(postId, privacy) {
    if (privacy === 'private' && !sessionToken) {
        alert("⚠️ Access Blocked! This specific document is locked. Please Sign Up or Log In first to read it.");
        openAuthModal();
        return;
    }
    
    const res = await fetch(`${BACKEND_SERVICE}/posts/${postId}`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
    });
    const postData = await res.json();
    
    if (res.ok) {
        document.getElementById('viewPostTitle').innerText = postData.title;
        document.getElementById('viewPostDisplayArea').innerHTML = postData.content;
        document.getElementById('contentViewerModal').style.display = 'flex';
    } else {
        alert("Access Denied or Document not found.");
    }
}

function closeContentViewer() {
    document.getElementById('contentViewerModal').style.display = 'none';
    document.getElementById('viewPostDisplayArea').innerHTML = ''; 
}

function logoutApp() {
    sessionToken = null; profileInstance = null;
    document.getElementById('navAuthBtn').innerText = "Sign In / Join";
    document.getElementById('adminComposeNav').style.display = 'none';
    document.getElementById('settingsNav').style.display = 'none';
    document.getElementById('drawerLogoutBtn').style.display = 'none';
    fetchDataCollections();
    navigate('feed-view');
}
