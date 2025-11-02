import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Product, Variant } from '../../types/product';
import { generateId, generateSku, toCurrencyMinorUnits } from '../../lib/admin';
import ProductPreview from './ProductPreview';

// Schema
const AttributePairSchema = z.object({
  name: z.string().min(1, 'Attribute name required'),
  value: z.string().min(1, 'Attribute value required'),
});

const VariantFormSchema = z.object({
  id: z.string().min(1),
  sku: z.string().min(3, 'SKU must be at least 3 chars'),
  attributesPairs: z.array(AttributePairSchema).default([]),
  image: z.string().url('Image must be absolute URL'),
  price: z.number().int().nonnegative('Price must be >= 0'),
  inStock: z.boolean(),
  isActive: z.boolean(),
});

const ProductFormSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['fashion', 'electronics']),
  description: z.string().min(1, 'Description is required'),
  images: z.array(z.string().url('Image must be absolute URL')).min(1, 'At least one image required'),
  price: z.number().int().nonnegative('Price must be >= 0'),
  attributeNames: z.array(z.string().min(1, 'Attribute name required')).default([]),
  variants: z.array(VariantFormSchema).default([]),
  featured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
}).superRefine((val, ctx) => {
  const names = (val.attributeNames || []).map(n => n.trim()).filter(Boolean);
  // If there are multiple variants, enforce that attributeNames exist
  if ((val.variants?.length || 0) > 1 && names.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Define attribute names for variants (e.g., color, size)', path: ['attributeNames'] });
  }
  // Enforce that each variant has the same attribute names and non-empty values
  const seenCombos = new Set<string>();
  val.variants.forEach((v, idx) => {
    const pairs = (v.attributesPairs || []).map(p => ({ name: p.name.trim(), value: p.value.trim() }));
    const vNames = pairs.map(p => p.name);
    // All names must match global attributeNames
    if (names.length && JSON.stringify([...vNames].sort()) !== JSON.stringify([...names].sort())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Variant attributes must match the defined attribute names', path: ['variants', idx, 'attributesPairs'] });
    }
    // All values must be present
    if (pairs.some(p => !p.value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'All variant attribute values are required', path: ['variants', idx, 'attributesPairs'] });
    }
    // Unique combination across variants
    const comboKey = pairs
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(p => `${p.name}=${p.value}`)
      .join('|');
    if (comboKey) {
      if (seenCombos.has(comboKey)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Duplicate variant combination', path: ['variants', idx, 'attributesPairs'] });
      } else {
        seenCombos.add(comboKey);
      }
    }
  });
});

type AttributePair = z.infer<typeof AttributePairSchema>;
type VariantForm = z.infer<typeof VariantFormSchema>;
type ProductFormValues = z.infer<typeof ProductFormSchema>;

function mapProductToFormValues(p: Product): ProductFormValues {
  const variants: VariantForm[] = (p.variants || []).map(v => ({
    id: v.id,
    sku: v.sku,
    attributesPairs: Object.entries(v.attributes || {}).map(([name, value]) => ({ name, value })),
    image: v.image,
    price: v.price,
    inStock: v.inStock,
    isActive: v.is_active ?? true,
  }));
  // Derive attribute names from first variant (or union)
  const attributeNames = variants.length
    ? Array.from(new Set(variants.flatMap(v => v.attributesPairs.map(a => a.name))))
    : [];
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description,
    images: p.images.length ? p.images : [''],
    price: p.price,
    attributeNames,
    variants,
    featured: !!p.featured,
    isActive: p.is_active ?? true,
  };
}

function mapFormValuesToProduct(values: ProductFormValues): Product {
  const variants: Variant[] = (values.variants || []).map(v => ({
    id: v.id,
    sku: v.sku,
    attributes: (v.attributesPairs || []).reduce<Record<string, string>>((acc, curr) => {
      acc[curr.name] = curr.value;
      return acc;
    }, {}),
    image: v.image,
    price: v.price,
    inStock: v.inStock,
    is_active: v.isActive,
  }));
  return {
    id: values.id,
    name: values.name,
    category: values.category,
    description: values.description,
    images: values.images,
    price: values.price,
    variants,
    featured: !!values.featured,
    is_active: values.isActive,
  };
}

interface Props {
  initial: Product;
  isEditing: boolean;
  onSubmit: (product: Product) => void;
}

