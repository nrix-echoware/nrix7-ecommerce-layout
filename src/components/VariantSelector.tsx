
import { useState } from 'react';
import { Variant } from '../types/product';

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariant: Variant | null;
  onVariantChange: (variant: Variant) => void;
}

const VariantSelector = ({ variants, selectedVariant, onVariantChange }: VariantSelectorProps) => {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  // Get unique attribute types
  const attributeTypes = Array.from(
    new Set(variants.flatMap(v => Object.keys(v.attributes)))
  );

  // Get available values for each attribute type
  const getAttributeValues = (attributeType: string) => {
    return Array.from(
      new Set(
        variants
          .filter(v => v.attributes[attributeType as keyof typeof v.attributes])
          .map(v => v.attributes[attributeType as keyof typeof v.attributes])
      )
    ).filter(Boolean);
  };

  // Find variant based on selected attributes
  const findVariant = (attributes: Record<string, string>) => {
    return variants.find(variant => {
      return Object.entries(attributes).every(([key, value]) => 
        variant.attributes[key as keyof typeof variant.attributes] === value
      );
    });
  };

  const handleAttributeChange = (attributeType: string, value: string) => {
    const newAttributes = { ...selectedAttributes, [attributeType]: value };
    setSelectedAttributes(newAttributes);
    
    const variant = findVariant(newAttributes);
    if (variant) {
      onVariantChange(variant);
    }
  };

  return (
    <div className="space-y-6">
      {attributeTypes.map(attributeType => (
        <div key={attributeType} className="space-y-2">
          <label className="text-sm font-medium capitalize text-neutral-700">
            {attributeType}
          </label>
          <div className="flex flex-wrap gap-2">
            {getAttributeValues(attributeType).map(value => {
              const isSelected = selectedAttributes[attributeType] === value;
              
              // Check if this combination would result in an out-of-stock variant
              const testAttributes = { ...selectedAttributes, [attributeType]: value };
              const testVariant = findVariant(testAttributes);
              const isAvailable = testVariant?.inStock !== false;
              
              return (
                <button
                  key={value}
                  onClick={() => handleAttributeChange(attributeType, value)}
                  disabled={!isAvailable}
                  className={`
                    px-4 py-2 text-sm border rounded transition-all duration-200
                    ${isSelected 
                      ? 'border-neutral-900 bg-neutral-900 text-white' 
                      : isAvailable 
                        ? 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400' 
                        : 'border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed'
                    }
                  `}
                >
                  {value}
                  {!isAvailable && ' (Out of Stock)'}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      
      {selectedVariant && (
        <div className="text-sm text-neutral-600">
          <p>SKU: {selectedVariant.sku}</p>
          <p className="text-lg font-medium text-neutral-900 mt-1">
            ${selectedVariant.price}
          </p>
        </div>
      )}
    </div>
  );
};

export default VariantSelector;
