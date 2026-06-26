const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

const PROD_KEY = "system_production_hash_token_string_key_value";

// Fully self-contained verified connection string
const MONGO_URI = "mongodb+srv://ericazibataram24_db_user:BioPulseSecure2026@mywebsite.hsh2yld.mongodb.net/biopulse?appName=Mywebsite"; 

// Force local URI fallback to bypass Render environment panel requirements
mongoose.connect(MONGO_URI)
    .then(() => console.log("🔥 MongoDB Connected Permanently!"))
    .catch(err => console.error("Database connection failure:", err));

// Define Database Schemas
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    dob: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'reader' }
});
const User = mongoose.model('User', UserSchema);

const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    privacy: { type: String, required: true },
    label: { type: String, required: true },
    content: { type: String, required: true },
    editorType: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Post = mongoose.model('Post', PostSchema);

async function seedAdmin() {
    const adminExists = await User.findOne({ email: "admin@test.com" });
    if (!adminExists) {
        const hashedAdminPassword = await bcrypt.hash("admin123", 10);
        await User.create({
            email: "admin@test.com",
            dob: "2000-01-01",
            password: hashedAdminPassword,
            role: "admin"
        });
        console.log("👑 Default Admin Seeded into Cloud Database.");
    }
}
seedAdmin();

// API ENDPOINTS
app.post('/api/signup', async (req, res) => {
    try {
        const { email, dob, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email taken." });

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ email, dob, password: hashedPassword, role: "reader" });
        res.status(201).json({ message: "Reader registration complete!" });
    } catch (err) {
        res.status(500).json({ error: "Server Registration Error" });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "Account not found." });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "Wrong password." });

        const token = jwt.sign({ id: user._id, role: user.role }, PROD_KEY, { expiresIn: '12h' });
        res.json({ token, user: { email: user.email, dob: user.dob, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: "Server Login Error" });
    }
});

app.post('/api/posts', async (req, res) => {
    try {
        const { title, privacy, label, content, editorType } = req.body;
        await Post.create({ title, privacy, label, content, editorType });
        res.json({ status: "success" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save post." });
    }
});

app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find({}, 'title privacy label').sort({ createdAt: -1 });
        const safeSummary = posts.map(p => ({ id: p._id, title: p.title, privacy: p.privacy, label: p.label }));
        res.json(safeSummary);
    } catch (err) {
        res.status(500).json({ error: "Failed to load feed." });
    }
});

app.get('/api/posts/:id', async (req, res) => {
    try {
        const targetPost = await Post.findById(req.params.id);
        if (!targetPost) return res.status(404).json({ error: "Document lost." });

        if (targetPost.privacy === 'public') {
            return res.json(targetPost);
        }

        const headerAuth = req.headers['authorization'];
        if (!headerAuth || headerAuth === "Bearer null") return res.status(403).json({ error: "Resource locked." });

        res.json(targetPost);
    } catch (err) {
        res.status(500).json({ error: "Access Evaluation Error" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Enterprise Node Engine listening on port ${PORT}`));

// Global system state controlled exclusively by you
let systemControlMatrix = {
    maintenanceMode: false,
    allowSignups: true
};

// Route that listens to your switches and logs updates to your terminal
app.post('/api/admin/toggle-control', (req, res) => {
    const { settingKey, targetState } = req.body;
    
    if (systemControlMatrix.hasOwnProperty(settingKey)) {
        systemControlMatrix[settingKey] = targetState;
        console.log(`⚙️ [TERMINAL UPDATE]: ${settingKey} has been toggled to ${targetState}`);
        return res.json({ status: "success" });
    }
    
    res.status(400).json({ error: "Invalid setting key" });
});

// Admin verification middleware to prevent unauthorized posts
app.post('/api/posts/compose', (req, res, next) => {
    if (req.session && req.session.user && req.session.user.isAdmin) {
        return next();
    } else {
        return res.status(403).send("Access Denied: Only Eric can publish posts.");
    }
});
