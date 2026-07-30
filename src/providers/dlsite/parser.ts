import { AppError } from '../../domain/errors';
import type { RjCode } from '../../domain/rj-code';
import type { WorkSummary } from '../../domain/work';
import { normalizeDateOnly } from '../../domain/date';

type UnknownRecord = Record<string, unknown>;

const record = (value: unknown): UnknownRecord =>
  value !== null && typeof value === 'object' ? value as UnknownRecord : {};
const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;
const number = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const workTypes: Record<string, [number, string]> = {
  SOU: [0, 'Voice / ASMR'],
  ACN: [1, 'Game'], QIZ: [1, 'Game'], ADV: [1, 'Game'], RPG: [1, 'Game'],
  TBL: [1, 'Game'], DNV: [1, 'Game'], SLN: [1, 'Game'], TYP: [1, 'Game'],
  STG: [1, 'Game'], PZL: [1, 'Game'], ETC: [1, 'Game'],
  MNG: [2, 'Manga'], SCM: [2, 'Manga'], WBT: [2, 'Manga'],
  ICG: [3, 'CG + Illustrations'], NRE: [4, 'Novel'], KSV: [4, 'Novel'],
  MOV: [5, 'Video'], MUS: [6, 'Music'], TOL: [7, 'Tools / Accessories'],
  IMT: [7, 'Tools / Accessories'], AMT: [7, 'Tools / Accessories'],
  VCM: [8, 'Voiced Comics'], ET3: [9, 'Miscellaneous'],
};

function imageUrl(value: unknown): string | null {
  const url = text(record(value).url) ?? text(value);
  if (!url || url.includes('no_img_main.gif')) return null;
  return url.startsWith('//') ? `https:${url}` : url;
}

function names(value: unknown): string[] {
  return array(value).map((item) => text(record(item).name) ?? text(item)).filter((item): item is string => Boolean(item));
}

export function parseDlsiteApi2Payload(payload: unknown, rjCode: RjCode): WorkSummary {
  const item = Array.isArray(payload) ? record(payload[0]) : record(payload);
  const title = text(item.work_name) ?? text(item.name);
  if (!title) throw new AppError('invalid-data', 'DLsite response did not contain a work title');

  const creators = record(item.creaters ?? item.creators);
  const workTypeCode = text(item.work_type) ?? '';
  const [workTypeId, workType] = workTypes[workTypeCode] ?? [-1, workTypeCode || null];
  const age = number(item.age_category);

  return {
    rjCode,
    title,
    imageUrl: imageUrl(item.image_main ?? item.work_image),
    circle: text(item.maker_name),
    sales: number(item.dl_count),
    ratingAverage: number(item.rate_average_2dp),
    ratingCount: number(item.rate_count),
    releaseDate: normalizeDateOnly(text(item.regist_date)),
    ageRating: age === 1 ? 'All' : age === 2 ? 'R15' : age === 3 ? 'R18' : null,
    workType,
    workTypeId,
    fileSize: number(item.contents_file_size),
    voiceActors: names(creators.voice_by),
    genres: names(item.genres),
    isGirls: text(item.site_id) === 'girls' || String(item.options ?? '').includes('OTM'),
  };
}

export function mergeDlsiteApi1(summary: WorkSummary, payload: unknown): WorkSummary {
  const root = record(payload);
  const data = record(root[summary.rjCode] ?? payload);
  return {
    ...summary,
    imageUrl: summary.imageUrl ?? imageUrl(data.work_image),
    circle: summary.circle ?? text(data.maker_name),
    sales: summary.sales ?? number(data.dl_count),
    ratingAverage: summary.ratingAverage ?? number(data.rate_average_2dp),
    ratingCount: summary.ratingCount ?? number(data.rate_count),
    releaseDate: summary.releaseDate ?? normalizeDateOnly(text(data.regist_date)),
    fileSize: summary.fileSize ?? number(data.contents_file_size),
  };
}

export function parseDlsiteApi1Payload(payload: unknown, rjCode: RjCode): WorkSummary {
  const root = record(payload);
  const data = record(root[rjCode] ?? payload);
  return parseDlsiteApi2Payload(data, rjCode);
}

export function formatFileSize(bytes: number | null): string | null {
  if (bytes === null || bytes < 0) return null;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${Math.round(value * 100) / 100}${units[index]}`;
}
