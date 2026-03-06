const request = require('supertest');
const app = require('../src/app');
const { resetStore } = require('../src/routes/links');

beforeEach(() => {
  resetStore();
});

describe('GET /links', () => {
  it('returns an empty array initially', async () => {
    const res = await request(app).get('/links');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all links after creation', async () => {
    await request(app)
      .post('/links')
      .send({ title: 'GitHub', url: 'https://github.com', tags: ['dev'] });

    const res = await request(app).get('/links');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('GitHub');
  });
});

describe('POST /links', () => {
  it('creates a link with valid data', async () => {
    const res = await request(app)
      .post('/links')
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

  it('creates a link without tags (defaults to empty array)', async () => {
    const res = await request(app)
      .post('/links')
      .send({ title: 'Example', url: 'https://example.com' });

    expect(res.status).toBe(201);
    expect(res.body.tags).toEqual([]);
  });

  it('rejects missing title', async () => {
    const res = await request(app)
      .post('/links')
      .send({ url: 'https://example.com' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].msg).toMatch(/title is required/);
  });

  it('rejects missing url', async () => {
    const res = await request(app)
      .post('/links')
      .send({ title: 'No URL' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].msg).toMatch(/url is required/);
  });

  it('rejects invalid url', async () => {
    const res = await request(app)
      .post('/links')
      .send({ title: 'Bad URL', url: 'not-a-url' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].msg).toMatch(/valid URL/);
  });

  it('rejects non-array tags', async () => {
    const res = await request(app)
      .post('/links')
      .send({ title: 'Test', url: 'https://test.com', tags: 'oops' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].msg).toMatch(/tags must be an array/);
  });

  it('rejects non-string items in tags', async () => {
    const res = await request(app)
      .post('/links')
      .send({ title: 'Test', url: 'https://test.com', tags: [123] });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].msg).toMatch(/each tag must be a string/);
  });
});

describe('GET /links/:id', () => {
  it('returns a link by id', async () => {
    await request(app)
      .post('/links')
      .send({ title: 'GitHub', url: 'https://github.com' });

    const res = await request(app).get('/links/1');
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('GitHub');
  });

  it('returns 404 for non-existent id', async () => {
    const res = await request(app).get('/links/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 400 for non-numeric id', async () => {
    const res = await request(app).get('/links/abc');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/integer/);
  });
});

describe('GET /links/search', () => {
  it('filters links by tag', async () => {
    await request(app)
      .post('/links')
      .send({ title: 'GitHub', url: 'https://github.com', tags: ['dev', 'ai'] });
    await request(app)
      .post('/links')
      .send({ title: 'News', url: 'https://news.com', tags: ['news'] });
    await request(app)
      .post('/links')
      .send({ title: 'OpenAI', url: 'https://openai.com', tags: ['ai'] });

    const res = await request(app).get('/links/search?tag=ai');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((b) => b.title).sort()).toEqual(['GitHub', 'OpenAI']);
  });

  it('returns empty array when no links match', async () => {
    await request(app)
      .post('/links')
      .send({ title: 'GitHub', url: 'https://github.com', tags: ['dev'] });

    const res = await request(app).get('/links/search?tag=nope');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 400 when tag param is missing', async () => {
    const res = await request(app).get('/links/search');
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
