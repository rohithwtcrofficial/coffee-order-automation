// src/app/(dashboard)/products/ProductsClientWrapper.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Edit, Trash2, X, AlertTriangle, MoreVertical, Package } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/client';
import { Product } from '@/lib/types';
import { CATEGORY_LABEL_MAP, ROAST_LABEL_MAP } from '@/constants/productOptions';



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
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Delete Product</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete{' '}
                <span className="font-bold text-gray-900">&quot;{productName}&quot;</span>?
              </p>
              <p className="text-sm text-red-700 font-medium">
                All product data will be permanently removed.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1 border-2"
              >
                Cancel
              </Button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/30"
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

interface ActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onDelete: () => void;
}

function ActionsModal({ isOpen, onClose, product, onDelete }: ActionsModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md transform transition-all duration-300">
          {/* Handle bar for mobile */}
          <div className="flex justify-center pt-3 pb-2 sm:hidden">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
          
          <div className="p-6">
            {/* Product Info */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-linear-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                  <Package className="w-8 h-8 text-amber-700" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-1">{product.name}</h3>
                <p className="text-sm text-gray-500 font-medium">
                  {CATEGORY_LABEL_MAP[product.category] ?? product.category}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Link href={`/products/${product.id}/edit`} className="block">
                <button 
                  onClick={onClose}
                  className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                    <Edit className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900">Edit Product</p>
                    <p className="text-sm text-gray-500">Update product details</p>
                  </div>
                </button>
              </Link>
              
              <button 
                onClick={() => {
                  onClose();
                  onDelete();
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-red-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">Delete Product</p>
                  <p className="text-sm text-gray-500">Permanently remove this product</p>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={onClose}
              className="w-full mt-4 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
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
  const [actionsModal, setActionsModal] = useState<{
    isOpen: boolean;
    product: Product | null;
  }>({ isOpen: false, product: null });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    product: Product | null;
  }>({ isOpen: false, product: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleActionsClick = (product: Product) => {
    setActionsModal({ isOpen: true, product });
  };

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

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-amber-200"
          >
            {/* Product Image */}
            <div className="relative">
              {product.imageUrl ? (
                <div className="relative w-full h-48 sm:h-56 bg-linear-to-br from-gray-100 to-gray-200">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="relative w-full h-48 sm:h-56 bg-linear-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                  <Package className="w-16 h-16 text-amber-300" />
                </div>
              )}
              
              {/* Status Badge */}
              <div className="absolute top-3 left-3">
                <Badge 
                  variant={product.isActive ? 'success' : 'danger'}
                  className="shadow-lg backdrop-blur-sm bg-opacity-90"
                >
                  {product.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Actions Button */}
              <button
                onClick={() => handleActionsClick(product)}
                className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
              >
                <MoreVertical className="w-5 h-5 text-gray-700" />
              </button>

              {/* Stock Badge */}
              {product.stockQuantity === 0 && (
                <div className="absolute bottom-3 right-3">
                  <span className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-full shadow-lg">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Product Content */}
            <div className="p-4 space-y-3">
              {/* Product Header */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-sm font-bold text-amber-900">
                 {CATEGORY_LABEL_MAP[product.category] ?? product.category}
                </p>
              </div>

              {/* Product Details Grid */}
              <div className="grid grid-cols-2 gap-2 py-2">
                <div className="bg-amber-50 rounded-lg p-2">
                  <p className="text-xs text-amber-700 font-medium mb-0.5">Roast</p>
                  <p className="text-sm font-bold text-amber-900">
                  {ROAST_LABEL_MAP[product.roastLevel] ?? product.roastLevel}
                </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-xs text-blue-700 font-medium mb-0.5">Stock</p>
                  <p className={`text-sm font-bold ${product.stockQuantity === 0 ? 'text-red-600' : 'text-blue-900'}`}>
                    {product.stockQuantity} units
                  </p>
                </div>
              </div>

              {/* Origin */}
              {product.origin && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">📍</span>
                  <span className="font-medium text-gray-700">{product.origin}</span>
                </div>
              )}

              {/* Available Sizes */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Available Sizes
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {product.availableGrams.map((grams) => (
                    <span
                      key={grams}
                      className="px-2.5 py-1 bg-linear-to-r from-amber-100 to-orange-100 text-amber-900 rounded-lg text-xs font-bold"
                    >
                      {grams}g • ₹{(product.pricePerVariant[grams] || 0).toFixed(0)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tasting Notes */}
              {product.tastingNotes && product.tastingNotes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Tasting Notes
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.tastingNotes.slice(0, 3).map((note) => (
                      <span
                        key={note}
                        className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md text-xs font-medium"
                      >
                        {note}
                      </span>
                    ))}
                    {product.tastingNotes.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                        +{product.tastingNotes.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions Modal */}
      {actionsModal.product && (
        <ActionsModal
          isOpen={actionsModal.isOpen}
          onClose={() => setActionsModal({ isOpen: false, product: null })}
          product={actionsModal.product}
          onDelete={() => handleDeleteClick(actionsModal.product!)}
        />
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, product: null })}
        onConfirm={handleDeleteConfirm}
        productName={deleteModal.product?.name || ''}
        loading={deleteLoading}
      />
    </>
  );
}