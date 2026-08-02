// Supabase から自動生成された型定義。
// スキーマを変更したら生成し直してこのファイルを置き換える。
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      entries: {
        Row: {
          archived: boolean
          body: string
          created_at: string
          done: boolean
          done_at: string | null
          due_on: string | null
          id: string
          kind: string
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          body: string
          created_at?: string
          done?: boolean
          done_at?: string | null
          due_on?: string | null
          id?: string
          kind?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived?: boolean
          body?: string
          created_at?: string
          done?: boolean
          done_at?: string | null
          due_on?: string | null
          id?: string
          kind?: string
          tags?: string[]
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

type DefaultSchema = Database["public"]

export type Tables<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Row"]

export type TablesInsert<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Insert"]

export type TablesUpdate<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Update"]
