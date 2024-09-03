import Jimp from "jimp";
import { Request, Response } from "express";

const routeFactory = async () => {

  return async (req: Request, res: Response) => {
    const {x, y, z}  = {
      x: parseInt(req.params.x),
      y: parseInt(req.params.y), 
      z: parseInt(req.params.z), 
    };
  
    let image = new Jimp(256, 256, ((x + y) % 2) == 0 ? '#d7ffc9' : '#ffcbb9');
  
    res.set("Content-Type", Jimp.MIME_PNG);
    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
    res.send(buffer);
  }

}

export default routeFactory;