// src/app/(dashboard)/products/page.tsx
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Coffee, PackageSearch } from 'lucide-react';
import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';
import { Product } from '@/lib/types';
import ProductsClientWrapper from './ProductsClientWrapper';

async function getProducts(): Promise<Product[]> {
  try {
    const productsSnapshot = await adminDb
      .collection('products')
      .orderBy('createdAt', 'desc')
      .get();

    return productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Product[];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            {/* Header Content */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Left Side - Title & Description */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Coffee className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    Products
                  </h1>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Manage your coffee catalog • {products.length} {products.length === 1 ? 'product' : 'products'}
                  </p>
                </div>
              </div>

              {/* Right Side - Action Button */}
              <Link href="/products/new">
                <Button className="w-full sm:w-auto bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg shadow-amber-600/30 px-6">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {products.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md w-full">
              <div className="text-center py-12 px-6">
                {/* Empty State Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-linear-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <PackageSearch className="w-10 h-10 text-amber-600" />
                </div>

                {/* Empty State Text */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Products Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start building your coffee catalog by adding your first product.
                </p>

                {/* CTA Button */}
                <Link href="/products/new">
                  <Button className="bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg shadow-amber-600/30">
                    <Plus className="w-5 h-5 mr-2" />
                    Add Your First Product
                  </Button>
                </Link>

                {/* Helper Text */}
                <p className="text-xs text-gray-500 mt-6">
                  Add product details, images, pricing, and more
                </p>
              </div>
            </Card>
          </div>
        ) : (
          <ProductsClientWrapper products={products} />
        )}
      </div>
    </div>
  );
}