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
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          audience: string
          body: string
          id: string
          sent_at: string
          sent_by: string
          title: string
        }
        Insert: {
          audience?: string
          body: string
          id?: string
          sent_at?: string
          sent_by: string
          title: string
        }
        Update: {
          audience?: string
          body?: string
          id?: string
          sent_at?: string
          sent_by?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_announcement_sender"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_content: {
        Row: {
          content: string
          created_at: string
          id: string
          key: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          key: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          key?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          can_veto_matches: boolean
          created_at: string
          guardian_email: string
          guardian_phone: string | null
          id: string
          is_approved: boolean
          relationship: string
          user_id: string
        }
        Insert: {
          can_veto_matches: boolean
          created_at: string
          guardian_email: string
          guardian_phone?: string | null
          id: string
          is_approved: boolean
          relationship: string
          user_id: string
        }
        Update: {
          can_veto_matches?: boolean
          created_at?: string
          guardian_email?: string
          guardian_phone?: string | null
          id?: string
          is_approved?: boolean
          relationship?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fkmbo1rlwk5ub8qo7k1l8q02vj3"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      filter_config: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string
          tier: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label: string
          tier?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string
          tier?: string
        }
        Relationships: []
      }
      match_preferences: {
        Row: {
          created_at: string
          id: string
          match_id: string
          nickname: string | null
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          nickname?: string | null
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          nickname?: string | null
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_preferences_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_game_night: boolean | null
          status: string | null
          user_one_id: string
          user_two_id: string
        }
        Insert: {
          created_at: string
          expires_at?: string | null
          id: string
          is_game_night?: boolean | null
          status?: string | null
          user_one_id: string
          user_two_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_game_night?: boolean | null
          status?: string | null
          user_one_id?: string
          user_two_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk90qwl66l27nhp2y6gv8maqmo6"
            columns: ["user_one_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fkd4g5coxlna9cnsj0a1icui4es"
            columns: ["user_two_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          extension: string | null
          id: string
          is_read: boolean
          match_id: string
          payload: Json | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at: string
          extension?: string | null
          id: string
          is_read: boolean
          match_id: string
          payload?: Json | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          extension?: string | null
          id?: string
          is_read?: boolean
          match_id?: string
          payload?: Json | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk79kgt6oyju1ma9ly4qmax5933"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fkigt65pktmh2tch9d05wyr8dc3"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_moderation: {
        Row: {
          created_at: string
          decision: string
          flag: string | null
          id: string
          photo_url: string
          reviewed_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          decision?: string
          flag?: string | null
          id?: string
          photo_url: string
          reviewed_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          decision?: string
          flag?: string | null
          id?: string
          photo_url?: string
          reviewed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_photo_mod_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_interests: {
        Row: {
          created_at: string | null
          id: string
          interest: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interest?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_interests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_kundali: {
        Row: {
          birth_date: string
          birth_place: string
          birth_time: string | null
          birth_time_known: boolean
          created_at: string
          id: string
          kundali_generated: boolean
          kundali_name: string
          manglik: boolean | null
          nakshatra: string | null
          profile_id: string
          rashi: string | null
          updated_at: string
        }
        Insert: {
          birth_date: string
          birth_place: string
          birth_time?: string | null
          birth_time_known?: boolean
          created_at?: string
          id?: string
          kundali_generated?: boolean
          kundali_name: string
          manglik?: boolean | null
          nakshatra?: string | null
          profile_id: string
          rashi?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string
          birth_place?: string
          birth_time?: string | null
          birth_time_known?: boolean
          created_at?: string
          id?: string
          kundali_generated?: boolean
          kundali_name?: string
          manglik?: boolean | null
          nakshatra?: string | null
          profile_id?: string
          rashi?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_kundali_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_photos_mapping: {
        Row: {
          photo_url: string | null
          profile_id: string
          visibility: string
        }
        Insert: {
          photo_url?: string | null
          profile_id: string
          visibility?: string
        }
        Update: {
          photo_url?: string | null
          profile_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "fkalr0iln36sqae7duqfy7k48hw"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_preferences: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          pref_age_max: number | null
          pref_age_min: number | null
          pref_education: string | null
          pref_family_assisted: boolean | null
          pref_height_max: number | null
          pref_height_min: number | null
          pref_intention: string | null
          pref_location: string | null
          pref_profession: string | null
          pref_religion: string | null
          pref_relocate: string | null
          pref_verified_only: boolean | null
          preset_name: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          pref_age_max?: number | null
          pref_age_min?: number | null
          pref_education?: string | null
          pref_family_assisted?: boolean | null
          pref_height_max?: number | null
          pref_height_min?: number | null
          pref_intention?: string | null
          pref_location?: string | null
          pref_profession?: string | null
          pref_religion?: string | null
          pref_relocate?: string | null
          pref_verified_only?: boolean | null
          preset_name: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          pref_age_max?: number | null
          pref_age_min?: number | null
          pref_education?: string | null
          pref_family_assisted?: boolean | null
          pref_height_max?: number | null
          pref_height_min?: number | null
          pref_intention?: string | null
          pref_location?: string | null
          pref_profession?: string | null
          pref_religion?: string | null
          pref_relocate?: string | null
          pref_verified_only?: boolean | null
          preset_name?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string | null
          avatar_url: string | null
          bio: string | null
          citizenship_back_url: string | null
          citizenship_front_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          family_type: string | null
          father_occupation: string | null
          full_name: string | null
          gender: string | null
          height_cm: number | null
          highest_education: string | null
          id: string
          income_range: string | null
          kundali_name: string | null
          kundali_url: string | null
          kyc_status: string
          last_active_at: string | null
          location: string | null
          looking_for: string | null
          love_language: string | null
          marital_status: string | null
          marriage_intention: string | null
          mother_occupation: string | null
          mother_tongue: string | null
          open_to_relocate: boolean | null
          personality: string | null
          phone: string | null
          photo_visibility: string
          profession: string | null
          profile_completed: boolean
          profile_visibility: string
          religion: string | null
          siblings: string | null
          social_energy: string | null
          social_links: Json | null
          spotify_track: string | null
          updated_at: string
        }
        Insert: {
          account_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          citizenship_back_url?: string | null
          citizenship_front_url?: string | null
          created_at: string
          date_of_birth?: string | null
          email?: string | null
          family_type?: string | null
          father_occupation?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          highest_education?: string | null
          id: string
          income_range?: string | null
          kundali_name?: string | null
          kundali_url?: string | null
          kyc_status?: string
          last_active_at?: string | null
          location?: string | null
          looking_for?: string | null
          love_language?: string | null
          marital_status?: string | null
          marriage_intention?: string | null
          mother_occupation?: string | null
          mother_tongue?: string | null
          open_to_relocate?: boolean | null
          personality?: string | null
          phone?: string | null
          photo_visibility: string
          profession?: string | null
          profile_completed?: boolean
          profile_visibility: string
          religion?: string | null
          siblings?: string | null
          social_energy?: string | null
          social_links?: Json | null
          spotify_track?: string | null
          updated_at: string
        }
        Update: {
          account_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          citizenship_back_url?: string | null
          citizenship_front_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          family_type?: string | null
          father_occupation?: string | null
          full_name?: string | null
          gender?: string | null
          height_cm?: number | null
          highest_education?: string | null
          id?: string
          income_range?: string | null
          kundali_name?: string | null
          kundali_url?: string | null
          kyc_status?: string
          last_active_at?: string | null
          location?: string | null
          looking_for?: string | null
          love_language?: string | null
          marital_status?: string | null
          marriage_intention?: string | null
          mother_occupation?: string | null
          mother_tongue?: string | null
          open_to_relocate?: boolean | null
          personality?: string | null
          phone?: string | null
          photo_visibility?: string
          profession?: string | null
          profile_completed?: boolean
          profile_visibility?: string
          religion?: string | null
          siblings?: string | null
          social_energy?: string | null
          social_links?: Json | null
          spotify_track?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          status: string
          stripe_subscription_id: string | null
          tier: string
          user_id: string
        }
        Insert: {
          created_at: string
          expires_at: string
          id: string
          status: string
          stripe_subscription_id?: string | null
          tier: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          status?: string
          stripe_subscription_id?: string | null
          tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk9dvq3oidaecg05k9t9sgd8ga9"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      swipes: {
        Row: {
          action: string
          created_at: string
          id: string
          swiped_id: string
          swiper_id: string
        }
        Insert: {
          action: string
          created_at: string
          id: string
          swiped_id: string
          swiper_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          swiped_id?: string
          swiper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fklf7k7id5saw812qad81bv8xer"
            columns: ["swiped_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fksjwf4myub8k0tmyyl5phupoar"
            columns: ["swiper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          created_at: string
          details: string | null
          evidence_urls: string[]
          id: string
          priority: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          evidence_urls?: string[]
          id?: string
          priority?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          evidence_urls?: string[]
          id?: string
          priority?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_report_reported"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_report_reporter"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          password: string
          verification_token: string | null
          verified: boolean
        }
        Insert: {
          created_at: string
          email: string
          full_name: string
          id: string
          password: string
          verification_token?: string | null
          verified: boolean
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          password?: string
          verification_token?: string | null
          verified?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          account_status: string
          created_at: string
          email: string
          full_name: string
          gender: string
          id: string
          kyc_status: string
          last_active_at: string
          phone: string
          profile_completed: boolean
          roles: string[]
        }[]
      }
      admin_stats_v2: { Args: never; Returns: Json }
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
