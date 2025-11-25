import './index.css';
import { Link } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import Code2DateLogo from './Code2Date';

/**
 * Renders a signup form with username, password, and password confirmation inputs,
 * password visibility toggle, error handling, and a link to the login page.
 * Includes theme-adaptive logo and modern card-based design.
 */
const Signup = () => {
  const {
    username,
    password,
    passwordConfirmation,
    showPassword,
    err,
    handleSubmit,
    handleInputChange,
    togglePasswordVisibility,
    twoFactorOptIn,
    handleTwoFactorOptInChange,
  } = useAuth('signup');

  return (
    <div className='container'>
      {/* Logo Section */}
      <div className='logo-section'>
        <Code2DateLogo width={200} height={50} />
      </div>

      {/* Signup Card */}
      <div className='signup-card'>
        <h2>Create Your Account</h2>
        <h3>Join the community and start asking questions</h3>

        <form onSubmit={handleSubmit}>
          <div>
            <h4>Username</h4>
            <input
              type='text'
              value={username}
              onChange={event => handleInputChange(event, 'username')}
              placeholder='Choose a username'
              required
              className='input-text'
              id='username-input'
            />
          </div>

          <div>
            <h4>Password</h4>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={event => handleInputChange(event, 'password')}
              placeholder='Create a password'
              required
              className='input-text'
              id='password-input'
            />
          </div>

          <div>
            <h4>Confirm Password</h4>
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordConfirmation}
              onChange={e => handleInputChange(e, 'confirmPassword')}
              placeholder='Re-enter your password'
              required
              className='input-text'
            />
          </div>

          <div className='show-password'>
            <input
              type='checkbox'
              id='showPasswordToggle'
              checked={showPassword}
              onChange={togglePasswordVisibility}
            />
            <label htmlFor='showPasswordToggle'>Show password</label>
          </div>

          <div className='twofactor-optin'>
            <input
              type='checkbox'
              id='signupTwoFactor'
              checked={twoFactorOptIn}
              onChange={event => handleTwoFactorOptInChange(event.target.checked)}
            />
            <label htmlFor='signupTwoFactor'>
              Enable two-factor authentication for extra security
            </label>
          </div>

          <button type='submit' className='login-button'>
            Create Account
          </button>
        </form>

        {err && <p className='error-message'>{err}</p>}

        <div className='link-container'>
          <Link to='/' className='login-link'>
            Already have an account? Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
