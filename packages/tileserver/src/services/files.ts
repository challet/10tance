import { list, type ListBlobResult, put, type PutBlobResult } from "@vercel/blob";
import type { Response } from "express";
import fs from "node:fs";

const USE_BLOB_STORAGE = 'BLOB_READ_WRITE_TOKEN' in process.env;
const SKIP_CACHE = process.env.DEBUG_SKIP_RESPONSE_CACHE === 'true';

export default abstract class File {
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
    return !SKIP_CACHE && this.file !== null;
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
    this.file = file;
    if (!SKIP_CACHE) {
      if (!fs.existsSync(this.fileDir)) {
        fs.mkdirSync(this.fileDir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, file);
    }
  }

  sendToResponse(res: Response): void {
    if (this.exists || SKIP_CACHE) {
      res.send(this.file).end();
    } else {
      res.status(404).end();
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
      res.status(404).end();
    }
  }
}
