import { useState, useEffect } from 'react';
import useNewQuestion from '../../../hooks/useNewQuestion';
import useQuestionSuggestions from '../../../hooks/useQuestionSuggestions';
import Form from '../baseComponents/form';
import Input from '../baseComponents/input';
import TextArea from '../baseComponents/textarea';
import QuestionSuggestion from './QuestionSuggestion';
import './index.css';
import BadWordWarningModal from '../badWordsWarningModal';

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
    showBadWordWarning,
    setShowBadWordWarning,
    badWordDetails,
  } = useNewQuestion();

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [justification, setJustification] = useState('');

  // Fetch suggestions based on title and text input (limited to 5)
  const { suggestions, loading } = useQuestionSuggestions(title, text);

  // Control when to show suggestions based on backend results
  useEffect(() => {
    if (title.trim().length < 3) {
      setShowSuggestions(false);
      return;
    }

    setShowSuggestions(loading || suggestions.length > 0);
  }, [suggestions, loading, title]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
  };

  const handlePostQuestion = async () => {
    // If there are suggestions and user provided justification, save it
    if (suggestions.length > 0 && justification.trim()) {
      postQuestion(false, {
        similarQuestions: suggestions,
        justification: justification.trim(),
      });
    } else {
      postQuestion();
    }
  };

  const handleCloseBadWordWarning = () => {
    setShowBadWordWarning(false);
  };

  const handlePostAnyway = () => {
    setShowBadWordWarning(false);
    postQuestion(true);
  };

  return (
    <>
      <BadWordWarningModal
        show={showBadWordWarning}
        onClose={handleCloseBadWordWarning}
        data-testid='bad-word-modal'
        onPostAnyway={handlePostAnyway}
        detectedIn={badWordDetails}
      />

      <Form>
        <Input
          title={'Question Title'}
          hint={'Limit title to 100 characters or less'}
          id={'formTitleInput'}
          data-testid='question-title'
          val={title}
          setState={handleTitleChange}
          err={titleErr}
        />

        <QuestionSuggestion suggestions={suggestions} loading={loading} show={showSuggestions} />

        <TextArea
          title={'Question Text'}
          hint={'Add details'}
          id={'formTextInput'}
          data-testid='question-text'
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
          data-testid='question-tags'
          val={tagNames}
          setState={setTagNames}
          err={tagErr}
        />

        {suggestions.length > 0 && (
          <div className='justification_section'>
            <label htmlFor='justification' className='input_title'>
              Why is your question different? (Optional)
            </label>
            <textarea
              id='justification'
              className='justification_field'
              data-testid='justification'
              value={justification}
              onChange={e => setJustification(e.target.value)}
              placeholder="E.g., I'm asking about a different framework, version, or specific use case..."
              rows={3}
            />
          </div>
        )}

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
            onClick={handlePostQuestion}
            data-testid='post-question-btn'>
            Post Question
          </button>
          <div className='mandatory_indicator'>* indicates mandatory fields</div>
        </div>
      </Form>
    </>
  );
};

export default NewQuestionPage;
