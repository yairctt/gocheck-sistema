'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/usuarios.controller');
const auth   = require('../middlewares/auth.middleware');
const { minRole } = require('../middlewares/role.middleware');

router.use(auth, minRole('admin'));
router.get ('/',              ctrl.list);
router.get ('/:id',           ctrl.getOne);
router.post('/',              ctrl.create);
router.put ('/:id',           ctrl.update);
router.patch('/:id/estado',   ctrl.toggleEstado);

module.exports = router;
