import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore, useWishlistStore } from '@/store';
import { products as localProducts } from '@/data';
import type { ProductColor } from '@/types';

/**
 * Syncs Zustand cart & wishlist to Supabase when user logs in.
 * On login:
 *   - Merges local cart items into Supabase cart_items
 *   - Loads wishlist from Supabase
 */
export function useSyncStore() {
  const { user } = useAuth();
  const { items: cartItems, addItem } = useCartStore();
  const { productIds: wishlistIds, addToWishlist } = useWishlistStore();

  useEffect(() => {
    if (!user) return;

    const sync = async () => {
      // ── Sync Cart: push local items to Supabase ──────────────
      for (const item of cartItems) {
        await supabase.from('cart_items').upsert({
          user_id: user.id,
          product_id: item.product.id,
          quantity: item.quantity,
          size: item.size,
          color_name: item.color.name,
          color_hex: item.color.hex,
        }, { onConflict: 'user_id,product_id,size,color_name' });
      }

      // ── Load Cart from Supabase ─────────────────────────────
      const { data: dbCart } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id);

      if (dbCart) {
        for (const dbItem of dbCart) {
          const product = localProducts.find(p => p.id === dbItem.product_id);
          if (!product) continue;
          const alreadyInLocal = cartItems.some(
            i => i.product.id === dbItem.product_id && i.size === dbItem.size && i.color.name === dbItem.color_name
          );
          if (!alreadyInLocal) {
            addItem(
              product,
              dbItem.size,
              { name: dbItem.color_name, hex: dbItem.color_hex } as ProductColor,
            );
          }
        }
      }

      // ── Sync Wishlist: push local wishlist to Supabase ────────
      for (const productId of wishlistIds) {
        await supabase.from('wishlist_items').upsert(
          { user_id: user.id, product_id: productId },
          { onConflict: 'user_id,product_id' }
        );
      }

      // ── Load Wishlist from Supabase ───────────────────────────
      const { data: dbWishlist } = await supabase
        .from('wishlist_items')
        .select('product_id')
        .eq('user_id', user.id);

      if (dbWishlist) {
        for (const { product_id } of dbWishlist) {
          if (!wishlistIds.includes(product_id)) {
            addToWishlist(product_id);
          }
        }
      }
    };

    sync();
  }, [user?.id]);
}

/**
 * Persist cart changes to Supabase in real-time (when user is logged in).
 */
export function usePersistCart() {
  const { user } = useAuth();
  const { items } = useCartStore();

  useEffect(() => {
    if (!user) return;

    // Debounced sync
    const timeout = setTimeout(async () => {
      // Delete current cart and re-insert (simplest approach for small carts)
      await supabase.from('cart_items').delete().eq('user_id', user.id);
      if (items.length === 0) return;
      await supabase.from('cart_items').insert(
        items.map(item => ({
          user_id: user.id,
          product_id: item.product.id,
          quantity: item.quantity,
          size: item.size,
          color_name: item.color.name,
          color_hex: item.color.hex,
        }))
      );
    }, 1000);

    return () => clearTimeout(timeout);
  }, [items, user?.id]);
}

/**
 * Persist wishlist changes to Supabase.
 */
export function usePersistWishlist() {
  const { user } = useAuth();
  const { productIds } = useWishlistStore();

  useEffect(() => {
    if (!user) return;

    const timeout = setTimeout(async () => {
      await supabase.from('wishlist_items').delete().eq('user_id', user.id);
      if (productIds.length === 0) return;
      await supabase.from('wishlist_items').insert(
        productIds.map(product_id => ({ user_id: user.id, product_id }))
      );
    }, 800);

    return () => clearTimeout(timeout);
  }, [productIds, user?.id]);
}
