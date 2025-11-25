import React from 'react';
import Avatar from '../../../avatar';
import { DatabaseMatchProfile } from '@fake-stack-overflow/shared';
import './index.css';

interface MatchedUserProfileHeaderProps {
  username: string;
  avatarUrl?: string;
  profile: DatabaseMatchProfile;
}

const MatchedUserProfileHeader: React.FC<MatchedUserProfileHeaderProps> = ({
  username,
  avatarUrl,
  profile,
}) => {
  const languages = profile.programmingLanguage.slice(0, 3);

  return (
    <div className='matched-profile-header'>
      <Avatar username={username} avatarUrl={avatarUrl} size='medium' />

      <div className='matched-profile-info'>
        <h3>{username}</h3>

        <p className='matched-profile-languages'>
          {languages.length > 0 ? languages.join(', ') : 'No languages listed'}
        </p>

        <p className='matched-profile-collaboration'>
          Collaboration style: {profile.onboardingAnswers?.personality || 'Unknown'}
        </p>
      </div>
    </div>
  );
};

export default MatchedUserProfileHeader;
