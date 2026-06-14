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
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
      boarding_houses: {
        Row: {
          address: string
          approval: Database["public"]["Enums"]["listing_approval"]
          approval_reason: string | null
          contact_number: string
          cover_photo: string | null
          created_at: string
          description: string | null
          distance_meters: number
          house_type: Database["public"]["Enums"]["house_type"]
          id: string
          landmark: string | null
          name: string
          owner_id: string
          photos: string[]
          updated_at: string
        }
        Insert: {
          address: string
          approval?: Database["public"]["Enums"]["listing_approval"]
          approval_reason?: string | null
          contact_number: string
          cover_photo?: string | null
          created_at?: string
          description?: string | null
          distance_meters?: number
          house_type?: Database["public"]["Enums"]["house_type"]
          id?: string
          landmark?: string | null
          name: string
          owner_id: string
          photos?: string[]
          updated_at?: string
        }
        Update: {
          address?: string
          approval?: Database["public"]["Enums"]["listing_approval"]
          approval_reason?: string | null
          contact_number?: string
          cover_photo?: string | null
          created_at?: string
          description?: string | null
          distance_meters?: number
          house_type?: Database["public"]["Enums"]["house_type"]
          id?: string
          landmark?: string | null
          name?: string
          owner_id?: string
          photos?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          boarding_house_id: string
          created_at: string
          customer_id: string
          id: string
        }
        Insert: {
          boarding_house_id: string
          created_at?: string
          customer_id: string
          id?: string
        }
        Update: {
          boarding_house_id?: string
          created_at?: string
          customer_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_boarding_house_id_fkey"
            columns: ["boarding_house_id"]
            isOneToOne: false
            referencedRelation: "boarding_houses"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          boarding_house_id: string
          created_at: string
          customer_id: string
          id: string
          message: string
          status: Database["public"]["Enums"]["inquiry_status"]
          updated_at: string
        }
        Insert: {
          boarding_house_id: string
          created_at?: string
          customer_id: string
          id?: string
          message: string
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Update: {
          boarding_house_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          message?: string
          status?: Database["public"]["Enums"]["inquiry_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_boarding_house_id_fkey"
            columns: ["boarding_house_id"]
            isOneToOne: false
            referencedRelation: "boarding_houses"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_status: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          reason: string | null
          status: Database["public"]["Enums"]["owner_approval"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["owner_approval"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["owner_approval"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          boarding_house_id: string
          capacity: number
          created_at: string
          description: string | null
          id: string
          monthly_rent: number
          photos: string[]
          room_name: string
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
        }
        Insert: {
          boarding_house_id: string
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          monthly_rent?: number
          photos?: string[]
          room_name: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Update: {
          boarding_house_id?: string
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          monthly_rent?: number
          photos?: string[]
          room_name?: string
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_boarding_house_id_fkey"
            columns: ["boarding_house_id"]
            isOneToOne: false
            referencedRelation: "boarding_houses"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      app_role: "admin" | "owner" | "customer"
      house_type: "mixed" | "male_only" | "female_only" | "family"
      inquiry_status: "new" | "responded" | "closed"
      listing_approval: "pending" | "approved" | "rejected"
      owner_approval: "pending" | "approved" | "rejected"
      room_status: "vacant" | "occupied"
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
      app_role: ["admin", "owner", "customer"],
      house_type: ["mixed", "male_only", "female_only", "family"],
      inquiry_status: ["new", "responded", "closed"],
      listing_approval: ["pending", "approved", "rejected"],
      owner_approval: ["pending", "approved", "rejected"],
      room_status: ["vacant", "occupied"],
    },
  },
} as const
