'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/catalogos.controller');
const auth   = require('../middlewares/auth.middleware');

router.use(auth);
router.get('/departamentos',      ctrl.departamentos);
router.get('/puestos',            ctrl.puestos);
router.get('/tipos-movimiento',   ctrl.tiposMovimiento);

module.exports = router;
