import { describe, it, expect } from 'vitest';
import { resources } from '@/lib/locales';

const EXPECTED_LANGS = ['ar', 'de', 'en', 'es', 'fr', 'hi', 'id', 'ja', 'ko', 'pt', 'ru', 'zh'];
const EXPECTED_KEY_COUNT = 56;

describe('로케일 리소스', () => {
  const langs = Object.keys(resources) as Array<keyof typeof resources>;

  it('12개 언어를 모두 제공한다', () => {
    expect([...langs].sort()).toEqual(EXPECTED_LANGS);
  });

  it('모든 언어가 en과 정확히 같은 키 집합을 갖는다', () => {
    const enKeys = Object.keys(resources.en.translation).sort();
    expect(enKeys).toHaveLength(EXPECTED_KEY_COUNT);

    for (const lang of langs) {
      expect(Object.keys(resources[lang].translation).sort(), `${lang}의 키가 en과 다릅니다`).toEqual(enKeys);
    }
  });

  it('빈 번역문이 없다', () => {
    for (const lang of langs) {
      for (const [key, value] of Object.entries(resources[lang].translation)) {
        expect(typeof value, `${lang}.${key}`).toBe('string');
        expect((value as string).trim().length, `${lang}.${key}가 비어 있습니다`).toBeGreaterThan(0);
      }
    }
  });
});
