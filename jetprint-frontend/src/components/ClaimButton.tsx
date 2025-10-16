import { useState } from 'react';
import api from '../services/api';

interface ClaimButtonProps {
  orderId: string;
  onClaimSuccess: () => void; // A callback to refresh the UI
}

const ClaimButton = ({ orderId, onClaimSuccess }: ClaimButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClaim = async () => {
    setIsLoading(true);
    setError('');
    try {
      await api.post('/claims', { orderId });
      onClaimSuccess();
    } catch (err) {
      console.error('Failed to claim order:', err);
      setError('Could not claim order.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClaim}
        disabled={isLoading}
        className="w-full px-4 py-2 mt-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-400"
      >
        {isLoading ? 'Claiming...' : 'Claim Order'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default ClaimButton;