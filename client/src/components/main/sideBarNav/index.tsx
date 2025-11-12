import { useState, useEffect } from 'react';
import './index.css';
import { NavLink, useLocation } from 'react-router-dom';
import useUserContext from '../../../hooks/useUserContext';
import Avatar from '../../avatar';

/**
 * Sidebar navigation with user profile, hierarchical menu,
 * messages section, and call-to-action area.
 */
const SideBarNav = () => {
  const { user } = useUserContext();
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const location = useLocation();

  // Auto-expand messaging options if on a messaging route
  useEffect(() => {
    if (location.pathname.startsWith('/messaging')) {
      setShowOptions(true);
    }
  }, [location.pathname]);

  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  return (
    <div id='sideBarNav' className='sideBarNav'>
      {/* User Profile Section */}
      <div className='user-profile'>
        <div className='user-avatar'>
          <Avatar username={user.username} avatarUrl={user.avatarUrl} size='medium' />
        </div>
        <div className='user-info'>
          <div className='user-role'>User</div>
          <div className='user-name'>{user.username}</div>
        </div>
        <button className='user-settings' aria-label='Settings'>
          <svg width='16' height='16' viewBox='0 0 24 24' fill='rgba(0,0,0,0.5)'>
            <path d='M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z' />
          </svg>
        </button>
      </div>

      {/* Main Section */}
      <div className='sidebar-section-header'>MAIN</div>

      <NavLink
        to='/home'
        id='menu_questions'
        className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}
        onClick={location.pathname === '/home' ? toggleOptions : undefined}>
        <span className='menu-icon'>
          <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' />
          </svg>
        </span>
        Questions
      </NavLink>

      <NavLink
        to='/tags'
        id='menu_tag'
        className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
        <span className='menu-icon'>
          <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z' />
          </svg>
        </span>
        Tags
      </NavLink>

      <NavLink
        to='/users'
        id='menu_users'
        className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
        <span className='menu-icon'>
          <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' />
          </svg>
        </span>
        Users
      </NavLink>

      <NavLink
        to='/partners'
        id='menu_partners'
        className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
        <span className='menu-icon'>
          <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
          </svg>
        </span>
        Find Partners
      </NavLink>

      <NavLink
        to='/games'
        id='menu_games'
        className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
        <span className='menu-icon'>
          <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z' />
          </svg>
        </span>
        Games
      </NavLink>

      <NavLink
        to='/communities'
        id='menu_communities'
        className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
        <span className='menu-icon'>
          <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' />
          </svg>
        </span>
        Communities
      </NavLink>

      <NavLink
        to={`/collections/${user.username}`}
        id='menu_collections'
        className={({ isActive }) => `menu_button ${isActive ? 'menu_selected' : ''}`}>
        <span className='menu-icon'>
          <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z' />
          </svg>
        </span>
        My Collections
      </NavLink>

      {/* Messages Section */}
      <div className='messages-section'>
        <div className='messages-header'>
          <div className='sidebar-section-header' style={{ padding: 0, margin: 0 }}>
            MESSAGES
          </div>
          <button className='add-message-btn' aria-label='Add message'>
            +
          </button>
        </div>

        <NavLink to='/messaging' className='message-user-item'>
          <div className='message-user-avatar'>💬</div>
          <div className='message-user-name'>Global Chat</div>
        </NavLink>

        <NavLink to='/messaging/direct-message' className='message-user-item'>
          <div className='message-user-avatar'>💭</div>
          <div className='message-user-name'>Direct Messages</div>
        </NavLink>
      </div>
    </div>
  );
};

export default SideBarNav;
