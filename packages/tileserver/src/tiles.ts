import Jimp, { Font } from "jimp";
import { Request, Response } from "express";

const routeFactory = async () => {
  const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);

  return async (req: Request, res: Response) => {
    const {x, y, z}  = {
      x: parseInt(req.params.x),
      y: parseInt(req.params.y), 
      z: parseInt(req.params.z), 
    };
  
    let image = new Jimp(256, 256, ((x + y) % 2) == 0 ? 'green' : 'red');
  
    image.print(font, 0, 0, `${x}\n${y}\n${z}`);
  
    res.set("Content-Type", Jimp.MIME_PNG);
    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
    res.send(buffer);
  }

}

export default routeFactory;