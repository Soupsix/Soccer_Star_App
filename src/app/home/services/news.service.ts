import { NewsArticle } from '../types/news.types';

const GUARDIAN_API_KEY = '31c4e98f-e66c-4fef-9d5e-5ce14ada3bfa';
const GUARDIAN_FIELDS = 'thumbnail,trailText,body,bodyText,byline';
const GUARDIAN_SEARCH_URL =
  `https://content.guardianapis.com/search?section=football&order-by=newest&page-size=20&show-fields=${GUARDIAN_FIELDS}&api-key=${GUARDIAN_API_KEY}`;

interface GuardianArticle {
  id: string;
  sectionName?: string;
  webPublicationDate?: string;
  webTitle?: string;
  webUrl?: string;
  fields?: {
    thumbnail?: string;
    trailText?: string;
    body?: string;
    bodyText?: string;
    byline?: string;
  };
}

interface GuardianSearchResponse {
  response?: {
    status?: string;
    results?: GuardianArticle[];
    content?: GuardianArticle;
  };
}

function stripHtml(value?: string): string {
  if (!value) return '';

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

function splitLongText(value: string): string[] {
  const sentences = value
    .match(/[^.!?]+[.!?]+["')\]]*|.+$/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) ?? [];

  if (sentences.length <= 1) return value ? [value] : [];

  const paragraphs: string[] = [];
  let current = '';

  sentences.forEach((sentence) => {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > 420 && current) {
      paragraphs.push(current);
      current = sentence;
    } else {
      current = next;
    }
  });

  if (current) paragraphs.push(current);
  return paragraphs;
}

function extractBodyParagraphs(bodyHtml?: string, fallbackText?: string): string[] {
  if (!bodyHtml) return splitLongText(fallbackText ?? '');

  const blockMatches = bodyHtml.match(/<(p|h2|h3|li)\b[^>]*>[\s\S]*?<\/\1>/gi) ?? [];
  const paragraphs = blockMatches
    .map((block) => decodeHtml(block.replace(/<[^>]*>/g, ' ')))
    .filter((block) => block.length > 0);

  if (paragraphs.length > 0) return paragraphs;
  return splitLongText(stripHtml(bodyHtml) || fallbackText || '');
}

function mapGuardianArticle(article: GuardianArticle, shouldTruncateBody = false): NewsArticle {
  const trailText = stripHtml(article.fields?.trailText);
  const bodyText = stripHtml(article.fields?.bodyText);
  const bodyParagraphs = extractBodyParagraphs(article.fields?.body, bodyText);

  return {
    id: article.id,
    title: article.webTitle ?? 'Untitled football story',
    trailText: trailText || truncate(bodyText, 180),
    bodyText: shouldTruncateBody ? truncate(bodyText, 220) : bodyText,
    bodyParagraphs: shouldTruncateBody ? [] : bodyParagraphs,
    byline: article.fields?.byline ?? 'The Guardian',
    sectionName: article.sectionName ?? 'Football',
    thumbnail: article.fields?.thumbnail ?? '',
    webUrl: article.webUrl ?? '',
    publishedAt: article.webPublicationDate ?? '',
  };
}

export class NewsService {
  static async getFootballNews(): Promise<NewsArticle[]> {
    const response = await fetch(GUARDIAN_SEARCH_URL);

    if (!response.ok) {
      throw new Error(`Guardian API error ${response.status}`);
    }

    const payload = (await response.json()) as GuardianSearchResponse;
    const results = payload.response?.results ?? [];

    return results.map((article) => mapGuardianArticle(article, true));
  }

  static async getArticleById(id: string): Promise<NewsArticle> {
    const articleUrl =
      `https://content.guardianapis.com/${encodeURI(id)}?show-fields=${GUARDIAN_FIELDS}&api-key=${GUARDIAN_API_KEY}`;
    const response = await fetch(articleUrl);

    if (!response.ok) {
      throw new Error(`Guardian article API error ${response.status}`);
    }

    const payload = (await response.json()) as GuardianSearchResponse;
    const article = payload.response?.content;

    if (!article) {
      throw new Error('Guardian article not found');
    }

    return mapGuardianArticle(article);
  }
}
