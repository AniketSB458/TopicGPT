import { createServer } from 'vite';
import express from 'express';

async function run() {
  const app = express();
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
  app.listen(3001, () => {
    console.log("Listening on 3001");
  });
}
run();
