'use strict';

const { Router } = require('express');
const { getAll, getById, getRawImage } = require('../controller/raw_image.controller');

const router = Router();

router.get('/image/:filename', getRawImage);
router.get('/', getAll);
router.get('/:id', getById);

module.exports = router;
