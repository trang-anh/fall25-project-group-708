import React from 'react';
import { PopulatedDatabaseQuestion } from '@fake-stack-overflow/shared';
import './index.css';

interface QuestionSuggestionsProps {
  suggestions: PopulatedDatabaseQuestion[];
  loading: boolean;
  show: boolean;
}

/**
 * QuestionSuggestions component displays similar questions
 * based on the user's input in the question title field.
 */
const QuestionSuggestions: React.FC<QuestionSuggestionsProps> = ({
  suggestions,
  loading,
  show,
}) => {
  if (!show) {
    return null;
  }

  if (loading) {
    return (
      <div className='similar_posts_section'>
        <div className='similar_posts_loading'>
          <div className='loading_spinner'></div>
          <span>Searching for similar questions...</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  // Strip HTML tags from text for preview
  const stripHtml = (html: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleQuestionClick = (questionId: string) => {
    window.open(`/question/${questionId}`, '_blank');
  };

  return (
    <div className='similar_posts_section'>
      <div className='similar_posts_header'>
        <div className='similar_posts_title'>Posts that may be similar</div>
        <div className='similar_posts_subtitle'>clicking opens the post in a new tab</div>
      </div>

      <div className='similar_posts_list'>
        {suggestions.map(question => (
          <div key={question._id.toString()} className='similar_post_item'>
            <a
              href={`/question/${question._id.toString()}`}
              target='_blank'
              rel='noopener noreferrer'
              className='similar_post_link'
              onClick={e => {
                e.preventDefault();
                handleQuestionClick(question._id.toString());
              }}>
              {question.title}
            </a>
            <div className='similar_post_preview'>
              {question.askedBy}: {stripHtml(question.text).substring(0, 200)}
              {stripHtml(question.text).length > 200 ? '...' : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionSuggestions;
