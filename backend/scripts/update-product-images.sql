-- SQL script to update all products with proper placeholder images
-- This script generates image URLs based on product fandom and name

-- Function to generate image URL based on fandom and product name
-- Note: This is a simplified version. In production, you'd run the Node.js script instead.

-- Update existing product media with proper placeholder URLs
-- For Harry Potter products
UPDATE "ProductMedia" 
SET url = 'https://via.placeholder.com/800x800/4a0202/ffffff?text=' || 
  REPLACE(REPLACE(REPLACE((SELECT name::json->>'en' FROM "Product" WHERE id = "ProductMedia"."productId"), ' ', '+'), '''', ''), '&', 'and')
WHERE "productId" IN (
  SELECT id FROM "Product" WHERE fandom = 'Harry Potter'
);

-- For Lord of the Rings products
UPDATE "ProductMedia" 
SET url = 'https://via.placeholder.com/800x800/1a1a1a/d4af37?text=' || 
  REPLACE(REPLACE(REPLACE((SELECT name::json->>'en' FROM "Product" WHERE id = "ProductMedia"."productId"), ' ', '+'), '''', ''), '&', 'and')
WHERE "productId" IN (
  SELECT id FROM "Product" WHERE fandom = 'Lord of the Rings'
);

-- For other fandoms, use default colors
UPDATE "ProductMedia" 
SET url = 'https://via.placeholder.com/800x800/1a1a2e/e94560?text=' || 
  REPLACE(REPLACE(REPLACE((SELECT name::json->>'en' FROM "Product" WHERE id = "ProductMedia"."productId"), ' ', '+'), '''', ''), '&', 'and')
WHERE "productId" NOT IN (
  SELECT id FROM "Product" WHERE fandom IN ('Harry Potter', 'Lord of the Rings')
);

