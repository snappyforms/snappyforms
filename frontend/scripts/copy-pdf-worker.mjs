import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const publicDir = new URL('../public/', import.meta.url);
await mkdir(publicDir, { recursive: true });
await copyFile(require.resolve('pdfjs-dist/build/pdf.worker.min.mjs'), fileURLToPath(new URL('pdf.worker.min.mjs', publicDir)));
