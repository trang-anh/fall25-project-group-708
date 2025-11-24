

type Code2DateLogoProps = {
  width?: number;
  height?: number;
  className?: string;
};

/**
 * Code2Date Logo - Pure CSS theme-aware component
 * Uses CSS variables for all colors - no hooks needed!
 * Automatically adapts based on your theme.css variables
 */
const Code2DateLogo: React.FC<Code2DateLogoProps> = ({
  width = 260,
  height = 64,
  className,
}) => {
  return (
    <div 
      className={`code2date-logo ${className || ''}`}
      style={{ 
        display: 'inline-block',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '2px solid var(--logo-border, #EC4899)',
        padding: '2px',
        transition: 'all 0.3s ease'
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 260 64"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Code 2 Date logo"
        style={{ display: 'block' }}
      >
        {/* Left text: code */}
        <text
          x="28"
          y="40"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
          fontSize={20}
          fontWeight={500}
          fill="var(--text-primary)"
        >
          code
        </text>

        {/* Left bracket */}
        <path
          d="M114 22 L106 34 L114 46"
          stroke="var(--logo-accent, #EC4899)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right bracket */}
        <path
          d="M134 22 L142 34 L134 46"
          stroke="var(--logo-accent, #EC4899)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Heart - stays pink in both modes */}
        <path
          d="M124 29
             C122 26,117 26,117 30
             C117 33,120 35,124 39
             C128 35,131 33,131 30
             C131 26,126 26,124 29Z"
          fill="#EC4899"
        />

        {/* Superscript "2" */}
        <text
          x="162"
          y="30"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
          fontSize={12}
          fontWeight={400}
          fill="var(--text-secondary)"
        >
          2
        </text>

        {/* Right text: date */}
        <text
          x="175"
          y="40"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
          fontSize={20}
          fontWeight={600}
          fill="var(--text-primary)"
        >
          date
        </text>
      </svg>
    </div>
  );
};

export default Code2DateLogo;