import Database from 'better-sqlite3';
import express from 'express';

const app = express();
app.use(express.json());

const db = new Database('posts.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    authorId TEXT NOT NULL
  )
`);

app.get('/api/users', (_req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { id, name, age } = req.body;
  db.prepare('INSERT INTO users (id, name, age) VALUES (?, ?, ?)').run(
    id,
    name,
    age,
  );
  res.status(201).json({ id, name, age });
});

app.patch('/api/users/:id', (req, res) => {
  const { name, age } = req.body;
  db.prepare('UPDATE users SET name = ?, age = ? WHERE id = ?').run(
    name,
    age,
    req.params.id,
  );
  res.json({ id: req.params.id, name, age });
});

app.delete('/api/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

app.get('/api/posts', (_req, res) => {
  const posts = db.prepare('SELECT * FROM posts').all();
  res.json(posts);
});

app.post('/api/posts', (req, res) => {
  const { id, title, authorId } = req.body;
  db.prepare('INSERT INTO posts (id, title, authorId) VALUES (?, ?, ?)').run(
    id,
    title,
    authorId,
  );
  res.status(201).json({ id, title, authorId });
});

app.patch('/api/posts/:id', (req, res) => {
  const { title, authorId } = req.body;
  db.prepare('UPDATE posts SET title = ?, authorId = ? WHERE id = ?').run(
    title,
    authorId,
    req.params.id,
  );
  res.json({ id: req.params.id, title, authorId });
});

app.delete('/api/posts/:id', (req, res) => {
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
