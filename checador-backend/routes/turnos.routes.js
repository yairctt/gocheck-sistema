'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/turnos.controller');
const auth   = require('../middlewares/auth.middleware');
const { minRole } = require('../middlewares/role.middleware');

router.use(auth);
router.get ('/',          ctrl.list);
router.get ('/:id',       ctrl.getOne);
router.post('/',          minRole('admin'), ctrl.create);
router.put ('/:id',       minRole('admin'), ctrl.update);
router.patch('/:id/estado', minRole('admin'), ctrl.toggleEstado);

module.exports = router;
