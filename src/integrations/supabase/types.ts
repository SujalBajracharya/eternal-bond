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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          citizenship_back_url: string | null
          citizenship_front_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          family_type: Database["public"]["Enums"]["family_type"] | null
          father_occupation: string | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          height_cm: number | null
          highest_education:
            | Database["public"]["Enums"]["education_level"]
            | null
          id: string
          income_range: Database["public"]["Enums"]["income_range"] | null
          kundali_name: string | null
          kundali_url: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          location: string | null
          looking_for: Database["public"]["Enums"]["gender_type"] | null
          marital_status:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          mother_occupation: string | null
          mother_tongue: string | null
          phone: string | null
          photo_visibility: Json
          profession: string | null
          profile_completed: boolean
          religion: string | null
          siblings: string | null
          social_links: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          citizenship_back_url?: string | null
          citizenship_front_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          family_type?: Database["public"]["Enums"]["family_type"] | null
          father_occupation?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          highest_education?:
            | Database["public"]["Enums"]["education_level"]
            | null
          id: string
          income_range?: Database["public"]["Enums"]["income_range"] | null
          kundali_name?: string | null
          kundali_url?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          location?: string | null
          looking_for?: Database["public"]["Enums"]["gender_type"] | null
          marital_status?:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          mother_occupation?: string | null
          mother_tongue?: string | null
          phone?: string | null
          photo_visibility?: Json
          profession?: string | null
          profile_completed?: boolean
          religion?: string | null
          siblings?: string | null
          social_links?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          citizenship_back_url?: string | null
          citizenship_front_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          family_type?: Database["public"]["Enums"]["family_type"] | null
          father_occupation?: string | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          highest_education?:
            | Database["public"]["Enums"]["education_level"]
            | null
          id?: string
          income_range?: Database["public"]["Enums"]["income_range"] | null
          kundali_name?: string | null
          kundali_url?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          location?: string | null
          looking_for?: Database["public"]["Enums"]["gender_type"] | null
          marital_status?:
            | Database["public"]["Enums"]["marital_status_type"]
            | null
          mother_occupation?: string | null
          mother_tongue?: string | null
          phone?: string | null
          photo_visibility?: Json
          profession?: string | null
          profile_completed?: boolean
          religion?: string | null
          siblings?: string | null
          social_links?: Json
          updated_at?: string
        }
        Relationships: []
      }
      profile_photos_mapping: {
        Row: {
          photo_url: string
          profile_id: string
          visibility: "visible" | "blurred"
        }
        Insert: {
          photo_url: string
          profile_id: string
          visibility?: "visible" | "blurred"
        }
        Update: {
          photo_url?: string
          profile_id?: string
          visibility?: "visible" | "blurred"
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      education_level:
        | "high_school"
        | "diploma"
        | "bachelors"
        | "masters"
        | "doctorate"
        | "other"
      family_type: "joint" | "nuclear" | "other"
      gender_type: "male" | "female" | "other"
      income_range:
        | "under_5l"
        | "5l_10l"
        | "10l_20l"
        | "20l_50l"
        | "50l_1cr"
        | "above_1cr"
        | "prefer_not_to_say"
      kyc_status: "unverified" | "pending" | "verified" | "rejected"
      marital_status_type:
        | "never_married"
        | "divorced"
        | "widowed"
        | "separated"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      education_level: [
        "high_school",
        "diploma",
        "bachelors",
        "masters",
        "doctorate",
        "other",
      ],
      family_type: ["joint", "nuclear", "other"],
      gender_type: ["male", "female", "other"],
      income_range: [
        "under_5l",
        "5l_10l",
        "10l_20l",
        "20l_50l",
        "50l_1cr",
        "above_1cr",
        "prefer_not_to_say",
      ],
      kyc_status: ["unverified", "pending", "verified", "rejected"],
      marital_status_type: [
        "never_married",
        "divorced",
        "widowed",
        "separated",
      ],
    },
  },
} as const
