// src/app/(dashboard)/products/ProductsClientWrapper.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Edit, Trash2, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/client';
import { Product } from '@/lib/types';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  loading: boolean;
}

function DeleteModal({ isOpen, onClose, onConfirm, productName, loading }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6 ml-15">
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-900">&quot;{productName}&quot;</span>?
              </p>
              <p className="text-sm text-red-600">
                This action cannot be undone. All product data will be permanently removed.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface ProductsClientWrapperProps {
  products: Product[];
}

export default function ProductsClientWrapper({ products: initialProducts }: ProductsClientWrapperProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    product: Product | null;
  }>({ isOpen: false, product: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteClick = (product: Product) => {
    setDeleteModal({ isOpen: true, product });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.product) return;

    setDeleteLoading(true);

    try {
      const productId = deleteModal.product.id;

      // Delete product image from Storage if exists
      if (deleteModal.product.imageUrl) {
        try {
          const imageRef = ref(storage, deleteModal.product.imageUrl);
          await deleteObject(imageRef);
        } catch (imageError) {
          console.error('Error deleting image:', imageError);
          // Continue even if image deletion fails
        }
      }

      // Delete product from Firestore
      await deleteDoc(doc(db, 'products', productId));

      // Update local state
      setProducts(products.filter((p) => p.id !== productId));

      // Close modal
      setDeleteModal({ isOpen: false, product: null });

      toast.success('Product deleted successfully!');
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, product: null });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            <div className="space-y-4">
              {/* Product Image */}
              {product.imageUrl ? (
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="relative w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}

              {/* Product Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.category}</p>
                </div>
                <Badge variant={product.isActive ? 'success' : 'danger'}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Product Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Roast Level:</span>
                  <span className="font-medium text-gray-900">{product.roastLevel}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Stock:</span>
                  <span
                    className={`font-medium ${
                      product.stockQuantity === 0 ? 'text-red-600' : 'text-gray-900'
                    }`}
                  >
                    {product.stockQuantity}
                    {product.stockQuantity === 0 && ' (Out of Stock)'}
                  </span>
                </div>
                {product.origin && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Origin:</span>
                    <span className="font-medium text-gray-900">{product.origin}</span>
                  </div>
                )}
              </div>

              {/* Available Sizes */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Available Sizes:</p>
                <div className="flex flex-wrap gap-2">
                  {product.availableGrams.map((grams) => (
                    <span
                      key={grams}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                    >
                      {grams}g - ₹{(product.pricePerVariant[grams] || 0).toFixed(2)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tasting Notes */}
              {product.tastingNotes && product.tastingNotes.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tasting Notes:</p>
                  <div className="flex flex-wrap gap-1">
                    {product.tastingNotes.map((note) => (
                      <span
                        key={note}
                        className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Link href={`/products/${product.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(product)}
                  className="hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        productName={deleteModal.product?.name || ''}
        loading={deleteLoading}
      />
    </>
  );
}