import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  reviews?: number;
  size?: 'sm' | 'md';
  showCount?: boolean;
}

export default function StarRating({ rating, reviews, size = 'sm', showCount = true }: StarRatingProps) {
  const starSize = size === 'sm' ? 12 : 16;
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={starSize}
            className={cn(
              i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' :
              i < rating ? 'text-amber-400 fill-amber-400/50' :
              'text-gray-300 fill-gray-300'
            )}
          />
        ))}
      </div>
      {showCount && reviews !== undefined && (
        <span className="text-xs text-gray-500">({reviews.toLocaleString()})</span>
      )}
    </div>
  );
}
