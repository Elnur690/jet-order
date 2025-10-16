import { useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const NotificationToast = () => {
  const { notifications, clearNotification } = useWebSocket();

  useEffect(() => {
    // Show toast for the latest notification
    if (notifications.length > 0) {
      const latest = notifications[0];
      
      const getIcon = () => {
        switch (latest.type) {
          case 'success':
            return <CheckCircle2 className="h-5 w-5" />;
          case 'error':
            return <AlertCircle className="h-5 w-5" />;
          case 'warning':
            return <AlertTriangle className="h-5 w-5" />;
          default:
            return <Info className="h-5 w-5" />;
        }
      };

      const toastContent = (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {getIcon()}
            <span className="font-medium">{latest.message}</span>
          </div>
          {latest.orderId && (
            <Link 
              to={`/orders/${latest.orderId}`}
              className="text-sm text-blue-600 hover:underline"
              onClick={() => clearNotification(latest.id)}
            >
              View Order →
            </Link>
          )}
        </div>
      );

      switch (latest.type) {
        case 'success':
          toast.success(toastContent, {
            duration: 5000,
            onDismiss: () => clearNotification(latest.id),
          });
          break;
        case 'error':
          toast.error(toastContent, {
            duration: 7000,
            onDismiss: () => clearNotification(latest.id),
          });
          break;
        case 'warning':
          toast.warning(toastContent, {
            duration: 10000,
            onDismiss: () => clearNotification(latest.id),
          });
          break;
        default:
          toast.info(toastContent, {
            duration: 5000,
            onDismiss: () => clearNotification(latest.id),
          });
      }
      
      // Clear the notification after showing
      setTimeout(() => clearNotification(latest.id), 100);
    }
  }, [notifications, clearNotification]);

  return null;
};

export default NotificationToast;
