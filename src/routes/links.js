const { Router } = require('express');
const { linkRules, handleValidationErrors } = require('../middleware/validate');

const router = Router();

let links = [];
let nextId = 1;

// Exposed for testing — reset state between runs
function resetStore() {
  links = [];
  nextId = 1;
}

router.get('/', (req, res) => {
  res.json(links);
});

router.get('/search', (req, res) => {
  const { tag } = req.query;
  if (!tag) {
    return res.status(400).json({ error: 'tag query parameter is required' });
  }
  const results = links.filter((link) => link.tags.includes(tag));
  res.json(results);
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'id must be an integer' });
  }

  const link = links.find((l) => l.id === id);
  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  res.json(link);
});

router.post('/', linkRules, handleValidationErrors, (req, res) => {
  const { title, url, tags = [] } = req.body;

  const link = {
    id: nextId++,
    title,
    url,
    tags,
    createdAt: new Date().toISOString(),
  };

  links.push(link);
  res.status(201).json(link);
});

module.exports = { router, resetStore };
