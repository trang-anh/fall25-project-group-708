import './index.css';
import { useNavigate } from 'react-router-dom';
import UserCardView from './userCard';
import UsersListHeader from './header';
import useUsersListPage from '../../../hooks/useUsersListPage';
import { SafeDatabaseUser } from '../../../types/types';

/**
 * Interface representing the props for the UsersListPage component.
 * handleUserSelect - The function to handle the click event on the user card.
 */
interface UserListPageProps {
  handleUserSelect?: (user: SafeDatabaseUser) => void;
  selectedUsers?: string[];
  currentUsername?: string;
}

/**
 * UsersListPage component renders a page displaying a list of users
 * based on search content filtering.
 * It includes a header with a search bar.
 */
const UsersListPage = (props: UserListPageProps) => {
  const { userList, setUserFilter } = useUsersListPage();
  const { handleUserSelect = null, currentUsername } = props;
  const navigate = useNavigate();

  /**
   * Handles the click event on the user card.
   * If handleUserSelect is provided, it calls the handleUserSelect function.
   * Otherwise, it navigates to the user's profile page.
   */
  const handleUserCardViewClickHandler = (user: SafeDatabaseUser): void => {
    if (handleUserSelect) {
      handleUserSelect(user);
    } else if (user.username) {
      navigate(`/user/${user.username}`);
    }
  };

  // Filter out current user from the list
  const filteredUsers = currentUsername
    ? userList.filter(user => user.username !== currentUsername)
    : userList;

  return (
    <div className='user-card-container'>
      <UsersListHeader userCount={filteredUsers.length} setUserFilter={setUserFilter} />
      <div className='users_list'>
        {filteredUsers.map(user => (
          <UserCardView
            user={user}
            key={user.username}
            handleUserCardViewClickHandler={handleUserCardViewClickHandler}
          />
        ))}
      </div>
      {(!filteredUsers.length || filteredUsers.length === 0) && (
        <div className='no-users-message'>No Users Found</div>
      )}
    </div>
  );
};

export default UsersListPage;
