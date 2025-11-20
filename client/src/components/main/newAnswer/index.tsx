import './index.css';
import Form from '../baseComponents/form';
import TextArea from '../baseComponents/textarea';
import useAnswerForm from '../../../hooks/useAnswerForm';
import BadWordWarningModal from '../badWordsWarningModal';

/**
 * NewAnswerPage component allows users to submit an answer to a specific question.
 */
const NewAnswerPage = () => {
  const {
    text,
    textErr,
    setText,
    postAnswer,
    showBadWordWarning,
    setShowBadWordWarning,
    badWordDetails,
  } = useAnswerForm();

  const handleCloseBadWordWarning = () => {
    setShowBadWordWarning(false);
  };

  const handlePostAnyway = () => {
    setShowBadWordWarning(false);
    postAnswer(true);
  };

  const handlePostQuestion = () => {
    //Check for badwords and show modal if needed
    postAnswer();
  };

  return (
    <Form>
      <TextArea
        title={'Answer Text'}
        id={'answerTextInput'}
        val={text}
        setState={setText}
        err={textErr}
      />

      <BadWordWarningModal
        show={showBadWordWarning}
        onClose={handleCloseBadWordWarning}
        onPostAnyway={handlePostAnyway}
        detectedIn={badWordDetails}
      />

      <h5>
        <i>Markdown formatting is supported.</i>
      </h5>
      <div className='btn_indicator_container'>
        <button className='form_postBtn' onClick={handlePostQuestion}>
          Post Answer
        </button>
        <div className='mandatory_indicator'>* indicates mandatory fields</div>
      </div>
    </Form>
  );
};

export default NewAnswerPage;
