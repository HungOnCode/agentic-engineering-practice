const { db } = require('../index');

function findAllProjects() {
  return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
}

function findProjectById(id) {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

function insertProject({ name, description, owner_id }) {
  return db.prepare(
    'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)'
  ).run(name, description, owner_id).lastInsertRowid;
}

function updateProject(id, { name, description, owner_id }) {
  db.prepare(
    'UPDATE projects SET name = ?, description = ?, owner_id = ? WHERE id = ?'
  ).run(name, description, owner_id, id);
}

function deleteProject(id) {
  return db.prepare('DELETE FROM projects WHERE id = ?').run(id).changes;
}

module.exports = { findAllProjects, findProjectById, insertProject, updateProject, deleteProject };
