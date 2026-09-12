import React from 'react';

interface LogoProps {
  className?: string;
}

export const HeliosLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Geometric stylized ][ H emblem */}
    <rect x="5" y="6" width="4.5" height="20" rx="1.5" fill="currentColor" />
    <rect x="22.5" y="6" width="4.5" height="20" rx="1.5" fill="currentColor" />
    <path
      d="M9.5 16H22.5"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <circle cx="16" cy="16" r="2.5" fill="#f43f5e" />
  </svg>
);

export const AppleLogo: React.FC<LogoProps> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.07 1.7-0.94 2.72 1.01.08 2.03-.49 2.64-1.22z" />
  </svg>
);

export const AmazonLogo: React.FC<LogoProps> = ({ className = 'w-4 h-4' }) => (
  <span className={`font-black text-amber-500 flex items-center justify-center select-none ${className}`}>
    <span className="text-base font-extrabold lowercase tracking-tighter leading-none">a</span>
  </span>
);

export const MicrosoftLogo: React.FC<LogoProps> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="3" y="3" width="8" height="8" rx="1" fill="#F25022" />
    <rect x="13" y="3" width="8" height="8" rx="1" fill="#7FBA00" />
    <rect x="3" y="13" width="8" height="8" rx="1" fill="#00A4EF" />
    <rect x="13" y="13" width="8" height="8" rx="1" fill="#FFB900" />
  </svg>
);

export const NvidiaLogo: React.FC<LogoProps> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C16.42 20 20 16.42 20 12C20 7.58 16.42 4 12 4ZM12 17.5C8.96 17.5 6.5 15.04 6.5 12C6.5 8.96 8.96 6.5 12 6.5C15.04 6.5 17.5 8.96 17.5 12C17.5 15.04 15.04 17.5 12 17.5Z"
      fill="#76B900"
    />
    <path
      d="M12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z"
      fill="#76B900"
    />
  </svg>
);

export const SpotifyLogo: React.FC<LogoProps> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="10" fill="#1DB954" />
    <path
      d="M16.5 9.5C13.8 7.9 9.3 7.8 6.8 8.5C6.4 8.6 6 8.4 5.9 8C5.8 7.6 6 7.2 6.4 7.1C9.3 6.2 14.3 6.4 17.4 8.2C17.8 8.4 17.9 8.9 17.7 9.3C17.4 9.6 16.9 9.7 16.5 9.5ZM16.2 12.3C15.9 12.7 15.4 12.8 15 12.6C12.7 11.2 9.1 10.8 6.6 11.5C6.2 11.6 5.8 11.4 5.7 11C5.6 10.6 5.8 10.2 6.2 10.1C9.1 9.2 13.1 9.7 15.8 11.3C16.1 11.6 16.3 12 16.2 12.3ZM15.1 15.1C14.9 15.4 14.5 15.5 14.2 15.3C12.3 14.1 9.7 13.8 6.4 14.6C6.1 14.7 5.7 14.5 5.6 14.2C5.5 13.9 5.7 13.5 6 13.4C9.6 12.6 12.5 12.9 14.7 14.3C15 14.4 15.2 14.8 15.1 15.1Z"
      fill="#121316"
    />
  </svg>
);

export const AssetBrandIcon: React.FC<{ type: string; className?: string }> = ({
  type,
  className = 'w-4 h-4',
}) => {
  switch (type) {
    case 'apple':
      return <AppleLogo className={className} />;
    case 'amazon':
      return <AmazonLogo className={className} />;
    case 'microsoft':
      return <MicrosoftLogo className={className} />;
    case 'nvidia':
      return <NvidiaLogo className={className} />;
    case 'spotify':
      return <SpotifyLogo className={className} />;
    default:
      return <div className="w-4 h-4 rounded-full bg-blue-500" />;
  }
};
