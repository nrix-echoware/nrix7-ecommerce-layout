
import { Product } from '../types/product';

export const mockProducts: Product[] = [
  // Fashion products with variants
  {
    id: 'fashion-1',
    name: 'Minimal Cotton Shirt',
    category: 'fashion',
    description: 'Premium cotton shirt with clean lines and minimal design.',
    images: ['https://picsum.photos/400/500?random=1', 'https://picsum.photos/400/500?random=2'],
    price: 0, // Not used for variant products
    featured: true,
    variants: [
      {
        id: 'fashion-1-white-s',
        sku: 'MCS-WHT-S',
        attributes: { color: 'White', size: 'S' },
        image: 'https://picsum.photos/400/500?random=1',
        price: 89,
        inStock: true
      },
      {
        id: 'fashion-1-white-m',
        sku: 'MCS-WHT-M',
        attributes: { color: 'White', size: 'M' },
        image: 'https://picsum.photos/400/500?random=1',
        price: 89,
        inStock: true
      },
      {
        id: 'fashion-1-black-s',
        sku: 'MCS-BLK-S',
        attributes: { color: 'Black', size: 'S' },
        image: 'https://picsum.photos/400/500?random=2',
        price: 89,
        inStock: false
      },
      {
        id: 'fashion-1-black-m',
        sku: 'MCS-BLK-M',
        attributes: { color: 'Black', size: 'M' },
        image: 'https://picsum.photos/400/500?random=2',
        price: 89,
        inStock: true
      }
    ]
  },
  // Electronics with variants
  {
    id: 'electronics-1',
    name: 'Redmi Case',
    category: 'electronics',
    description: 'Premium protective case for Redmi phones.',
    images: ['https://picsum.photos/400/500?random=3', 'https://picsum.photos/400/500?random=4'],
    price: 0,
    featured: true,
    variants: [
      {
        id: 'electronics-1-note14-clear',
        sku: 'RC-N14-CLR',
        attributes: { model: 'Note 14', color: 'Clear' },
        image: 'https://picsum.photos/400/500?random=3',
        price: 25,
        inStock: true
      },
      {
        id: 'electronics-1-note14plus-clear',
        sku: 'RC-N14P-CLR',
        attributes: { model: 'Note 14+', color: 'Clear' },
        image: 'https://picsum.photos/400/500?random=3',
        price: 30,
        inStock: true
      },
      {
        id: 'electronics-1-note14-black',
        sku: 'RC-N14-BLK',
        attributes: { model: 'Note 14', color: 'Black' },
        image: 'https://picsum.photos/400/500?random=4',
        price: 25,
        inStock: false
      }
    ]
  },
  // Simple products without variants
  {
    id: 'fashion-2',
    name: 'Minimal Wool Sweater',
    category: 'fashion',
    description: 'Luxurious merino wool sweater with timeless design.',
    images: ['https://picsum.photos/400/500?random=5'],
    price: 149,
    featured: true
  },
  // Generate more mock products programmatically
  ...Array.from({ length: 97 }, (_, i) => {
    const categories = ['fashion', 'electronics'] as const;
    const category = categories[i % 2];
    const hasVariants = i % 3 === 0; // Every 3rd product has variants
    
    const baseProduct: Product = {
      id: `product-${i + 4}`,
      name: category === 'fashion' 
        ? `${['Minimal', 'Clean', 'Simple', 'Modern'][i % 4]} ${['Shirt', 'Dress', 'Jacket', 'Pants'][i % 4]}` 
        : `${['Tech', 'Pro', 'Smart', 'Digital'][i % 4]} ${['Phone', 'Laptop', 'Watch', 'Case'][i % 4]}`,
      category,
      description: `Premium ${category} item with attention to detail and minimal aesthetic.`,
      images: [`https://picsum.photos/400/500?random=${i + 10}`],
      price: hasVariants ? 0 : Math.floor(Math.random() * 400) + 50,
      featured: i < 3,
    };

    if (hasVariants) {
      baseProduct.variants = [
        {
          id: `${baseProduct.id}-var1`,
          sku: `${baseProduct.id.toUpperCase()}-V1`,
          attributes: category === 'fashion' 
            ? { color: 'Black', size: 'M' }
            : { model: 'Standard', color: 'Black' },
          image: `https://picsum.photos/400/500?random=${i + 10}`,
          price: Math.floor(Math.random() * 400) + 50,
          inStock: true
        },
        {
          id: `${baseProduct.id}-var2`,
          sku: `${baseProduct.id.toUpperCase()}-V2`,
          attributes: category === 'fashion' 
            ? { color: 'White', size: 'M' }
            : { model: 'Pro', color: 'White' },
          image: `https://picsum.photos/400/500?random=${i + 100}`,
          price: Math.floor(Math.random() * 400) + 70,
          inStock: Math.random() > 0.3
        }
      ];
    }

    return baseProduct;
  })
];
