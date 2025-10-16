import { OrderStage, type Order } from '../types';
import { Link } from 'react-router-dom';

// NOTE: ClaimButton is temporarily removed until we build the new claims logic.

const getStageColor = (stage: OrderStage) => {
  // Softer, more professional badge colors
  switch (stage) {
    case OrderStage.WAITING: return 'bg-slate-200 text-slate-700';
    case OrderStage.DESIGN: return 'bg-sky-100 text-sky-800';
    case OrderStage.PRINT_READY: return 'bg-amber-100 text-amber-800';
    case OrderStage.PRINTING: case OrderStage.CUT: return 'bg-purple-100 text-purple-800';
    case OrderStage.COMPLETED: return 'bg-green-100 text-green-800';
    case OrderStage.DELIVERED: return 'bg-emerald-500 text-white';
    default: return 'bg-slate-200 text-slate-700';
  }
};

// A new component to display the list of products concisely
const ProductSummary = ({ products }: { products: Order['products'] }) => {
  if (!products || products.length === 0) {
    return <p className="text-sm text-slate-500 italic">No products in this order.</p>;
  }

  return (
    <div className="mt-3">
      <h4 className="text-sm font-semibold text-slate-700 mb-1">
        {products.length} {products.length > 1 ? 'Products' : 'Product'}:
      </h4>
      <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
        {products.slice(0, 3).map((product) => (
          <li key={product.id}>
            {product.name || `Print (${product.width}x${product.height}cm)`} - Qty: {product.quantity}
          </li>
        ))}
        {products.length > 3 && <li>...and {products.length - 3} more</li>}
      </ul>
    </div>
  );
};

const OrderCard = ({ order }: { order: Order }) => {
  // The 'onUpdate' prop is removed for now, as real-time updates will handle refreshes.
  
  return (
        <div className="glass-card flex flex-col justify-between transition-all duration-200 cursor-pointer">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <p className="text-sm font-semibold text-slate-600">
            Order #{order.id.substring(0, 8).toUpperCase()}
          </p>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStageColor(order.currentStage)}`}>
            {order.currentStage.replace('_', ' ')}
          </span>
        </div>
        <p className="text-lg font-bold text-slate-800 mb-3">
          Customer: {order.customerPhone}
        </p>
        
        <ProductSummary products={order.products} />

        <div className="text-sm text-slate-500 space-y-1 mt-4 pt-4 border-t border-slate-200">
          <p><span className="font-medium">Branch:</span> {order.branch.name}</p>
          <p><span className="font-medium">Created:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
          {order.stageClaims[0] && (
            <p className="font-semibold text-brand">{`Claimed by: ${order.stageClaims[0].user.phone}`}</p>
          )}
        </div>
      </div>
      <div className="bg-slate-50 p-4 rounded-b-lg border-t border-slate-200">
        <Link
          to={`/orders/${order.id}`}
          className="block w-full text-center px-4 py-2 text-sm font-semibold text-white bg-brand rounded-md hover:bg-brand-dark transition-colors"
        >
          View Details & Claim
        </Link>
      </div>
    </div>
  );
};

export default OrderCard;