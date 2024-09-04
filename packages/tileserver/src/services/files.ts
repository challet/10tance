import { list, type ListBlobResult, put, type PutBlobResult } from "@vercel/blob";
import type { Response } from "express";
import fs from "node:fs";

export type fileType = PutBlobResult | ListBlobResult["blobs"][number] | Buffer ;

export const USE_BLOB_STORAGE = 'BLOB_READ_WRITE_TOKEN' in process.env;

export abstract class File {
  protected fileDir: string;
  protected filePath: string;
  protected file: PutBlobResult | ListBlobResult["blobs"][number] | Buffer | null = null;

  protected constructor(fileDir: string, fileName: string) {
    this.fileDir = fileDir;
    this.filePath = `${this.fileDir}/${fileName}`;
  }

  static async init(fileDir: string, fileName: string) {
    if (USE_BLOB_STORAGE) {
      // TODO don't call that "list" each time. Or do it since Vercel functions instance are short lived (?)
      const filesList = await list({prefix: fileDir});
      return new VercelFile(fileDir, fileName, filesList);
    } else {
      // TODO the following root path should be configurable for other usages
      return new LocalFile(`${process.cwd()}/files/${fileDir}`, fileName);
    }
  }

  get exists(): boolean {
    return this.file !== null;
  }
  
  abstract save(file: Buffer): Promise<void>;
  protected sendToResponse(res: Response): void {};
}

class LocalFile extends File {
  protected file: Buffer | null;

  constructor(fileDir: string, fileName: string) {
    super(fileDir, fileName);
    this.file = fs.existsSync(this.filePath) ? fs.readFileSync(this.filePath) : null;
  }

  async save(file: Buffer): Promise<void> {
    if (!fs.existsSync(this.fileDir)) {
      fs.mkdirSync(this.fileDir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, file);
    this.file = file;
  }

  sendToResponse(res: Response): void {
    if (this.exists) {
      res.send(this.file);
    } else {
      res.status(404);
    }
  }
}

class VercelFile extends File {
  protected file: PutBlobResult | ListBlobResult["blobs"][number] | null;

  constructor(fileDir: string, fileName: string, filesList: ListBlobResult) {
    super(fileDir, fileName);
    this.file = filesList.blobs.find((file) => file.pathname == this.filePath) ?? null;
  }

  async save(file: Buffer): Promise<void> {
    this.file = await put(this.filePath, file, { access: 'public' });
  }

  sendToResponse(res: Response): void {
    if (this.exists) {
      res.redirect(301, this.file!.url);
    } else {
      res.status(404);
    }
  }
}


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