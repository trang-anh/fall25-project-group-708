import { useState, useEffect } from 'react';
import useNewQuestion from '../../../hooks/useNewQuestion';
import useQuestionSuggestions from '../../../hooks/useQuestionSuggestions';
import { saveNotDuplicateQuestion } from '../../../services/notDuplicateQuestionService';
import Form from '../baseComponents/form';
import Input from '../baseComponents/input';
import TextArea from '../baseComponents/textarea';
import QuestionSuggestions from './QuestionSuggestion';
import SimilarQuestionsModal from './SimilarQuestionModal';
import './index.css';

/**
 * NewQuestionPage component allows users to submit a new question with a title,
 * description, tags, and username. It also displays suggestions for similar
 * existing questions as the user types the title.
 */
const NewQuestionPage = () => {
  const {
    title,
    setTitle,
    text,
    setText,
    tagNames,
    setTagNames,
    communityList,
    handleDropdownChange,
    titleErr,
    textErr,
    tagErr,
    postQuestion,
  } = useNewQuestion();

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [manuallyClosedSuggestions, setManuallyClosedSuggestions] = useState(false);
  const [acknowledgedSuggestions, setAcknowledgedSuggestions] = useState(false);
  const [similarQuestions, setSimilarQuestions] = useState<string[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Fetch suggestions based on title and text input
  const { suggestions, loading } = useQuestionSuggestions(title, text);

  // eslint-disable-next-line no-console
  console.log('NewQuestionPage - Current state:', {
    title,
    titleLength: title.length,
    showSuggestions,
    loading,
    suggestionsCount: suggestions.length,
    suggestions: suggestions.map(s => s.title),
  });

  // Show suggestions when they're available
  useEffect(() => {
    // Reset everything when title is too short
    if (title.trim().length < 3) {
      setShowSuggestions(false);
      setManuallyClosedSuggestions(false);
      setAcknowledgedSuggestions(false);
      setSimilarQuestions([]);
      return;
    }

    // Show suggestions if we're loading or have suggestions, and not manually closed
    const shouldShow = !manuallyClosedSuggestions && (loading || suggestions.length > 0);

    setShowSuggestions(shouldShow);

    // Reset acknowledgement when new suggestions appear
    if (suggestions.length > 0) {
      const newQuestionIds = suggestions.map(q => q._id);
      const hasNewSuggestions = JSON.stringify(newQuestionIds) !== JSON.stringify(similarQuestions);

      if (hasNewSuggestions) {
        console.log('New suggestions detected, resetting acknowledgement');
        setAcknowledgedSuggestions(false);
        setSimilarQuestions(newQuestionIds);
      }
    }
  }, [suggestions, loading, title, manuallyClosedSuggestions, similarQuestions]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Reset manual close flag when user starts typing again
    setManuallyClosedSuggestions(false);
  };

  const handleCloseSuggestions = () => {
    // Only allow closing if acknowledged or no suggestions
    if (acknowledgedSuggestions || suggestions.length === 0) {
      setShowSuggestions(false);
      setManuallyClosedSuggestions(true);
    }
  };

  const handleAcknowledgeSuggestions = async (justification: string) => {
    try {
      // Save the not duplicate question justification to backend
      if (similarQuestions.length > 0 && justification.trim()) {
        // Get username from localStorage or session
        const username = localStorage.getItem('username') || 'anonymous';

        const result = await saveNotDuplicateQuestion({
          questionTitle: title,
          questionText: text,
          similarQuestionIds: similarQuestions,
          justification: justification,
          username: username,
        });

        if (!result.success) {
          // eslint-disable-next-line no-console
          console.warn('Failed to save not duplicate question justification:', result.error);
        } else {
          // eslint-disable-next-line no-console
          console.log('Successfully saved not duplicate question justification');
        }
      }

      setAcknowledgedSuggestions(true);
      setShowSuggestions(false);
      setManuallyClosedSuggestions(true);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving not duplicate question:', error);
      // Still allow user to proceed even if saving fails
      setAcknowledgedSuggestions(true);
      setShowSuggestions(false);
      setManuallyClosedSuggestions(true);
    }
  };

  const handlePostQuestion = () => {
    // Check if there are unacknowledged suggestions
    if (suggestions.length > 0 && !acknowledgedSuggestions && title.trim().length >= 3) {
      setShowWarningModal(true);
      return;
    }

    postQuestion();
  };

  const handleCloseModal = () => {
    setShowWarningModal(false);
  };

  const handleReviewSuggestions = () => {
    setShowWarningModal(false);
    setShowSuggestions(true);
    setManuallyClosedSuggestions(false);

    // Scroll to suggestions section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <SimilarQuestionsModal
        show={showWarningModal}
        onClose={handleCloseModal}
        onReview={handleReviewSuggestions}
        suggestionCount={suggestions.length}
      />

      <Form>
        <Input
          title={'Question Title'}
          hint={'Limit title to 100 characters or less'}
          id={'formTitleInput'}
          val={title}
          setState={handleTitleChange}
          err={titleErr}
        />

        <QuestionSuggestions
          suggestions={suggestions}
          loading={loading}
          onClose={handleCloseSuggestions}
          onAcknowledge={handleAcknowledgeSuggestions}
          show={showSuggestions}
        />

        <TextArea
          title={'Question Text'}
          hint={'Add details'}
          id={'formTextInput'}
          val={text}
          setState={setText}
          err={textErr}
        />
        <h5>
          <i>Markdown formatting is supported.</i>
        </h5>
        <Input
          title={'Tags'}
          hint={'Add keywords separated by whitespace'}
          id={'formTagInput'}
          val={tagNames}
          setState={setTagNames}
          err={tagErr}
        />
        <div className='input_title'>Community</div>
        <select className='form_communitySelect' onChange={handleDropdownChange}>
          <option value=''>Select Community</option>
          {communityList.map(com => (
            <option key={com._id.toString()} value={com._id.toString()}>
              {com.name}
            </option>
          ))}
        </select>
        <div className='btn_indicator_container'>
          <button className='form_postBtn' onClick={handlePostQuestion}>
            Post Question
          </button>
          <div className='mandatory_indicator'>* indicates mandatory fields</div>
        </div>
      </Form>
    </>
  );
};

export default NewQuestionPage;
