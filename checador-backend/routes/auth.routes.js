'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const auth   = require('../middlewares/auth.middleware');

router.post('/login',  ctrl.login);
router.get ('/me',     auth, ctrl.me);
router.post('/logout', auth, ctrl.logout);

module.exports = router;
