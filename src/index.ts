import { serve } from '@hono/node-server';
import { app } from '#app';
import '#router/health.router.ts';
import '#router/person.router.ts';

const port = 3000;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
