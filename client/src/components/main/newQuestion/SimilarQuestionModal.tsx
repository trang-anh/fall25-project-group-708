import React from 'react';
import './SimilarQuestionModal.css';

interface SimilarQuestionsModalProps {
  show: boolean;
  onClose: () => void;
  onReview: () => void;
  suggestionCount: number;
}

/**
 * Modal that warns users about similar questions before posting
 */
const SimilarQuestionsModal: React.FC<SimilarQuestionsModalProps> = ({
  show,
  onClose,
  onReview,
  suggestionCount,
}) => {
  if (!show) {
    return null;
  }

  return (
    <>
      <div className="modal_overlay" onClick={onClose}></div>
      <div className="modal_container">
        <div className="modal_header">
          <div className="modal_icon_warning">⚠️</div>
          <h2 className="modal_title">Similar Questions Found</h2>
          <button
            className="modal_close_btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="modal_body">
          <p className="modal_message">
            We found <strong>{suggestionCount} similar question{suggestionCount > 1 ? 's' : ''}</strong> that 
            might already answer your question.
          </p>
          
          <div className="modal_info_box">
            <p className="modal_info_title">Before posting, please:</p>
            <ul className="modal_info_list">
              <li>Review the similar questions shown below the title field</li>
              <li>Check if any of them answer your question</li>
              <li>If your question is different, explain why in the justification box</li>
            </ul>
          </div>

          <p className="modal_help_text">
            This helps keep the community organized and prevents duplicate questions.
          </p>
        </div>

        <div className="modal_footer">
          <button
            className="modal_btn modal_btn_secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="modal_btn modal_btn_primary"
            onClick={onReview}
          >
            Review Similar Questions
          </button>
        </div>
      </div>
    </>
  );
};

export default SimilarQuestionsModal;