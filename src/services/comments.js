const commentsQueries = require('../db/queries/comments');
const tasksQueries = require('../db/queries/tasks');
const usersQueries = require('../db/queries/users');
const { isNonEmptyString } = require('../utils/validation');

function assertTaskExists(taskId) {
  if (!tasksQueries.findTaskById(taskId)) throw { status: 404, message: 'Task not found' };
}

function listCommentsForTask(taskId) {
  assertTaskExists(taskId);
  return commentsQueries.findCommentsForTask(taskId);
}

function createComment(taskId, { user_id, body }) {
  assertTaskExists(taskId);
  if (!isNonEmptyString(body)) throw { status: 400, message: 'body is required' };
  if (!user_id) throw { status: 400, message: 'user_id is required' };
  if (!usersQueries.findUserById(parseInt(user_id))) throw { status: 400, message: 'user not found' };

  const id = commentsQueries.insertComment({ task_id: taskId, user_id: parseInt(user_id), body });
  return commentsQueries.findCommentById(id);
}

module.exports = { listCommentsForTask, createComment };
