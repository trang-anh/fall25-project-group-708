import './index.css';
import FakeStackOverflowLogo from './Code2Date';
import { Link } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import DarkModeToggle from '../../darkModeToggle/DarkModeToggle';

// use environment variable or fallback to localhost
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Renders a login page Github login option
 */
const Login = () => {
  const {
    username,
    password,
    showPassword,
    err,
    requires2FA,
    twoFactorCode,
    twoFactorDevCode,
    isSendingTwoFactorCode,
    handleSubmit,
    handleInputChange,
    togglePasswordVisibility,
    handleRequestTwoFactorCode,
    cancelTwoFactorFlow,
    twoFactorOptIn,
    handleTwoFactorOptInChange,
    rememberDevice,
    handleRememberDeviceChange,
    twoFactorEmail,
    handleTwoFactorEmailChange,
  } = useAuth('login');

  /**
   * redirects to the GitHub OAuth authentication page
   */
  const handleGitHubLogin = () => {
    window.location.href = `${apiBaseUrl}/api/auth/github`;
  };

  return (
    <div className='container'>
      {/* Header */}
      <div className='login-header'>
        <Link to='/' className='back-button'>
          <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
            <path
              d='M8 0L6.59 1.41 12.17 7H0v2h12.17l-5.58 5.59L8 16l8-8z'
              transform='rotate(180 8 8)'
            />
          </svg>
          Back
        </Link>
        <Link to='/signup' className='create-account-link'>
          Create an account
        </Link>
        <DarkModeToggle />
      </div>

      {/* Main Content */}
      <div className='login-content'>
        <FakeStackOverflowLogo />
        <div className='login-wrapper'>
          {/* Left Column - Traditional Login */}
          <div className='login-form-section'>
            <h2 className='section-heading'>Log in</h2>
            <form onSubmit={handleSubmit}>
              <div className='form-group'>
                <label className='form-label' htmlFor='username-input'>
                  Username
                </label>
                <input
                  type='text'
                  value={username}
                  onChange={event => handleInputChange(event, 'username')}
                  placeholder=''
                  required
                  className='input-text'
                  id='username-input'
                  disabled={requires2FA}
                />
              </div>

              <div className='form-group'>
                <label className='form-label' htmlFor='password-input'>
                  Password
                </label>
                <div className='password-wrapper'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={event => handleInputChange(event, 'password')}
                    placeholder=''
                    required
                    className='input-text'
                    id='password-input'
                    disabled={requires2FA}
                  />
                  <button
                    type='button'
                    className='toggle-password'
                    onClick={togglePasswordVisibility}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className='twofactor-optin'>
                <input
                  type='checkbox'
                  id='twofactor-optin-checkbox'
                  checked={twoFactorOptIn}
                  onChange={event => handleTwoFactorOptInChange(event.target.checked)}
                  disabled={requires2FA}
                />
                <label htmlFor='twofactor-optin-checkbox'>Enable two-factor authentication</label>
              </div>

              {(twoFactorOptIn || requires2FA) && (
                <div className='form-group'>
                  <label className='form-label' htmlFor='twofactor-email-input'>
                    Email for verification
                  </label>
                  <input
                    type='email'
                    value={twoFactorEmail}
                    onChange={event => handleTwoFactorEmailChange(event.target.value)}
                    placeholder='name@example.com'
                    className='input-text'
                    id='twofactor-email-input'
                    required={twoFactorOptIn || requires2FA}
                  />
                </div>
              )}

              {twoFactorOptIn && !requires2FA && (
                <button
                  type='button'
                  className='secondary-button'
                  onClick={handleRequestTwoFactorCode}
                  disabled={isSendingTwoFactorCode}>
                  {isSendingTwoFactorCode ? 'Sending…' : 'Send verification code'}
                </button>
              )}

              <div className='remember-device'>
                <input
                  type='checkbox'
                  id='remember-device-checkbox'
                  checked={rememberDevice}
                  onChange={event => handleRememberDeviceChange(event.target.checked)}
                  disabled={requires2FA}
                />
                <label htmlFor='remember-device-checkbox'>Remember this device</label>
              </div>

              {requires2FA && (
                <>
                  <div className='form-group'>
                    <label className='form-label' htmlFor='twofactor-input'>
                      Verification code
                    </label>
                    <input
                      type='text'
                      inputMode='numeric'
                      pattern='[0-9]*'
                      value={twoFactorCode}
                      onChange={event => handleInputChange(event, 'twoFactor')}
                      placeholder='Enter 6-digit code'
                      className='input-text'
                      id='twofactor-input'
                      maxLength={6}
                    />
                    <p className='form-helper'>
                      Enter the 6-digit code we sent to your email.
                      {twoFactorDevCode && <span className='code-preview'> </span>}
                    </p>
                  </div>
                  <div className='twofactor-actions'>
                    <button
                      type='button'
                      className='secondary-button'
                      onClick={handleRequestTwoFactorCode}
                      disabled={isSendingTwoFactorCode}>
                      {isSendingTwoFactorCode ? 'Sending…' : 'Resend code'}
                    </button>
                    <button type='button' className='link-button' onClick={cancelTwoFactorFlow}>
                      Use different credentials
                    </button>
                  </div>
                </>
              )}

              <button type='submit' className='login-button'>
                {requires2FA ? 'Verify & Log in' : 'Log in'}
              </button>
            </form>
          </div>

          {/* Vertical Divider */}
          <div className='vertical-divider'>OR</div>

          {/* Right Column - GitHub Login */}
          <div className='social-login-section'>
            <button
              type='button'
              onClick={handleGitHubLogin}
              className='social-button'
              aria-label='Continue with GitHub'>
              <svg className='social-icon' viewBox='0 0 16 16' fill='currentColor'>
                <path d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z' />
              </svg>
              Continue with GitHub
            </button>
          </div>
        </div>

        {err && <p className='error-message'>{err}</p>}
      </div>

      {/* Footer */}
      <div className='login-footer'>
        <div className='footer-link'>Can't log in?</div>
        <div className='footer-text'>
          Secure Login with reCAPTCHA subject to Google{' '}
          <a href='https://policies.google.com/terms'>Terms</a> &{' '}
          <a href='https://policies.google.com/privacy'>Privacy</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
