'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/empleados.controller');
const auth   = require('../middlewares/auth.middleware');
const { minRole } = require('../middlewares/role.middleware');

router.use(auth);

router.get ('/',                ctrl.list);
router.get ('/:id',             ctrl.getOne);
router.post('/',                minRole('admin'), ctrl.create);
router.put ('/:id',             minRole('admin'), ctrl.update);
router.patch('/:id/estado',     minRole('admin'), ctrl.toggleEstado);
router.get ('/:id/qr',          ctrl.getQr);
router.get ('/:id/horario',     ctrl.getHorario);
router.put ('/:id/horario',     minRole('supervisor'), ctrl.saveHorario);

module.exports = router;
