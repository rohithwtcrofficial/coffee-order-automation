// src/app/(dashboard)/products/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, Plus, X, Upload } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/client';

const categoryOptions = [
  { value: 'COFFEE_BEANS', label: 'Coffee Beans' },
  { value: 'FILTER_COFFEE', label: 'Filter Coffee' },
  { value: 'INSTANT_COFFEE', label: 'Instant Coffee' },
  { value: 'TEA', label: 'Tea' },
];


const roastLevelOptions = [
  { value: 'LIGHT', label: 'Light' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'MEDIUM_DARK', label: 'Medium Dark' },
  { value: 'DARK', label: 'Dark' },
];

interface Variant {
  grams: number;
  price: number;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Product Information
  const [name, setName] = useState('');
  const [category, setCategory] = useState('COFFEE_BEANS');
  const [roastLevel, setRoastLevel] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [origin, setOrigin] = useState('');
  const [stockQuantity, setStockQuantity] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Image handling
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageChanged, setImageChanged] = useState(false);

  // Variants (grams and prices)
  const [variants, setVariants] = useState<Variant[]>([
    { grams: 250, price: 0 },
  ]);

  // Tasting Notes
  const [tastingNotes, setTastingNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productDoc = await getDoc(doc(db, 'products', productId));
        
        if (!productDoc.exists()) {
          toast.error('Product not found');
          router.push('/products');
          return;
        }

        const data = productDoc.data();
        
        setName(data.name || '');
        setCategory(data.category || 'Coffee Beans');
        setRoastLevel(data.roastLevel || 'MEDIUM');
        setDescription(data.description || '');
        setOrigin(data.origin || '');
        setStockQuantity(data.stockQuantity || 0);
        setIsActive(data.isActive ?? true);
        setCurrentImageUrl(data.imageUrl || '');
        setTastingNotes(data.tastingNotes || []);

        // Convert pricePerVariant to variants array
        if (data.availableGrams && data.pricePerVariant) {
          const variantsArray = data.availableGrams.map((grams: number) => ({
            grams,
            price: data.pricePerVariant[grams] || 0,
          }));
          setVariants(variantsArray);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchProduct();
  }, [productId, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setImageFile(file);
      setImageChanged(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageChanged(true);
    setCurrentImageUrl('');
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      setUploadingImage(true);
      
      // Create unique filename
      const timestamp = Date.now();
      const filename = `products/${timestamp}_${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      // Upload to Firebase Storage
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, imageFile);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const addVariant = () => {
    setVariants([...variants, { grams: 500, price: 0 }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (index: number, field: 'grams' | 'price', value: number) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const addTastingNote = () => {
    if (newNote.trim() && !tastingNotes.includes(newNote.trim())) {
      setTastingNotes([...tastingNotes, newNote.trim()]);
      setNewNote('');
    }
  };

  const removeTastingNote = (note: string) => {
    setTastingNotes(tastingNotes.filter(n => n !== note));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate
      if (!name || !category || !roastLevel) {
        throw new Error('Please fill in all required fields');
      }

      if (variants.some(v => v.grams <= 0 || v.price <= 0)) {
        throw new Error('All variants must have valid grams and price');
      }

      // Check for duplicate grams
      const gramValues = variants.map(v => v.grams);
      if (new Set(gramValues).size !== gramValues.length) {
        throw new Error('Duplicate gram sizes are not allowed');
      }

      let imageUrl = currentImageUrl;

      // Handle image updates
      if (imageChanged) {
        // Delete old image if exists
        if (currentImageUrl) {
          try {
            const oldImageRef = ref(storage, currentImageUrl);
            await deleteObject(oldImageRef);
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }

        // Upload new image if provided
        if (imageFile) {
          const newImageUrl = await uploadImage();
          if (newImageUrl) {
            imageUrl = newImageUrl;
          }
        } else {
          imageUrl = '';
        }
      }

      // Build price per variant object
      const pricePerVariant: Record<number, number> = {};
      const availableGrams: number[] = [];

      variants.forEach(v => {
        pricePerVariant[v.grams] = v.price;
        availableGrams.push(v.grams);
      });

      // Update product
      await updateDoc(doc(db, 'products', productId), {
        name,
        category,
        roastLevel,
        description,
        origin: origin || null,
        availableGrams: availableGrams.sort((a, b) => a - b),
        pricePerVariant,
        stockQuantity,
        isActive,
        tastingNotes: tastingNotes.length > 0 ? tastingNotes : null,
        imageUrl: imageUrl || null,
        currency: 'INR',
        updatedAt: serverTimestamp(),
      });

      toast.success('Product updated successfully!');
      router.push('/products');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <Link 
        href="/products"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Products
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-600 mt-1">Update product information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
       {/* Product Image */}
<Card>
  <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
    Product Image
  </h2>

  {!imagePreview && !currentImageUrl ? (
    <div className="flex justify-center">
      <div className="
        w-280px
        aspect-4/5
        border-2 border-dashed border-gray-300
        rounded-lg p-6
        text-center
        hover:border-primary-400 transition-colors
        flex flex-col justify-center
      ">
        <input
          type="file"
          id="product-image"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
        <label
          htmlFor="product-image"
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className="w-10 h-10 text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            Upload product image
          </p>
          <p className="text-xs text-gray-500">
            JPG, PNG, WEBP (561 × 700)
          </p>
        </label>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center">
      <div className="relative w-280px aspect-4/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imagePreview || currentImageUrl}
          alt="Product preview"
          className="
            w-full h-full
            object-cover
            rounded-lg
            border border-gray-200
          "
        />

        <Button
          type="button"
          onClick={removeImage}
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 bg-white shadow-md hover:bg-red-50"
        >
          <X className="w-4 h-4 text-red-600" />
        </Button>
      </div>
      {imagePreview && (
        <p className="mt-1 text-sm text-gray-600">
          New image selected: <span className="font-medium">{imageFile?.name}</span>
        </p>
      )}
    </div>
  )}
</Card>



        {/* Basic Information */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Product Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ethiopian Yirgacheffe"
              required
            />
            
            <Select
              label="Category *"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categoryOptions}
              required
            />

            <Select
              label="Roast Level *"
              value={roastLevel}
              onChange={(e) => setRoastLevel(e.target.value)}
              options={roastLevelOptions}
              required
            />

            <Input
              label="Origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Ethiopia, Yirgacheffe"
            />

            <Input
              label="Stock Quantity *"
              type="number"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
              required
            />

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active (Show in catalog)
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Describe the flavor profile, brewing recommendations, etc."
            />
          </div>
        </Card>

        {/* Variants (Sizes & Prices) */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Sizes & Pricing *</h2>
            <Button type="button" onClick={addVariant} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Size
            </Button>
          </div>

          <div className="space-y-3">
            {variants.map((variant, index) => (
              <div key={index} className="flex items-end gap-3">
                <Input
                  label="Grams"
                  type="number"
                  min="1"
                  value={variant.grams}
                  onChange={(e) => updateVariant(index, 'grams', parseInt(e.target.value) || 0)}
                  required
                />
                <Input
                  label="Price (₹)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={variant.price}
                  onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                  required
                />
                {variants.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeVariant(index)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Common sizes: 250g, 500g, 1000g
          </p>
        </Card>

        {/* Tasting Notes */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasting Notes</h2>
          
          <div className="flex gap-2 mb-3">
            <Input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="e.g., Chocolate, Citrus, Floral"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTastingNote();
                }
              }}
            />
            <Button type="button" onClick={addTastingNote} variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {tastingNotes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tastingNotes.map((note) => (
                <span
                  key={note}
                  className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm"
                >
                  {note}
                  <button
                    type="button"
                    onClick={() => removeTastingNote(note)}
                    className="ml-2 hover:text-amber-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </Card>

       {/* Submit Buttons - Centered & Same Width */}
<div className="
  sticky bottom-0
  bg-white p-5 rounded-lg
  border-2 border-primary-200
  shadow-lg z-10
">
  <div className="flex justify-center gap-6">
    
    {/* Cancel */}
    <button
      type="button"
      onClick={() => router.push('/products')}
      disabled={loading || uploadingImage}
      className="
        w-48 px-6 py-3
        border border-gray-300
        rounded-lg font-medium
        text-gray-700
        hover:bg-gray-50
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
      "
    >
      Cancel
    </button>

    {/* Update Product – BLUE */}
    <button
      type="submit"
      disabled={loading || uploadingImage || !name || variants.some(v => v.price <= 0)}
      className="
        w-48 px-6 py-3
        bg-blue-800 hover:bg-blue-900
        text-white rounded-lg font-semibold
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
        shadow-md
      "
    >
      {uploadingImage
        ? 'Uploading Image...'
        : loading
        ? 'Updating Product...'
        : 'Update Product'}
    </button>

  </div>
</div>



      </form>
    </div>
  );
}