const request = require('supertest');
const app = require('../src/app');
const { resetStore } = require('../src/routes/bookmarks');

beforeEach(() => {
  resetStore();
});

describe('GET /bookmarks', () => {
  it('returns an empty array initially', async () => {
    const res = await request(app).get('/bookmarks');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all bookmarks after creation', async () => {
    await request(app)
      .post('/bookmarks')
      .send({ title: 'GitHub', url: 'https://github.com', tags: ['dev'] });

    const res = await request(app).get('/bookmarks');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('GitHub');
  });
});

describe('POST /bookmarks', () => {
  it('creates a bookmark with valid data', async () => {
    const res = await request(app)
      .post('/bookmarks')
      .send({ title: 'GitHub', url: 'https://github.com', tags: ['dev', 'code'] });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 1,
      title: 'GitHub',
      url: 'https://github.com',
      tags: ['dev', 'code'],
    });
    expect(res.body.createdAt).toBeDefined();
  });

  it('creates a bookmark without tags (defaults to empty array)', async () => {
    const res = await request(app)
      .post('/bookmarks')
      .send({ title: 'Example', url: 'https://example.com' });

    expect(res.status).toBe(201);
    expect(res.body.tags).toEqual([]);
  });

  it('rejects missing title', async () => {
    const res = await request(app)
      .post('/bookmarks')
      .send({ url: 'https://example.com' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].msg).toMatch(/title is required/);
  });

  it('rejects missing url', async () => {
    const res = await request(app)
      .post('/bookmarks')
      .send({ title: 'No URL' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].msg).toMatch(/url is required/);
  });

  it('rejects invalid url', async () => {
    const res = await request(app)
      .post('/bookmarks')
      .send({ title: 'Bad URL', url: 'not-a-url' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].msg).toMatch(/valid URL/);
  });

  it('rejects non-array tags', async () => {
    const res = await request(app)
      .post('/bookmarks')
      .send({ title: 'Test', url: 'https://test.com', tags: 'oops' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].msg).toMatch(/tags must be an array/);
  });

  it('rejects non-string items in tags', async () => {
    const res = await request(app)
      .post('/bookmarks')
      .send({ title: 'Test', url: 'https://test.com', tags: [123] });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].msg).toMatch(/each tag must be a string/);
  });
});

describe('GET /bookmarks/:id', () => {
  it('returns a bookmark by id', async () => {
    await request(app)
      .post('/bookmarks')
      .send({ title: 'GitHub', url: 'https://github.com' });

    const res = await request(app).get('/bookmarks/1');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('GitHub');
  });

  it('returns 404 for non-existent id', async () => {
    const res = await request(app).get('/bookmarks/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 400 for non-numeric id', async () => {
    const res = await request(app).get('/bookmarks/abc');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/integer/);
  });
});

describe('GET /bookmarks/search', () => {
  it('filters bookmarks by tag', async () => {
    await request(app)
      .post('/bookmarks')
      .send({ title: 'GitHub', url: 'https://github.com', tags: ['dev', 'ai'] });
    await request(app)
      .post('/bookmarks')
      .send({ title: 'News', url: 'https://news.com', tags: ['news'] });
    await request(app)
      .post('/bookmarks')
      .send({ title: 'OpenAI', url: 'https://openai.com', tags: ['ai'] });

    const res = await request(app).get('/bookmarks/search?tag=ai');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((b) => b.title).sort()).toEqual(['GitHub', 'OpenAI']);
  });

  it('returns empty array when no bookmarks match', async () => {
    await request(app)
      .post('/bookmarks')
      .send({ title: 'GitHub', url: 'https://github.com', tags: ['dev'] });

    const res = await request(app).get('/bookmarks/search?tag=nope');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 400 when tag param is missing', async () => {
    const res = await request(app).get('/bookmarks/search');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/tag/);
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
