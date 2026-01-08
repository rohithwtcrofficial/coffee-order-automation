// src/components/orders/OrderStatusBadge.tsx
import { Badge } from '@/components/ui/Badge';
import { OrderStatus } from '@/lib/types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const statusConfig: Record<OrderStatus, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
    RECEIVED: { variant: 'info', label: 'Order Received' },
    ACCEPTED: { variant: 'success', label: 'Order Accepted' },
    PACKED: { variant: 'info', label: 'Order Packed' },
    SHIPPED: { variant: 'info', label: 'Order Shipped' },
    DELIVERED: { variant: 'success', label: 'Order Delivered' },
    CANCELLED: { variant: 'danger', label: 'Order Cancelled' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}