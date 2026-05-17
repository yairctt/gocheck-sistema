'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/dashboard.controller');
const auth   = require('../middlewares/auth.middleware');

router.use(auth);
router.get('/kpis',             ctrl.kpis);
router.get('/movimientos-hoy',  ctrl.movimientosHoy);
router.get('/no-llegados',      ctrl.noLlegados);

module.exports = router;
