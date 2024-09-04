import { list, type ListBlobResult, put, type PutBlobResult } from "@vercel/blob";
import type { Response } from "express";
import fs from "node:fs";

export type fileType = PutBlobResult | ListBlobResult["blobs"][number] | Buffer;

export const USE_BLOB_STORAGE = 'BLOB_READ_WRITE_TOKEN' in process.env;

export const getFile = async (filePath: string, fileDir: string): Promise<fileType | null> => {
  if (USE_BLOB_STORAGE) {
    // use Vercel blob storage
    // TODO don't call that "list" each time. Or not since Vercel functions are short lived (?)
    const files = await list({prefix: fileDir});
    return files.blobs.find((file) => file.pathname == filePath) ?? null;
  } else { 
    // local storage
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    } else {
      return null;
    }
  }
};

export const saveFile = async(file: Buffer, filePath: string, fileDir: string): Promise<fileType> => {
  if (USE_BLOB_STORAGE) {
    // use Vercel blob storage
    return await put(filePath, file, { access: 'public' });
  } else { 
    // local storage
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir);
    }
    fs.writeFileSync(filePath, file);
    return file;
  }
};

export const sendFile = (file: fileType, res: Response) => {
  if (USE_BLOB_STORAGE && !(file instanceof Buffer)) {
    res.redirect(301, file.url)
  } else {
    res.type("image/png").send(file);
  }
};