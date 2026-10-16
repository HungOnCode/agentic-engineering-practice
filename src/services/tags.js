const tagsQueries = require('../db/queries/tags');
const { isNonEmptyString } = require('../utils/validation');
const { isUniqueViolation } = require('../utils/sqlite-errors');

function listTags() {
  return tagsQueries.findAllTags();
}

function createTag({ name }) {
  if (!isNonEmptyString(name)) throw { status: 400, message: 'name is required' };
  let id;
  try {
    id = tagsQueries.insertTag(name.toLowerCase().trim());
  } catch (err) {
    if (isUniqueViolation(err)) throw { status: 409, message: 'tag already exists' };
    throw err;
  }
  return tagsQueries.findTagById(id);
}

module.exports = { listTags, createTag };
