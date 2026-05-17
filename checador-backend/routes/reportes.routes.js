'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/reportes.controller');
const auth   = require('../middlewares/auth.middleware');
const { minRole } = require('../middlewares/role.middleware');

router.use(auth);
router.get ('/resumen',        ctrl.resumen);
router.post('/generar-resumen', minRole('admin'), ctrl.generarResumen);

module.exports = router;
