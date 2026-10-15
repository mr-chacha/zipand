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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      briefings: {
        Row: {
          comment: string | null
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          office_id: string
          property_id: string
          sections: Json
          token: string
          view_count: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          office_id?: string
          property_id: string
          sections?: Json
          token?: string
          view_count?: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          office_id?: string
          property_id?: string
          sections?: Json
          token?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "briefings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefings_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "briefings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          audio_duration_sec: number | null
          audio_name: string | null
          audio_path: string | null
          audio_size: number | null
          channel: string
          consulted_at: string
          content: string
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          office_id: string
        }
        Insert: {
          audio_duration_sec?: number | null
          audio_name?: string | null
          audio_path?: string | null
          audio_size?: number | null
          channel?: string
          consulted_at?: string
          content: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          office_id?: string
        }
        Update: {
          audio_duration_sec?: number | null
          audio_name?: string | null
          audio_path?: string | null
          audio_size?: number | null
          channel?: string
          consulted_at?: string
          content?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          office_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_properties: {
        Row: {
          created_at: string
          customer_id: string
          note: string | null
          office_id: string
          property_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          note?: string | null
          office_id?: string
          property_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          note?: string | null
          office_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_properties_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_properties_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string
          created_by: string | null
          deal_type: string | null
          exclude: string | null
          id: string
          manager_id: string | null
          memo: string | null
          move_in_date: string | null
          must_have: string | null
          name: string
          office_id: string
          phone: string | null
          regions: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          created_by?: string | null
          deal_type?: string | null
          exclude?: string | null
          id?: string
          manager_id?: string | null
          memo?: string | null
          move_in_date?: string | null
          must_have?: string | null
          name: string
          office_id?: string
          phone?: string | null
          regions?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          created_by?: string | null
          deal_type?: string | null
          exclude?: string | null
          id?: string
          manager_id?: string | null
          memo?: string | null
          move_in_date?: string | null
          must_have?: string | null
          name?: string
          office_id?: string
          phone?: string | null
          regions?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_checklist_items: {
        Row: {
          category: string
          created_at: string
          deal_id: string
          done: boolean
          id: string
          label: string
          office_id: string
          sort_order: number
          stage: string
        }
        Insert: {
          category?: string
          created_at?: string
          deal_id: string
          done?: boolean
          id?: string
          label: string
          office_id?: string
          sort_order?: number
          stage?: string
        }
        Update: {
          category?: string
          created_at?: string
          deal_id?: string
          done?: boolean
          id?: string
          label?: string
          office_id?: string
          sort_order?: number
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_checklist_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_checklist_items_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_clauses: {
        Row: {
          body: string
          created_at: string
          deal_id: string
          id: string
          office_id: string
          sort_order: number
        }
        Insert: {
          body: string
          created_at?: string
          deal_id: string
          id?: string
          office_id?: string
          sort_order?: number
        }
        Update: {
          body?: string
          created_at?: string
          deal_id?: string
          id?: string
          office_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "deal_clauses_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_clauses_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_shares: {
        Row: {
          created_at: string
          created_by: string | null
          deal_id: string
          expires_at: string
          id: string
          office_id: string
          token: string
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deal_id: string
          expires_at?: string
          id?: string
          office_id?: string
          token?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deal_id?: string
          expires_at?: string
          id?: string
          office_id?: string
          token?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "deal_shares_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_shares_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_shares_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          amount: number | null
          balance_date: string | null
          balance_note: string | null
          cancel_reason: string | null
          closing_note: string | null
          commission: number | null
          commission_paid: boolean
          contract_date: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          down_payment: number | null
          down_payment_date: string | null
          id: string
          lessee_name: string | null
          lessee_phone: string | null
          lessor_account: string | null
          lessor_name: string | null
          lessor_phone: string | null
          loan_note: string | null
          memo: string | null
          monthly_rent: number | null
          move_in_date: string | null
          office_id: string
          prep_note: string | null
          property_id: string
          stage: string
          terms_note: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          balance_date?: string | null
          balance_note?: string | null
          cancel_reason?: string | null
          closing_note?: string | null
          commission?: number | null
          commission_paid?: boolean
          contract_date?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          down_payment?: number | null
          down_payment_date?: string | null
          id?: string
          lessee_name?: string | null
          lessee_phone?: string | null
          lessor_account?: string | null
          lessor_name?: string | null
          lessor_phone?: string | null
          loan_note?: string | null
          memo?: string | null
          monthly_rent?: number | null
          move_in_date?: string | null
          office_id?: string
          prep_note?: string | null
          property_id: string
          stage?: string
          terms_note?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          balance_date?: string | null
          balance_note?: string | null
          cancel_reason?: string | null
          closing_note?: string | null
          commission?: number | null
          commission_paid?: boolean
          contract_date?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          down_payment?: number | null
          down_payment_date?: string | null
          id?: string
          lessee_name?: string | null
          lessee_phone?: string | null
          lessor_account?: string | null
          lessor_name?: string | null
          lessor_phone?: string | null
          loan_note?: string | null
          memo?: string | null
          monthly_rent?: number | null
          move_in_date?: string | null
          office_id?: string
          prep_note?: string | null
          property_id?: string
          stage?: string
          terms_note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      document_fields: {
        Row: {
          created_at: string
          document_id: string
          evidence_text: string | null
          id: string
          label: string
          office_id: string
          page: number | null
          reviewed: boolean
          value: string
        }
        Insert: {
          created_at?: string
          document_id: string
          evidence_text?: string | null
          id?: string
          label: string
          office_id?: string
          page?: number | null
          reviewed?: boolean
          value: string
        }
        Update: {
          created_at?: string
          document_id?: string
          evidence_text?: string | null
          id?: string
          label?: string
          office_id?: string
          page?: number | null
          reviewed?: boolean
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_fields_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_fields_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signals: {
        Row: {
          created_at: string
          description: string | null
          document_id: string
          evidence_text: string | null
          id: string
          level: string
          next_action: string | null
          office_id: string
          page: number | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_id: string
          evidence_text?: string | null
          id?: string
          level: string
          next_action?: string | null
          office_id?: string
          page?: number | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_id?: string
          evidence_text?: string | null
          id?: string
          level?: string
          next_action?: string | null
          office_id?: string
          page?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_signals_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_signals_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string
          file_name: string
          file_size: number | null
          id: string
          issued_at: string | null
          office_id: string
          property_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          doc_type: string
          file_name: string
          file_size?: number | null
          id?: string
          issued_at?: string | null
          office_id?: string
          property_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_name?: string
          file_size?: number | null
          id?: string
          issued_at?: string | null
          office_id?: string
          property_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      office_clauses: {
        Row: {
          body: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          office_id: string
          title: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          office_id?: string
          title: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          office_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_clauses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_clauses_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      office_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          office_id: string
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          office_id?: string
          role?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          office_id?: string
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_invites_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      office_verification_requests: {
        Row: {
          business_doc_path: string
          business_no: string | null
          created_at: string
          id: string
          license_doc_path: string
          office_id: string
          office_name: string
          registration_no: string | null
          requested_by: string
          review_memo: string | null
          reviewed_at: string | null
          status: string
        }
        Insert: {
          business_doc_path: string
          business_no?: string | null
          created_at?: string
          id?: string
          license_doc_path: string
          office_id?: string
          office_name: string
          registration_no?: string | null
          requested_by?: string
          review_memo?: string | null
          reviewed_at?: string | null
          status?: string
        }
        Update: {
          business_doc_path?: string
          business_no?: string | null
          created_at?: string
          id?: string
          license_doc_path?: string
          office_id?: string
          office_name?: string
          registration_no?: string | null
          requested_by?: string
          review_memo?: string | null
          reviewed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_verification_requests_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_verification_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          address: string | null
          business_no: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          registered_at: string | null
          registration_no: string | null
          registry_data: Json | null
          representative: string | null
        }
        Insert: {
          address?: string | null
          business_no?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          registered_at?: string | null
          registration_no?: string | null
          registry_data?: Json | null
          representative?: string | null
        }
        Update: {
          address?: string | null
          business_no?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          registered_at?: string | null
          registration_no?: string | null
          registry_data?: Json | null
          representative?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          license_no: string | null
          name: string
          office_id: string
          onboarded_at: string | null
          phone: string | null
          role: string
          setup_completed_at: string | null
          verification_status: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id: string
          license_no?: string | null
          name: string
          office_id: string
          onboarded_at?: string | null
          phone?: string | null
          role?: string
          setup_completed_at?: string | null
          verification_status?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          license_no?: string | null
          name?: string
          office_id?: string
          onboarded_at?: string | null
          phone?: string | null
          role?: string
          setup_completed_at?: string | null
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          area_m2: number | null
          available_from: string | null
          available_negotiable: boolean
          baths: number | null
          caretaker_phone: string | null
          created_at: string
          created_by: string | null
          deal_type: string
          description: string | null
          direction: string | null
          floor: number | null
          highlights: string[]
          id: string
          internal_memo: string | null
          landlord_phone: string | null
          maintenance_fee: number | null
          maintenance_items: string[]
          maintenance_status: string | null
          manager_id: string | null
          monthly_rent: number | null
          office_id: string
          price: number
          property_type: string
          region: string | null
          rooms: number | null
          status: string
          tenant_phone: string | null
          title: string
          total_floors: number | null
          updated_at: string
        }
        Insert: {
          address: string
          area_m2?: number | null
          available_from?: string | null
          available_negotiable?: boolean
          baths?: number | null
          caretaker_phone?: string | null
          created_at?: string
          created_by?: string | null
          deal_type: string
          description?: string | null
          direction?: string | null
          floor?: number | null
          highlights?: string[]
          id?: string
          internal_memo?: string | null
          landlord_phone?: string | null
          maintenance_fee?: number | null
          maintenance_items?: string[]
          maintenance_status?: string | null
          manager_id?: string | null
          monthly_rent?: number | null
          office_id?: string
          price?: number
          property_type: string
          region?: string | null
          rooms?: number | null
          status?: string
          tenant_phone?: string | null
          title: string
          total_floors?: number | null
          updated_at?: string
        }
        Update: {
          address?: string
          area_m2?: number | null
          available_from?: string | null
          available_negotiable?: boolean
          baths?: number | null
          caretaker_phone?: string | null
          created_at?: string
          created_by?: string | null
          deal_type?: string
          description?: string | null
          direction?: string | null
          floor?: number | null
          highlights?: string[]
          id?: string
          internal_memo?: string | null
          landlord_phone?: string | null
          maintenance_fee?: number | null
          maintenance_items?: string[]
          maintenance_status?: string | null
          manager_id?: string | null
          monthly_rent?: number | null
          office_id?: string
          price?: number
          property_type?: string
          region?: string | null
          rooms?: number | null
          status?: string
          tenant_phone?: string | null
          title?: string
          total_floors?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      property_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          message: string
          office_id: string
          property_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          message: string
          office_id?: string
          property_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          message?: string
          office_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_events_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_list_items: {
        Row: {
          id: string
          list_id: string
          office_id: string
          property_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          list_id: string
          office_id?: string
          property_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          list_id?: string
          office_id?: string
          property_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "property_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "property_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_list_items_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_list_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_lists: {
        Row: {
          comment: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          expires_at: string
          id: string
          office_id: string
          title: string
          token: string
          view_count: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          expires_at?: string
          id?: string
          office_id?: string
          title: string
          token?: string
          view_count?: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          expires_at?: string
          id?: string
          office_id?: string
          title?: string
          token?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "property_lists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_lists_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_lists_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
        ]
      }
      property_photos: {
        Row: {
          created_at: string
          id: string
          office_id: string
          property_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          office_id?: string
          property_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          office_id?: string
          property_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_photos_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_photos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_videos: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          office_id: string
          property_id: string
          size_bytes: number | null
          sort_order: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          office_id?: string
          property_id: string
          size_bytes?: number | null
          sort_order?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          office_id?: string
          property_id?: string
          size_bytes?: number | null
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_videos_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_videos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_visits: {
        Row: {
          audio_path: string | null
          checklist: Json
          created_at: string
          created_by: string | null
          fields: Json
          follow_ups: string[]
          id: string
          memo: string | null
          office_id: string
          property_id: string
          visited_at: string
        }
        Insert: {
          audio_path?: string | null
          checklist?: Json
          created_at?: string
          created_by?: string | null
          fields?: Json
          follow_ups?: string[]
          id?: string
          memo?: string | null
          office_id?: string
          property_id: string
          visited_at?: string
        }
        Update: {
          audio_path?: string | null
          checklist?: Json
          created_at?: string
          created_by?: string | null
          fields?: Json
          follow_ups?: string[]
          id?: string
          memo?: string | null
          office_id?: string
          property_id?: string
          visited_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_visits_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_visits_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          done: boolean
          due_at: string
          id: string
          office_id: string
          property_id: string | null
          title: string
          type: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          done?: boolean
          due_at: string
          id?: string
          office_id?: string
          property_id?: string | null
          title: string
          type?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          done?: boolean
          due_at?: string
          id?: string
          office_id?: string
          property_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_office_id: { Args: never; Returns: string }
      current_role_is: { Args: { target: string }; Returns: boolean }
      get_briefing: { Args: { briefing_token: string }; Returns: Json }
      get_deal_share: { Args: { share_token: string }; Returns: Json }
      get_invite: {
        Args: { invite_token: string }
        Returns: {
          email: string
          office_name: string
          role: string
        }[]
      }
      get_property_list: { Args: { list_token: string }; Returns: Json }
      is_public_briefing_photo: {
        Args: { object_name: string }
        Returns: boolean
      }
      register_office: {
        Args: {
          p_address: string
          p_business_no: string
          p_name: string
          p_phone: string
          p_registration_no: string
          p_registry: Json
          p_representative: string
          p_secret: string
        }
        Returns: undefined
      }
      unregister_office: { Args: never; Returns: undefined }
      update_member: {
        Args: { member_id: string; new_active: boolean; new_role: string }
        Returns: undefined
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
