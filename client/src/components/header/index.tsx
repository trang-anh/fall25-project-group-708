import { useNavigate } from 'react-router-dom';
import useHeader from '../../hooks/useHeader';
import './index.css';
import FakeStackOverflowLogo from './Code2Date';
import useUserContext from '../../hooks/useUserContext';
import DarkModeToggle from '../darkModeToggle/DarkModeToggle';

/**
 * Header component that renders the main title/logo, search bar, and user actions.
 * The search bar allows the user to input a query and navigate to the search results page
 * when they press Enter.
 */
const Header = () => {
  const { val, handleInputChange, handleKeyDown, handleSignOut } = useHeader();
  const { user: currentUser } = useUserContext();
  const navigate = useNavigate();

  return (
    <div id='header' className='header'>
      <FakeStackOverflowLogo />

      <div className='header-right'>
        <div className='search-container'>
          <span className='search-icon'>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' />
            </svg>
          </span>
          <input
            id='searchBar'
            placeholder='Search'
            type='text'
            value={val}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className='header-buttons'>
          <DarkModeToggle />
          <button
            className='view-profile-button'
            onClick={() => navigate(`/user/${currentUser.username}`)}>
            View Profile
          </button>
          <button onClick={handleSignOut} className='logout-button'>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
