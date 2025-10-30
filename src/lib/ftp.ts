// src/lib/ftp.ts
import * as ftp from "basic-ftp";
import { Readable } from "stream";

export type UploadBufferToFtp = {
  remotePath: string;
  buffer: Buffer;
};

export const uploadBufferToFtp = async ({
  remotePath,
  buffer,
}: UploadBufferToFtp) => {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  const host = process.env.FTP_HOST!;
  const user = process.env.FTP_USER!;
  const password = process.env.FTP_PASSWORD!;
  const secure = (process.env.FTP_SECURE || "false") === "true";

  try {
    await client.access({ host, user, password, secure });
    const dir = remotePath.substring(0, remotePath.lastIndexOf("/"));
    if (dir) {
      await client.ensureDir(dir);
    }
    const stream = Readable.from(buffer);

    await client.uploadFrom(stream, remotePath);
  } finally {
    client.close();
  }
};
