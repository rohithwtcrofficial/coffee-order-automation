// src/app/(dashboard)/products/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { 
  ArrowLeft, Plus, X, Upload, Package, Tag, IndianRupee, 
  Image as ImageIcon, Coffee, Save, CheckCircle, Sparkles,
  AlertCircle 
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageFromUrl, setImageFromUrl] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Variants (grams and prices)
  const [variants, setVariants] = useState<Variant[]>([
    { grams: 250, price: 0 },
  ]);

  // Tasting Notes
  const [tastingNotes, setTastingNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      processImageFile(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageUrlInput('');
    setImageFromUrl(false);
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

      // Upload image if provided
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      } else if (imageFromUrl && imageUrlInput) {
        // Use URL directly if image is from URL
        imageUrl = imageUrlInput;
      }

      // Build price per variant object
      const pricePerVariant: Record<number, number> = {};
      const availableGrams: number[] = [];

      variants.forEach(v => {
        pricePerVariant[v.grams] = v.price;
        availableGrams.push(v.grams);
      });

      // Create product
      await addDoc(collection(db, 'products'), {
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success('Product created successfully!');
      router.push('/products');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    } else {
      toast.error('Please drop a valid image file');
    }
  };

  const processImageFile = (file: File) => {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);
    setImageFromUrl(false);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const loadImageFromUrl = async () => {
    if (!imageUrlInput.trim()) {
      toast.error('Please enter a valid image URL');
      return;
    }

    try {
      // Validate URL format
      new URL(imageUrlInput);
      
      // Test if image loads
      const img = new Image();
      img.onload = () => {
        setImagePreview(imageUrlInput);
        setImageFile(null);
        setImageFromUrl(true);
        toast.success('Image loaded successfully');
      };
      img.onerror = () => {
        toast.error('Failed to load image from URL. Please check the URL.');
      };
      img.src = imageUrlInput;
    } catch (error) {
      toast.error('Invalid URL format');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/products"
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create New Product</h1>
              <p className="text-sm text-gray-600 mt-0.5">Add a new product to your catalog</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Image */}
          <Card className="border-none shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-gray-900">Product Image</h2>
            </div>

            {/* Toggle between Upload and URL */}
            <div className="flex justify-center gap-3 mb-6">
              <button
                type="button"
                onClick={() => {
                  setImageInputMode('upload');
                  setImageUrlInput('');
                }}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                  imageInputMode === 'upload'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Upload Image
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageInputMode('url');
                  setImageFile(null);
                }}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                  imageInputMode === 'url'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Image URL
              </button>
            </div>

            {/* Show preview if image exists */}
            {imagePreview ? (
              <div className="flex flex-col items-center">
                <div className="relative w-48 h-56">
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="w-full h-full object-cover rounded-xl border-2 border-gray-200 shadow-md"
                  />
                  <Button
                    type="button"
                    onClick={removeImage}
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm shadow-md hover:bg-red-50 border border-gray-200 p-1.5"
                  >
                    <X className="w-3.5 h-3.5 text-red-600" />
                  </Button>
                  <div className="absolute bottom-2 left-2 right-2 bg-green-500/90 backdrop-blur-sm text-white px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Ready to upload
                  </div>
                </div>
                {imagePreview && imageFile && (
                  <p className="mt-2 text-xs text-gray-600 font-medium max-w-xs truncate">
                    <span className="text-amber-700">{imageFile?.name}</span>
                  </p>
                )}
                {imagePreview && !imageFile && imageFromUrl && (
                  <p className="mt-2 text-xs text-green-700 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Loaded from URL
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Upload Mode */}
                {imageInputMode === 'upload' && (
                  <div className="flex justify-center">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleImageDrop}
                      className={`
                        w-48 h-56
                        border-2 border-dashed rounded-xl p-4
                        text-center transition-all
                        flex flex-col justify-center
                        ${isDragging 
                          ? 'border-amber-600 bg-amber-50 scale-105' 
                          : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50/50'
                        }
                      `}
                    >
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
                        <Upload className="w-10 h-10 text-amber-500 mb-2" />
                        <p className="text-sm font-bold text-gray-900 mb-1">
                          {isDragging ? 'Drop here' : 'Upload image'}
                        </p>
                        <p className="text-xs text-gray-600">
                          Max 5MB
                        </p>
                      </label>
                    </div>
                  </div>
                )}

                {/* URL Mode */}
                {imageInputMode === 'url' && (
                  <div className="flex flex-col items-center">
                    <div className="w-full max-w-md">
                      <Input
                        label="Image URL"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            loadImageFromUrl();
                          }
                        }}
                        className="border-2"
                      />
                      <button
                        type="button"
                        onClick={loadImageFromUrl}
                        disabled={!imageUrlInput.trim()}
                        className="mt-3 w-full px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg text-sm"
                      >
                        Load Image
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Basic Information */}
          <Card className="border-none shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Product Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ethiopian Yirgacheffe"
                required
                className="border-2"
              />
              
              <Select
                label="Category *"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={categoryOptions}
                required
                className="border-2"
              />

              <Select
                label="Roast Level *"
                value={roastLevel}
                onChange={(e) => setRoastLevel(e.target.value)}
                options={roastLevelOptions}
                required
                className="border-2"
              />

              <Input
                label="Origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Ethiopia, Yirgacheffe"
                className="border-2"
              />

              <Input
                label="Stock Quantity *"
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                required
                className="border-2"
              />

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-gray-900">
                  Active (Show in catalog)
                </label>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                placeholder="Describe the flavor profile, brewing recommendations, etc."
              />
            </div>
          </Card>

          {/* Variants (Sizes & Prices) */}
          <Card className="border-none shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-gray-900">Sizes & Pricing *</h2>
              </div>
              <Button type="button" onClick={addVariant} className="bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg">
                <Plus className="w-4 h-4 mr-1" />
                Add Size
              </Button>
            </div>

            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div key={index} className="flex items-end gap-3 p-4 bg-gradient-to-br from-gray-50 to-amber-50 rounded-xl border-2 border-gray-200">
                  <Input
                    label="Grams"
                    type="number"
                    min="1"
                    value={variant.grams}
                    onChange={(e) => updateVariant(index, 'grams', parseInt(e.target.value) || 0)}
                    required
                    className="border-2"
                  />
                  <Input
                    label="Price (₹)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={variant.price}
                    onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                    required
                    className="border-2"
                  />
                  {variants.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeVariant(index)}
                      variant="ghost"
                      size="sm"
                      className="hover:bg-red-100"
                    >
                      <X className="w-5 h-5 text-red-600" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-600 mt-3 font-medium">
              💡 Common sizes: 250g, 500g, 1000g
            </p>
          </Card>

          {/* Tasting Notes */}
          <Card className="border-none shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-gray-900">Tasting Notes</h2>
            </div>
            
            <div className="flex gap-2 mb-4">
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
                className="border-2"
              />
              <Button 
                type="button" 
                onClick={addTastingNote}
                className="bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {tastingNotes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tastingNotes.map((note) => (
                  <span
                    key={note}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 rounded-xl text-sm font-bold border-2 border-amber-200"
                  >
                    {note}
                    <button
                      type="button"
                      onClick={() => removeTastingNote(note)}
                      className="ml-2 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Card>
        </form>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => router.push('/products')}
              disabled={loading || uploadingImage}
              className="w-40 px-5 py-2.5 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading || uploadingImage || !name || variants.some(v => v.price <= 0)}
              className="w-40 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
            >
              {uploadingImage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create Product
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}