function now() {
  return new Date().toISOString();
}

function getHeader(req, name) {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value || '';
}

function getRequestBody(req) {
  if (req.is('multipart/form-data')) {
    return {
      fields: req.body || {},
      files: (req.files || []).map(file => ({
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size
      }))
    };
  }

  if (Buffer.isBuffer(req.body)) {
    return {
      encoding: 'base64',
      size: req.body.length,
      content: req.body.toString('base64')
    };
  }

  return req.body ?? null;
}

module.exports = {
  now,
  getHeader,
  getRequestBody
};