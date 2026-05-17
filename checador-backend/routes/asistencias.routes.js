'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/asistencias.controller');
const auth   = require('../middlewares/auth.middleware');

router.use(auth);
router.get('/', ctrl.list);

module.exports = router;
