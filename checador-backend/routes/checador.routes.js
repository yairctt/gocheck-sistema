'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/checador.controller');

// El terminal checador no requiere JWT (es un kiosco público en la tienda).
// Se protege por rate limiting estricto definido en server.js.
router.post('/identificar', ctrl.identificar);
router.post('/registrar',   ctrl.registrar);

module.exports = router;
