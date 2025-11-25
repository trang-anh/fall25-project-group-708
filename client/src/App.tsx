import { useEffect, useState } from 'react';
import { FakeSOSocket } from './types/types';
import { BrowserRouter as Router } from 'react-router-dom';
import { io } from 'socket.io-client';
import FakeStackOverflow from './components/fakestackoverflow';
import GlobalToastContainer from './components/globalToastContainer';
import './styles/theme.css';
import { ToastProvider } from './contexts/ToastContext';

// ensures that the socket connections work properly in production as well.
const SERVER_URL: string | undefined = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

const App = () => {
  const [socket, setSocket] = useState<FakeSOSocket | null>(null);

  useEffect(() => {
    if (!socket) {
      setSocket(
        io(SERVER_URL, {
          path: '/socket.io',
          withCredentials: true,
        }),
      );
    }

    return () => {
      if (socket !== null) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <ToastProvider>
      <Router>
        <GlobalToastContainer />
        <FakeStackOverflow socket={socket} />
      </Router>
    </ToastProvider>
  );
};

export default App;
