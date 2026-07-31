import type { RjCode } from './rj-code';

export interface WorkSummary {
  rjCode: RjCode;
  title: string;
  imageUrl: string | null;
  circle: string | null;
  sales: number | null;
  ratingAverage: number | null;
  ratingCount: number | null;
  releaseDate: string | null;
  ageRating: string | null;
  workType: string | null;
  workTypeId: number;
  fileSize: number | null;
  voiceActors: string[];
  genres: string[];
  isGirls: boolean;
  metadata?: Record<string, unknown>;
}

export interface ResourceResult {
  id: string;
  providerId: string;
  title: string;
  url: string;
  author?: string;
  date?: string;
  metadata?: Record<string, unknown>;
}
