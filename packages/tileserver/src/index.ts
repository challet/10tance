import 'dotenv/config';
import express, { Express } from "express";``
import cors from "cors";

import tilesRouteFactory from './tiles';
import objectsRouteFactory from './objects';

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(cors())

Promise.all([
  tilesRouteFactory(),
  objectsRouteFactory()
]).then(([tilesRoute, objecstRoute]) => {
  app.get("/tiles/:z/:x/:y", tilesRoute);
  app.get("/objects", objecstRoute);

  app.listen(port, async () => {  
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
});

