import React from 'react';
import './index.css';

/**
 * Props for a simple confirmation modal.
 * `open` controls visibility, and confirm/cancel trigger callbacks.
 */
interface ConfirmationModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reusable confirmation modal component.
 * Renders only when `open` is true.
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className='modal-overlay'>
      <div className='modal-box'>
        <h3>{title}</h3>
        <p>{message}</p>

        <div className='modal-buttons'>
          <button className='modal-cancel' onClick={onCancel}>
            Cancel
          </button>
          <button className='modal-confirm' onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
