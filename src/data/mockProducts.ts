import { Product } from '../types/product';

export const mockProducts: Product[] = [
  // Product with no variants - Minimal Tee
  {
    id: 'minimal-tee',
    name: 'Essential Cotton Tee',
    category: 'fashion',
    description: 'Premium organic cotton t-shirt with a relaxed fit. Perfect for everyday wear with its soft texture and timeless design.',
    images: [
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80&fit=crop',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80&fit=crop'
    ],
    price: 49,
    featured: true
  },

  // Product with color variants - Hoodie
  {
    id: 'classic-hoodie',
    name: 'Classic Pullover Hoodie',
    category: 'fashion',
    description: 'Comfortable cotton blend hoodie with adjustable drawstring and kangaroo pocket. Available in multiple colors.',
    images: [
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=600&q=80&fit=crop',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80&fit=crop'
    ],
    price: 0,
    featured: true,
    variants: [
      {
        id: 'classic-hoodie-black',
        sku: 'CHD-BLK',
        attributes: { color: 'Black' },
        image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=600&q=80&fit=crop',
        price: 89,
        inStock: true
      },
      {
        id: 'classic-hoodie-gray',
        sku: 'CHD-GRY',
        attributes: { color: 'Gray' },
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80&fit=crop',
        price: 89,
        inStock: true
      },
      {
        id: 'classic-hoodie-white',
        sku: 'CHD-WHT',
        attributes: { color: 'White' },
        image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80&fit=crop',
        price: 89,
        inStock: false
      }
    ]
  },

  // Product with model variants - Phone case (keep for variety, but use a fashion image)
  {
    id: 'redmi-case',
    name: 'Redmi Clear Case',
    category: 'fashion', // changed from 'accessories' to 'fashion'
    description: 'Premium transparent case with reinforced corners. Perfect protection while showcasing your phone design.',
    images: [
      'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=600&q=80&fit=crop',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80&fit=crop'
    ],
    price: 0,
    featured: true,
    variants: [
      {
        id: 'redmi-case-note14',
        sku: 'RC-N14',
        attributes: { model: 'Note 14' },
        image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=600&q=80&fit=crop',
        price: 25,
        inStock: true
      },
      {
        id: 'redmi-case-note14plus',
        sku: 'RC-N14P',
        attributes: { model: 'Note 14 Plus' },
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80&fit=crop',
        price: 30,
        inStock: true
      },
      {
        id: 'redmi-case-note13',
        sku: 'RC-N13',
        attributes: { model: 'Note 13' },
        image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80&fit=crop',
        price: 22,
        inStock: false
      }
    ]
  },

  // Product with size and color variants - Leather Jacket
  {
    id: 'leather-jacket',
    name: 'Minimal Leather Jacket',
    category: 'fashion',
    description: 'Genuine leather jacket with clean lines and modern cut. Crafted from premium materials for lasting quality.',
    images: [
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80&fit=crop',
      'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=600&q=80&fit=crop'
    ],
    price: 0,
    featured: false,
    variants: [
      {
        id: 'leather-jacket-black-m',
        sku: 'LJ-BLK-M',
        attributes: { color: 'Black', size: 'M' },
        image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80&fit=crop',
        price: 299,
        inStock: true
      },
      {
        id: 'leather-jacket-black-l',
        sku: 'LJ-BLK-L',
        attributes: { color: 'Black', size: 'L' },
        image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80&fit=crop',
        price: 299,
        inStock: true
      },
      {
        id: 'leather-jacket-brown-m',
        sku: 'LJ-BRN-M',
        attributes: { color: 'Brown', size: 'M' },
        image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=600&q=80&fit=crop',
        price: 319,
        inStock: false
      },
      {
        id: 'leather-jacket-brown-l',
        sku: 'LJ-BRN-L',
        attributes: { color: 'Brown', size: 'L' },
        image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=600&q=80&fit=crop',
        price: 319,
        inStock: true
      }
    ]
  },

  // Simple electronics product (replace with a fashion accessory)
  {
    id: 'minimal-tote',
    name: 'Minimal Canvas Tote',
    category: 'fashion', // changed from 'accessories' to 'fashion'
    description: 'Spacious and stylish canvas tote bag for everyday essentials. Minimal branding, maximum utility.',
    images: [
      'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=600&q=80&fit=crop'
    ],
    price: 45,
    featured: false
  }
];
