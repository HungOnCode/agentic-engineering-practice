const express = require('express');
const tagsService = require('../services/tags');

const tagsRouter = express.Router();

tagsRouter.get('/', (req, res, next) => {
  try {
    res.json(tagsService.listTags());
  } catch (err) {
    next(err);
  }
});

tagsRouter.post('/', (req, res, next) => {
  try {
    const tag = tagsService.createTag(req.body);
    res.status(201).json(tag);
  } catch (err) {
    next(err);
  }
});

module.exports = { tagsRouter };
