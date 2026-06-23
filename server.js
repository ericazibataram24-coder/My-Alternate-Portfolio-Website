const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect directly to your live MongoDB cloud URI string configured on Render
const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('[-] DATABASE CONNECTED PERMANENTLY TO CLOUD ATOMS'))
    .catch(err => console.error('Database connection error:', err));

// Database Schema Blueprint Rules
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    dob: String,
    password: { type: String, required: true }
});

const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, default: "General" },
    body: { type: String, required: true },
    comments: [{
        id: String,
        text: String,
        likes: { type: Number, default: 0 }
    }],
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// --- AUTHENTICATION ENDPOINTS ---
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, email, dob, password } = req.body;
        const exactMatch = await User.findOne({ email: email.toLowerCase() });
        if (exactMatch) {
            return res.status(400).json({ error: "An account with this email already exists." });
        }
        const newUser = new User({ username, email: email.toLowerCase(), dob, password });
        await newUser.save();
        res.status(201).json({ message: "Registration successful!" });
    } catch (err) {
        res.status(500).json({ error: "Internal server error during account assembly." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const targetUser = await User.findOne({ email: email.toLowerCase() });
        if (!targetUser || targetUser.password !== password) {
            return res.status(401).json({ error: "Invalid email or master security password alignment." });
        }
        res.status(200).json({
            message: "Authentication clear!",
            user: { username: targetUser.username, email: targetUser.email, dob: targetUser.dob }
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to read database parameters." });
    }
});

// --- FEED & ARTICLES ENDPOINTS ---
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({ error: "Unable to retrieve database streams." });
    }
});

app.post('/api/posts', async (req, res) => {
    try {
        const { title, category, body } = req.body;
        const freshPost = new Post({ title, category, body, comments: [] });
        await freshPost.save();
        res.status(201).json(freshPost);
    } catch (err) {
        res.status(500).json({ error: "Database rejected article insertion parameters." });
    }
});

app.post('/api/posts/:postId/comments', async (req, res) => {
    try {
        const { commentText } = req.body;
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ error: "Post target missing." });
        
        post.comments.push({
            id: 'c_' + Math.random().toString(36).substr(2, 9),
            text: commentText,
            likes: 0
        });
        await post.save();
        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ error: "Failed to save comment record." });
    }
});

app.post('/api/posts/:postId/comments/:commentId/like', async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ error: "Target stream closed." });
        const comment = post.comments.id(req.params.commentId);
        if (comment) {
            comment.likes += 1;
            await post.save();
        }
        res.status(200).json(post);
    } catch (err) {
        res.status(500).json({ error: "Failed to increment comment counter metrics." });
    }
});

app.listen(PORT, () => {
    console.log(`[-] ECO-SYSTEM PERMANENT INSTANCE LIVE ON PORT: ${PORT}`);
});
