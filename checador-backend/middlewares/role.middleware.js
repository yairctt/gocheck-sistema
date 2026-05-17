'use strict';
const R = require('../utils/response');

/**
 * Jerarquía de roles (mayor número = más privilegios).
 * superadmin > admin > supervisor > consulta
 */
const ROLE_LEVEL = {
  consulta:   1,
  supervisor: 2,
  admin:      3,
  superadmin: 4,
};

/**
 * Middleware de control de roles.
 * Uso: roleMiddleware('admin')        → requiere admin o superior
 *      roleMiddleware(['admin','supervisor'])  → cualquiera de esos roles
 */
function roleMiddleware(...allowedRoles) {
  // Aplanar si viene como array anidado
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) return R.unauthorized(res);

    const userLevel = ROLE_LEVEL[req.user.rol] || 0;
    const allowed   = roles.some(r => {
      if (r === req.user.rol) return true;
      // Soporte para notación "min:admin" (mínimo ese rol)
      if (r.startsWith('min:')) {
        const minRole  = r.slice(4);
        const minLevel = ROLE_LEVEL[minRole] || 0;
        return userLevel >= minLevel;
      }
      return false;
    });

    if (!allowed) return R.forbidden(res);
    next();
  };
}

/**
 * Alias — requiere que el rol sea al menos el indicado.
 */
function minRole(role) {
  return roleMiddleware(`min:${role}`);
}

module.exports = { roleMiddleware, minRole };
