export interface NewsArticle {
  id: string;
  title: string;
  trailText: string;
  bodyText: string;
  bodyParagraphs: string[];
  byline: string;
  sectionName: string;
  thumbnail: string;
  webUrl: string;
  publishedAt: string;
}

export default function Ignore() { return null; }
