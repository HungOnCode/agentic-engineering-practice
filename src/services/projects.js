const projectsQueries = require('../db/queries/projects');
const tasksQueries = require('../db/queries/tasks');
const { isNonEmptyString } = require('../utils/validation');

function listProjects() {
  return projectsQueries.findAllProjects();
}

function findProjectOrThrow(id) {
  const project = projectsQueries.findProjectById(id);
  if (!project) throw { status: 404, message: 'Project not found' };
  return project;
}

function getProjectStats(projectId) {
  const stats = { total: 0, active: 0, completed: 0, archived: 0 };
  for (const row of tasksQueries.countTasksByStatusForProject(projectId)) {
    stats[row.status] = row.count;
    stats.total += row.count;
  }
  return stats;
}

function getProjectById(id) {
  const project = findProjectOrThrow(id);
  return { ...project, stats: getProjectStats(id) };
}

function createProject({ name, description, owner_id }) {
  if (!isNonEmptyString(name)) throw { status: 400, message: 'name is required' };
  const id = projectsQueries.insertProject({
    name,
    description: description || null,
    owner_id: owner_id || null
  });
  return projectsQueries.findProjectById(id);
}

function updateProject(id, data) {
  const existing = findProjectOrThrow(id);
  projectsQueries.updateProject(id, {
    name: data.name !== undefined ? data.name : existing.name,
    description: data.description !== undefined ? data.description : existing.description,
    owner_id: data.owner_id !== undefined ? data.owner_id : existing.owner_id
  });
  return projectsQueries.findProjectById(id);
}

function deleteProject(id) {
  if (projectsQueries.deleteProject(id) === 0) throw { status: 404, message: 'Project not found' };
  return { deleted: true };
}

module.exports = { listProjects, getProjectById, createProject, updateProject, deleteProject };
