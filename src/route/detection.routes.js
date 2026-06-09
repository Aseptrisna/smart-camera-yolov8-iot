'use strict';

const { Router } = require('express');
const { getAll, getById } = require('../controller/detection.controller');

const router = Router();

router.get('/', getAll);
router.get('/:id', getById);

module.exports = router;
