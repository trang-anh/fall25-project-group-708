import './index.css';
import { useNavigate } from 'react-router-dom';
import UserCardView from './userCard';
import UsersListHeader, { SortOption } from './header';
import useUsersListPage from '../../../hooks/useUsersListPage';
import { SafeDatabaseUser } from '../../../types/types';
import { useMemo, useState } from 'react';

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
  const [sortOption, setSortOption] = useState<SortOption>('newest');
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
  const filteredAndSortedUsers = useMemo(() => {
    // ADDED: useMemo for performance
    const filtered = currentUsername
      ? userList.filter(user => user.username !== currentUsername)
      : userList;

    // ADDED: Sort the filtered users based on the sort option
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.dateJoined).getTime() - new Date(a.dateJoined).getTime();
        case 'oldest':
          return new Date(a.dateJoined).getTime() - new Date(b.dateJoined).getTime();
        case 'points':
          return (b.totalPoints || 0) - (a.totalPoints || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [userList, currentUsername, sortOption]); // ADDED: Dependencies for useMemo

  return (
    <div className='user-card-container'>
      <UsersListHeader
        userCount={filteredAndSortedUsers.length}
        setUserFilter={setUserFilter}
        setUserSort={setSortOption}
      />
      <div className='users_list'>
        {filteredAndSortedUsers.map(user => (
          <UserCardView
            user={user}
            key={user.username}
            handleUserCardViewClickHandler={handleUserCardViewClickHandler}
          />
        ))}
      </div>
      {(!filteredAndSortedUsers.length || filteredAndSortedUsers.length === 0) && (
        <div className='no-users-message'>No Users Found</div>
      )}
    </div>
  );
};

export default UsersListPage;
