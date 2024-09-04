import 'dotenv/config';
import express, { Express, Request } from "express";
import cors from "cors";

import {tilesRouteFactory, objectsRouteFactory  } from './routes';
import tileBasedMiddleware from './routes/tileBasedMiddleware';

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(cors());

const promise_app = Promise.all([
    tileBasedMiddleware(),
    tilesRouteFactory(),
    objectsRouteFactory()
  ])
  .then(([tileParamsMiddleware, tilesRoute, objectsRoute]) => {
    app.get("/tiles/:x\::y\::z", tileParamsMiddleware, tilesRoute);
    app.get("/objects/:x\::y\::z", tileParamsMiddleware, objectsRoute);

    app.listen(port, async () => {  
      console.log(`[server]: Server is running at http://localhost:${port}`);
    });
  })
  .finally(() => app);


process.on("exit", () => {
  // TODO close db;
})


module.exports = promise_app;
