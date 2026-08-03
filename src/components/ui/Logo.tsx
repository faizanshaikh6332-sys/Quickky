import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'auto';
  showSubtitle?: boolean;
  className?: string;
  asLink?: boolean;
}

export default function Logo({
  size = 'md',
  variant = 'auto',
  showSubtitle = true,
  className,
  asLink = true,
}: LogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const subtitleSizes = {
    sm: 'text-[8px]',
    md: 'text-[9px]',
    lg: 'text-[10px]',
    xl: 'text-xs',
  };

  const textClasses = {
    light: 'text-white',
    dark: 'text-gray-900',
    auto: 'text-gray-900 dark:text-white',
  };

  const subtitleClasses = {
    light: 'text-purple-300',
    dark: 'text-purple-600',
    auto: 'text-purple-600 dark:text-purple-400',
  };

  const content = (
    <div className={cn('flex items-center gap-2.5 flex-shrink-0 group', className)}>
      <div className={cn('relative rounded-full p-0.5 bg-gradient-to-tr from-cyan-500 via-purple-600 to-amber-500 shadow-md group-hover:scale-105 transition-transform duration-300', iconSizes[size])}>
        <img
          src="/logo.png"
          alt="Quickky Logo"
          className="w-full h-full object-contain rounded-full bg-slate-900"
        />
      </div>
      <div className="flex flex-col text-left">
        <span className={cn('font-black tracking-tight leading-none text-gradient-purple', titleSizes[size])}>
          Quickky
        </span>
        {showSubtitle && (
          <span className={cn('font-extrabold uppercase tracking-widest leading-none mt-1', subtitleClasses[variant], subtitleSizes[size])}>
            Fast • Reliable • Now
          </span>
        )}
      </div>
    </div>
  );

  if (asLink) {
    return <Link to="/">{content}</Link>;
  }

  return content;
}
