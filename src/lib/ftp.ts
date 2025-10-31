import * as ftp from "basic-ftp";
import { Readable } from "stream";

export const uploadBufferToFtp = async ({
  remotePath,
  buffer,
}: {
  remotePath: string;
  buffer: Buffer;
}) => {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  const host = process.env.FTP_HOST!;
  const user = process.env.FTP_USER!;
  const password = process.env.FTP_PASSWORD!;
  const secure = (process.env.FTP_SECURE || "false") === "true";

  const baseDir = process.env.FTP_BASE_DIR || "/public_html/uploads";
  const publicBaseUrl = (process.env.FTP_BASE_URL || "").replace(/\/+$/, "");

  await client.access({ host, user, password, secure });

  const cleanPath = remotePath.replace(/^\/+/, "").replace(/\/{2,}/g, "/");
  const parts = cleanPath.split("/");
  const fileName = parts.pop()!;
  const dir = `${baseDir}/${parts.join("/")}`;

  console.log("📂 Criando diretórios:", dir);
  await client.ensureDir(dir);
  await client.cd(dir);

  const stream = Readable.from(buffer);
  await client.uploadFrom(stream, fileName);

  console.log("✅ Upload concluído:", `${dir}/${fileName}`);

  client.close();

  return `${publicBaseUrl}/${cleanPath}`;
};

export const deleteFromFtp = async (remotePath: string) => {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  const host = process.env.FTP_HOST!;
  const user = process.env.FTP_USER!;
  const password = process.env.FTP_PASSWORD!;
  const secure = (process.env.FTP_SECURE || "false") === "true";

  const baseDir = process.env.FTP_BASE_DIR || "/public_html/uploads";

  try {
    await client.access({ host, user, password, secure });
    const cleanPath = remotePath.replace(/^\/+/, "").replace(/\/{2,}/g, "/");
    const fullPath = `${baseDir}/${cleanPath}`;

    console.log("🗑️ Removendo arquivo:", fullPath);
    await client.remove(fullPath).catch((err) => {
      console.warn("⚠️ Erro ao remover arquivo FTP:", err.message);
    });
  } finally {
    client.close();
  }
};
