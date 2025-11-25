import React from 'react';
import Toast from '../toast';
import { useToast } from '../../contexts/ToastContext';
import './index.css';

/**
 * GlobalToastContainer displays all toast notifications globally
 */
const GlobalToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className='global-toast-container'>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default GlobalToastContainer;
