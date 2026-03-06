const { body, validationResult } = require('express-validator');

const bookmarkRules = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('title is required'),
  body('url')
    .trim()
    .notEmpty()
    .withMessage('url is required')
    .isURL()
    .withMessage('url must be a valid URL'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .withMessage('each tag must be a string'),
];

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

module.exports = { bookmarkRules, handleValidationErrors };
