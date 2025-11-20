import './index.css';

interface BadWordWarningModalProps {
  show: boolean;
  onClose: () => void;
  onPostAnyway: () => void;
  detectedIn: string[];
}

const BadWordWarningModal = ({
  show,
  onClose,
  onPostAnyway,
  detectedIn,
}: BadWordWarningModalProps) => {
  if (!show) return null;

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal-content bad-word-modal' onClick={e => e.stopPropagation()}>
        <div className='modal-header'>
          <h2>⚠️ Inappropriate Language Detected</h2>
        </div>

        <div className='modal-body'>
          <p>
            We detected potentially inappropriate language in your{' '}
            <strong>{detectedIn.join(', ')}</strong>.
          </p>

          <div className='warning-box'>
            <h3>If you continue posting:</h3>
            <ul>
              <li>❌ Inappropriate words will be automatically censored (replaced with ***)</li>
              <li>📉 You will lose reputation points (1 point per inappropriate word)</li>
              <li>⚠️ Repeated violations may affect your account standing</li>
            </ul>
          </div>

          <p className='recommendation'>
            <strong>We recommend</strong> editing your content to remove inappropriate language
            before posting.
          </p>
        </div>

        <div className='modal-footer'>
          <button className='btn-secondary' onClick={onClose}>
            Go Back and Edit
          </button>
          <button className='btn-warning' onClick={onPostAnyway}>
            Post Anyway (with penalties)
          </button>
        </div>
      </div>
    </div>
  );
};

export default BadWordWarningModal;
