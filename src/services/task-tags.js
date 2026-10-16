const tagsQueries = require('../db/queries/tags');
const tasksQueries = require('../db/queries/tasks');
const { isUniqueViolation } = require('../utils/sqlite-errors');

function applyTagToTask(taskId, { tag_id }) {
  if (!tasksQueries.findTaskById(taskId)) throw { status: 404, message: 'Task not found' };
  if (!tag_id) throw { status: 400, message: 'tag_id is required' };
  const tagId = parseInt(tag_id);
  if (!tagsQueries.findTagById(tagId)) throw { status: 404, message: 'Tag not found' };

  try {
    tagsQueries.insertTaskTag(taskId, tagId);
  } catch (err) {
    if (isUniqueViolation(err)) throw { status: 409, message: 'tag already applied to this task' };
    throw err;
  }
  return { task_id: taskId, tag_id: tagId };
}

function removeTagFromTask(taskId, tagId) {
  if (tagsQueries.deleteTaskTag(taskId, tagId) === 0) {
    throw { status: 404, message: 'Tag not applied to this task' };
  }
  return { deleted: true };
}

module.exports = { applyTagToTask, removeTagFromTask };
