import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { firstValueFrom, from } from 'rxjs';

interface MultipartInitiateResponse {
  upload_id: string;
  part_size: number;
}

interface MultipartPresignResponse {
  parts: Array<{ part_number: number; url: string }>;
}

interface UploadedPart {
  part_number: number;
  etag: string;
}

@Injectable({
  providedIn: 'root'
})
export class SimilarityUrlService {

  private http = inject(HttpClient);
  API_URL = `${environment.API_URL}/${environment.VERSION}/aims`;

  searchSimilarityByUrl(sourceUrl: string, page: number = 1, pageSize: number = 10) {
    return this.http.post<any[]>(`${this.API_URL}/similarity/`, {
      youtube_url: sourceUrl,
      link: sourceUrl,
      page,
      page_size: pageSize
    });
  }

  searchSimilarityByPrompt(text: string, page: number = 1, pageSize: number = 10) {
    return this.http.post<any[]>(`${this.API_URL}/similarity-prompt/`, {
      text,
      page,
      page_size: pageSize
    });
  }

  searchSimilarityByVideo(videoFile: File, page: number = 1, pageSize: number = 10) {
    return from(this.searchSimilarityByVideoMultipart(videoFile, page, pageSize));
  }

  private async searchSimilarityByVideoMultipart(videoFile: File, page: number, pageSize: number) {
    let uploadId: string | null = null;
    try {
      const initiate = await firstValueFrom(this.http.post<MultipartInitiateResponse>(
        `${this.API_URL}/video-multipart/initiate/`,
        {
          filename: videoFile.name,
          content_type: videoFile.type || 'application/octet-stream',
          size_bytes: videoFile.size
        }
      ));
      uploadId = initiate.upload_id;

      const partSize = initiate.part_size;
      const partNumbers = this.getPartNumbers(videoFile.size, partSize);
      const presigned = await firstValueFrom(this.http.post<MultipartPresignResponse>(
        `${this.API_URL}/video-multipart/presign-parts/`,
        {
          upload_id: uploadId,
          part_numbers: partNumbers
        }
      ));

      const uploadedParts = await this.uploadPartsToS3(videoFile, partSize, presigned.parts);
      return await firstValueFrom(this.http.post<any[]>(
        `${this.API_URL}/video-multipart/complete/`,
        {
          upload_id: uploadId,
          parts: uploadedParts,
          page,
          page_size: pageSize
        }
      ));
    } catch (error) {
      if (uploadId) {
        await this.abortMultipartUpload(uploadId);
      }
      throw error;
    }
  }

  private getPartNumbers(size: number, partSize: number): number[] {
    const count = Math.max(1, Math.ceil(size / partSize));
    return Array.from({ length: count }, (_, index) => index + 1);
  }

  private async uploadPartsToS3(
    videoFile: File,
    partSize: number,
    parts: Array<{ part_number: number; url: string }>
  ): Promise<UploadedPart[]> {
    const sortedParts = [...parts].sort((a, b) => a.part_number - b.part_number);
    const uploadedParts: UploadedPart[] = [];
    let nextIndex = 0;
    const concurrency = Math.min(3, sortedParts.length);

    const uploadNext = async (): Promise<void> => {
      const currentIndex = nextIndex;
      nextIndex += 1;
      const part = sortedParts[currentIndex];
      if (!part) {
        return;
      }

      const start = (part.part_number - 1) * partSize;
      const end = Math.min(start + partSize, videoFile.size);
      const blob = videoFile.slice(start, end);
      const response = await fetch(part.url, {
        method: 'PUT',
        body: blob
      });
      if (!response.ok) {
        throw new Error(`S3 upload part ${part.part_number} failed with status ${response.status}`);
      }

      const etag = response.headers.get('ETag');
      if (!etag) {
        throw new Error('S3 did not expose an ETag header for the uploaded part.');
      }
      uploadedParts.push({ part_number: part.part_number, etag });
      await uploadNext();
    };

    await Promise.all(Array.from({ length: concurrency }, () => uploadNext()));
    return uploadedParts.sort((a, b) => a.part_number - b.part_number);
  }

  private async abortMultipartUpload(uploadId: string): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.API_URL}/video-multipart/abort/`, { upload_id: uploadId }));
    } catch {
      // Best-effort cleanup only; preserve the original upload error.
    }
  }
}
