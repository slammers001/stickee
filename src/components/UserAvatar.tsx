import { cn } from '@/lib/utils';
import { getInitials } from '@/services/profileService';

interface UserAvatarProps {
  name: string;
  color: string;
  image?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

export const UserAvatar = ({ name, color, image, size = 'md', className }: UserAvatarProps) => {
  const initials = getInitials(name);

  if (image) {
    return (
      <img
        src={image}
        alt={name || 'User avatar'}
        className={cn(
          'rounded-full object-cover',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
};
