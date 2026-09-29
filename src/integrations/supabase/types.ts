export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      active_boosts: {
        Row: {
          activated_at: string
          item_id: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          item_id: string
          user_id: string
        }
        Update: {
          activated_at?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_boosts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      equipped: {
        Row: {
          item_id: string
          slot: string
          user_id: string
        }
        Insert: {
          item_id: string
          slot: string
          user_id: string
        }
        Update: {
          item_id?: string
          slot?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipped_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          created_at: string
          duration_ms: number | null
          game_id: string
          id: string
          score: number
          user_id: string
          won: boolean
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          game_id: string
          id?: string
          score?: number
          user_id: string
          won?: boolean
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          game_id?: string
          id?: string
          score?: number
          user_id?: string
          won?: boolean
        }
        Relationships: []
      }
      game_stats: {
        Row: {
          best_score: number | null
          best_time_ms: number | null
          game_id: string
          id: string
          plays: number
          total_score: number
          updated_at: string
          user_id: string
          wins: number
        }
        Insert: {
          best_score?: number | null
          best_time_ms?: number | null
          game_id: string
          id?: string
          plays?: number
          total_score?: number
          updated_at?: string
          user_id: string
          wins?: number
        }
        Update: {
          best_score?: number | null
          best_time_ms?: number | null
          game_id?: string
          id?: string
          plays?: number
          total_score?: number
          updated_at?: string
          user_id?: string
          wins?: number
        }
        Relationships: []
      }
      inventory: {
        Row: {
          acquired_at: string
          item_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          acquired_at?: string
          item_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          acquired_at?: string
          item_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_messages: {
        Row: {
          body: string
          created_at: string
          display_name: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          display_name: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          display_name?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          code: string
          created_at: string
          game: string
          guest_id: string | null
          host_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          game: string
          guest_id?: string | null
          host_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          game?: string
          guest_id?: string | null
          host_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          description: string
          id: string
          kind: string
          name: string
          price: number
          slot: string | null
          sort: number
        }
        Insert: {
          description: string
          id: string
          kind: string
          name: string
          price: number
          slot?: string | null
          sort?: number
        }
        Update: {
          description?: string
          id?: string
          kind?: string
          name?: string
          price?: number
          slot?: string | null
          sort?: number
        }
        Relationships: []
      }
      wallets: {
        Row: {
          coins: number
          total_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coins?: number
          total_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coins?: number
          total_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buy_item: { Args: { p_item: string }; Returns: Json }
      create_room: {
        Args: { p_game: string }
        Returns: {
          code: string
          created_at: string
          game: string
          guest_id: string | null
          host_id: string
          id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "rooms"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      equip_item: { Args: { p_item: string }; Returns: undefined }
      is_room_member: {
        Args: { _room: string; _user: string }
        Returns: boolean
      }
      join_room: {
        Args: { p_code: string }
        Returns: {
          code: string
          created_at: string
          game: string
          guest_id: string | null
          host_id: string
          id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "rooms"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_room_status: {
        Args: { p_room: string; p_status: string }
        Returns: undefined
      }
      submit_game_result: {
        Args: {
          p_game_id: string
          p_lower_is_better?: boolean
          p_score?: number
          p_time_ms?: number
          p_won?: boolean
        }
        Returns: Json
      }
      unequip_slot: { Args: { p_slot: string }; Returns: undefined }
      use_consumable: { Args: { p_item: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
