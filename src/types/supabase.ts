// 扩展 User 类型以包含 Supabase Auth 信息
export interface AuthUser {
  id: string;
  auth_id: string;
  email: string;
  name: string;
  avatar_emoji?: string;
  partner_id?: string;
  invite_code?: string;
  created_at: string;
}

// Supabase 数据库类型（根据实际表结构定义）
export type Database = {
  public: {
    Tables: {
      users: {
        Row: AuthUser;
        Insert: Omit<AuthUser, 'id' | 'created_at'>;
        Update: Partial<Omit<AuthUser, 'id' | 'auth_id' | 'created_at'>>;
      };
      poo_records: {
        Row: {
          id: string;
          user_id: string;
          happened_at: string;
          shape_type: number;
          mood: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['poo_records']['Row'], 'id' | 'created_at'>;
        Update: Partial<Omit<Database['public']['Tables']['poo_records']['Row'], 'id' | 'user_id' | 'created_at'>>;
      };
      heart_reactions: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          record_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['heart_reactions']['Row'], 'id' | 'created_at'>;
      };
      reminder_cards: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          message: string;
          bg_color: string;
          text_color: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reminder_cards']['Row'], 'id' | 'created_at'>;
        Update: Partial<Pick<Database['public']['Tables']['reminder_cards']['Row'], 'is_active'>>;
      };
    };
  };
};
