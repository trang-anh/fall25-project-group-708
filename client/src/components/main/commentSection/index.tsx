import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getMetaData } from '../../../tool';
import { Comment, DatabaseComment } from '../../../types/types';
import './index.css';
import useUserContext from '../../../hooks/useUserContext';
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';
import BadWordWarningModal from '../badWordsWarningModal';

// Create matcher with English dataset
const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

/**
 * Interface representing the props for the Comment Section component.
 *
 * - comments - list of the comment components
 * - handleAddComment - a function that handles adding a new comment, taking a Comment object as an argument
 */
interface CommentSectionProps {
  comments: DatabaseComment[];
  handleAddComment: (comment: Comment) => void;
}

/**
 * CommentSection component shows the users all the comments and allows the users add more comments.
 *
 * @param comments: an array of Comment objects
 * @param handleAddComment: function to handle the addition of a new comment
 */
const CommentSection = ({ comments, handleAddComment }: CommentSectionProps) => {
  const { user } = useUserContext();
  const [text, setText] = useState<string>('');
  const [textErr, setTextErr] = useState<string>('');
  const [showComments, setShowComments] = useState<boolean>(false);

  // state for bad word detection
  const [showBadWordWarning, setShowBadWordWarning] = useState<boolean>(false);
  const [badWordDetails, setBadWordDetails] = useState<string[]>([]);

  const checkForBadWords = (): boolean => {
    const detectedIn: string[] = [];

    if (text && matcher.hasMatch(text)) {
      detectedIn.push('answer text');
    }

    if (detectedIn.length > 0) {
      setBadWordDetails(detectedIn);
      return true;
    }
    return false;
  };

  /**
   * Function to handle the addition of a new comment.
   */
  const handleAddCommentClick = (forcePost = false) => {
    if (text.trim() === '' || user.username.trim() === '') {
      setTextErr(text.trim() === '' ? 'Comment text cannot be empty' : '');
      return;
    }

    const newComment: Comment = {
      text,
      commentBy: user.username,
      commentDateTime: new Date(),
    };

    // Check for bad words if not force posting
    if (!forcePost && checkForBadWords()) {
      setShowBadWordWarning(true);
      return;
    }

    handleAddComment(newComment);
    setText('');
    setTextErr('');
  };

  /**
   * Handle closing the bad word warning modal
   */
  const handleCloseBadWordWarning = () => {
    setShowBadWordWarning(false);
    setBadWordDetails([]);
  };

  /**
   * Handle posting the comment anyway despite bad words
   */
  const handlePostAnyway = () => {
    setShowBadWordWarning(false);
    handleAddCommentClick(true);
  };

  return (
    <div className='comment-section'>
      <BadWordWarningModal
        show={showBadWordWarning}
        onClose={handleCloseBadWordWarning}
        onPostAnyway={handlePostAnyway}
        detectedIn={badWordDetails}
      />

      <button className='toggle-button' onClick={() => setShowComments(!showComments)}>
        {showComments ? 'Hide Comments' : 'Show Comments'}
      </button>

      {showComments && (
        <div className='comments-container'>
          <ul className='comments-list'>
            {comments.length > 0 ? (
              comments.map(comment => (
                <li key={String(comment._id)} className='comment-item'>
                  <div className='comment-text'>
                    <Markdown remarkPlugins={[remarkGfm]}>{comment.text}</Markdown>
                  </div>
                  <small className='comment-meta'>
                    {comment.commentBy}, {getMetaData(new Date(comment.commentDateTime))}
                  </small>
                </li>
              ))
            ) : (
              <p className='no-comments'>No comments yet.</p>
            )}
          </ul>

          <div className='add-comment'>
            <div className='input-row'>
              <textarea
                placeholder='Comment'
                value={text}
                onChange={e => setText(e.target.value)}
                className='comment-textarea'
              />
              <button className='add-comment-button' onClick={() => handleAddCommentClick(false)}>
                Add Comment
              </button>
            </div>
            {textErr && <small className='error'>{textErr}</small>}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
