import express, { Express } from "express";

import tilesRouteFactory from './tiles';

const app: Express = express();
const port = process.env.PORT || 3001;


Promise.all([
  tilesRouteFactory()
]).then(([tilesRoute]) => {
  app.get("/tiles/:z/:x/:y", tilesRoute);

  app.listen(port, async () => {  
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
});

