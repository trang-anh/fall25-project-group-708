import './index.css';
import { SafeDatabaseUser } from '../../../../types/types';
import Avatar from '../../../avatar';

/**
 * Interface representing the props for the User component.
 *
 * user - The user object containing details about the user.
 * handleUserCardViewClickHandler - The function to handle the click event on the user card.
 */
interface UserProps {
  user: SafeDatabaseUser;
  handleUserCardViewClickHandler: (user: SafeDatabaseUser) => void;
}

/**
 * User component renders the details of a user including its username, points, and dateJoined.
 * Clicking on the component triggers the handleUserPage function.
 *
 * @param user - The user object containing user details.
 */
const UserCardView = (props: UserProps) => {
  const { user, handleUserCardViewClickHandler } = props;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className='user-card-grid' onClick={() => handleUserCardViewClickHandler(user)}>
      <div className='user-avatar-large'>
        <Avatar username={user.username} avatarUrl={user.avatarUrl} size='xlarge' showBorder />
      </div>

      <h3 className='user-name-large'>{user.username}</h3>
      <p className='user-join-date'>{formatDate(user.dateJoined)}</p>

      <div className='user-stats-grid'>
        <div className='stat-box'>
          <span className='stat-label-small'>Total Points</span>
          <span className='stat-value-large'>{user.totalPoints}</span>
        </div>
      </div>
    </div>
  );
};

export default UserCardView;
