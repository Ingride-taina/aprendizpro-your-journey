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
      budgets: {
        Row: {
          categoria: string
          created_at: string
          id: string
          mes_referencia: string
          updated_at: string
          user_id: string
          valor_limite: number
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          mes_referencia: string
          updated_at?: string
          user_id: string
          valor_limite: number
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          mes_referencia?: string
          updated_at?: string
          user_id?: string
          valor_limite?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          descricao: string | null
          dia_inteiro: boolean
          fim: string | null
          id: string
          inicio: string
          lembrete_minutos: number | null
          recorrencia: Database["public"]["Enums"]["recorrencia"]
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          dia_inteiro?: boolean
          fim?: string | null
          id?: string
          inicio: string
          lembrete_minutos?: number | null
          recorrencia?: Database["public"]["Enums"]["recorrencia"]
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          dia_inteiro?: boolean
          fim?: string | null
          id?: string
          inicio?: string
          lembrete_minutos?: number | null
          recorrencia?: Database["public"]["Enums"]["recorrencia"]
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          aporte_mensal: number
          created_at: string
          data_alvo: string | null
          id: string
          meses: number
          taxa_juros_mensal: number
          titulo: string
          updated_at: string
          user_id: string
          valor_alvo: number
          valor_atual: number
        }
        Insert: {
          aporte_mensal?: number
          created_at?: string
          data_alvo?: string | null
          id?: string
          meses?: number
          taxa_juros_mensal?: number
          titulo: string
          updated_at?: string
          user_id: string
          valor_alvo: number
          valor_atual?: number
        }
        Update: {
          aporte_mensal?: number
          created_at?: string
          data_alvo?: string | null
          id?: string
          meses?: number
          taxa_juros_mensal?: number
          titulo?: string
          updated_at?: string
          user_id?: string
          valor_alvo?: number
          valor_atual?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          consentimento_responsavel: boolean
          criado_em: string
          data_nascimento: string | null
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          avatar_url?: string | null
          consentimento_responsavel?: boolean
          criado_em?: string
          data_nascimento?: string | null
          id: string
          nome?: string
          tipo?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          avatar_url?: string | null
          consentimento_responsavel?: boolean
          criado_em?: string
          data_nascimento?: string | null
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      study_plan_steps: {
        Row: {
          concluida: boolean
          created_at: string
          id: string
          ordem: number
          plan_id: string
          prazo: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          concluida?: boolean
          created_at?: string
          id?: string
          ordem?: number
          plan_id: string
          prazo?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          concluida?: boolean
          created_at?: string
          id?: string
          ordem?: number
          plan_id?: string
          prazo?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_plan_steps_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          inicio: string
          meta_horas_semana: number
          prazo: string | null
          status: Database["public"]["Enums"]["status_plano"]
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          inicio?: string
          meta_horas_semana?: number
          prazo?: string | null
          status?: Database["public"]["Enums"]["status_plano"]
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          inicio?: string
          meta_horas_semana?: number
          prazo?: string | null
          status?: Database["public"]["Enums"]["status_plano"]
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          concluida: boolean
          created_at: string
          id: string
          prazo: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          concluida?: boolean
          created_at?: string
          id?: string
          prazo?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          concluida?: boolean
          created_at?: string
          id?: string
          prazo?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          categoria: string
          created_at: string
          data: string
          descricao: string | null
          id: string
          tipo: Database["public"]["Enums"]["tipo_transacao"]
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          tipo: Database["public"]["Enums"]["tipo_transacao"]
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          tipo?: Database["public"]["Enums"]["tipo_transacao"]
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      turma_membros: {
        Row: {
          data_entrada: string
          id: string
          papel_na_turma: Database["public"]["Enums"]["app_role"]
          turma_id: string
          user_id: string
        }
        Insert: {
          data_entrada?: string
          id?: string
          papel_na_turma?: Database["public"]["Enums"]["app_role"]
          turma_id: string
          user_id: string
        }
        Update: {
          data_entrada?: string
          id?: string
          papel_na_turma?: Database["public"]["Enums"]["app_role"]
          turma_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turma_membros_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turma_membros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          ano: number
          codigo: string
          criado_em: string
          criado_por: string | null
          descricao: string | null
          id: string
          nome: string
          periodo: string | null
          status: Database["public"]["Enums"]["turma_status"]
        }
        Insert: {
          ano?: number
          codigo: string
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          nome: string
          periodo?: string | null
          status?: Database["public"]["Enums"]["turma_status"]
        }
        Update: {
          ano?: number
          codigo?: string
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          periodo?: string | null
          status?: Database["public"]["Enums"]["turma_status"]
        }
        Relationships: [
          {
            foreignKeyName: "turmas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      [_ in never]: never
    }
    Enums: {
      app_role: "aluno" | "docente" | "admin"
      recorrencia: "nenhuma" | "diaria" | "semanal" | "mensal"
      status_plano: "ativo" | "concluido" | "pausado"
      tipo_transacao: "entrada" | "saida"
      turma_status: "em_andamento" | "encerrada"
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
    Enums: {
      app_role: ["aluno", "docente", "admin"],
      recorrencia: ["nenhuma", "diaria", "semanal", "mensal"],
      status_plano: ["ativo", "concluido", "pausado"],
      tipo_transacao: ["entrada", "saida"],
      turma_status: ["em_andamento", "encerrada"],
    },
  },
} as const
