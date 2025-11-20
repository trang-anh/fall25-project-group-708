import './index.css';
import { useState } from 'react';
import useUserSearch from '../../../../hooks/useUserSearch';

/**
 * Interface representing the props for the UserHeader component.
 *
 * userCount - The number of users to be displayed in the header.
 * setUserFilter - A function that sets the search bar filter value.
 */
interface UserHeaderProps {
  userCount: number;
  setUserFilter: (search: string) => void;
}

type SortOption = 'newest' | 'oldest' | 'points';

/**
 * UsersListHeader component displays the header section for a list of users.
 * It includes the title, filter buttons, and search bar to filter users.
 *
 * @param userCount - The number of users displayed in the header.
 * @param setUserFilter - Function that sets the search bar filter value.
 */
const UsersListHeader = ({ userCount, setUserFilter }: UserHeaderProps) => {
  const { val, handleInputChange } = useUserSearch(setUserFilter);
  const [activeSort, setActiveSort] = useState<SortOption>('newest');

  const handleSortClick = (sort: SortOption) => {
    setActiveSort(sort);
  };

  return (
    <div className='users-list-header'>
      <div className='header-top'>
        <h2 className='users-count'>{userCount} users</h2>
        <div className='filter-buttons'>
          <button
            className={`filter-btn ${activeSort === 'newest' ? 'active' : ''}`}
            onClick={() => handleSortClick('newest')}>
            Newest
          </button>
          <button
            className={`filter-btn ${activeSort === 'oldest' ? 'active' : ''}`}
            onClick={() => handleSortClick('oldest')}>
            Oldest
          </button>
          <button
            className={`filter-btn ${activeSort === 'points' ? 'active' : ''}`}
            onClick={() => handleSortClick('points')}>
            Most Points
          </button>
        </div>
      </div>
      <div className='header-search'>
        <input
          id='user_search_bar'
          className='search-input'
          placeholder='Search usernames...'
          type='text'
          value={val}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
};

export default UsersListHeader;
