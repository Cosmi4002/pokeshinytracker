
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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bingo_boards: {
        Row: {
          created_at: string
          generations: number[]
          grid_entity_keys: string[]
          grid_ids: number[]
          grid_size: number
          marked_ids: number[]
          random_generation_filter: number | null
          random_generation_filters: number[]
          random_entity_key: string | null
          random_pokemon_id: number | null
          random_pokemon_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generations?: number[]
          grid_entity_keys?: string[]
          grid_ids?: number[]
          grid_size?: number
          marked_ids?: number[]
          random_generation_filter?: number | null
          random_generation_filters?: number[]
          random_entity_key?: string | null
          random_pokemon_id?: number | null
          random_pokemon_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generations?: number[]
          grid_entity_keys?: string[]
          grid_ids?: number[]
          grid_size?: number
          marked_ids?: number[]
          random_generation_filter?: number | null
          random_generation_filters?: number[]
          random_entity_key?: string | null
          random_pokemon_id?: number | null
          random_pokemon_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      active_hunts: {
        Row: {
          counter: number
          created_at: string
          has_shiny_charm: boolean | null
          id: string
          increment_amount: number | null
          increment_hotkey: string | null
          is_visible_on_counter: boolean | null
          method: string
          pokemon_id: number | null
          pokemon_entity_keys: string[]
          pokemon_name: string | null
          selected_game_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          has_shiny_charm?: boolean | null
          id?: string
          increment_amount?: number | null
          increment_hotkey?: string | null
          is_visible_on_counter?: boolean | null
          method: string
          pokemon_id?: number | null
          pokemon_entity_keys?: string[]
          pokemon_name?: string | null
          selected_game_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          has_shiny_charm?: boolean | null
          id?: string
          increment_amount?: number | null
          increment_hotkey?: string | null
          is_visible_on_counter?: boolean | null
          method?: string
          pokemon_id?: number | null
          pokemon_entity_keys?: string[]
          pokemon_name?: string | null
          selected_game_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      caught_shinies: {
        Row: {
          attempts: number | null
          caught_date: string
          created_at: string
          evolved_from_id: number | null
          evolved_from_entity_key: string | null
          evolved_from_name: string | null
          evolved_icon_arrow_color: string | null
          evolved_icon_color: string | null
          evolved_icon_outline_color: string | null
          entity_key: string | null
          form: string | null
          game: string
          secondary_game: string | null
          gender: string | null
          has_shiny_charm: boolean | null
          hunt_start_date: string | null
          id: string
          is_evolved: boolean
          is_fail: boolean
          is_gigamax: boolean
          is_legends_arceus: boolean | null
          is_unobtainable: boolean
          method: string
          notes: string | null
          phase_number: number | null
          playlist_id: string | null
          pokeball: string
          pokemon_id: number
          pokemon_name: string
          show_encounters: boolean
          show_total: boolean
          show_total_seen: boolean
          total_value: number | null
          total_seen_count: number | null
          sprite_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number | null
          caught_date?: string
          created_at?: string
          form?: string | null
          game: string
          secondary_game?: string | null
          gender?: string | null
          has_shiny_charm?: boolean | null
          hunt_start_date?: string | null
          id?: string
          is_evolved?: boolean
          is_fail?: boolean
          is_gigamax?: boolean
          is_legends_arceus?: boolean | null
          is_unobtainable?: boolean
          method: string
          notes?: string | null
          evolved_from_id?: number | null
          evolved_from_entity_key?: string | null
          evolved_from_name?: string | null
          evolved_icon_arrow_color?: string | null
          evolved_icon_color?: string | null
          evolved_icon_outline_color?: string | null
          entity_key?: string | null
          phase_number?: number | null
          playlist_id?: string | null
          pokeball?: string
          pokemon_id: number
          pokemon_name: string
          show_encounters?: boolean
          show_total?: boolean
          show_total_seen?: boolean
          total_value?: number | null
          total_seen_count?: number | null
          sprite_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number | null
          caught_date?: string
          created_at?: string
          form?: string | null
          game?: string
          secondary_game?: string | null
          gender?: string | null
          has_shiny_charm?: boolean | null
          hunt_start_date?: string | null
          id?: string
          is_evolved?: boolean
          is_fail?: boolean
          is_gigamax?: boolean
          is_legends_arceus?: boolean | null
          is_unobtainable?: boolean
          method?: string
          notes?: string | null
          evolved_from_id?: number | null
          evolved_from_entity_key?: string | null
          evolved_from_name?: string | null
          evolved_icon_arrow_color?: string | null
          evolved_icon_color?: string | null
          evolved_icon_outline_color?: string | null
          entity_key?: string | null
          phase_number?: number | null
          playlist_id?: string | null
          pokeball?: string
          pokemon_id?: number
          pokemon_name?: string
          show_encounters?: boolean
          show_total?: boolean
          show_total_seen?: boolean
          total_value?: number | null
          total_seen_count?: number | null
          sprite_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_caught_shinies_playlist"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "shiny_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_history: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          changed_fields: string[]
          created_at: string
          id: string
          record_id: string
          source_event_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          changed_fields?: string[]
          created_at?: string
          id?: string
          record_id: string
          source_event_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          changed_fields?: string[]
          created_at?: string
          id?: string
          record_id?: string
          source_event_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_history_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "collection_history"
            referencedColumns: ["id"]
          },
        ]
      }
      hunt_room_members: {
        Row: {
          counter: number
          display_name: string
          joined_at: string
          room_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          counter?: number
          display_name: string
          joined_at?: string
          room_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          counter?: number
          display_name?: string
          joined_at?: string
          room_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hunt_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "hunt_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      hunt_rooms: {
        Row: {
          created_at: string
          found_at: string | null
          host_user_id: string
          id: string
          invite_code: string
          max_members: number
          name: string
          pokemon_form: string | null
          pokemon_game: string | null
          pokemon_gender: string | null
          pokemon_id: number
          pokemon_name: string
          sprite_url: string | null
          status: string
          updated_at: string
          winner_user_id: string | null
        }
        Insert: {
          created_at?: string
          found_at?: string | null
          host_user_id: string
          id?: string
          invite_code: string
          max_members?: number
          name: string
          pokemon_form?: string | null
          pokemon_game?: string | null
          pokemon_gender?: string | null
          pokemon_id: number
          pokemon_name: string
          sprite_url?: string | null
          status?: string
          updated_at?: string
          winner_user_id?: string | null
        }
        Update: {
          created_at?: string
          found_at?: string | null
          host_user_id?: string
          id?: string
          invite_code?: string
          max_members?: number
          name?: string
          pokemon_form?: string | null
          pokemon_game?: string | null
          pokemon_gender?: string | null
          pokemon_id?: number
          pokemon_name?: string
          sprite_url?: string | null
          status?: string
          updated_at?: string
          winner_user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      shiny_playlists: {
        Row: {
          category_type: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_type?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_type?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      theme_preset_overrides: {
        Row: {
          background_color: string
          background_color2: string
          background_color3: string
          background_style: string
          created_at: string
          is_deleted: boolean
          name: string
          preset_id: string
          theme_color: string
          ui_style: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          background_color: string
          background_color2?: string
          background_color3?: string
          background_style: string
          created_at?: string
          is_deleted?: boolean
          name: string
          preset_id: string
          theme_color: string
          ui_style: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          background_color?: string
          background_color2?: string
          background_color3?: string
          background_style?: string
          created_at?: string
          is_deleted?: boolean
          name?: string
          preset_id?: string
          theme_color?: string
          ui_style?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          background_color: string | null
          created_at: string
          id: string
          layout_style: string | null
          theme_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          id?: string
          layout_style?: string | null
          theme_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          id?: string
          layout_style?: string | null
          theme_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sprite_scale_overrides: {
        Row: {
          scale: number
          sprite_url: string
          updated_at: string
        }
        Insert: {
          scale: number
          sprite_url: string
          updated_at?: string
        }
        Update: {
          scale?: number
          sprite_url?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      close_hunt_room: {
        Args: { selected_room_id: string }
        Returns: undefined
      }
      create_hunt_room: {
        Args: {
          room_name: string
          target_pokemon_form: string | null
          target_pokemon_game: string | null
          target_pokemon_gender: string | null
          target_pokemon_id: number
          target_pokemon_name: string
          target_sprite_url: string | null
        }
        Returns: string
      }
      increment_hunt_room_counter: {
        Args: { counter_delta: number; selected_room_id: string }
        Returns: number
      }
      is_hunt_room_member: {
        Args: { checked_room_id: string }
        Returns: boolean
      }
      join_hunt_room: {
        Args: { room_code: string }
        Returns: string
      }
      leave_hunt_room: {
        Args: { selected_room_id: string }
        Returns: undefined
      }
      mark_hunt_room_found: {
        Args: { selected_room_id: string }
        Returns: boolean
      }
      restore_collection_history_event: {
        Args: { history_event_id: string }
        Returns: string
      }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
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
