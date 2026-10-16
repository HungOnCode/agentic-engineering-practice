const tasksQueries = require('../db/queries/tasks');
const projectsQueries = require('../db/queries/projects');
const usersQueries = require('../db/queries/users');
const tagsQueries = require('../db/queries/tags');
const commentsQueries = require('../db/queries/comments');
const { isNonEmptyString } = require('../utils/validation');
const { getPagination } = require('../utils/pagination');

// Also enforced by a CHECK constraint in src/db/schema.js
const VALID_TASK_STATUSES = ['active', 'completed', 'archived'];

function assertValidStatus(status) {
  if (status && !VALID_TASK_STATUSES.includes(status)) {
    throw { status: 400, message: `status must be one of: ${VALID_TASK_STATUSES.join(', ')}` };
  }
}

function findTaskOrThrow(id) {
  const task = tasksQueries.findTaskById(id);
  if (!task) throw { status: 404, message: 'Task not found' };
  return task;
}

function listTasks({ status, project_id, assignee_id, page, page_size }) {
  assertValidStatus(status);
  const { limit, offset } = getPagination(page, page_size);
  return tasksQueries.findTasks({
    status: status || undefined,
    projectId: project_id ? parseInt(project_id) : undefined,
    assigneeId: assignee_id ? parseInt(assignee_id) : undefined,
    limit,
    offset
  });
}

function getTaskById(id) {
  const task = findTaskOrThrow(id);
  task.tags = tagsQueries.findTagsForTask(id);
  task.comments = commentsQueries.findCommentsForTask(id);
  return task;
}

function createTask({ title, description, project_id, assignee_id, due_date }) {
  if (!isNonEmptyString(title)) throw { status: 400, message: 'title is required' };
  if (project_id && !projectsQueries.findProjectById(parseInt(project_id))) {
    throw { status: 400, message: 'project not found' };
  }
  if (assignee_id && !usersQueries.findUserById(parseInt(assignee_id))) {
    throw { status: 400, message: 'assignee not found' };
  }
  const id = tasksQueries.insertTask({
    title,
    description: description || null,
    project_id: project_id ? parseInt(project_id) : null,
    assignee_id: assignee_id ? parseInt(assignee_id) : null,
    due_date: due_date || null
  });
  return tasksQueries.findTaskById(id);
}

function updateTask(id, data) {
  const existing = findTaskOrThrow(id);
  assertValidStatus(data.status);

  const status = data.status !== undefined ? data.status : existing.status;
  let completed_at = null;
  if (status === 'completed') {
    completed_at = existing.status === 'completed' ? existing.completed_at : new Date().toISOString();
  }

  tasksQueries.updateTask(id, {
    title: data.title !== undefined ? data.title : existing.title,
    description: data.description !== undefined ? data.description : existing.description,
    status,
    project_id: data.project_id !== undefined ? data.project_id : existing.project_id,
    assignee_id: data.assignee_id !== undefined ? data.assignee_id : existing.assignee_id,
    due_date: data.due_date !== undefined ? data.due_date : existing.due_date,
    completed_at
  });
  return tasksQueries.findTaskById(id);
}

function deleteTask(id) {
  if (tasksQueries.deleteTask(id) === 0) throw { status: 404, message: 'Task not found' };
  return { deleted: true };
}

module.exports = { listTasks, getTaskById, createTask, updateTask, deleteTask };
