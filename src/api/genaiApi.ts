import axios from 'axios';
import { getApiBaseUrl } from '@/config/api';

export type TryonJob = {
  id: number;
  category: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMsg?: string;
  medias?: Array<{
    id: number;
    jobID: number;
    filePath: string;
    mimeType: string;
    sizeBytes: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateTryonJobBody = {
  category: string;
  prompt: string;
  medias: Array<{ data: string; mimetype: string }>;
};

const base = () => getApiBaseUrl();

export async function createTryonJob(body: CreateTryonJobBody): Promise<{ id: number; status: string }> {
  const res = await axios.post(`${base()}/genai/tryons/jobs`, body);
  return res.data;
}

export async function listTryonJobs(limit = 50): Promise<TryonJob[]> {
  const res = await axios.get(`${base()}/genai/tryons/jobs`, { params: { limit } });
  return (res.data as any[]).map((j) => ({
    id: j.ID ?? j.id,
    category: j.Category ?? j.category,
    prompt: j.Prompt ?? j.prompt,
    status: j.Status ?? j.status,
    errorMsg: j.ErrorMsg ?? j.errorMsg,
    createdAt: j.CreatedAt ?? j.createdAt,
    updatedAt: j.UpdatedAt ?? j.updatedAt,
    medias: Array.isArray(j.Medias)
      ? j.Medias.map((m: any) => ({
          id: m.ID ?? m.id,
          jobID: m.JobID ?? m.jobID,
          filePath: m.FilePath ?? m.filePath,
          mimeType: m.MimeType ?? m.mimeType,
          sizeBytes: m.SizeBytes ?? m.sizeBytes,
        }))
      : undefined,
  }));
}

export async function getTryonJob(id: number): Promise<TryonJob> {
  const res = await axios.get(`${base()}/genai/tryons/jobs/${id}`);
  const j = res.data;
  return {
    id: j.ID ?? j.id,
    category: j.Category ?? j.category,
    prompt: j.Prompt ?? j.prompt,
    status: j.Status ?? j.status,
    errorMsg: j.ErrorMsg ?? j.errorMsg,
    createdAt: j.CreatedAt ?? j.createdAt,
    updatedAt: j.UpdatedAt ?? j.updatedAt,
    medias: Array.isArray(j.Medias)
      ? j.Medias.map((m: any) => ({
          id: m.ID ?? m.id,
          jobID: m.JobID ?? m.jobID,
          filePath: m.FilePath ?? m.filePath,
          mimeType: m.MimeType ?? m.mimeType,
          sizeBytes: m.SizeBytes ?? m.sizeBytes,
        }))
      : undefined,
  };
}

export async function listTryonMedias(limit = 20, offset = 0): Promise<{ items: any[]; total: number; limit: number; offset: number }> {
  const res = await axios.get(`${base()}/genai/tryons/medias`, { params: { limit, offset } });
  const raw = res.data;
  return {
    total: raw.total,
    limit: raw.limit,
    offset: raw.offset,
    items: Array.isArray(raw.items)
      ? raw.items.map((m: any) => ({
          id: m.ID ?? m.id,
          jobID: m.JobID ?? m.jobID,
          filePath: m.FilePath ?? m.filePath,
          mimeType: m.MimeType ?? m.mimeType,
          sizeBytes: m.SizeBytes ?? m.sizeBytes,
          createdAt: m.CreatedAt ?? m.createdAt,
        }))
      : [],
  };
}


