
import { Product } from '../types/product';

export const mockProducts: Product[] = [
  // Product with no variants - Simple fashion item
  {
    id: 'minimal-tee',
    name: 'Essential Cotton Tee',
    category: 'fashion',
    description: 'Premium organic cotton t-shirt with a relaxed fit. Perfect for everyday wear with its soft texture and timeless design.',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=500&fit=crop'
    ],
    price: 49,
    featured: true
  },

  // Product with color variants
  {
    id: 'classic-hoodie',
    name: 'Classic Pullover Hoodie',
    category: 'fashion',
    description: 'Comfortable cotton blend hoodie with adjustable drawstring and kangaroo pocket. Available in multiple colors.',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=400&h=500&fit=crop'
    ],
    price: 0,
    featured: true,
    variants: [
      {
        id: 'classic-hoodie-black',
        sku: 'CHD-BLK',
        attributes: { color: 'Black' },
        image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop',
        price: 89,
        inStock: true
      },
      {
        id: 'classic-hoodie-gray',
        sku: 'CHD-GRY',
        attributes: { color: 'Gray' },
        image: 'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=400&h=500&fit=crop',
        price: 89,
        inStock: true
      },
      {
        id: 'classic-hoodie-white',
        sku: 'CHD-WHT',
        attributes: { color: 'White' },
        image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop',
        price: 89,
        inStock: false
      }
    ]
  },

  // Product with model variants - Phone case
  {
    id: 'redmi-case',
    name: 'Redmi Clear Case',
    category: 'electronics',
    description: 'Premium transparent case with reinforced corners. Perfect protection while showcasing your phone design.',
    images: [
      'https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=500&fit=crop'
    ],
    price: 0,
    featured: true,
    variants: [
      {
        id: 'redmi-case-note14',
        sku: 'RC-N14',
        attributes: { model: 'Note 14' },
        image: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=500&fit=crop',
        price: 25,
        inStock: true
      },
      {
        id: 'redmi-case-note14plus',
        sku: 'RC-N14P',
        attributes: { model: 'Note 14 Plus' },
        image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=500&fit=crop',
        price: 30,
        inStock: true
      },
      {
        id: 'redmi-case-note13',
        sku: 'RC-N13',
        attributes: { model: 'Note 13' },
        image: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=500&fit=crop',
        price: 22,
        inStock: false
      }
    ]
  },

  // Product with size and color variants
  {
    id: 'leather-jacket',
    name: 'Minimal Leather Jacket',
    category: 'fashion',
    description: 'Genuine leather jacket with clean lines and modern cut. Crafted from premium materials for lasting quality.',
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop',
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop'
    ],
    price: 0,
    featured: false,
    variants: [
      {
        id: 'leather-jacket-black-m',
        sku: 'LJ-BLK-M',
        attributes: { color: 'Black', size: 'M' },
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop',
        price: 299,
        inStock: true
      },
      {
        id: 'leather-jacket-black-l',
        sku: 'LJ-BLK-L',
        attributes: { color: 'Black', size: 'L' },
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop',
        price: 299,
        inStock: true
      },
      {
        id: 'leather-jacket-brown-m',
        sku: 'LJ-BRN-M',
        attributes: { color: 'Brown', size: 'M' },
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop',
        price: 319,
        inStock: false
      },
      {
        id: 'leather-jacket-brown-l',
        sku: 'LJ-BRN-L',
        attributes: { color: 'Brown', size: 'L' },
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop',
        price: 319,
        inStock: true
      }
    ]
  },

  // Simple electronics product
  {
    id: 'wireless-charger',
    name: 'Qi Wireless Charger',
    category: 'electronics',
    description: 'Fast wireless charging pad with LED indicator. Compatible with all Qi-enabled devices.',
    images: [
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=500&fit=crop'
    ],
    price: 45,
    featured: false
  }
];
