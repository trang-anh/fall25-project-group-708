import * as React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './index.css';
import useProfileSettings from '../../hooks/useProfileSettings';
import {
  uploadAvatar,
  deleteAvatar,
  validateImageFile,
  getAvatarUrl,
} from '../../services/avatarService';

const ProfileSettings: React.FC = () => {
  const {
    userData,
    loading,
    editBioMode,
    newBio,
    newPassword,
    confirmNewPassword,
    successMessage,
    errorMessage,
    showConfirmation,
    pendingAction,
    canEditProfile,
    showPassword,
    togglePasswordVisibility,
    setEditBioMode,
    setNewBio,
    setNewPassword,
    setConfirmNewPassword,
    setShowConfirmation,
    handleResetPassword,
    handleUpdateBiography,
    handleDeleteUser,
    handleViewCollectionsPage,
    updateUserData,
    twoFactorEnabled,
    twoFactorCodeInput,
    setTwoFactorCodeInput,
    twoFactorDevCode,
    isTwoFactorLoading,
    showTwoFactorSetup,
    twoFactorEmail,
    setTwoFactorEmail,
    handleTwoFactorToggle,
    confirmTwoFactorSetup,
    cancelTwoFactorSetup,
    beginTwoFactorSetup,
    sessionOverview,
    sessionsLoading,
    sessionsError,
    revokingSessionId,
    handleRevokeSession,
    refreshSessions,
  } = useProfileSettings();

  const [selectedAvatar, setSelectedAvatar] = React.useState<string | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarLoading, setAvatarLoading] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const twoFactorSwitchChecked = twoFactorEnabled || showTwoFactorSetup;

  const handleBadge = (points: number): string => {
    if (points >= 10000) return 'Legendary';
    if (points >= 5000) return 'Epic';
    if (points >= 2500) return 'Master';
    if (points >= 1000) return 'Expert';
    if (points >= 500) return 'Pro';
    if (points >= 250) return 'Advanced';
    if (points >= 100) return 'Intermediate';
    if (points >= 50) return 'Contributor';
    if (points >= 10) return 'Beginner';
    return 'Newcomer';
  };

  const handleTwoFactorCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    if (checked) {
      if (!twoFactorEnabled) {
        handleTwoFactorToggle(true);
      }
    } else {
      if (twoFactorEnabled) {
        handleTwoFactorToggle(false);
      } else if (showTwoFactorSetup) {
        cancelTwoFactorSetup();
      }
    }
  };

  const handleTwoFactorInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 6);
    setTwoFactorCodeInput(digitsOnly);
  };

  const handleTwoFactorEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTwoFactorEmail(event.target.value);
  };

  const handleResendTwoFactorCode = () => {
    if (!isTwoFactorLoading) {
      beginTwoFactorSetup();
    }
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) {
      return 'Unknown';
    }

    return new Date(timestamp).toLocaleString();
  };

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setAvatarError(validation.error || 'Invalid file');
      return;
    }

    setAvatarError('');
    setAvatarFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Handle avatar upload - FIXED VERSION
  const handleAvatarUpload = async () => {
    if (!avatarFile || !userData?.username) return;

    setAvatarLoading(true);
    setAvatarError('');

    try {
      const result = await uploadAvatar(userData.username, avatarFile);

      // Update user data properly - keep all fields, only change avatarUrl
      updateUserData({
        ...userData,
        avatarUrl: result.avatarUrl,
      });

      // Reset upload state
      setAvatarFile(null);
      setSelectedAvatar(null);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  // Handle avatar deletion - FIXED VERSION
  const handleAvatarDelete = async () => {
    if (!userData?.username) return;

    if (!window.confirm('Are you sure you want to delete your avatar?')) return;

    setAvatarLoading(true);
    setAvatarError('');

    try {
      await deleteAvatar(userData.username);

      // Update user data properly - keep all fields, only clear avatarUrl
      updateUserData({
        ...userData,
        avatarUrl: '',
      });
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Failed to delete avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  // Cancel avatar selection
  const handleCancelAvatar = () => {
    setSelectedAvatar(null);
    setAvatarFile(null);
    setAvatarError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className='profile-settings'>
        <div className='profile-card'>
          <h2>Loading user data...</h2>
        </div>
      </div>
    );
  }

  const displayAvatar = selectedAvatar || getAvatarUrl(userData?.avatarUrl);

  return (
    <div className='profile-settings'>
      <div className='profile-card'>
        <div className='profile-header'>
          <h2>Profile Settings</h2>
          <button className='close-button' onClick={() => window.history.back()}>
            ×
          </button>
        </div>

        {successMessage && <p className='success-message'>{successMessage}</p>}
        {errorMessage && <p className='error-message'>{errorMessage}</p>}
        {avatarError && <p className='error-message'>{avatarError}</p>}

        {userData ? (
          <>
            {/* Profile Picture Section */}
            <div className='profile-picture-section'>
              <div className='profile-avatar'>
                {displayAvatar ? (
                  <img src={displayAvatar} alt={userData.username} className='avatar-image' />
                ) : (
                  <div className='avatar-circle'>{userData.username?.charAt(0).toUpperCase()}</div>
                )}
                {canEditProfile && !avatarLoading && (
                  <button className='edit-avatar-button' onClick={handleAvatarClick}>
                    <svg width='16' height='16' viewBox='0 0 16 16' fill='none'>
                      <path
                        d='M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L4.99967 13.6667L1.33301 14.6667L2.33301 11L11.333 2.00004Z'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  </button>
                )}
                {avatarLoading && (
                  <div className='avatar-loading-overlay'>
                    <div className='spinner'></div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/jpeg,image/jpg,image/png,image/gif,image/webp'
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </div>
              <div className='profile-email'>{userData.username}</div>

              {avatarFile && !avatarLoading && (
                <div className='avatar-upload-actions'>
                  <button className='button button-primary' onClick={handleAvatarUpload}>
                    Upload Avatar
                  </button>
                  <button className='button button-secondary' onClick={handleCancelAvatar}>
                    Cancel
                  </button>
                </div>
              )}

              {userData.avatarUrl && !avatarFile && canEditProfile && !avatarLoading && (
                <button
                  className='button button-danger button-small'
                  onClick={handleAvatarDelete}
                  style={{ marginTop: '0.5rem' }}>
                  Remove Avatar
                </button>
              )}
            </div>

            {/* Profile Information Rows */}
            <div className='profile-info-section'>
              <div className='info-row'>
                <label className='info-label'>Username</label>
                <div className='info-value'>{userData.username}</div>
              </div>

              <div className='info-row'>
                <label className='info-label'>Badge</label>
                <div className='info-value'>{handleBadge(userData.totalPoints ?? 0)}</div>
              </div>

              <div className='info-row'>
                <label className='info-label'>Total Points</label>
                <div className='info-value points-badge'>{userData.totalPoints || 0}</div>
              </div>

              <div className='info-row'>
                <label className='info-label'>Biography</label>
                <div className='info-value biography-section'>
                  {!editBioMode ? (
                    <>
                      <div className='biography-text'>
                        <Markdown remarkPlugins={[remarkGfm]}>
                          {userData.biography || 'No biography yet.'}
                        </Markdown>
                      </div>
                      {canEditProfile && (
                        <button
                          className='edit-inline-button'
                          onClick={() => {
                            setEditBioMode(true);
                            setNewBio(userData.biography || '');
                          }}>
                          Edit
                        </button>
                      )}
                    </>
                  ) : (
                    <div className='biography-edit'>
                      <textarea
                        className='input-textarea'
                        value={newBio}
                        onChange={e => setNewBio(e.target.value)}
                        rows={3}
                      />
                      <div className='edit-actions'>
                        <button className='button button-primary' onClick={handleUpdateBiography}>
                          Save
                        </button>
                        <button
                          className='button button-secondary'
                          onClick={() => setEditBioMode(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className='info-row'>
                <label className='info-label'>Date Joined</label>
                <div className='info-value'>
                  {userData.dateJoined ? new Date(userData.dateJoined).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>

            <button
              className='button button-primary full-width'
              onClick={handleViewCollectionsPage}>
              View Collections
            </button>

            {/* Reset Password Section */}
            {canEditProfile && (
              <div className='section-divider'>
                <h3 className='section-title'>Security</h3>
                <div className='twofactor-section'>
                  <div className='twofactor-header'>
                    <div>
                      <p className='twofactor-title'>Two-factor authentication</p>
                      <p className='twofactor-description'>
                        Add an extra verification step when logging in.
                      </p>
                    </div>
                    {canEditProfile && (
                      <label className='twofactor-toggle'>
                        <input
                          type='checkbox'
                          checked={twoFactorSwitchChecked}
                          onChange={handleTwoFactorCheckboxChange}
                          disabled={isTwoFactorLoading}
                        />
                        <span>{twoFactorSwitchChecked ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    )}
                  </div>
                  {!canEditProfile && (
                    <span
                      className={`twofactor-status ${twoFactorEnabled ? 'enabled' : 'disabled'}`}>
                      {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  )}

                  {canEditProfile && (
                    <div className='twofactor-email-field'>
                      <label htmlFor='twofactor-email-input'>Verification email</label>
                      <input
                        id='twofactor-email-input'
                        type='email'
                        className='input-text'
                        placeholder='name@example.com'
                        value={twoFactorEmail}
                        onChange={handleTwoFactorEmailChange}
                      />
                    </div>
                  )}

                  {showTwoFactorSetup && (
                    <div className='twofactor-setup'>
                      <label htmlFor='twofactor-code'>Verification code</label>
                      <input
                        id='twofactor-code'
                        className='input-text'
                        type='text'
                        inputMode='numeric'
                        pattern='[0-9]*'
                        maxLength={6}
                        value={twoFactorCodeInput}
                        onChange={handleTwoFactorInputChange}
                        placeholder='Enter 6-digit code'
                      />
                      {twoFactorDevCode && (
                        <p className='twofactor-helper'>Test code: {twoFactorDevCode}</p>
                      )}
                      <div className='twofactor-actions'>
                        <button
                          className='button button-primary'
                          onClick={confirmTwoFactorSetup}
                          disabled={isTwoFactorLoading}>
                          Verify & Enable
                        </button>
                        <button
                          className='button button-secondary'
                          onClick={handleResendTwoFactorCode}
                          disabled={isTwoFactorLoading}>
                          Resend Code
                        </button>
                        <button className='button button-secondary' onClick={cancelTwoFactorSetup}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className='sessions-section'>
                  <div className='sessions-header'>
                    <p className='twofactor-title'>Active sessions</p>
                    <button
                      className='button button-secondary button-small'
                      onClick={refreshSessions}>
                      Refresh
                    </button>
                  </div>
                  {sessionsError && <p className='error-message'>{sessionsError}</p>}
                  {sessionsLoading ? (
                    <p className='twofactor-description'>Loading sessions…</p>
                  ) : sessionOverview && sessionOverview.sessions.length > 0 ? (
                    <ul className='sessions-list'>
                      {sessionOverview.sessions.map(session => (
                        <li key={session.sessionId} className='session-item'>
                          <div className='session-details'>
                            <p className='session-device'>
                              {session.current
                                ? 'This device'
                                : session.userAgent || 'Unknown device'}
                            </p>
                            <p className='session-meta'>
                              IP: {session.ipAddress || 'Unknown'} · Last active{' '}
                              {formatTimestamp(session.lastActiveAt)}
                            </p>
                            <p className='session-meta'>
                              Signed in {formatTimestamp(session.createdAt)}
                            </p>
                          </div>
                          <button
                            className='button button-secondary button-small'
                            onClick={() => handleRevokeSession(session.sessionId)}
                            disabled={revokingSessionId === session.sessionId}>
                            {revokingSessionId === session.sessionId ? 'Revoking…' : 'Revoke'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className='twofactor-description'>No other active sessions.</p>
                  )}
                  {sessionOverview && sessionOverview.recentLogins.length > 0 && (
                    <div className='recent-logins'>
                      <p className='twofactor-description'>Recent login activity</p>
                      <ul>
                        {sessionOverview.recentLogins.map(session => (
                          <li key={`recent-${session.sessionId}`} className='session-meta'>
                            {formatTimestamp(session.createdAt)} ·{' '}
                            {session.userAgent || 'Unknown device'} · IP{' '}
                            {session.ipAddress || 'Unknown'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className='password-section'>
                  <input
                    className='input-text'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='New Password'
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <input
                    className='input-text'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Confirm New Password'
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                  />
                  <div className='password-actions'>
                    <button className='button button-secondary' onClick={togglePasswordVisibility}>
                      {showPassword ? 'Hide Passwords' : 'Show Passwords'}
                    </button>
                    <button className='button button-primary' onClick={handleResetPassword}>
                      Reset Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {canEditProfile && (
              <div className='section-divider danger-zone'>
                <h3 className='section-title'>Danger Zone</h3>
                <button className='button button-danger full-width' onClick={handleDeleteUser}>
                  Delete Account
                </button>
              </div>
            )}
          </>
        ) : (
          <p className='error-message'>
            No user data found. Make sure the username parameter is correct.
          </p>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className='modal'>
            <div className='modal-content'>
              <h3>Confirm Deletion</h3>
              <p>
                Are you sure you want to delete user <strong>{userData?.username}</strong>? This
                action cannot be undone.
              </p>
              <div className='modal-actions'>
                <button className='button button-danger' onClick={() => pendingAction?.()}>
                  Confirm Delete
                </button>
                <button
                  className='button button-secondary'
                  onClick={() => setShowConfirmation(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
