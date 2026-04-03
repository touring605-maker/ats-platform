export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface IFileStorageService {
  upload(key: string, data: Buffer, options?: UploadOptions): Promise<string>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
