'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/bitacora.controller');
const auth   = require('../middlewares/auth.middleware');
const { minRole } = require('../middlewares/role.middleware');

router.use(auth, minRole('supervisor'));
router.get('/', ctrl.list);

module.exports = router;
