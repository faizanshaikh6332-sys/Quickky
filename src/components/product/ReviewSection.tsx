import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useReviews } from '@/hooks/useReviews';

interface ReviewSectionProps {
  productId: string;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
        >
          <Star
            size={28}
            className={
              (hover || value) >= s
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-200 dark:text-gray-700 fill-current'
            }
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  const profile = review.profiles;
  return (
    <div className="flex gap-3 py-4 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <div className="flex-shrink-0">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
            {profile?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-sm text-gray-900 dark:text-white">
            {profile?.full_name || 'Anonymous'}
          </span>
          {review.verified && (
            <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full">
              ✓ Verified
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(review.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <div className="flex mb-2">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} size={12} className={s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
          ))}
        </div>
        {review.title && <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">{review.title}</p>}
        {review.body && <p className="text-sm text-gray-600 dark:text-gray-300">{review.body}</p>}
      </div>
    </div>
  );
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const { user } = useAuth();
  const { reviews, loading, submitting, avgRating, submitReview, userHasReviewed } = useReviews(productId);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submitReview({ rating, title, body });
    if (ok) {
      setShowForm(false);
      setTitle('');
      setBody('');
      setRating(5);
    }
  };

  const ratingDist = [5, 4, 3, 2, 1].map(r => ({
    star: r,
    count: reviews.filter(rv => rv.rating === r).length,
    pct: reviews.length ? Math.round((reviews.filter(rv => rv.rating === r).length / reviews.length) * 100) : 0,
  }));

  return (
    <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">
          Customer Reviews <span className="text-gray-400 font-normal text-lg">({reviews.length})</span>
        </h2>
        {user && !userHasReviewed && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors"
          >
            <Star size={14} /> Write a Review
          </button>
        )}
      </div>

      {/* Rating Summary */}
      {reviews.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6 flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="text-5xl font-black text-gray-900 dark:text-white">{avgRating.toFixed(1)}</div>
            <div className="flex mt-1 mb-1">
              {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />)}
            </div>
            <p className="text-xs text-gray-400">{reviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-2 w-full">
            {ratingDist.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-5 text-right">{star}★</span>
                <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: star * 0.05 }}
                    className="h-full bg-amber-400 rounded-full"
                  />
                </div>
                <span className="text-xs text-gray-400 w-8">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-purple-200 dark:border-purple-800 p-6 mb-6 shadow-lg"
          >
            <h3 className="font-black text-gray-900 dark:text-white mb-4">Your Review</h3>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Rating</label>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div className="space-y-3">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Review title (optional)"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all"
              />
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Share your experience..."
                rows={4}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-purple-500 transition-all resize-none"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || !body}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <Star size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No reviews yet. Be the first to review!</p>
          {user && !showForm && (
            <button onClick={() => setShowForm(true)} className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-colors">
              Write a Review
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}
    </section>
  );
}
