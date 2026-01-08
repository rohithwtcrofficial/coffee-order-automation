// src/components/orders/StatusUpdateSection.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Edit, X, Check, AlertCircle, Loader2, Package, Truck } from 'lucide-react';
import { updateOrderStatus } from '@/lib/actions/orders';
import { useRouter } from 'next/navigation';

interface StatusUpdateSectionProps {
  orderId: string;
  currentStatus: string;
  orderNumber: string;
  currentTrackingId?: string;
}

const STATUS_OPTIONS = [
  { value: 'RECEIVED', label: 'Order Received', icon: '📥', color: 'from-blue-500 to-cyan-500', description: 'Order has been received' },
  { value: 'ACCEPTED', label: 'Order Accepted', icon: '✅', color: 'from-green-500 to-emerald-500', description: 'Order has been accepted' },
  { value: 'PACKED', label: 'Order Packed', icon: '📦', color: 'from-indigo-500 to-purple-500', description: 'Order is packed and ready' },
  { value: 'SHIPPED', label: 'Order Shipped', icon: '🚚', color: 'from-purple-500 to-pink-500', description: 'Order is in transit', requiresTracking: true },
  { value: 'DELIVERED', label: 'Order Delivered', icon: '🎉', color: 'from-green-600 to-teal-600', description: 'Order has been delivered' },
  { value: 'CANCELLED', label: 'Order Cancelled', icon: '❌', color: 'from-red-500 to-rose-500', description: 'Order has been cancelled' },
];

