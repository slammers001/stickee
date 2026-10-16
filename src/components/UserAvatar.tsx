import { cn } from '@/lib/utils';
import { getAvatarTheme } from '@/services/profileService';

interface UserAvatarProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

const getFirstLetter = (name: string): string => {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
};

export const UserAvatar = ({ name, color, size = 'md', className }: UserAvatarProps) => {
  const theme = getAvatarTheme(color);

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: theme.background, color: theme.letter }}
    >
      {getFirstLetter(name)}
    </div>
  );
};