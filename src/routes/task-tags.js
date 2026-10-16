const express = require('express');
const taskTagsService = require('../services/task-tags');

// Mounted at /tasks/:id/tags; mergeParams exposes the parent :id
const taskTagsRouter = express.Router({ mergeParams: true });

taskTagsRouter.post('/', (req, res, next) => {
  try {
    const taskTag = taskTagsService.applyTagToTask(parseInt(req.params.id), req.body);
    res.status(201).json(taskTag);
  } catch (err) {
    next(err);
  }
});

taskTagsRouter.delete('/:tagId', (req, res, next) => {
  try {
    res.json(taskTagsService.removeTagFromTask(parseInt(req.params.id), parseInt(req.params.tagId)));
  } catch (err) {
    next(err);
  }
});

module.exports = { taskTagsRouter };
