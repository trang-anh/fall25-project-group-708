/**
 * Avatar Component
 */

import './index.css';
import { getAvatarUrl } from '../../services/avatarService';

interface AvatarProps {
  username: string;
  avatarUrl?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  className?: string;
  onClick?: () => void;
  showBorder?: boolean;
}

/**
 * Avatar component displays user avatar image or fallback to username initial
 *
 * @param username - The username to display
 * @param avatarUrl - Optional avatar image URL
 * @param size - Avatar size (small: 32px, medium: 48px, large: 64px, xlarge: 100px)
 * @param className - Additional CSS classes
 * @param onClick - Optional click handler
 * @param showBorder - Whether to show border around avatar
 */
const Avatar: React.FC<AvatarProps> = ({
  username,
  avatarUrl,
  size = 'medium',
  className = '',
  onClick,
  showBorder = false,
}) => {
  const initial = username?.charAt(0).toUpperCase() || '?';
  const fullAvatarUrl = getAvatarUrl(avatarUrl);

  return (
    <div
      className={`avatar avatar-${size} ${showBorder ? 'avatar-bordered' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={onClick ? e => e.key === 'Enter' && onClick() : undefined}>
      {fullAvatarUrl ? (
        <img
          src={fullAvatarUrl}
          alt={username}
          className='avatar-image'
          onError={e => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      <div className={`avatar-placeholder ${fullAvatarUrl ? 'hidden' : ''}`}>{initial}</div>
    </div>
  );
};

export default Avatar;
