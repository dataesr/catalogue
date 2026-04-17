import { ODS_THEME_TO_TOPICS } from './ods-topics';

const ODS_THEME_KEYS = Object.keys(ODS_THEME_TO_TOPICS);

/**
 * Split Zenodo keywords into topics and remaining keywords.
 * Any keyword that matches an ODS theme name (case-insensitive) is promoted
 * to a topic so it can be filtered alongside ODS datasets using the same vocabulary.
 */
export function resolveZenodoTopics(keywords: string[]): { topics: string[]; keywords: string[] } {
  const topics: string[] = [];
  const remaining: string[] = [];

  for (const kw of keywords) {
    const matched = ODS_THEME_KEYS.find(
      (theme) => theme.toLowerCase() === kw.trim().toLowerCase(),
    );
    if (matched) {
      topics.push(matched);
    } else {
      remaining.push(kw);
    }
  }

  return { topics: [...new Set(topics)], keywords: remaining };
}
