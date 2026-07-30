import { describe, expect, it } from 'vitest';
import { parseRjCode } from '../../src/domain/rj-code';
import { formatFileSize, parseDlsiteApi2Payload } from '../../src/providers/dlsite/parser';

describe('DLsite parser', () => {
  it('normalizes a work summary', () => {
    const summary = parseDlsiteApi2Payload([{
      work_name: 'Work',
      image_main: { url: '//img.example/work.jpg' },
      maker_name: 'Circle',
      dl_count: 42,
      rate_average_2dp: '4.5',
      rate_count: 10,
      age_category: 3,
      work_type: 'SOU',
      contents_file_size: 1048576,
      creaters: { voice_by: [{ name: 'Actor' }] },
      genres: [{ name: 'ASMR' }],
    }], parseRjCode('RJ123456')!);
    expect(summary).toMatchObject({
      title: 'Work', imageUrl: 'https://img.example/work.jpg', circle: 'Circle',
      sales: 42, ratingAverage: 4.5, ageRating: 'R18', workTypeId: 0,
      voiceActors: ['Actor'], genres: ['ASMR'],
    });
    expect(formatFileSize(summary.fileSize)).toBe('1MB');
  });
});

