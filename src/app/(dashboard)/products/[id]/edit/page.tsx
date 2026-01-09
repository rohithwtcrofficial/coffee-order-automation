// src/app/(dashboard)/products/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { 
  ArrowLeft, Plus, X, Upload, Package, Tag, IndianRupee, 
  Image as ImageIcon, Coffee, Save, AlertCircle, CheckCircle 
} from 'lucide-react';
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
        
        console.log('📦 Fetched product data:', data);
        console.log('🖼️ Product imageUrl:', data.imageUrl);
        
        setName(data.name || '');
        setCategory(data.category || 'COFFEE_BEANS');
        setRoastLevel(data.roastLevel || 'MEDIUM');
        setDescription(data.description || '');
        setOrigin(data.origin || '');
        setStockQuantity(data.stockQuantity || 0);
        setIsActive(data.isActive ?? true);
        
        // IMPORTANT: Set the current image URL
        const imageUrl = data.imageUrl || '';
        setCurrentImageUrl(imageUrl);
        console.log('✅ Set currentImageUrl to:', imageUrl);
        
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
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      processImageFile(file);
    }
  };

  const removeImage = () => {
    console.log('🗑️ Removing image preview (not deleting from storage yet)');
    setImageFile(null);
    setImagePreview('');
    setImageUrlInput('');
    setImageFromUrl(false);
    setImageChanged(true);
    // DON'T reset currentImageUrl here - we need it for deletion later
    console.log('✅ Image removal marked, currentImageUrl preserved:', currentImageUrl);
  };

  const deleteOldImage = async (imageUrl: string) => {
    if (!imageUrl) {
      console.log('No image URL provided for deletion');
      return;
    }
    
    try {
      // Only delete if it's a Firebase Storage URL
      if (!imageUrl.includes('firebasestorage.googleapis.com')) {
        console.log('Not a Firebase Storage URL, skipping deletion:', imageUrl);
        return;
      }

      console.log('Processing deletion for URL:', imageUrl);
      
      // Extract the file path from the URL
      // URL format: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile.jpg?alt=media&token=...
      const decodedUrl = decodeURIComponent(imageUrl);
      console.log('Decoded URL:', decodedUrl);
      
      const startIndex = decodedUrl.indexOf('/o/') + 3;
      const endIndex = decodedUrl.indexOf('?');
      
      if (startIndex === -1 || endIndex === -1) {
        console.error('Could not extract file path from URL');
        return;
      }
      
      const filePath = decodedUrl.substring(startIndex, endIndex);
      console.log('Extracted file path:', filePath);
      
      const imageRef = ref(storage, filePath);
      console.log('Deleting file from Storage...');
      
      await deleteObject(imageRef);
      console.log('✅ Successfully deleted old image from:', filePath);
      toast.success('Old image deleted from storage');
    } catch (error: any) {
      console.error('❌ Error deleting old image:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Don't throw error if file doesn't exist (already deleted)
      if (error.code === 'storage/object-not-found') {
        console.log('Image already deleted or does not exist');
      } else {
        console.warn('Failed to delete old image, but continuing with update');
      }
    }
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

    console.log('=== SUBMIT STARTED ===');
    console.log('imageChanged:', imageChanged);
    console.log('imageFile:', imageFile?.name);
    console.log('currentImageUrl:', currentImageUrl);
    console.log('imageFromUrl:', imageFromUrl);

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
      const oldImageUrl = currentImageUrl; // Store the old URL before changes

      console.log('Old image URL:', oldImageUrl);

      // Handle image updates
      if (imageChanged) {
        console.log('🔄 Image has changed, processing...');
        
        // Upload new image first if provided
        if (imageFile) {
          console.log('📤 Uploading new image file:', imageFile.name);
          const newImageUrl = await uploadImage();
          
          if (newImageUrl) {
            console.log('✅ New image uploaded successfully:', newImageUrl);
            imageUrl = newImageUrl;
            
            // Delete old image only after successful upload
            if (oldImageUrl && oldImageUrl !== newImageUrl) {
              console.log('🗑️ Deleting old image:', oldImageUrl);
              await deleteOldImage(oldImageUrl);
            } else {
              console.log('⚠️ Skipping deletion - no old image or same URL');
            }
          } else {
            throw new Error('Failed to upload new image');
          }
        } else if (imageFromUrl && imageUrlInput) {
          console.log('🔗 Using image from URL:', imageUrlInput);
          imageUrl = imageUrlInput;
          
          // Delete old Firebase Storage image if switching to URL
          if (oldImageUrl && oldImageUrl.includes('firebasestorage.googleapis.com')) {
            console.log('🗑️ Switching to URL, deleting old Firebase image:', oldImageUrl);
            await deleteOldImage(oldImageUrl);
          }
        } else {
          console.log('❌ Removing image entirely');
          imageUrl = '';
          
          // Delete old image if removing image entirely
          if (oldImageUrl && oldImageUrl.includes('firebasestorage.googleapis.com')) {
            console.log('🗑️ Removing image, deleting old Firebase image:', oldImageUrl);
            await deleteOldImage(oldImageUrl);
          }
        }
      } else {
        console.log('⏭️ Image not changed, skipping image operations');
      }

      // Build price per variant object
      const pricePerVariant: Record<number, number> = {};
      const availableGrams: number[] = [];

      variants.forEach(v => {
        pricePerVariant[v.grams] = v.price;
        availableGrams.push(v.grams);
      });

      // Update product
      console.log('💾 Updating product with image URL:', imageUrl);
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

      console.log('✅ Product updated successfully');
      toast.success('Product updated successfully!');
      router.push('/products');
    } catch (error: any) {
      console.error('❌ Error in handleSubmit:', error);
      toast.error(error.message || 'Failed to update product');
    } finally {
      setLoading(false);
      console.log('=== SUBMIT ENDED ===');
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

    console.log('📸 Processing new image file:', file.name);
    setImageFile(file);
    setImageChanged(true); // Mark that image has changed
    setImageFromUrl(false);
    
    console.log('✅ imageChanged set to TRUE');
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      console.log('✅ Image preview created');
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
        setImageChanged(true);
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

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/products"
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-sm text-gray-600 mt-0.5">Update product information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-32">
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
                    ? 'bg-linear-to-r from-amber-600 to-orange-600 text-white shadow-lg'
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
                    ? 'bg-linear-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Image URL
              </button>
            </div>

            {/* Show preview if image exists */}
            {(imagePreview || currentImageUrl) && (!imageChanged || imagePreview) ? (
              <div className="flex flex-col items-center">
                <div className="relative w-80 aspect-4/5">
                  <img
                    src={imagePreview || currentImageUrl}
                    alt="Product preview"
                    className="w-full h-full object-cover rounded-2xl border-2 border-gray-200 shadow-lg"
                  />
                  <Button
                    type="button"
                    onClick={removeImage}
                    variant="ghost"
                    size="sm"
                    className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-red-50 border-2 border-gray-200"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </Button>
                  {imageChanged && imagePreview && (
                    <div className="absolute bottom-3 left-3 right-3 bg-green-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      New image will be uploaded
                    </div>
                  )}
                </div>
                {imagePreview && imageFile && (
                  <p className="mt-3 text-sm text-gray-600 font-medium">
                    New image: <span className="text-amber-700">{imageFile?.name}</span>
                  </p>
                )}
                {imagePreview && !imageFile && imageFromUrl && (
                  <p className="mt-3 text-sm text-green-700 font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Image loaded from URL
                  </p>
                )}
              </div>
            ) : imageChanged && !imagePreview && !imageFile && currentImageUrl ? (
              // Show message that image will be deleted with option to upload new
              <div className="flex flex-col items-center">
                <div className="w-full max-w-md p-6 bg-red-50 border-2 border-red-200 rounded-2xl mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Image Removed</h3>
                      <p className="text-sm text-gray-600">Current image will be deleted on update</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImageChanged(false);
                      console.log('↩️ Undoing image removal');
                    }}
                    className="w-full px-4 py-2 bg-white hover:bg-gray-50 border-2 border-gray-300 rounded-xl font-semibold transition-colors text-gray-700"
                  >
                    ↩️ Undo Removal
                  </button>
                </div>

                {/* Upload new image section */}
                <div className="w-full max-w-md">
                  <p className="text-center text-sm font-bold text-gray-700 mb-4">Or upload a new image:</p>
                  
                  {imageInputMode === 'upload' ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleImageDrop}
                      className={`
                        w-full aspect-4/5
                        border-2 border-dashed rounded-2xl p-8
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
                        id="product-image-replace"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="product-image-replace"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload className="w-16 h-16 text-amber-500 mb-4" />
                        <p className="text-base font-bold text-gray-900 mb-2">
                          {isDragging ? 'Drop new image here' : 'Upload new image'}
                        </p>
                        <p className="text-sm text-gray-600">
                          JPG, PNG, WEBP (max 5MB)
                        </p>
                      </label>
                    </div>
                  ) : (
                    <div className="w-full">
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
                        className="mt-4 w-full px-4 py-3 bg-linear-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg"
                      >
                        Load Image
                      </button>
                    </div>
                  )}
                </div>
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
                        w-80 aspect-4/5
                        border-2 border-dashed rounded-2xl p-8
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
                        <Upload className="w-16 h-16 text-amber-500 mb-4" />
                        <p className="text-base font-bold text-gray-900 mb-2">
                          {isDragging ? 'Drop image here' : 'Upload or drag & drop'}
                        </p>
                        <p className="text-sm text-gray-600">
                          JPG, PNG, WEBP (max 5MB)
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
                        className="mt-4 w-full px-4 py-3 bg-linear-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg"
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
              <Button type="button" onClick={addVariant} className="bg-linear-to-r from-amber-600 to-orange-600 shadow-lg">
                <Plus className="w-4 h-4 mr-1" />
                Add Size
              </Button>
            </div>

            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div key={index} className="flex items-end gap-3 p-4 bg-linear-to-br from-gray-50 to-amber-50 rounded-xl border-2 border-gray-200">
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
                className="bg-linear-to-r from-amber-600 to-orange-600 shadow-lg"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {tastingNotes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tastingNotes.map((note) => (
                  <span
                    key={note}
                    className="inline-flex items-center px-4 py-2 bg-linear-to-r from-amber-100 to-orange-100 text-amber-900 rounded-xl text-sm font-bold border-2 border-amber-200"
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-40">
        <div className="max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => router.push('/products')}
              disabled={loading || uploadingImage}
              className="w-48 px-6 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading || uploadingImage || !name || variants.some(v => v.price <= 0)}
              className="w-48 px-6 py-3 bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {uploadingImage ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Update Product
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}