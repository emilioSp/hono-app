import app from '../app.ts';

app.get('/health', (c) => {
  return c.json({
    status: 'OK',
  });
});
