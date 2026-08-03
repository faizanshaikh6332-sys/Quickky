import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/lib/database.types';
import toast from 'react-hot-toast';

type Review = Database['public']['Tables']['reviews']['Row'] & {
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

export function useReviews(productId: string) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [avgRating, setAvgRating] = useState(0);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    
    const list = (data || []) as unknown as Review[];
    setReviews(list);
    if (list.length > 0) {
      setAvgRating(list.reduce((s, r) => s + r.rating, 0) / list.length);
    }
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [productId]);

  const submitReview = async ({
    rating,
    title,
    body,
    orderId,
  }: {
    rating: number;
    title: string;
    body: string;
    orderId?: string;
  }) => {
    if (!user) { toast.error('Sign in to write a review'); return false; }
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      user_id: user.id,
      product_id: productId,
      order_id: orderId || null,
      rating,
      title,
      body,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Review submitted! Thank you 🙏');
    fetchReviews();
    return true;
  };

  const userHasReviewed = reviews.some(r => r.user_id === user?.id);

  return { reviews, loading, submitting, avgRating, submitReview, userHasReviewed, refetch: fetchReviews };
}
