import { request } from './request';

export interface UploadResult {
  url: string;
}

/** Upload an image to COS via backend proxy. Returns the public URL. */
export const uploadImage = (file: File): Promise<UploadResult> => {
  const form = new FormData();
  form.append('file', file);
  // Let the browser set the multipart boundary; do NOT set Content-Type manually.
  return request.post<unknown, UploadResult>('/upload/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
