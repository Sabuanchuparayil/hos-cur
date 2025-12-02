/**
 * Image utility functions for generating placeholder images
 */

export interface FandomColors {
  bg: string;
  text: string;
}

const FANDOM_COLORS: { [key: string]: FandomColors } = {
  'Harry Potter': { bg: '4a0202', text: 'ffffff' },
  'Lord of the Rings': { bg: '1a1a1a', text: 'd4af37' },
  'Game of Thrones': { bg: '2c1810', text: 'c9a961' },
  'Star Wars': { bg: '000000', text: 'ffd700' },
  'Marvel Cinematic Universe': { bg: '1a1a2e', text: 'e94560' },
  'Fantastic Beasts': { bg: '2d1b1b', text: 'd4a574' },
  'DC Universe': { bg: '0a0a0a', text: '0066cc' },
  'Doctor Who': { bg: '003d6b', text: 'ffffff' },
  'Studio Ghibli': { bg: '8b9dc3', text: 'ffffff' },
};

const DEFAULT_COLORS: FandomColors = { bg: '1a1a2e', text: 'e94560' };

/**
 * Generate a placeholder image URL for a product
 */
export function getProductImageUrl(
  productName: string | { en: string; [key: string]: string },
  fandom: string = 'Other',
  width: number = 800,
  height: number = 800
): string {
  const nameEn = typeof productName === 'object' ? productName.en : productName || 'Product';
  const colors = FANDOM_COLORS[fandom] || DEFAULT_COLORS;
  const label = nameEn.length > 30 ? nameEn.substring(0, 30) + '...' : nameEn;
  const encodedLabel = encodeURIComponent(label);
  
  return `https://via.placeholder.com/${width}x${height}/${colors.bg}/${colors.text}?text=${encodedLabel}`;
}

/**
 * Generate a placeholder image URL for a category/fandom
 */
export function getCategoryImageUrl(
  fandomName: string,
  width: number = 400,
  height: number = 250
): string {
  const colors = FANDOM_COLORS[fandomName] || DEFAULT_COLORS;
  const encodedName = encodeURIComponent(fandomName);
  
  return `https://via.placeholder.com/${width}x${height}/${colors.bg}/${colors.text}?text=${encodedName}`;
}

/**
 * Get the primary image URL for a product, with fallback
 */
export function getPrimaryProductImage(
  product: {
    media?: Array<{ url?: string; type?: string }>;
    name: string | { en: string; [key: string]: string };
    taxonomy?: { fandom?: string };
  }
): string {
  // Check if product has valid media with URL
  if (
    product.media &&
    Array.isArray(product.media) &&
    product.media.length > 0 &&
    product.media[0]?.url &&
    product.media[0].url.trim() !== '' &&
    !product.media[0].url.includes('undefined')
  ) {
    return product.media[0].url;
  }
  
  // Generate fallback placeholder
  const fandom = product.taxonomy?.fandom || 'Other';
  return getProductImageUrl(product.name, fandom);
}

