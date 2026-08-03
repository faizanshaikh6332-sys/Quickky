import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'discount' | 'delivery' | 'new' | 'trending' | 'sale' | 'default';
  className?: string;
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    discount: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
    delivery: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white',
    new: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
    trending: 'bg-gradient-to-r from-orange-400 to-pink-500 text-white',
    sale: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
    default: 'bg-gray-100 text-gray-700',
  };
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
