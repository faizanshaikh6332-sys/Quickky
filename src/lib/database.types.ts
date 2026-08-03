// ================================================================
// QUICKKY — Supabase Database Types v3.1
// Compatible with @supabase/supabase-js v2.x
// Matches complete_schema.sql exactly.
// ================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          email: string | null;
          is_blocked: boolean;
          role: 'customer' | 'seller' | 'admin';
          total_orders: number;
          total_spent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          is_blocked?: boolean;
          role?: 'customer' | 'seller' | 'admin';
          total_orders?: number;
          total_spent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          is_blocked?: boolean;
          role?: 'customer' | 'seller' | 'admin';
          total_orders?: number;
          total_spent?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          full_name: string;
          phone: string;
          line1: string;
          line2: string | null;
          city: string;
          state: string;
          pincode: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string;
          full_name: string;
          phone: string;
          line1: string;
          line2?: string | null;
          city: string;
          state: string;
          pincode: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          full_name?: string;
          phone?: string;
          line1?: string;
          line2?: string | null;
          city?: string;
          state?: string;
          pincode?: string;
          is_default?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'addresses_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      wishlist_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          added_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          added_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'wishlist_items_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          size: string;
          color_name: string;
          color_hex: string;
          added_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          quantity?: number;
          size: string;
          color_name: string;
          color_hex?: string;
          added_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          quantity?: number;
          size?: string;
          color_name?: string;
          color_hex?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cart_items_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          type: 'percentage' | 'flat';
          value: number;
          min_order_value: number;
          max_discount: number | null;
          description: string | null;
          valid_until: string | null;
          is_active: boolean;
          usage_limit: number | null;
          usage_count: number;
          shop_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          type: 'percentage' | 'flat';
          value: number;
          min_order_value?: number;
          max_discount?: number | null;
          description?: string | null;
          valid_until?: string | null;
          is_active?: boolean;
          usage_limit?: number | null;
          usage_count?: number;
          shop_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          type?: 'percentage' | 'flat';
          value?: number;
          min_order_value?: number;
          max_discount?: number | null;
          description?: string | null;
          valid_until?: string | null;
          is_active?: boolean;
          usage_limit?: number | null;
          usage_count?: number;
          shop_id?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          shop_id: string | null;
          address: Json;
          payment_method: string;
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
          status: 'confirmed' | 'processing' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
          subtotal: number;
          discount: number;
          delivery_fee: number;
          tax: number;
          total: number;
          coupon_code: string | null;
          estimated_delivery: string | null;
          notes: string | null;
          cancel_reason: string | null;
          refund_amount: number | null;
          refund_status: 'none' | 'pending' | 'processed' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          shop_id?: string | null;
          address: Json;
          payment_method: string;
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
          status?: 'confirmed' | 'processing' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
          subtotal: number;
          discount?: number;
          delivery_fee?: number;
          tax?: number;
          total: number;
          coupon_code?: string | null;
          estimated_delivery?: string | null;
          notes?: string | null;
          cancel_reason?: string | null;
          refund_amount?: number | null;
          refund_status?: 'none' | 'pending' | 'processed' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          shop_id?: string | null;
          address?: Json;
          payment_method?: string;
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded';
          status?: 'confirmed' | 'processing' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
          subtotal?: number;
          discount?: number;
          delivery_fee?: number;
          tax?: number;
          total?: number;
          coupon_code?: string | null;
          estimated_delivery?: string | null;
          notes?: string | null;
          cancel_reason?: string | null;
          refund_amount?: number | null;
          refund_status?: 'none' | 'pending' | 'processed' | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_snapshot: Json;
          quantity: number;
          size: string;
          color_name: string;
          unit_price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          product_snapshot: Json;
          quantity: number;
          size: string;
          color_name: string;
          unit_price: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          product_snapshot?: Json;
          quantity?: number;
          size?: string;
          color_name?: string;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          }
        ];
      };
      reviews: {
        Row: {
          id: string;
          user_id: string | null;
          product_id: string;
          order_id: string | null;
          rating: number;
          title: string | null;
          body: string | null;
          helpful: number;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          product_id: string;
          order_id?: string | null;
          rating: number;
          title?: string | null;
          body?: string | null;
          helpful?: number;
          verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          product_id?: string;
          order_id?: string | null;
          rating?: number;
          title?: string | null;
          body?: string | null;
          helpful?: number;
          verified?: boolean;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'order' | 'offer' | 'system' | 'delivery';
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'order' | 'offer' | 'system' | 'delivery';
          title: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'order' | 'offer' | 'system' | 'delivery';
          title?: string;
          message?: string;
          is_read?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      search_history: {
        Row: {
          id: string;
          user_id: string;
          query: string;
          searched_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          query: string;
          searched_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          query?: string;
        };
        Relationships: [];
      };
      admin_roles: {
        Row: {
          id: string;
          user_id: string;
          role: 'super_admin' | 'admin' | 'moderator';
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: 'super_admin' | 'admin' | 'moderator';
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'super_admin' | 'admin' | 'moderator';
          created_by?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          gradient: string | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          product_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string | null;
          gradient?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          product_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string | null;
          gradient?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          product_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      shops: {
        Row: {
          id: string;
          seller_id: string;
          name: string;
          slug: string;
          tagline: string | null;
          logo_url: string | null;
          banner_url: string | null;
          category: string | null;
          category_id: string | null;
          city: string;
          address: string | null;
          pincode: string | null;
          phone: string | null;
          email: string | null;
          gstin: string | null;
          status: 'pending' | 'active' | 'suspended' | 'rejected';
          is_verified: boolean;
          is_featured: boolean;
          rating: number;
          total_ratings: number;
          total_sales: number;
          total_revenue: number;
          delivery_time: number;
          min_order: number;
          about: string | null;
          established: string | null;
          reject_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          name: string;
          slug: string;
          tagline?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          category?: string | null;
          category_id?: string | null;
          city?: string;
          address?: string | null;
          pincode?: string | null;
          phone?: string | null;
          email?: string | null;
          gstin?: string | null;
          status?: 'pending' | 'active' | 'suspended' | 'rejected';
          is_verified?: boolean;
          is_featured?: boolean;
          rating?: number;
          total_ratings?: number;
          total_sales?: number;
          total_revenue?: number;
          delivery_time?: number;
          min_order?: number;
          about?: string | null;
          established?: string | null;
          reject_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          name?: string;
          slug?: string;
          tagline?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          category?: string | null;
          category_id?: string | null;
          city?: string;
          address?: string | null;
          pincode?: string | null;
          phone?: string | null;
          email?: string | null;
          gstin?: string | null;
          status?: 'pending' | 'active' | 'suspended' | 'rejected';
          is_verified?: boolean;
          is_featured?: boolean;
          rating?: number;
          total_ratings?: number;
          total_sales?: number;
          total_revenue?: number;
          delivery_time?: number;
          min_order?: number;
          about?: string | null;
          established?: string | null;
          reject_reason?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shops_seller_id_fkey';
            columns: ['seller_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      products: {
        Row: {
          id: string;
          shop_id: string | null;
          seller_id: string | null;
          name: string;
          slug: string;
          brand: string | null;
          description: string | null;
          category_slug: string | null;
          category_id: string | null;
          images: Json;
          price: number;
          original_price: number | null;
          discount_pct: number;
          sizes: Json;
          colors: Json;
          tags: Json;
          rating: number;
          review_count: number;
          stock: number;
          status: 'pending' | 'active' | 'rejected' | 'archived';
          is_featured: boolean;
          is_new_arrival: boolean;
          reject_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id?: string | null;
          seller_id?: string | null;
          name: string;
          slug: string;
          brand?: string | null;
          description?: string | null;
          category_slug?: string | null;
          category_id?: string | null;
          images?: Json;
          price: number;
          original_price?: number | null;
          sizes?: Json;
          colors?: Json;
          tags?: Json;
          rating?: number;
          review_count?: number;
          stock?: number;
          status?: 'pending' | 'active' | 'rejected' | 'archived';
          is_featured?: boolean;
          is_new_arrival?: boolean;
          reject_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string | null;
          seller_id?: string | null;
          name?: string;
          slug?: string;
          brand?: string | null;
          description?: string | null;
          category_slug?: string | null;
          category_id?: string | null;
          images?: Json;
          price?: number;
          original_price?: number | null;
          sizes?: Json;
          colors?: Json;
          tags?: Json;
          rating?: number;
          review_count?: number;
          stock?: number;
          status?: 'pending' | 'active' | 'rejected' | 'archived';
          is_featured?: boolean;
          is_new_arrival?: boolean;
          reject_reason?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      banners: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          image_url: string | null;
          link_url: string | null;
          position: 'hero' | 'mid' | 'category' | 'footer' | 'popup';
          sort_order: number;
          is_active: boolean;
          bg_color: string;
          text_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          subtitle?: string | null;
          image_url?: string | null;
          link_url?: string | null;
          position?: 'hero' | 'mid' | 'category' | 'footer' | 'popup';
          sort_order?: number;
          is_active?: boolean;
          bg_color?: string;
          text_color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          subtitle?: string | null;
          image_url?: string | null;
          link_url?: string | null;
          position?: 'hero' | 'mid' | 'category' | 'footer' | 'popup';
          sort_order?: number;
          is_active?: boolean;
          bg_color?: string;
          text_color?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_settings: {
        Row: {
          key: string;
          value: string;
          description: string | null;
          type: 'string' | 'number' | 'boolean' | 'json';
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value: string;
          description?: string | null;
          type?: 'string' | 'number' | 'boolean' | 'json';
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          key?: string;
          value?: string;
          description?: string | null;
          type?: 'string' | 'number' | 'boolean' | 'json';
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      admin_logs: {
        Row: {
          id: string;
          admin_id: string | null;
          admin_email: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          entity_name: string | null;
          details: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          admin_email?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          entity_name?: string | null;
          details?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string | null;
          admin_email?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          entity_name?: string | null;
          details?: Json;
          ip_address?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: { user_uuid?: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ── Convenience row type aliases ────────────────────────────────────────────
export type Profile         = Database['public']['Tables']['profiles']['Row'];
export type Address         = Database['public']['Tables']['addresses']['Row'];
export type WishlistItem    = Database['public']['Tables']['wishlist_items']['Row'];
export type CartItemRow     = Database['public']['Tables']['cart_items']['Row'];
export type Coupon          = Database['public']['Tables']['coupons']['Row'];
export type Order           = Database['public']['Tables']['orders']['Row'];
export type OrderItem       = Database['public']['Tables']['order_items']['Row'];
export type Review          = Database['public']['Tables']['reviews']['Row'];
export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type SearchHistory   = Database['public']['Tables']['search_history']['Row'];
export type AdminRole       = Database['public']['Tables']['admin_roles']['Row'];
export type Category        = Database['public']['Tables']['categories']['Row'];
export type Shop            = Database['public']['Tables']['shops']['Row'];
export type Product         = Database['public']['Tables']['products']['Row'];
export type Banner          = Database['public']['Tables']['banners']['Row'];
export type PlatformSetting = Database['public']['Tables']['platform_settings']['Row'];
export type AdminLog        = Database['public']['Tables']['admin_logs']['Row'];
