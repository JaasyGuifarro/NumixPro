export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      vendors: {
        Row: {
          id: string
          name: string
          email: string
          password: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          password: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          password?: string
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          start_time: string
          end_time: string
          active: boolean
          repeat_daily: boolean
          status: "active" | "closed_awarded" | "closed_not_awarded"
          first_prize?: string
          second_prize?: string
          third_prize?: string
          awarded_at?: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          start_date: string
          end_date: string
          start_time: string
          end_time: string
          active?: boolean
          repeat_daily?: boolean
          status?: "active" | "closed_awarded" | "closed_not_awarded"
          first_prize?: string
          second_prize?: string
          third_prize?: string
          awarded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          end_date?: string
          start_time?: string
          end_time?: string
          active?: boolean
          repeat_daily?: boolean
          status?: "active" | "closed_awarded" | "closed_not_awarded"
          first_prize?: string
          second_prize?: string
          third_prize?: string
          awarded_at?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

