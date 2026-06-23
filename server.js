const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
app.use(cors());
app.use(express.json());

// Serve static frontend files (index.html, App.js, style.css) out of the root folder
app.use(express.static(path.join(__dirname, './')));

// Simulated live server databases
let databaseUsers = [];
let databasePosts = [
        {
                    id: "post_101",
                            title: "Welcome to the Platform Engine",
                                    category: "Tech",
                                            body: "This is the very first official article on our dynamic feed. Built with a crisp navy and white layout!",
                                                    comments: [
                                                                    { id: "c_1", text: "System Account: Wow, this layout looks great!", likes: 3 }
                                                    ]
        }
];

// 1. API: Handle Account Registrations
app.post('/api/auth/signup', (req, res) => {
        const { username, email, dob, password } = req.body;

            if (!username || !email || !dob || !password) {
                        return res.status(400).json({ error: "Missing required registration parameters." });
            }

                const checkUserExist = databaseUsers.find(user => user.email === email);
                    if (checkUserExist) {
                                return res.status(400).json({ error: "An account with this email address already exists." });
                    }

                        const newUser = { username, email, dob, password };
                            databaseUsers.push(newUser);

                                return res.status(201).json({ message: "Registration successful!", user: { username, email, dob } });
});

// 2. API: Handle Account Authentication Logins
app.post('/api/auth/login', (req, res) => {
        const { email, password } = req.body;

            if (!email || !password) {
                        return res.status(400).json({ error: "Please enter both your email address and password." });
            }

                const targetUser = databaseUsers.find(user => user.email === email);
                    
                        if (!targetUser) {
                                    return res.status(401).json({ error: "Authentication Failed: Account profile not found." });
                        }

                            if (targetUser.password !== password) {
                                        return res.status(401).json({ error: "Authentication Failed: Incorrect password string." });
                            }

                                // Success response
                                    return res.json({ 
                                                message: "Login authorized!", 
                                                        user: { username: targetUser.username, email: targetUser.email, dob: targetUser.dob } 
                                    });
});

// 3. API: Get All Community Articles Feed
app.get('/api/posts', (req, res) => {
        res.json(databasePosts);
});

// 4. API: Create & Format Blogger-Style Article
app.post('/api/posts', (req, res) => {
        const { title, category, body } = req.body;

            if (!title || !body) {
                        return res.status(400).json({ error: "Title and body text are mandatory." });
            }

                const newPost = {
                            id: `post_${Date.now()}`,
                                    title,
                                            category: category || "General",
                                                    body,
                                                            comments: []
                };

                    databasePosts.unshift(newPost);
                        res.status(201).json({ message: "Article published successfully!", post: newPost });
});

// 5. API: Append Comments to a Specific Post ID
app.post('/api/posts/:id/comments', (req, res) => {
        const postId = req.params.id;
            const { commentText } = req.body;

                const post = databasePosts.find(p => p.id === postId);
                    if (!post) return res.status(404).json({ error: "Article not found." });

                        const newComment = {
                                    id: `c_${Date.now()}`,
                                            text: commentText,
                                                    likes: 0
                        };

                            post.comments.push(newComment);
                                res.status(201).json(post);
});

// 6. API: Handle Comment Likes
app.post('/api/posts/:postId/comments/:commentId/like', (req, res) => {
        const { postId, commentId } = req.params;
            
                const post = databasePosts.find(p => p.id === postId);
                    if (!post) return res.status(404).json({ error: "Article not found." });

                        const comment = post.comments.find(c => c.id === commentId);
                            if (!comment) return res.status(404).json({ error: "Comment not found." });

                                comment.likes += 1;
                                    res.json(post);
});

// Start listening engine
app.listen(PORT, () => {
        console.log(`[-] SERVER CORE STREAMING ONLINE ON PORT: ${PORT}`);
});