'use strict';
/**
 * response.js — Helpers para respuestas estandarizadas de la API.
 *
 * Formato:
 * {
 *   success: boolean,
 *   message: string,
 *   data:    any | null,
 *   meta:    { page, per_page, total } | undefined
 * }
 */

/**
 * Respuesta de éxito.
 */
function success(res, data = null, message = 'Operación realizada correctamente', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

/**
 * Respuesta de éxito con paginación.
 */
function paginated(res, rows, total, page, perPage, message = 'OK') {
  return res.status(200).json({
    success: true,
    message,
    data: rows,
    meta: {
      total,
      page:     Number(page),
      per_page: Number(perPage),
      pages:    Math.ceil(total / perPage),
    },
  });
}

/**
 * Respuesta de creación (201).
 */
function created(res, data = null, message = 'Registro creado correctamente') {
  return res.status(201).json({ success: true, message, data });
}

/**
 * Respuesta de error del cliente (4xx).
 */
function clientError(res, message = 'Solicitud inválida', status = 400, details = null) {
  const body = { success: false, message };
  if (details) body.details = details;
  return res.status(status).json(body);
}

/**
 * Respuesta no autorizado (401).
 */
function unauthorized(res, message = 'No autorizado') {
  return res.status(401).json({ success: false, message });
}

/**
 * Respuesta sin permisos (403).
 */
function forbidden(res, message = 'Sin permisos para realizar esta acción') {
  return res.status(403).json({ success: false, message });
}

/**
 * Respuesta no encontrado (404).
 */
function notFound(res, message = 'Recurso no encontrado') {
  return res.status(404).json({ success: false, message });
}

/**
 * Respuesta de error de servidor (500).
 */
function serverError(res, message = 'Error interno del servidor') {
  return res.status(500).json({ success: false, message });
}

/**
 * Parsear parámetros de paginación desde query string.
 */
function parsePagination(query) {
  const page    = Math.max(1, Number(query.page) || 1);
  const perPage = Math.min(200, Math.max(1, Number(query.per_page) || 20));
  const offset  = (page - 1) * perPage;
  return { page, perPage, offset };
}

module.exports = { success, paginated, created, clientError, unauthorized, forbidden, notFound, serverError, parsePagination };
