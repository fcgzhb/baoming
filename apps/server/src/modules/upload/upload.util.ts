import { extname } from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_IMAGE_MIME = ALLOWED_MIME;
export const MAX_IMAGE_SIZE = MAX_SIZE;

export function validateImage(file: Express.Multer.File): void {
  if (!file) throw new Error('未提供文件');
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    throw new Error(`不支持的图片类型: ${file.mimetype}（仅 jpg/png/webp/gif）`);
  }
  if (file.size > MAX_SIZE) {
    throw new Error(`图片过大: ${(file.size / 1024 / 1024).toFixed(1)}MB（上限 5MB）`);
  }
}

/** Generate a COS key: uploads/projects/YYYYMMDD/<uuid>.<ext> */
export function buildObjectKey(originalName: string, contentType: string): string {
  const date = new Date();
  const yyyymmdd =
    date.getUTCFullYear().toString() +
    String(date.getUTCMonth() + 1).padStart(2, '0') +
    String(date.getUTCDate()).padStart(2, '0');
  let ext = extname(originalName).toLowerCase();
  if (!ext) {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    ext = map[contentType] ?? '';
  }
  return `uploads/projects/${yyyymmdd}/${randomUUID()}${ext}`;
}
