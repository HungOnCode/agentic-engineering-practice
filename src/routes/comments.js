const express = require('express');
const commentsService = require('../services/comments');

// Mounted at /tasks/:id/comments; mergeParams exposes the parent :id
const commentsRouter = express.Router({ mergeParams: true });

commentsRouter.get('/', (req, res, next) => {
  try {
    res.json(commentsService.listCommentsForTask(parseInt(req.params.id)));
  } catch (err) {
    next(err);
  }
});

commentsRouter.post('/', (req, res, next) => {
  try {
    const comment = commentsService.createComment(parseInt(req.params.id), req.body);
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

module.exports = { commentsRouter };
