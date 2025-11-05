import { JSX, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout';
import Login from './auth/login';
import { FakeSOSocket, SafeDatabaseUser } from '../types/types';
import LoginContext from '../contexts/LoginContext';
import UserContext from '../contexts/UserContext';
import QuestionPage from './main/questionPage';
import TagPage from './main/tagPage';
import NewQuestionPage from './main/newQuestion';
import NewAnswerPage from './main/newAnswer';
import AnswerPage from './main/answerPage';
import MessagingPage from './main/messagingPage';
import DirectMessage from './main/directMessage';
import Signup from './auth/signup';
import UsersListPage from './main/usersListPage';
import ProfileSettings from './profileSettings';
import AllGamesPage from './main/games/allGamesPage';
import GamePage from './main/games/gamePage';
import AllCommunitiesPage from './main/communities/allCommunitiesPage';
import NewCommunityPage from './main/communities/newCommunityPage';
import CommunityPage from './main/communities/communityPage';
import AllCollectionsPage from './main/collections/allCollectionsPage';
import CollectionPage from './main/collections/collectionPage';
import NewCollectionPage from './main/collections/newCollectionPage';
import { getUserByUsername } from '../services/userService';

const ProtectedRoute = ({
  user,
  socket,
  isProcessingOAuth,
  children,
}: {
  user: SafeDatabaseUser | null;
  socket: FakeSOSocket | null;
  isProcessingOAuth: boolean;
  children: JSX.Element;
}) => {
  if (isProcessingOAuth) {
    return <div>Processing login...</div>;
  }

  if (!user || !socket) {
    return <Navigate to='/' />;
  }

  return <UserContext.Provider value={{ user, socket }}>{children}</UserContext.Provider>;
};

/**
 * Represents the main component of the application.
 * It manages the state for search terms and the main title.
 */
const FakeStackOverflow = ({ socket }: { socket: FakeSOSocket | null }) => {
  // Check for OAuth callback params during initialization
  const urlParams = new URLSearchParams(window.location.search);
  const hasOAuthParams = !!(urlParams.get('username') || urlParams.get('githubId'));

  const [user, setUser] = useState<SafeDatabaseUser | null>(null);
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(hasOAuthParams);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const currentUrlParams = new URLSearchParams(window.location.search);
      const username = currentUrlParams.get('username');
      const githubId = currentUrlParams.get('githubId');

      if (isProcessingOAuth && !username && !githubId) {
        setIsProcessingOAuth(false);
        return;
      }

      if ((username || githubId) && !user && isProcessingOAuth) {
        try {
          if (username) {
            const userData = await getUserByUsername(username);
            setUser(userData);
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch (error) {
          window.history.replaceState({}, '', window.location.pathname);
        } finally {
          setIsProcessingOAuth(false);
        }
      }
    };

    if (isProcessingOAuth) {
      handleOAuthCallback();
    }
  }, [user, isProcessingOAuth]);

  return (
    <LoginContext.Provider value={{ setUser }}>
      <Routes>
        {/* Public Route */}
        <Route path='/' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        {/* Protected Routes */}
        {
          <Route
            element={
              <ProtectedRoute user={user} socket={socket} isProcessingOAuth={isProcessingOAuth}>
                <Layout />
              </ProtectedRoute>
            }>
            <Route path='/home' element={<QuestionPage />} />
            <Route path='tags' element={<TagPage />} />
            <Route path='/messaging' element={<MessagingPage />} />
            <Route path='/messaging/direct-message' element={<DirectMessage />} />
            <Route path='/question/:qid' element={<AnswerPage />} />
            <Route path='/new/question' element={<NewQuestionPage />} />
            <Route path='/new/answer/:qid' element={<NewAnswerPage />} />
            <Route path='/users' element={<UsersListPage />} />
            <Route path='/user/:username' element={<ProfileSettings />} />
            <Route path='/new/collection' element={<NewCollectionPage />} />
            <Route path='/collections/:username' element={<AllCollectionsPage />} />
            <Route path='/collections/:username/:collectionId' element={<CollectionPage />} />
            <Route path='/games' element={<AllGamesPage />} />
            <Route path='/games/:gameID' element={<GamePage />} />
            <Route path='/communities' element={<AllCommunitiesPage />} />
            <Route path='/new/community' element={<NewCommunityPage />} />
            <Route path='/communities/:communityID' element={<CommunityPage />} />
          </Route>
        }
      </Routes>
    </LoginContext.Provider>
  );
};

export default FakeStackOverflow;
