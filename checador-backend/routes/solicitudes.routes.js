'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/solicitudes.controller');
const auth   = require('../middlewares/auth.middleware');
const { minRole } = require('../middlewares/role.middleware');

router.use(auth);
router.get ('/',                    ctrl.list);
router.post('/',                    ctrl.create);
router.get ('/:id',                 ctrl.getOne);
router.patch('/:id/aprobar',        minRole('supervisor'), ctrl.aprobar);
router.patch('/:id/rechazar',       minRole('supervisor'), ctrl.rechazar);

module.exports = router;

