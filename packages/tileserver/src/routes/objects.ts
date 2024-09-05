import { Request, Response } from "express";
import type { ModelStatic } from "sequelize";
import initDb from '../common/sequelize';
import type { EVMObjectType } from "../common/sequelize/models/EVMObject";
import File from "../services/files";

const objectsRoute = async (req: Request, res: Response) => {
  const { x, y, z } = res.locals.tile.coords;
  const file = await File.init(`objects/${z}`, `${x}-${y}.json`);

  if (!file.exists) {
    const db = await initDb();
    const EVMObject = db.models.EVMObject as EVMObjectType;

    const data = await EVMObject.findAllInTile(res.locals.tile.bounds);

    const result = data.map((d) => ({
      id: d.id,
      lat: d.latlng.y,
      lng: d.latlng.x,
      symbol: d.meta.symbol,
      name: d.meta.name,
      icon_url: d.meta.icon_url
    }));

    await file.save(Buffer.from(JSON.stringify(result), 'utf-8'));
  }
  file.sendToResponse(res.type("application/json"));
};

export default objectsRoute;
