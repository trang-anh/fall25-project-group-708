import { getMetaData } from '../../../tool';
import AnswerView from './answer';
import AnswerHeader from './header';
import { Comment } from '../../../types/types';
import './index.css';
import QuestionBody from './questionBody';
import VoteComponent from '../voteComponent';
import CommentSection from '../commentSection';
import useAnswerPage from '../../../hooks/useAnswerPage';
import useQuestionSuggestions from '../../../hooks/useQuestionSuggestions';
import QuestionSuggestion from '../newQuestion/QuestionSuggestion';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * AnswerPage component that displays the full content of a question along with its answers.
 * It also includes the functionality to vote, ask a new question, and post a new answer.
 */
const AnswerPage = () => {
  const { qid } = useParams();
  const { questionID, question, handleNewComment, handleNewAnswer } = useAnswerPage();
  // Fetch suggestions based on title and text input (limited to 5)
  const { suggestions, loading } = useQuestionSuggestions(
    question?.title ?? '',
    question?.text ?? '',
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [qid]);

  if (!question) {
    return null;
  }

  return (
    <>
      <VoteComponent question={question} />
      <AnswerHeader ansCount={question.answers.length} title={question.title} />
      <QuestionBody
        views={question.views.length}
        text={question.text}
        askby={question.askedBy}
        meta={getMetaData(new Date(question.askDateTime))}
      />
      <CommentSection
        comments={question.comments}
        handleAddComment={(comment: Comment) => handleNewComment(comment, 'question', questionID)}
      />
      {question.answers.map(a => (
        <AnswerView
          key={String(a._id)}
          text={a.text}
          ansBy={a.ansBy}
          meta={getMetaData(new Date(a.ansDateTime))}
          comments={a.comments}
          handleAddComment={(comment: Comment) =>
            handleNewComment(comment, 'answer', String(a._id))
          }
        />
      ))}
      <button
        className='bluebtn ansButton'
        onClick={() => {
          handleNewAnswer();
        }}>
        Answer Question
      </button>
      <QuestionSuggestion suggestions={suggestions} loading={loading} show={true} />
    </>
  );
};

export default AnswerPage;