export function StatusUpdateSection({ orderId, currentStatus, orderNumber, currentTrackingId }: StatusUpdateSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [trackingId, setTrackingId] = useState(currentTrackingId || '');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleStatusSelect = (status: string) => {
    setSelectedStatus(status);
    setError(null);
  };

  const handleTrackingIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTrackingId(e.target.value);
    setError(null);
  };

  const handleProceedToConfirm = () => {
    const selectedStatusObj = STATUS_OPTIONS.find(s => s.value === selectedStatus);
    
    // Validate tracking ID for shipped status
    if (selectedStatusObj?.requiresTracking && !trackingId.trim()) {
      setError('Tracking ID is required for shipped orders');
      return;
    }

    if (selectedStatus !== currentStatus || trackingId !== (currentTrackingId || '')) {
      setError(null);
      setShowConfirmation(true);
    }
  };

  const handleConfirmUpdate = async () => {
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await updateOrderStatus(
        orderId, 
        selectedStatus, 
        trackingId.trim() || null
      );
      
      if (result.success) {
        setSuccessMessage('Order status updated successfully!');
        setShowConfirmation(false);
        setIsEditing(false);
        
        // Refresh the page data
        router.refresh();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError(result.error || 'Failed to update status');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Error updating status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedStatus(currentStatus);
    setTrackingId(currentTrackingId || '');
    setError(null);
    setSuccessMessage(null);
  };

  const currentStatusObj = STATUS_OPTIONS.find(s => s.value === currentStatus);
  const selectedStatusObj = STATUS_OPTIONS.find(s => s.value === selectedStatus);
  const hasChanges = selectedStatus !== currentStatus || trackingId.trim() !== (currentTrackingId || '');

  return (
    <>
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 min-w-[320px]">
        {/* Success Message */}
        {successMessage && !isEditing && (
          <div className="mb-4 bg-green-50 border-2 border-green-200 rounded-xl p-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600 shrink-0" />
              <div className="text-sm text-green-800 font-medium">{successMessage}</div>
            </div>
          </div>
        )}

        {!isEditing ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Current Status</div>
            <div className={`px-4 py-3 bg-linear-to-r ${currentStatusObj?.color} rounded-xl text-white font-bold text-center text-lg shadow-md`}>
              {currentStatusObj?.icon} {currentStatusObj?.label}
            </div>
            {currentTrackingId && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-900">Tracking ID</span>
                </div>
                <div className="font-mono text-sm font-bold text-blue-700 break-all">{currentTrackingId}</div>
              </div>
            )}
            <Button
              onClick={() => setIsEditing(true)}
              className="w-full bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold shadow-md"
            >
              <Edit className="w-4 h-4 mr-2" />
              Update Status
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Update Order</div>
              <button
                onClick={handleCancelEdit}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isUpdating}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-2 block uppercase tracking-wide">
                Select Status
              </label>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleStatusSelect(status.value)}
                    disabled={isUpdating}
                    className={`w-full px-4 py-3 rounded-xl font-semibold transition-all text-left ${
                      status.value === selectedStatus
                        ? `bg-linear-to-r ${status.color} text-white shadow-lg ring-2 ring-offset-2 ring-blue-500`
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:shadow-md border-2 border-gray-200'
                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="text-xl">{status.icon}</span>
                        <div>
                          <div className="font-bold">{status.label}</div>
                          <div className={`text-xs ${status.value === selectedStatus ? 'text-white/80' : 'text-gray-500'}`}>
                            {status.description}
                          </div>
                        </div>
                      </span>
                      {status.value === selectedStatus && (
                        <Check className="w-5 h-5" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedStatusObj?.requiresTracking && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <label className="text-sm font-bold text-blue-900">Tracking Information</label>
                </div>
                <Input
                  value={trackingId}
                  onChange={handleTrackingIdChange}
                  placeholder="Enter tracking number (e.g., TRK123456789)"
                  className="font-mono"
                  disabled={isUpdating}
                />
                <p className="text-xs text-blue-700 mt-2">
                  Tracking ID is required for shipped orders
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 animate-shake">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <div className="text-sm text-red-800 font-medium">{error}</div>
                </div>
              </div>
            )}

            <Button
              onClick={handleProceedToConfirm}
              disabled={!hasChanges || isUpdating}
              className={`w-full font-bold shadow-md ${
                hasChanges 
                  ? 'bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4 mr-2" />
              {hasChanges ? 'Proceed to Confirm' : 'No Changes to Save'}
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-scale-in">
            {/* Header */}
            <div className={`bg-linear-to-r ${selectedStatusObj?.color} p-6 rounded-t-2xl`}>
              <div className="flex items-center justify-center mb-3">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-5xl">{selectedStatusObj?.icon}</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-1">
                Confirm Status Update
              </h2>
              <p className="text-white/90 text-center text-sm">
                {selectedStatusObj?.description}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-900">
                    <p className="font-bold mb-1">⚠️ Customer Notification</p>
                    <p className="text-amber-800">
                      Updating the order status will trigger an automated email notification to the customer with the new status information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">Order Number:</span>
                  <span className="font-mono font-bold text-gray-900">#{orderNumber}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">Current Status:</span>
                  <span className="font-bold text-gray-900">{currentStatusObj?.label}</span>
                </div>
                
                {currentTrackingId && currentTrackingId !== trackingId && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-600 font-medium">Current Tracking:</span>
                    <span className="font-mono text-sm text-gray-700 break-all">{currentTrackingId}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-center py-2">
                  <div className="text-3xl text-gray-400">↓</div>
                </div>
                
                <div className={`p-4 bg-linear-to-r ${selectedStatusObj?.color} rounded-xl shadow-lg`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white font-semibold">New Status:</span>
                    <span className="font-bold text-white text-xl">
                      {selectedStatusObj?.icon} {selectedStatusObj?.label}
                    </span>
                  </div>
                  {trackingId.trim() && (
                    <div className="mt-3 pt-3 border-t border-white/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-4 h-4 text-white" />
                        <span className="text-xs text-white/90 font-semibold">Tracking ID:</span>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <span className="font-mono font-bold text-white break-all">{trackingId.trim()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    <div className="text-sm text-red-800 font-medium">{error}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-0">
              <Button
                onClick={handleCancelConfirmation}
                variant="outline"
                disabled={isUpdating}
                className="flex-1 border-2 border-gray-300 hover:bg-gray-50 font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmUpdate}
                disabled={isUpdating}
                className={`flex-1 bg-linear-to-r ${selectedStatusObj?.color} hover:opacity-90 text-white font-bold shadow-lg`}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirm Update
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-shake {
          animation: shake 0.3s ease-out;
        }
      `}</style>
    </>
  );
}