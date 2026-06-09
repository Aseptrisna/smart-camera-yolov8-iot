'use strict';

const { Router } = require('express');
const { getAll, getSummary, getById, create, update, remove, control } = require('../controller/device.controller');

const router = Router();

router.get('/summary',      getSummary);   // sebelum /:id
router.get('/',             getAll);
router.get('/:id',          getById);
router.post('/',            create);
router.put('/:id',          update);
router.delete('/:id',       remove);
router.post('/:id/control', control);

module.exports = router;
