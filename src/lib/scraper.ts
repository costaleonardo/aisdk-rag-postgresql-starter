import * as cheerio from 'cheerio';

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  metadata: {
    description?: string;
    author?: string;
    publishedDate?: string;
    [key: string]: any;
  };
}

/**
 * Scrapes and extracts clean text content from a URL
 */
export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  try {
    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RAG-Bot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    return extractContent(html, url);
  } catch (error) {
    throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts clean content from HTML
 */
export function extractContent(html: string, url: string): ScrapedContent {
  const $ = cheerio.load(html);
  
  // Remove unwanted elements
  $('script, style, nav, header, footer, aside, iframe, noscript').remove();
  $('[role="navigation"], [role="banner"], [aria-label="advertisement"]').remove();
  $('.nav, .navigation, .menu, .sidebar, .advertisement, .ads, .social-share').remove();
  
  // Extract title
  const title = extractTitle($);
  
  // Extract metadata
  const metadata = extractMetadata($);
  
  // Extract main content
  const content = extractMainContent($);
  
  return {
    url,
    title,
    content,
    metadata
  };
}

/**
 * Extracts the page title using multiple strategies
 */
function extractTitle($: cheerio.CheerioAPI): string {
  // Try different title extraction strategies
  const strategies = [
    () => $('title').text(),
    () => $('meta[property="og:title"]').attr('content'),
    () => $('meta[name="twitter:title"]').attr('content'),
    () => $('h1').first().text(),
    () => $('[class*="title"]').first().text(),
  ];
  
  for (const strategy of strategies) {
    const title = strategy()?.trim();
    if (title && title.length > 0) {
      return title;
    }
  }
  
  return 'Untitled Document';
}

/**
 * Extracts metadata from the page
 */
function extractMetadata($: cheerio.CheerioAPI): Record<string, any> {
  const metadata: Record<string, any> = {};
  
  // Description
  const description = 
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content');
  
  if (description) metadata.description = description;
  
  // Author
  const author = 
    $('meta[name="author"]').attr('content') ||
    $('meta[property="article:author"]').attr('content');
  
  if (author) metadata.author = author;
  
  // Published date
  const publishedDate = 
    $('meta[property="article:published_time"]').attr('content') ||
    $('time[datetime]').first().attr('datetime');
  
  if (publishedDate) metadata.publishedDate = publishedDate;
  
  // Language
  const language = $('html').attr('lang') || 'en';
  metadata.language = language;
  
  // Keywords
  const keywords = $('meta[name="keywords"]').attr('content');
  if (keywords) metadata.keywords = keywords.split(',').map(k => k.trim());
  
  return metadata;
}

/**
 * Extracts the main content from the page
 */
function extractMainContent($: cheerio.CheerioAPI): string {
  // Try to find main content areas
  const contentSelectors = [
    'main',
    'article',
    '[role="main"]',
    '#main-content',
    '#content',
    '.content',
    '.main-content',
    '#main',
    '.main',
    'body'
  ];
  
  let content = '';
  
  for (const selector of contentSelectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      content = extractTextContent(element);
      if (content.length > 100) { // Minimum content threshold
        break;
      }
    }
  }
  
  // Fallback to body if no content found
  if (content.length < 100) {
    content = extractTextContent($('body'));
  }
  
  return cleanContent(content);
}

/**
 * Extracts text content from a Cheerio element
 */
function extractTextContent(element: cheerio.Cheerio<any>): string {
  // Get text and preserve some structure
  const lines: string[] = [];
  
  element.find('p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote').each((_, el) => {
    const text = cheerio.load(el).text().trim();
    if (text.length > 0) {
      lines.push(text);
    }
  });
  
  // If no structured content found, get all text
  if (lines.length === 0) {
    return element.text();
  }
  
  return lines.join('\n\n');
}

/**
 * Cleans and normalizes content text
 */
function cleanContent(content: string): string {
  return content
    .replace(/\s+/g, ' ')              // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n')        // Limit consecutive newlines
    .replace(/[^\S\n]+/g, ' ')         // Replace non-newline whitespace with single space
    .replace(/^\s+|\s+$/gm, '')        // Trim each line
    .trim();
}

/**
 * Validates if content is suitable for processing
 */
export function validateContent(content: ScrapedContent): boolean {
  // Check if content has minimum length
  if (content.content.length < 50) {
    return false;
  }
  
  // Check if title exists
  if (!content.title || content.title === 'Untitled Document') {
    return false;
  }
  
  return true;
}