const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Bookmarks API listening on http://localhost:${PORT}`);
});
