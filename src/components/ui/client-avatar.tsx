import React from 'react';

interface ClientAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Generate a consistent color based on the name
const getAvatarColor = (name: string): { bg: string; text: string } => {
  const colors = [
    { bg: 'bg-rose-500', text: 'text-rose-50' },
    { bg: 'bg-pink-500', text: 'text-pink-50' },
    { bg: 'bg-fuchsia-500', text: 'text-fuchsia-50' },
    { bg: 'bg-purple-500', text: 'text-purple-50' },
    { bg: 'bg-violet-500', text: 'text-violet-50' },
    { bg: 'bg-indigo-500', text: 'text-indigo-50' },
    { bg: 'bg-blue-500', text: 'text-blue-50' },
    { bg: 'bg-cyan-500', text: 'text-cyan-50' },
    { bg: 'bg-teal-500', text: 'text-teal-50' },
    { bg: 'bg-emerald-500', text: 'text-emerald-50' },
    { bg: 'bg-green-500', text: 'text-green-50' },
    { bg: 'bg-lime-500', text: 'text-lime-50' },
    { bg: 'bg-amber-500', text: 'text-amber-50' },
    { bg: 'bg-orange-500', text: 'text-orange-50' },
  ];

  // Create a hash from the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Get initials from name (max 2 characters)
const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const sizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

const ClientAvatar: React.FC<ClientAvatarProps> = ({ name, size = 'md', className = '' }) => {
  const { bg, text } = getAvatarColor(name);
  const initials = getInitials(name);

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${bg}
        ${text}
        rounded-full
        flex items-center justify-center
        font-semibold
        shrink-0
        ring-2 ring-background
        shadow-sm
        transition-transform duration-200
        hover:scale-110
        ${className}
      `}
      title={name}
    >
      {initials}
    </div>
  );
};

export default ClientAvatar;
