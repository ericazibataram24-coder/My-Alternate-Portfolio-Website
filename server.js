const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname)); // Static file serving rule added for production deployment

const PROD_KEY = "system_production_hash_token_string_key_value";

let databaseUsers = [{
    id: 11111,
    email: "admin@test.com", 
    dob: "2000-01-01",
    password: bcrypt.hashSync("admin123", 10), 
    role: "admin"
}];
let databasePosts = [];

app.post('/api/signup', async (req, res) => {
    const { email, dob, password } = req.body;
    if (databaseUsers.find(u => u.email === email)) return res.status(400).json({ error: "Email taken." });

    const hashedPassword = await bcrypt.hash(password, 10);
    databaseUsers.push({ id: Date.now(), email, dob, password: hashedPassword, role: "reader" });
    res.status(201).json({ message: "Reader registration complete!" });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = databaseUsers.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: "Account not found." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Wrong password." });

    const token = jwt.sign({ id: user.id, role: user.role }, PROD_KEY, { expiresIn: '12h' });
    res.json({ token, user: { email: user.email, dob: user.dob, role: user.role } });
});

app.post('/api/posts', (req, res) => {
    const { title, privacy, label, content, editorType } = req.body;
    const postRecord = { id: String(Date.now()), title, privacy, label, content, editorType };
    databasePosts.push(postRecord);
    res.json({ status: "success" });
});

app.get('/api/posts', (req, res) => {
    const safeSummary = databasePosts.map(p => ({ id: p.id, title: p.title, privacy: p.privacy, label: p.label }));
    res.json(safeSummary);
});

app.get('/api/posts/:id', (req, res) => {
    const targetPost = databasePosts.find(p => p.id === req.params.id);
    if (!targetPost) return res.status(404).json({ error: "Document lost." });

    if (targetPost.privacy === 'public') {
        return res.json(targetPost);
    }

    const headerAuth = req.headers['authorization'];
    if (!headerAuth || headerAuth === "Bearer null") return res.status(403).json({ error: "Resource locked." });

    res.json(targetPost);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Enterprise Node Engine listening on port ${PORT}`));
