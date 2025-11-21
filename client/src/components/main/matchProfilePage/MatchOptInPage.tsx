import React from 'react';
import { useNavigate } from 'react-router-dom';
import useUserContext from '../../../hooks/useUserContext';
import './MatchOptInPage.css';

const MatchOptInPage: React.FC = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();

  const handleJoinClick = () => {
    navigate('/match-onboarding');
  };

  const handleMaybeLaterClick = () => {
    navigate('/');
  };

  if (!user || !user._id) {
    return (
      <div className='match-opt-in-page'>
        <div className='opt-in-container'>
          <h2>Please log in to continue</h2>
          <p>You need to be logged in to access partner matching features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='match-opt-in-page'>
      <div className='opt-in-container'>
        <div className='opt-in-header'>
          <h1>Find Your Perfect Coding Partner</h1>
          <p className='tagline'>
            Connect with developers who share your interests, goals, and programming style
          </p>
        </div>

        <div className='feature-benefits'>
          <div className='benefit-item'>
            <h3>Goal-Aligned Partners</h3>
            <p>Match with developers who have similar coding goals and project interests</p>
          </div>

          <div className='benefit-item'>
            <h3>Skill Compatibility</h3>
            <p>Find partners at your skill level or learn from more experienced developers</p>
          </div>

          <div className='benefit-item'>
            <h3>Build Together</h3>
            <p>Collaborate on projects, share knowledge, and grow your network</p>
          </div>

          <div className='benefit-item'>
            <h3>Smart Matching</h3>
            <p>Our algorithm finds partners based on programming languages, location, and style</p>
          </div>
        </div>

        <div className='opt-in-process'>
          <h3>How It Works</h3>
          <div className='process-steps'>
            <div className='step'>
              <div className='step-number'>1</div>
              <div className='step-content'>
                <h4>Complete Your Profile</h4>
                <p>Tell us about your skills, goals, and what you're looking for</p>
              </div>
            </div>
            <div className='step'>
              <div className='step-number'>2</div>
              <div className='step-content'>
                <h4>Discover Partners</h4>
                <p>Browse profiles and see compatibility scores</p>
              </div>
            </div>
            <div className='step'>
              <div className='step-number'>3</div>
              <div className='step-content'>
                <h4>Connect & Collaborate</h4>
                <p>Send requests, start conversations, and build amazing projects</p>
              </div>
            </div>
          </div>
        </div>

        <div className='opt-in-actions'>
          <button onClick={handleJoinClick} className='join-btn'>
            Get Started
          </button>
          <button onClick={handleMaybeLaterClick} className='later-btn'>
            Maybe Later
          </button>
        </div>

        <div className='opt-in-privacy'>
          <p>Your information is private and only shared with matched partners you approve</p>
        </div>
      </div>
    </div>
  );
};

export default MatchOptInPage;
