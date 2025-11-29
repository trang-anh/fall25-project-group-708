import React from 'react';
import Avatar from '../../../avatar';
import { DatabaseMatchProfile } from '@fake-stack-overflow/shared';
import './index.css';

interface MatchedUserProfileHeaderProps {
  username: string;
  avatarUrl?: string;
  profile: DatabaseMatchProfile;
}

/**
 * MatchedUserProfileHeader - Displays matched user's profile in chat header
 * Shows avatar, username, programming languages, and collaboration style
 */
const MatchedUserProfileHeader: React.FC<MatchedUserProfileHeaderProps> = ({
  username,
  avatarUrl,
  profile,
}) => {
  // Get top 3 languages for display
  const languages = profile.programmingLanguage.slice(0, 3);
  const hasMoreLanguages = profile.programmingLanguage.length > 3;
  const additionalCount = profile.programmingLanguage.length - 3;

  return (
    <div className='matched-profile-header'>
      <Avatar username={username} avatarUrl={avatarUrl} size='medium' />

      <div className='matched-profile-info'>
        <h3>{username}</h3>

        {languages.length > 0 && (
          <div className='matched-profile-languages'>
            {languages.map((lang, idx) => (
              <span key={idx} className='language-badge'>
                {lang}
              </span>
            ))}
            {hasMoreLanguages && <span className='language-badge'>+{additionalCount}</span>}
          </div>
        )}

        {profile.onboardingAnswers?.personality && (
          <p className='matched-profile-collaboration'>{profile.onboardingAnswers.personality}</p>
        )}
      </div>
    </div>
  );
};

export default MatchedUserProfileHeader;
