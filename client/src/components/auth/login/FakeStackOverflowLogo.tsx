import React, { useEffect, useState } from 'react';

export type FakeStackOverflowLogoProps = {
  color?: string; // CSS color (defaults to 'currentColor')
  size?: number; // icon size in px (height of icon block)
  withWordmark?: boolean; // include 'Fake Stack Overflow' text
  wordmarkColor?: string; // color for the wordmark (defaults to color)
  wordmarkFontFamily?: string; // CSS font family for the wordmark
  className?: string; // pass-through className
  title?: string; // accessible title
};

/**
 * FakeStackOverflowLogo
 * - Pure SVG, no external assets
 * - Automatically adapts to dark mode
 * - Icon color changes based on theme
 * - Optional wordmark rendered to the right
 */
const FakeStackOverflowLogo: React.FC<FakeStackOverflowLogoProps> = ({
  color,
  size = 64,
  withWordmark = true,
  wordmarkColor,
  wordmarkFontFamily = '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
  className,
  title = 'Fake Stack Overflow Logo',
}) => {
  const [isDark, setIsDark] = useState(false);

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme === 'dark');
    };

    // Check initial theme
    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  // Determine color based on theme if not explicitly set
  const logoColor = color || (isDark ? '#f5f5f7' : '#1d1d1f');
  const wmColor = wordmarkColor || logoColor;

  const icon = (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 512 512'
      width={size}
      height={size}
      aria-label={title}
      role='img'
      className={className}
      style={{ color: logoColor, transition: 'color 0.3s ease' }}>
      <g fill='currentColor'>
        <path d='M124 80c-22 0-40 18-40 40v28c0 7-6 12-12 16l-22 13c-10 6-7 21 5 23l29 4c27 4 54 4 81 0l190-28c18-2 32-18 32-36v-20c0-22-18-40-40-40H124z' />
        <path d='M108 210c-22 0-40 18-40 40v30c0 7-6 12-12 16l-22 13c-10 6-7 21 5 23l29 4c27 4 54 4 81 0l210-30c18-2 32-18 32-36v-20c0-22-18-40-40-40H108z' />
        <path d='M124 344c-22 0-40 18-40 40v30c0 7-6 12-12 16l-22 13c-10 6-7 21 5 23l29 4c27 4 54 4 81 0l198-28c18-3 33-18 33-36v-22c0-22-18-40-40-40H124zM120 468a10 10 0 0 0 0 20h200a10 10 0 0 0 0-20H120z' />
      </g>
    </svg>
  );

  if (!withWordmark) return icon;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
      {icon}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          lineHeight: 1.05,
          color: wmColor,
          fontFamily: wordmarkFontFamily,
          transition: 'color 0.3s ease',
        }}
        aria-hidden='true'>
        <span style={{ fontSize: size * 0.42, fontWeight: 700 }}>Fake</span>
        <span style={{ fontSize: size * 0.42, fontWeight: 700 }}>Stack</span>
        <span style={{ fontSize: size * 0.42, fontWeight: 800 }}>Overflow</span>
      </div>
    </div>
  );
};

export default FakeStackOverflowLogo;
