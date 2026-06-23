// Configuration points to the running backend link environment
const API_BASE_URL = '/api';
const CURRENT_USER_ID = 'user_01'; 

// Trigger data boots on load
window.addEventListener('DOMContentLoaded', () => {
        loadArticlesFromServer();
            loadTasksFromServer();
                loadReferralDetails();
                    loadUserProfile();
});

function toggleMenu() {
        const folder = document.getElementById('dropdownFolder');
            folder.style.display = (folder.style.display === 'flex') ? 'none' : 'flex';
}

function switchView(viewId) {
        document.getElementById('dropdownFolder').style.display = 'none';

            const panels = document.querySelectorAll('.view-panel');
                panels.forEach(panel => panel.classList.remove('active'));

                    const targetPanel = document.getElementById('view-' + viewId);
                        if (targetPanel) targetPanel.classList.add('active');

                            const navBoxes = document.querySelectorAll('.nav-box');
                                navBoxes.forEach(box => box.classList.remove('active'));
                                    
                                        const activeNav = document.getElementById('btn-nav-' + viewId);
                                            if (activeNav) activeNav.classList.add('active');
                                                
                                                    if(viewId === 'create-post') {
                                                                document.getElementById('shareBoxContainer').style.display = 'none';
                                                    }
}

// 1. Fetch live articles from backend
async function loadArticlesFromServer() {
        try {
                    const response = await fetch(`${API_BASE_URL}/posts`);
                            const posts = await response.json();
                                    const feed = document.getElementById('articles-feed');
                                            feed.innerHTML = ''; 

                                                    posts.forEach(post => {
                                                                    const card = document.createElement('div');
                                                                                card.className = 'card';
                                                                                            card.innerHTML = `
                                                                                                            <div class="card-title">${post.title}</div>
                                                                                                                            <span style="font-size: 0.8rem; color:#64748b; font-weight: bold;">Category: ${post.category}</span>
                                                                                                                                            <p style="margin-top:8px; line-height:1.4;">${post.body}</p>
                                                                                                                                                        `;
                                                                                                                                                                    feed.appendChild(card);
                                                    });
        } catch (err) {
                    console.error("Error loading articles:", err);
        }
}

// 2. Upload article via pencil modal pipeline
async function publishPostToServer() {
        const title = document.getElementById('postTitle').value;
            const category = document.getElementById('postCategory').value;
                const body = document.getElementById('postBody').value;

                    if(!title || !category || !body) {
                                alert("All input fields are required before database upload.");
                                        return;
                    }

                        try {
                                    const response = await fetch(`${API_BASE_URL}/posts`, {
                                                    method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ title, category, body })
                                    });

                                            if(response.ok) {
                                                            document.getElementById('shareBoxContainer').style.display = 'block';
                                                                        loadArticlesFromServer(); 
                                                                                    document.getElementById('postTitle').value = '';
                                                                                                document.getElementById('postCategory').value = '';
                                                                                                            document.getElementById('postBody').value = '';
                                            }
                        } catch (err) {
                                    alert("Failed to submit article to server.");
                        }
}

// 3. Load TapSwap earnings configurations
async function loadTasksFromServer() {
        try {
                    const response = await fetch(`${API_BASE_URL}/tasks/${CURRENT_USER_ID}`);
                            const data = await response.json();
                                    
                                            document.getElementById('totalPointsDisplay').innerText = `${data.totalPoints.toLocaleString()} BP`;
                                                    
                                                            const taskContainer = document.getElementById('tasks-list');
                                                                    taskContainer.innerHTML = '';

                                                                            data.tasks.forEach(task => {
                                                                                            const card = document.createElement('div');
                                                                                                        card.className = 'card';
                                                                                                                    card.innerHTML = `
                                                                                                                                    <div class="card-title">${task.description}</div>
                                                                                                                                                    <p style="font-size:0.9rem; color:#64748b; margin-bottom:10px;">Reward: +${task.reward} BP</p>
                                                                                                                                                                    <button class="btn-submit" style="padding:8px; font-size:0.9rem;" 
                                                                                                                                                                                        ${task.completed ? 'disabled' : ''} 
                                                                                                                                                                                                            onclick="claimTaskReward('${task.id}')">
                                                                                                                                                                                                                                ${task.completed ? '✅ Claimed' : 'Claim Reward'}
                                                                                                                                                                                                                                                </button>
                                                                                                                                                                                                                                                            `;
                                                                                                                                                                                                                                                                        taskContainer.appendChild(card);
                                                                            });
        } catch (err) {
                    console.error("Error loading tasks:", err);
        }
}

// 4. Claim reward points with safety verification
async function claimTaskReward(taskId) {
        try {
                    const response = await fetch(`${API_BASE_URL}/tasks/claim`, {
                                    method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ userId: CURRENT_USER_ID, taskId: taskId })
                    });
                            const data = await response.json();
                                    alert(data.message);
                                            loadTasksFromServer(); 
        } catch (err) {
                    console.error("Error claiming points:", err);
        }
}

// 5. Load dynamic referral configs
async function loadReferralDetails() {
        try {
                    const response = await fetch(`${API_BASE_URL}/referral/${CURRENT_USER_ID}`);
                            const data = await response.json();
                                    document.getElementById('referralUrlField').value = data.referralUrl;
                                            document.getElementById('referralCountDisplay').innerText = data.totalReferrals;
        } catch (err) {
                    console.error("Error loading referral architecture:", err);
        }
}

// 6. Map profiles fields payload details
async function loadUserProfile() {
        try {
                    const response = await fetch(`${API_BASE_URL}/users/${CURRENT_USER_ID}`);
                            const user = await response.json();
                                    document.getElementById('prof-username').innerText = user.username;
                                            document.getElementById('prof-email').innerText = user.email;
        } catch (err) {
                    console.error("Profile payload loading issue:", err);
        }
}

function copyReferralLink() {
        const copyText = document.getElementById("referralUrlField");
            const fieldVal = copyText.value;
                copyText.select();
                    copyText.setSelectionRange(0, 99999);
                        navigator.clipboard.writeText(fieldVal);
                            alert("Your live unique referral link is copied!");
}

async function logoutSession() {
        try {
                    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
                                    method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ userId: CURRENT_USER_ID })
                    });
                            const data = await response.json();
                                    if(data.success) {
                                                    alert("Logged out successfully! App will now refresh.");
                                                                location.reload();
                                    }
        } catch(err) {
                    alert("Server connection failed during logout.");
        }
}