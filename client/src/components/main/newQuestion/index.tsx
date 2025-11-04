import { useState, useEffect } from 'react';
import useNewQuestion from '../../../hooks/useNewQuestion';
import useQuestionSuggestions from '../../../hooks/useQuestionSuggestions';
import Form from '../baseComponents/form';
import Input from '../baseComponents/input';
import TextArea from '../baseComponents/textarea';
import QuestionSuggestion from './QuestionSuggestion';
import SimilarQuestionModal from './SimilarQuestionModal';
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
  const [showWarningModal, setShowWarningModal] = useState(false);
  
  // Fetch suggestions based on title and text input - this calls the backend
  const { suggestions, loading } = useQuestionSuggestions(title, text);

  // Control when to show suggestions based on backend results
  useEffect(() => {
    if (title.trim().length < 3) {
      setShowSuggestions(false);
      setManuallyClosedSuggestions(false);
      setAcknowledgedSuggestions(false);
      return;
    }

    const shouldShow = !manuallyClosedSuggestions && (loading || suggestions.length > 0);
    setShowSuggestions(shouldShow);
    
    // Reset acknowledgement when suggestions change
    if (suggestions.length > 0 && !manuallyClosedSuggestions) {
      setAcknowledgedSuggestions(false);
    }
  }, [suggestions, loading, title, manuallyClosedSuggestions]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setManuallyClosedSuggestions(false);
  };

  const handleCloseSuggestions = () => {
    if (acknowledgedSuggestions || suggestions.length === 0) {
      setShowSuggestions(false);
      setManuallyClosedSuggestions(true);
    }
  };

  const handleAcknowledgeSuggestions = (justification: string) => {
    setAcknowledgedSuggestions(true);
    setShowSuggestions(false);
    setManuallyClosedSuggestions(true);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <SimilarQuestionModal
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
        
        <QuestionSuggestion
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
          <button
            className='form_postBtn'
            onClick={handlePostQuestion}>
            Post Question
          </button>
          <div className='mandatory_indicator'>* indicates mandatory fields</div>
        </div>
      </Form>
    </>
  );
};

export default NewQuestionPage;