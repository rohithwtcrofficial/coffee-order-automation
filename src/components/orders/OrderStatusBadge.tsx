// src/components/orders/OrderStatusBadge.tsx
import { Badge } from '@/components/ui/Badge';
import { OrderStatus } from '@/lib/types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const statusConfig: Record<OrderStatus, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
    PLACED: { variant: 'info', label: 'Placed' },
    PROCESSING: { variant: 'warning', label: 'Processing' },
    PACKED: { variant: 'default', label: 'Packed' },
    SHIPPED: { variant: 'info', label: 'Shipped' },
    DELIVERED: { variant: 'success', label: 'Delivered' },
    CANCELLED: { variant: 'danger', label: 'Cancelled' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}