export default function ProductForm({ initial, isEditing, onSubmit }: Props) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: mapProductToFormValues(initial),
    mode: 'onChange',
  });

  const [showPreview, setShowPreview] = useState(false);

  // Reset when initial changes
  useEffect(() => {
    form.reset(mapProductToFormValues(initial));
  }, [initial, form]);

  const variantsFA = useFieldArray({ control: form.control, name: 'variants' });

  // Images (simple array)
  const images = form.watch('images');
  function addImage() {
    form.setValue('images', [...(images || []), '']);
  }
  function removeImage(i: number) {
    const next = [...(images || [])];
    next.splice(i, 1);
    form.setValue('images', next);
  }

  // Attribute schema management
  const attributeNames = form.watch('attributeNames') || [];
  function addAttributeName() {
    const name = prompt('Enter attribute name (e.g., color, size)');
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    if (attributeNames.includes(trimmed)) return;
    const nextNames = [...attributeNames, trimmed];
    form.setValue('attributeNames', nextNames);
    // Ensure every variant has this attribute pair
    const variants = form.getValues('variants') || [];
    variants.forEach((v, i) => {
      const pairs = v.attributesPairs || [];
      if (!pairs.find(p => p.name === trimmed)) {
        form.setValue(`variants.${i}.attributesPairs`, [...pairs, { name: trimmed, value: '' }]);
      }
    });
  }
  function removeAttributeName(name: string) {
    if (isEditing) return; // do not allow schema change on edit
    const nextNames = attributeNames.filter(n => n !== name);
    form.setValue('attributeNames', nextNames);
    const variants = form.getValues('variants') || [];
    variants.forEach((v, i) => {
      const pairs = v.attributesPairs || [];
      form.setValue(
        `variants.${i}.attributesPairs`,
        pairs.filter(p => p.name !== name)
      );
    });
  }

  // When adding a variant, initialize all attribute pairs according to schema
  function addVariant() {
    const pairs = (attributeNames || []).map(n => ({ name: n, value: '' }));
    variantsFA.append({
      id: generateId(),
      sku: generateSku(form.getValues('name'), form.getValues('category')),
      attributesPairs: pairs,
      image: '',
      price: 0,
      inStock: true,
      isActive: true,
    });
  }
  function removeVariant(idx: number) {
    if (isEditing) return;
    variantsFA.remove(idx);
  }

  function addAttributePair(variantIndex: number) {
    // Add a new schema attribute name then it will reflect in all variants
    addAttributeName();
  }
  function removeAttributePair(variantIndex: number, pairIndex: number) {
    // Removing specific pair is not allowed; remove attribute name from schema instead
    if (isEditing) return;
    const pair = form.getValues(`variants.${variantIndex}.attributesPairs.${pairIndex}`);
    if (pair?.name) removeAttributeName(pair.name);
  }

  function handleSubmit(values: ProductFormValues) {
    const prepared: Product = mapFormValuesToProduct({
      ...values,
      price: toCurrencyMinorUnits(values.price),
      variants: (values.variants || []).map(v => ({
        ...v,
        price: toCurrencyMinorUnits(v.price),
      })),
    });
    onSubmit(prepared);
  }

  const currentPreviewProduct: Product = mapFormValuesToProduct(form.watch());

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-neutral-600">Define the attribute schema for this product.</div>
        <button type="button" className="px-3 py-2 border rounded" onClick={() => setShowPreview(true)}>Preview</button>
      </div>

      {/* Attribute schema */}
      <div className="border rounded p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Attributes</h3>
          <button type="button" className="px-3 py-2 border rounded" onClick={addAttributeName} disabled={isEditing}>Add Attribute Type</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {attributeNames.map((n) => (
            <span key={n} className="inline-flex items-center gap-2 px-3 py-1 rounded border bg-neutral-50 text-sm">
              {n}
              {!isEditing && (
                <button type="button" className="text-neutral-500 hover:text-neutral-800" onClick={() => removeAttributeName(n)}>×</button>
              )}
            </span>
          ))}
          {attributeNames.length === 0 && (
            <span className="text-sm text-neutral-500">No attributes defined. Add at least one to create variants.</span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm text-neutral-600 mb-1">Name</label>
        <input className="w-full border rounded px-3 py-2" {...form.register('name')} />
        {form.formState.errors.name && <p className="text-xs text-red-600 mt-1">{form.formState.errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm text-neutral-600 mb-1">Category</label>
        <select className="w-full border rounded px-3 py-2" {...form.register('category')}>
          <option value="fashion">fashion</option>
          <option value="electronics">electronics</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-neutral-600 mb-1">Description</label>
        <textarea className="w-full border rounded px-3 py-2" rows={4} {...form.register('description')} />
        {form.formState.errors.description && <p className="text-xs text-red-600 mt-1">{form.formState.errors.description.message}</p>}
      </div>

      <div>
        <label className="block text-sm text-neutral-600 mb-1">Images (absolute URLs)</label>
        {(images || []).map((_, i) => {
          const fieldName = `images.${i}` as const;
          const url = form.getValues(fieldName) as unknown as string;
          const showThumb = typeof url === 'string' && /^https?:\/\//i.test(url);
          return (
            <div key={i} className="flex items-center gap-2 mb-2">
              <input className="w-full border rounded px-3 py-2" {...form.register(fieldName)} />
              {showThumb && (
                <div className="h-10 w-10 rounded overflow-hidden bg-neutral-100 border">
                  <img src={url} alt="thumb" className="h-full w-full object-cover" />
                </div>
              )}
              <button type="button" className="px-3 py-2 border rounded" onClick={() => removeImage(i)}>Remove</button>
            </div>
          );
        })}
        <button type="button" className="px-3 py-2 border rounded" onClick={addImage}>Add Image</button>
        {form.formState.errors.images && <p className="text-xs text-red-600 mt-1">{form.formState.errors.images.message as string}</p>}
      </div>

      <div>
        <label className="block text-sm text-neutral-600 mb-1">Price (for non-variant)</label>
        <Controller
          control={form.control}
          name="price"
          render={({ field }) => (
            <input type="number" className="w-full border rounded px-3 py-2" value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
          )}
        />
        {form.formState.errors.price && <p className="text-xs text-red-600 mt-1">{form.formState.errors.price.message}</p>}
      </div>

      <div className="flex items-center gap-2">
        <input id="featured" type="checkbox" {...form.register('featured')} />
        <label htmlFor="featured" className="text-sm text-neutral-700">Featured</label>
      </div>

      <div className="flex items-center gap-2">
        <input id="isActive" type="checkbox" {...form.register('isActive')} />
        <label htmlFor="isActive" className="text-sm text-neutral-700">Active</label>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Variants</h3>
          <button type="button" className="px-3 py-2 border rounded" onClick={addVariant}>Add Variant</button>
        </div>
        {variantsFA.fields.map((field, i) => (
          <div key={field.id} className="border rounded p-3 mb-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-neutral-600 mb-1">SKU</label>
                <input className="w-full border rounded px-3 py-2 bg-neutral-100" readOnly={isEditing} {...form.register(`variants.${i}.sku` as const)} />
                <p className="text-xs text-neutral-500 mt-1">{isEditing ? 'SKU is immutable on edit' : 'Auto-generated; you can adjust before saving'}</p>
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-1">Image URL</label>
                <div className="flex items-center gap-2">
                  <input className="w-full border rounded px-3 py-2" {...form.register(`variants.${i}.image` as const)} />
                  {(() => {
                    const vUrl = form.getValues(`variants.${i}.image`) as unknown as string;
                    const ok = typeof vUrl === 'string' && /^https?:\/\//i.test(vUrl);
                    return ok ? (
                      <div className="h-10 w-10 rounded overflow-hidden bg-neutral-100 border">
                        <img src={vUrl} alt="thumb" className="h-full w-full object-cover" />
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
              <div>
                <label className="block text-sm text-neutral-600 mb-1">Price</label>
                <Controller
                  control={form.control}
                  name={`variants.${i}.price` as const}
                  render={({ field }) => (
                    <input type="number" className="w-full border rounded px-3 py-2" value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
                  )}
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input id={`instock-${i}`} type="checkbox" {...form.register(`variants.${i}.inStock` as const)} />
                <label htmlFor={`instock-${i}`} className="text-sm text-neutral-700">In Stock</label>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input id={`isactive-${i}`} type="checkbox" {...form.register(`variants.${i}.isActive` as const)} />
                <label htmlFor={`isactive-${i}`} className="text-sm text-neutral-700">Active</label>
              </div>
            </div>

            {/* Attribute grid per schema */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Attributes</h4>
                {!isEditing && (
                  <button type="button" className="px-2 py-1 border rounded" onClick={() => addAttributePair(i)}>Add Attribute Type</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {attributeNames.map((attrName) => {
                  // Ensure a pair exists for this name
                  const pairs = form.getValues(`variants.${i}.attributesPairs`) || [];
                  if (!pairs.find((p: AttributePair) => p.name === attrName)) {
                    form.setValue(`variants.${i}.attributesPairs`, [...pairs, { name: attrName, value: '' }]);
                  }
                  const pairIndex = (form.getValues(`variants.${i}.attributesPairs`) || []).findIndex((p: AttributePair) => p.name === attrName);
                  return (
                    <div key={`${attrName}-${pairIndex}`} className="flex gap-2">
                      <input className="border rounded px-3 py-2 w-1/2 bg-neutral-100" value={attrName} readOnly />
                      <input className="border rounded px-3 py-2 w-1/2" placeholder={`value for ${attrName}`} {...form.register(`variants.${i}.attributesPairs.${pairIndex}.value` as const)} />
                    </div>
                  );
                })}
              </div>
            </div>

            {!isEditing && (
              <div className="mt-3 text-right">
                <button type="button" className="px-3 py-2 border rounded" onClick={() => removeVariant(i)}>Remove Variant</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={!form.formState.isValid} className="px-4 py-2 bg-neutral-900 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed">{isEditing ? 'Save Changes' : 'Create Product'}</button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Preview</h3>
              <button type="button" className="px-3 py-1 border rounded" onClick={() => setShowPreview(false)}>Close</button>
            </div>
            <ProductPreview product={currentPreviewProduct} />
          </div>
        </div>
      )}
    </form>
  );
} 