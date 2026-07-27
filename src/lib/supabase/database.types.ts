export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_email_deliveries: {
        Row: {
          auth_user_id: string | null
          created_at: string
          environment: string
          error_code: string | null
          flow: string
          id: string
          profile_id: string | null
          request_id: string
          resend_email_id: string | null
          result_status: string
          role: string
          to_email: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          environment: string
          error_code?: string | null
          flow: string
          id?: string
          profile_id?: string | null
          request_id: string
          resend_email_id?: string | null
          result_status: string
          role: string
          to_email: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          environment?: string
          error_code?: string | null
          flow?: string
          id?: string
          profile_id?: string | null
          request_id?: string
          resend_email_id?: string | null
          result_status?: string
          role?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_email_deliveries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_active_client_snapshots: {
        Row: {
          active_client_quantity: number
          amount_cents: number
          captured_at: string
          id: string
          metadata: Json
          partner_id: string
          reason: string
          stripe_invoice_id: string | null
          stripe_subscription_id: string | null
          subscription_id: string | null
          unit_amount_cents: number
        }
        Insert: {
          active_client_quantity: number
          amount_cents: number
          captured_at?: string
          id?: string
          metadata?: Json
          partner_id: string
          reason: string
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string | null
          unit_amount_cents?: number
        }
        Update: {
          active_client_quantity?: number
          amount_cents?: number
          captured_at?: string
          id?: string
          metadata?: Json
          partner_id?: string
          reason?: string
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string | null
          unit_amount_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_active_client_snapshots_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_active_client_snapshots_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "partner_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          due_at: string
          id: string
          paid_at: string | null
          partner_id: string
          payment_kind: string
          status: string
          stripe_payment_intent_id: string | null
          subscription_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          due_at: string
          id?: string
          paid_at?: string | null
          partner_id: string
          payment_kind: string
          status: string
          stripe_payment_intent_id?: string | null
          subscription_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          due_at?: string
          id?: string
          paid_at?: string | null
          partner_id?: string
          payment_kind?: string
          status?: string
          stripe_payment_intent_id?: string | null
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_payments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "partner_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_plan_addons: {
        Row: {
          billing_interval: string
          created_at: string
          currency: string
          id: string
          is_active: boolean
          lookup_key: string
          name: string
          price_cents: number
          slug: string
          stripe_interval: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
          usage_type: string
        }
        Insert: {
          billing_interval?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          lookup_key: string
          name: string
          price_cents: number
          slug: string
          stripe_interval?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
          usage_type?: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          lookup_key?: string
          name?: string
          price_cents?: number
          slug?: string
          stripe_interval?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
          usage_type?: string
        }
        Relationships: []
      }
      billing_plans: {
        Row: {
          billing_interval: string
          created_at: string
          currency: string
          id: string
          is_active: boolean
          lookup_key: string | null
          name: string
          price_cents: number
          public_metadata: Json
          slug: string
          sort_order: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          stripe_product_lookup_key: string | null
          trial_days: number
          updated_at: string
        }
        Insert: {
          billing_interval: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          lookup_key?: string | null
          name: string
          price_cents: number
          public_metadata?: Json
          slug: string
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_product_lookup_key?: string | null
          trial_days?: number
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          lookup_key?: string | null
          name?: string
          price_cents?: number
          public_metadata?: Json
          slug?: string
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_product_lookup_key?: string | null
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      billing_prices: {
        Row: {
          active: boolean
          billing_product_id: string
          billing_scheme: string
          billing_type: string
          created_at: string
          currency: string
          deleted_at: string | null
          id: string
          last_stripe_event_created_at: string | null
          livemode: boolean
          lookup_key: string | null
          metadata: Json
          recurring_interval: string | null
          recurring_interval_count: number | null
          stripe_created_at: string | null
          stripe_price_id: string
          stripe_product_id: string
          stripe_updated_at: string | null
          tax_behavior: string | null
          unit_amount_cents: number | null
          unit_amount_decimal: string | null
          updated_at: string
          usage_type: string | null
        }
        Insert: {
          active?: boolean
          billing_product_id: string
          billing_scheme: string
          billing_type: string
          created_at?: string
          currency: string
          deleted_at?: string | null
          id?: string
          last_stripe_event_created_at?: string | null
          livemode?: boolean
          lookup_key?: string | null
          metadata?: Json
          recurring_interval?: string | null
          recurring_interval_count?: number | null
          stripe_created_at?: string | null
          stripe_price_id: string
          stripe_product_id: string
          stripe_updated_at?: string | null
          tax_behavior?: string | null
          unit_amount_cents?: number | null
          unit_amount_decimal?: string | null
          updated_at?: string
          usage_type?: string | null
        }
        Update: {
          active?: boolean
          billing_product_id?: string
          billing_scheme?: string
          billing_type?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          last_stripe_event_created_at?: string | null
          livemode?: boolean
          lookup_key?: string | null
          metadata?: Json
          recurring_interval?: string | null
          recurring_interval_count?: number | null
          stripe_created_at?: string | null
          stripe_price_id?: string
          stripe_product_id?: string
          stripe_updated_at?: string | null
          tax_behavior?: string | null
          unit_amount_cents?: number | null
          unit_amount_decimal?: string | null
          updated_at?: string
          usage_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_prices_billing_product_id_fkey"
            columns: ["billing_product_id"]
            isOneToOne: false
            referencedRelation: "billing_products"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_products: {
        Row: {
          active: boolean
          catalog_role: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          last_stripe_event_created_at: string | null
          livemode: boolean
          metadata: Json
          name: string
          stripe_created_at: string | null
          stripe_product_id: string
          stripe_updated_at: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          catalog_role: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          last_stripe_event_created_at?: string | null
          livemode?: boolean
          metadata?: Json
          name: string
          stripe_created_at?: string | null
          stripe_product_id: string
          stripe_updated_at?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          catalog_role?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          last_stripe_event_created_at?: string | null
          livemode?: boolean
          metadata?: Json
          name?: string
          stripe_created_at?: string | null
          stripe_product_id?: string
          stripe_updated_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      billing_sync_outbox: {
        Row: {
          attempts: number
          available_at: string
          created_at: string
          event_type: string
          id: string
          last_error_code: string | null
          last_error_message: string | null
          locked_at: string | null
          partner_id: string
          payload: Json
          processed_at: string | null
          source_record_id: string | null
          source_table: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          available_at?: string
          created_at?: string
          event_type: string
          id?: string
          last_error_code?: string | null
          last_error_message?: string | null
          locked_at?: string | null
          partner_id: string
          payload?: Json
          processed_at?: string | null
          source_record_id?: string | null
          source_table: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          available_at?: string
          created_at?: string
          event_type?: string
          id?: string
          last_error_code?: string | null
          last_error_message?: string | null
          locked_at?: string | null
          partner_id?: string
          payload?: Json
          processed_at?: string | null
          source_record_id?: string | null
          source_table?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_sync_outbox_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      client_diet_daily_logs: {
        Row: {
          created_at: string
          id: string
          log_date: string
          partner_id: string
          patient_id: string
          plan_id: string
          updated_at: string
          water_ml: number
        }
        Insert: {
          created_at?: string
          id?: string
          log_date?: string
          partner_id: string
          patient_id: string
          plan_id: string
          updated_at?: string
          water_ml?: number
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          partner_id?: string
          patient_id?: string
          plan_id?: string
          updated_at?: string
          water_ml?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_diet_daily_logs_plan_match_fkey"
            columns: ["plan_id", "partner_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "partner_client_diet_plans"
            referencedColumns: ["id", "partner_id", "patient_id"]
          },
        ]
      }
      client_diet_events: {
        Row: {
          created_at: string
          detail: string
          details: Json
          event_type: string
          id: string
          log_date: string
          meal_id: string | null
          partner_id: string
          patient_id: string
          plan_id: string
        }
        Insert: {
          created_at?: string
          detail: string
          details?: Json
          event_type: string
          id?: string
          log_date?: string
          meal_id?: string | null
          partner_id: string
          patient_id: string
          plan_id: string
        }
        Update: {
          created_at?: string
          detail?: string
          details?: Json
          event_type?: string
          id?: string
          log_date?: string
          meal_id?: string | null
          partner_id?: string
          patient_id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_diet_events_meal_match_fkey"
            columns: ["meal_id", "plan_id", "partner_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "partner_client_diet_meals"
            referencedColumns: ["id", "plan_id", "partner_id", "patient_id"]
          },
          {
            foreignKeyName: "client_diet_events_plan_match_fkey"
            columns: ["plan_id", "partner_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "partner_client_diet_plans"
            referencedColumns: ["id", "partner_id", "patient_id"]
          },
        ]
      }
      client_diet_meal_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          log_date: string
          meal_id: string
          notes: string | null
          partner_id: string
          patient_id: string
          photo_mime_type: string | null
          photo_original_filename: string | null
          photo_storage_path: string | null
          plan_id: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          log_date?: string
          meal_id: string
          notes?: string | null
          partner_id: string
          patient_id: string
          photo_mime_type?: string | null
          photo_original_filename?: string | null
          photo_storage_path?: string | null
          plan_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          log_date?: string
          meal_id?: string
          notes?: string | null
          partner_id?: string
          patient_id?: string
          photo_mime_type?: string | null
          photo_original_filename?: string | null
          photo_storage_path?: string | null
          plan_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_diet_meal_logs_meal_match_fkey"
            columns: ["meal_id", "plan_id", "partner_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "partner_client_diet_meals"
            referencedColumns: ["id", "plan_id", "partner_id", "patient_id"]
          },
        ]
      }
      client_diet_substitution_logs: {
        Row: {
          applied_at: string
          created_at: string
          food_id: string
          id: string
          item_id: string
          log_date: string
          meal_id: string
          partner_id: string
          patient_id: string
          plan_id: string
          replacement_carbs_g: number
          replacement_fat_g: number
          replacement_fiber_g: number
          replacement_kcal: number
          replacement_name: string
          replacement_protein_g: number
          replacement_serving_size: number
          replacement_serving_unit: string
          updated_at: string
        }
        Insert: {
          applied_at?: string
          created_at?: string
          food_id: string
          id?: string
          item_id: string
          log_date?: string
          meal_id: string
          partner_id: string
          patient_id: string
          plan_id: string
          replacement_carbs_g: number
          replacement_fat_g: number
          replacement_fiber_g?: number
          replacement_kcal: number
          replacement_name: string
          replacement_protein_g: number
          replacement_serving_size: number
          replacement_serving_unit: string
          updated_at?: string
        }
        Update: {
          applied_at?: string
          created_at?: string
          food_id?: string
          id?: string
          item_id?: string
          log_date?: string
          meal_id?: string
          partner_id?: string
          patient_id?: string
          plan_id?: string
          replacement_carbs_g?: number
          replacement_fat_g?: number
          replacement_fiber_g?: number
          replacement_kcal?: number
          replacement_name?: string
          replacement_protein_g?: number
          replacement_serving_size?: number
          replacement_serving_unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_diet_substitution_logs_food_partner_fkey"
            columns: ["food_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_protocol_foods"
            referencedColumns: ["id", "partner_id"]
          },
          {
            foreignKeyName: "client_diet_substitution_logs_item_match_fkey"
            columns: [
              "item_id",
              "meal_id",
              "plan_id",
              "partner_id",
              "patient_id",
            ]
            isOneToOne: false
            referencedRelation: "partner_client_diet_meal_items"
            referencedColumns: [
              "id",
              "meal_id",
              "plan_id",
              "partner_id",
              "patient_id",
            ]
          },
        ]
      }
      client_health_action_logs: {
        Row: {
          action_key: string
          completed_at: string
          created_at: string
          id: string
          log_date: string
          partner_id: string
          patient_id: string
          status: string
          updated_at: string
        }
        Insert: {
          action_key: string
          completed_at?: string
          created_at?: string
          id?: string
          log_date?: string
          partner_id: string
          patient_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_key?: string
          completed_at?: string
          created_at?: string
          id?: string
          log_date?: string
          partner_id?: string
          patient_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_health_action_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_health_action_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_health_daily_logs: {
        Row: {
          created_at: string
          hydration_ml: number
          id: string
          log_date: string
          partner_id: string
          patient_id: string
          sleep_deep_minutes: number | null
          sleep_efficiency_pct: number | null
          sleep_latency_minutes: number | null
          sleep_minutes: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hydration_ml?: number
          id?: string
          log_date?: string
          partner_id: string
          patient_id: string
          sleep_deep_minutes?: number | null
          sleep_efficiency_pct?: number | null
          sleep_latency_minutes?: number | null
          sleep_minutes?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hydration_ml?: number
          id?: string
          log_date?: string
          partner_id?: string
          patient_id?: string
          sleep_deep_minutes?: number | null
          sleep_efficiency_pct?: number | null
          sleep_latency_minutes?: number | null
          sleep_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_health_daily_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_health_daily_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_health_events: {
        Row: {
          created_at: string
          detail: string
          details: Json
          event_type: string
          id: string
          partner_id: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          detail: string
          details?: Json
          event_type: string
          id?: string
          partner_id: string
          patient_id: string
        }
        Update: {
          created_at?: string
          detail?: string
          details?: Json
          event_type?: string
          id?: string
          partner_id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_health_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_health_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_health_medication_logs: {
        Row: {
          created_at: string
          id: string
          log_date: string
          medication_id: string
          partner_id: string
          patient_id: string
          status: string
          taken_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_date?: string
          medication_id: string
          partner_id: string
          patient_id: string
          status?: string
          taken_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          medication_id?: string
          partner_id?: string
          patient_id?: string
          status?: string
          taken_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_health_medication_logs_medication_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "client_health_medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_health_medication_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_health_medications: {
        Row: {
          created_at: string
          dosage: string
          id: string
          name: string
          partner_id: string
          patient_id: string
          schedule_time: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage: string
          id?: string
          name: string
          partner_id: string
          patient_id: string
          schedule_time: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string
          id?: string
          name?: string
          partner_id?: string
          patient_id?: string
          schedule_time?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_health_medications_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_health_medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_health_pressure_logs: {
        Row: {
          created_at: string
          diastolic: number
          id: string
          measured_at: string
          notes: string | null
          partner_id: string
          patient_id: string
          systolic: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          diastolic: number
          id?: string
          measured_at?: string
          notes?: string | null
          partner_id: string
          patient_id: string
          systolic: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          diastolic?: number
          id?: string
          measured_at?: string
          notes?: string | null
          partner_id?: string
          patient_id?: string
          systolic?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_health_pressure_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_health_pressure_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_workout_events: {
        Row: {
          client_session_id: string | null
          created_at: string
          detail: string
          details: Json
          event_type: string
          id: string
          partner_id: string
          patient_id: string
          prescribed_session_id: string | null
          program_id: string
        }
        Insert: {
          client_session_id?: string | null
          created_at?: string
          detail: string
          details?: Json
          event_type: string
          id?: string
          partner_id: string
          patient_id: string
          prescribed_session_id?: string | null
          program_id: string
        }
        Update: {
          client_session_id?: string | null
          created_at?: string
          detail?: string
          details?: Json
          event_type?: string
          id?: string
          partner_id?: string
          patient_id?: string
          prescribed_session_id?: string | null
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_workout_events_client_session_id_fkey"
            columns: ["client_session_id"]
            isOneToOne: false
            referencedRelation: "client_workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_workout_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_workout_events_prescribed_match_fkey"
            columns: ["prescribed_session_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_workout_sessions"
            referencedColumns: ["id", "partner_id"]
          },
          {
            foreignKeyName: "client_workout_events_program_match_fkey"
            columns: ["program_id", "partner_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "partner_workout_programs"
            referencedColumns: ["id", "partner_id", "patient_id"]
          },
        ]
      }
      client_workout_exercise_logs: {
        Row: {
          client_session_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          partner_id: string
          patient_id: string
          prescribed_exercise_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_session_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          partner_id: string
          patient_id: string
          prescribed_exercise_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_session_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          partner_id?: string
          patient_id?: string
          prescribed_exercise_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_workout_exercise_logs_client_session_id_fkey"
            columns: ["client_session_id"]
            isOneToOne: false
            referencedRelation: "client_workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_workout_exercise_logs_exercise_match_fkey"
            columns: ["prescribed_exercise_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_workout_exercises"
            referencedColumns: ["id", "partner_id"]
          },
          {
            foreignKeyName: "client_workout_exercise_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_workout_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          partner_id: string
          patient_id: string
          prescribed_session_id: string
          program_id: string
          started_at: string | null
          status: string
          total_volume_kg: number
          updated_at: string
          workout_date: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          partner_id: string
          patient_id: string
          prescribed_session_id: string
          program_id: string
          started_at?: string | null
          status?: string
          total_volume_kg?: number
          updated_at?: string
          workout_date?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          partner_id?: string
          patient_id?: string
          prescribed_session_id?: string
          program_id?: string
          started_at?: string | null
          status?: string
          total_volume_kg?: number
          updated_at?: string
          workout_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_workout_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_workout_sessions_prescribed_match_fkey"
            columns: ["prescribed_session_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_workout_sessions"
            referencedColumns: ["id", "partner_id"]
          },
          {
            foreignKeyName: "client_workout_sessions_program_match_fkey"
            columns: ["program_id", "partner_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "partner_workout_programs"
            referencedColumns: ["id", "partner_id", "patient_id"]
          },
        ]
      }
      client_workout_set_logs: {
        Row: {
          client_session_id: string
          completed_at: string | null
          created_at: string
          exercise_log_id: string
          id: string
          load_kg: number | null
          partner_id: string
          patient_id: string
          prescribed_exercise_id: string
          prescribed_set_id: string
          reps: number | null
          set_number: number
          status: string
          updated_at: string
        }
        Insert: {
          client_session_id: string
          completed_at?: string | null
          created_at?: string
          exercise_log_id: string
          id?: string
          load_kg?: number | null
          partner_id: string
          patient_id: string
          prescribed_exercise_id: string
          prescribed_set_id: string
          reps?: number | null
          set_number: number
          status?: string
          updated_at?: string
        }
        Update: {
          client_session_id?: string
          completed_at?: string | null
          created_at?: string
          exercise_log_id?: string
          id?: string
          load_kg?: number | null
          partner_id?: string
          patient_id?: string
          prescribed_exercise_id?: string
          prescribed_set_id?: string
          reps?: number | null
          set_number?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_workout_set_logs_client_session_id_fkey"
            columns: ["client_session_id"]
            isOneToOne: false
            referencedRelation: "client_workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_workout_set_logs_exercise_log_id_fkey"
            columns: ["exercise_log_id"]
            isOneToOne: false
            referencedRelation: "client_workout_exercise_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_workout_set_logs_exercise_match_fkey"
            columns: ["prescribed_exercise_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_workout_exercises"
            referencedColumns: ["id", "partner_id"]
          },
          {
            foreignKeyName: "client_workout_set_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_workout_set_logs_prescribed_set_id_fkey"
            columns: ["prescribed_set_id"]
            isOneToOne: false
            referencedRelation: "partner_workout_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verification_tokens: {
        Row: {
          auth_user_id: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          profile_id: string
          purpose: string
          token_hash: string
        }
        Insert: {
          auth_user_id: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          profile_id: string
          purpose: string
          token_hash: string
        }
        Update: {
          auth_user_id?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          profile_id?: string
          purpose?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_verification_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_billing_trial_usage: {
        Row: {
          created_at: string
          first_subscription_id: string | null
          partner_id: string
          stripe_subscription_id: string | null
          used_at: string
        }
        Insert: {
          created_at?: string
          first_subscription_id?: string | null
          partner_id: string
          stripe_subscription_id?: string | null
          used_at?: string
        }
        Update: {
          created_at?: string
          first_subscription_id?: string | null
          partner_id?: string
          stripe_subscription_id?: string | null
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_billing_trial_usage_first_subscription_id_fkey"
            columns: ["first_subscription_id"]
            isOneToOne: false
            referencedRelation: "partner_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_billing_trial_usage_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_calendar_blocks: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          partner_id: string
          reason: string | null
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          partner_id: string
          reason?: string | null
          starts_at: string
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          partner_id?: string
          reason?: string | null
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_calendar_blocks_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_adherence_snapshots: {
        Row: {
          created_at: string
          diet_percentage: number | null
          id: string
          partner_id: string
          patient_id: string
          period_end: string
          period_start: string
          training_percentage: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          diet_percentage?: number | null
          id?: string
          partner_id: string
          patient_id: string
          period_end: string
          period_start: string
          training_percentage?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          diet_percentage?: number | null
          id?: string
          partner_id?: string
          patient_id?: string
          period_end?: string
          period_start?: string
          training_percentage?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_adherence_snapshots_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_adherence_snapshots_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_anamnesis_entries: {
        Row: {
          content: string
          created_at: string
          created_by_profile_id: string | null
          id: string
          is_current: boolean
          partner_id: string
          patient_id: string
          sections: Json
          summary: string | null
          title: string
          updated_at: string
          version_number: number
        }
        Insert: {
          content: string
          created_at?: string
          created_by_profile_id?: string | null
          id?: string
          is_current?: boolean
          partner_id: string
          patient_id: string
          sections?: Json
          summary?: string | null
          title: string
          updated_at?: string
          version_number: number
        }
        Update: {
          content?: string
          created_at?: string
          created_by_profile_id?: string | null
          id?: string
          is_current?: boolean
          partner_id?: string
          patient_id?: string
          sections?: Json
          summary?: string | null
          title?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_anamnesis_entries_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_anamnesis_entries_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_anamnesis_entries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_appointments: {
        Row: {
          appointment_type: string
          created_at: string
          ends_at: string
          id: string
          location_text: string | null
          modality: string
          notes: string | null
          partner_id: string
          patient_id: string
          reminder_minutes: number
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          appointment_type?: string
          created_at?: string
          ends_at: string
          id?: string
          location_text?: string | null
          modality?: string
          notes?: string | null
          partner_id: string
          patient_id: string
          reminder_minutes?: number
          starts_at: string
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          appointment_type?: string
          created_at?: string
          ends_at?: string
          id?: string
          location_text?: string | null
          modality?: string
          notes?: string | null
          partner_id?: string
          patient_id?: string
          reminder_minutes?: number
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_appointments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_assessment_circumferences: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          metric_key: string
          partner_id: string
          patient_id: string
          updated_at: string
          value_cm: number
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          metric_key: string
          partner_id: string
          patient_id: string
          updated_at?: string
          value_cm: number
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          metric_key?: string
          partner_id?: string
          patient_id?: string
          updated_at?: string
          value_cm?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_assessment_circumferences_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "partner_client_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_assessment_circumferences_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_assessment_circumferences_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_assessment_skinfolds: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          metric_key: string
          partner_id: string
          patient_id: string
          updated_at: string
          value_mm: number
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          metric_key: string
          partner_id: string
          patient_id: string
          updated_at?: string
          value_mm: number
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          metric_key?: string
          partner_id?: string
          patient_id?: string
          updated_at?: string
          value_mm?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_assessment_skinfolds_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "partner_client_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_assessment_skinfolds_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_assessment_skinfolds_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_assessments: {
        Row: {
          activity_level: string
          assessed_at: string
          assessment_method: string
          body_fat_percentage: number | null
          created_at: string
          height_cm: number
          id: string
          muscle_mass_kg: number | null
          notes: string | null
          partner_id: string
          patient_id: string
          target_days: number
          target_weight_kg: number | null
          title: string
          updated_at: string
          weight_kg: number
        }
        Insert: {
          activity_level?: string
          assessed_at: string
          assessment_method?: string
          body_fat_percentage?: number | null
          created_at?: string
          height_cm: number
          id?: string
          muscle_mass_kg?: number | null
          notes?: string | null
          partner_id: string
          patient_id: string
          target_days?: number
          target_weight_kg?: number | null
          title?: string
          updated_at?: string
          weight_kg: number
        }
        Update: {
          activity_level?: string
          assessed_at?: string
          assessment_method?: string
          body_fat_percentage?: number | null
          created_at?: string
          height_cm?: number
          id?: string
          muscle_mass_kg?: number | null
          notes?: string | null
          partner_id?: string
          patient_id?: string
          target_days?: number
          target_weight_kg?: number | null
          title?: string
          updated_at?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_assessments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_body_measurements: {
        Row: {
          body_fat_percentage: number | null
          created_at: string
          id: string
          measured_at: string
          notes: string | null
          partner_id: string
          patient_id: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          body_fat_percentage?: number | null
          created_at?: string
          id?: string
          measured_at: string
          notes?: string | null
          partner_id: string
          patient_id: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          body_fat_percentage?: number | null
          created_at?: string
          id?: string
          measured_at?: string
          notes?: string | null
          partner_id?: string
          patient_id?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_body_measurements_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_body_measurements_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_calorie_calculations: {
        Row: {
          activity_factor: number
          assessment_id: string | null
          bmr_kcal: number
          created_at: string
          daily_energy_delta_kcal: number
          formula: string
          id: string
          inputs: Json
          partner_id: string
          patient_id: string
          projected_weight_delta_kg: number
          status: string
          target_days: number
          target_kcal: number
          target_weight_kg: number | null
          tdee_kcal: number
          updated_at: string
          weekly_energy_delta_kcal: number
        }
        Insert: {
          activity_factor: number
          assessment_id?: string | null
          bmr_kcal: number
          created_at?: string
          daily_energy_delta_kcal: number
          formula: string
          id?: string
          inputs?: Json
          partner_id: string
          patient_id: string
          projected_weight_delta_kg: number
          status?: string
          target_days: number
          target_kcal: number
          target_weight_kg?: number | null
          tdee_kcal: number
          updated_at?: string
          weekly_energy_delta_kcal: number
        }
        Update: {
          activity_factor?: number
          assessment_id?: string | null
          bmr_kcal?: number
          created_at?: string
          daily_energy_delta_kcal?: number
          formula?: string
          id?: string
          inputs?: Json
          partner_id?: string
          patient_id?: string
          projected_weight_delta_kg?: number
          status?: string
          target_days?: number
          target_kcal?: number
          target_weight_kg?: number | null
          tdee_kcal?: number
          updated_at?: string
          weekly_energy_delta_kcal?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_calorie_calculations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "partner_client_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_calorie_calculations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_calorie_calculations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_cardio_calculations: {
        Row: {
          activity_key: string
          comparison_activity_key: string
          comparison_kcal_estimate: number
          comparison_kcal_per_min: number
          comparison_met: number
          created_at: string
          duration_minutes: number
          id: string
          kcal_estimate: number
          kcal_per_min: number
          met: number
          parameters: Json
          partner_id: string
          patient_id: string
          plan_id: string
          target_zone: string
          weight_kg: number
        }
        Insert: {
          activity_key: string
          comparison_activity_key: string
          comparison_kcal_estimate: number
          comparison_kcal_per_min: number
          comparison_met: number
          created_at?: string
          duration_minutes: number
          id?: string
          kcal_estimate: number
          kcal_per_min: number
          met: number
          parameters?: Json
          partner_id: string
          patient_id: string
          plan_id: string
          target_zone: string
          weight_kg: number
        }
        Update: {
          activity_key?: string
          comparison_activity_key?: string
          comparison_kcal_estimate?: number
          comparison_kcal_per_min?: number
          comparison_met?: number
          created_at?: string
          duration_minutes?: number
          id?: string
          kcal_estimate?: number
          kcal_per_min?: number
          met?: number
          parameters?: Json
          partner_id?: string
          patient_id?: string
          plan_id?: string
          target_zone?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_cardio_calculations_plan_fkey"
            columns: ["plan_id", "partner_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "partner_client_cardio_plans"
            referencedColumns: ["id", "partner_id", "patient_id"]
          },
        ]
      }
      partner_client_cardio_events: {
        Row: {
          actor_name: string | null
          created_at: string
          detail: string
          details: Json
          event_type: string
          id: string
          partner_id: string
          patient_id: string
          plan_id: string
          version: number
        }
        Insert: {
          actor_name?: string | null
          created_at?: string
          detail: string
          details?: Json
          event_type: string
          id?: string
          partner_id: string
          patient_id: string
          plan_id: string
          version?: number
        }
        Update: {
          actor_name?: string | null
          created_at?: string
          detail?: string
          details?: Json
          event_type?: string
          id?: string
          partner_id?: string
          patient_id?: string
          plan_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_cardio_events_plan_fkey"
            columns: ["plan_id", "partner_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "partner_client_cardio_plans"
            referencedColumns: ["id", "partner_id", "patient_id"]
          },
        ]
      }
      partner_client_cardio_plans: {
        Row: {
          comparison_activity_key: string
          created_at: string
          id: string
          notes: string | null
          partner_id: string
          patient_id: string
          primary_activity_key: string
          published_at: string | null
          sent_at: string | null
          status: string
          target_zone: string
          title: string
          updated_at: string
          version: number
          weekly_target_minutes: number
          weight_kg: number
        }
        Insert: {
          comparison_activity_key?: string
          created_at?: string
          id?: string
          notes?: string | null
          partner_id: string
          patient_id: string
          primary_activity_key?: string
          published_at?: string | null
          sent_at?: string | null
          status?: string
          target_zone?: string
          title?: string
          updated_at?: string
          version?: number
          weekly_target_minutes?: number
          weight_kg: number
        }
        Update: {
          comparison_activity_key?: string
          created_at?: string
          id?: string
          notes?: string | null
          partner_id?: string
          patient_id?: string
          primary_activity_key?: string
          published_at?: string | null
          sent_at?: string | null
          status?: string
          target_zone?: string
          title?: string
          updated_at?: string
          version?: number
          weekly_target_minutes?: number
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_cardio_plans_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_cardio_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_cardio_sessions: {
        Row: {
          activity_key: string
          created_at: string
          duration_minutes: number
          id: string
          kcal_estimate: number
          met: number
          notes: string | null
          partner_id: string
          patient_id: string
          performed_at: string
          plan_id: string
          target_zone: string
          updated_at: string
        }
        Insert: {
          activity_key: string
          created_at?: string
          duration_minutes: number
          id?: string
          kcal_estimate: number
          met: number
          notes?: string | null
          partner_id: string
          patient_id: string
          performed_at: string
          plan_id: string
          target_zone: string
          updated_at?: string
        }
        Update: {
          activity_key?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          kcal_estimate?: number
          met?: number
          notes?: string | null
          partner_id?: string
          patient_id?: string
          performed_at?: string
          plan_id?: string
          target_zone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_cardio_sessions_plan_fkey"
            columns: ["plan_id", "partner_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "partner_client_cardio_plans"
            referencedColumns: ["id", "partner_id", "patient_id"]
          },
        ]
      }
      partner_client_diet_events: {
        Row: {
          actor_name: string | null
          created_at: string
          detail: string
          details: Json
          event_type: string
          id: string
          partner_id: string
          patient_id: string
          plan_id: string
          version: number
        }
        Insert: {
          actor_name?: string | null
          created_at?: string
          detail: string
          details?: Json
          event_type: string
          id?: string
          partner_id: string
          patient_id: string
          plan_id: string
          version?: number
        }
        Update: {
          actor_name?: string | null
          created_at?: string
          detail?: string
          details?: Json
          event_type?: string
          id?: string
          partner_id?: string
          patient_id?: string
          plan_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_diet_events_plan_match_fkey"
            columns: ["plan_id", "partner_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "partner_client_diet_plans"
            referencedColumns: ["id", "partner_id", "patient_id"]
          },
        ]
      }
      partner_client_diet_meal_items: {
        Row: {
          created_at: string
          food_id: string | null
          household_measure: string | null
          id: string
          meal_id: string
          partner_id: string
          patient_id: string
          plan_id: string
          quantity: number
          quantity_unit: string
          snapshot_carbs_g: number
          snapshot_fat_g: number
          snapshot_fiber_g: number
          snapshot_kcal: number
          snapshot_name: string
          snapshot_protein_g: number
          snapshot_serving_size: number
          snapshot_serving_unit: string
          snapshot_sodium_mg: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          food_id?: string | null
          household_measure?: string | null
          id?: string
          meal_id: string
          partner_id: string
          patient_id: string
          plan_id: string
          quantity: number
          quantity_unit: string
          snapshot_carbs_g: number
          snapshot_fat_g: number
          snapshot_fiber_g?: number
          snapshot_kcal: number
          snapshot_name: string
          snapshot_protein_g: number
          snapshot_serving_size: number
          snapshot_serving_unit: string
          snapshot_sodium_mg?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          food_id?: string | null
          household_measure?: string | null
          id?: string
          meal_id?: string
          partner_id?: string
          patient_id?: string
          plan_id?: string
          quantity?: number
          quantity_unit?: string
          snapshot_carbs_g?: number
          snapshot_fat_g?: number
          snapshot_fiber_g?: number
          snapshot_kcal?: number
          snapshot_name?: string
          snapshot_protein_g?: number
          snapshot_serving_size?: number
          snapshot_serving_unit?: string
          snapshot_sodium_mg?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_diet_items_food_partner_fkey"
            columns: ["food_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_protocol_foods"
            referencedColumns: ["id", "partner_id"]
          },
          {
            foreignKeyName: "partner_client_diet_items_meal_match_fkey"
            columns: ["meal_id", "plan_id", "partner_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "partner_client_diet_meals"
            referencedColumns: ["id", "plan_id", "partner_id", "patient_id"]
          },
        ]
      }
      partner_client_diet_meals: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          meal_time: string
          menu_option: number
          option_label: string
          partner_id: string
          patient_id: string
          plan_id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number
          id?: string
          meal_time: string
          menu_option?: number
          option_label?: string
          partner_id: string
          patient_id: string
          plan_id: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          meal_time?: string
          menu_option?: number
          option_label?: string
          partner_id?: string
          patient_id?: string
          plan_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_diet_meals_plan_match_fkey"
            columns: ["plan_id", "partner_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "partner_client_diet_plans"
            referencedColumns: ["id", "partner_id", "patient_id"]
          },
        ]
      }
      partner_client_diet_plans: {
        Row: {
          calorie_strategy: string
          created_at: string
          id: string
          notes: string | null
          partner_id: string
          patient_id: string
          published_at: string | null
          review_on: string | null
          sent_at: string | null
          starts_on: string | null
          status: string
          target_carbs_g: number
          target_fat_g: number
          target_kcal: number
          target_protein_g: number
          title: string
          updated_at: string
          version: number
          water_liters: number
        }
        Insert: {
          calorie_strategy?: string
          created_at?: string
          id?: string
          notes?: string | null
          partner_id: string
          patient_id: string
          published_at?: string | null
          review_on?: string | null
          sent_at?: string | null
          starts_on?: string | null
          status?: string
          target_carbs_g?: number
          target_fat_g?: number
          target_kcal?: number
          target_protein_g?: number
          title: string
          updated_at?: string
          version?: number
          water_liters?: number
        }
        Update: {
          calorie_strategy?: string
          created_at?: string
          id?: string
          notes?: string | null
          partner_id?: string
          patient_id?: string
          published_at?: string | null
          review_on?: string | null
          sent_at?: string | null
          starts_on?: string | null
          status?: string
          target_carbs_g?: number
          target_fat_g?: number
          target_kcal?: number
          target_protein_g?: number
          title?: string
          updated_at?: string
          version?: number
          water_liters?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_diet_plans_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_diet_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_exam_collections: {
        Row: {
          collected_at: string
          created_at: string
          id: string
          notes: string | null
          partner_id: string
          patient_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          collected_at: string
          created_at?: string
          id?: string
          notes?: string | null
          partner_id: string
          patient_id: string
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          collected_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          partner_id?: string
          patient_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_exam_collections_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_exam_collections_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_exam_events: {
        Row: {
          actor_name: string | null
          collection_id: string | null
          created_at: string
          detail: string
          details: Json
          event_type: string
          exam_id: string | null
          id: string
          partner_id: string
          patient_id: string | null
        }
        Insert: {
          actor_name?: string | null
          collection_id?: string | null
          created_at?: string
          detail: string
          details?: Json
          event_type: string
          exam_id?: string | null
          id?: string
          partner_id: string
          patient_id?: string | null
        }
        Update: {
          actor_name?: string | null
          collection_id?: string | null
          created_at?: string
          detail?: string
          details?: Json
          event_type?: string
          exam_id?: string | null
          id?: string
          partner_id?: string
          patient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_exam_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_exam_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_exam_results: {
        Row: {
          collection_id: string
          conversion_factor_from_default: number | null
          created_at: string
          default_unit: string
          exam_id: string
          id: string
          input_unit: string
          input_value: number
          notes: string | null
          partner_id: string
          patient_id: string
          reference_high: number | null
          reference_low: number | null
          reference_sex: string
          snapshot_category_name: string
          snapshot_category_slug: string
          snapshot_exam_name: string
          snapshot_exam_slug: string
          status: string
          updated_at: string
          value_default: number
        }
        Insert: {
          collection_id: string
          conversion_factor_from_default?: number | null
          created_at?: string
          default_unit: string
          exam_id: string
          id?: string
          input_unit: string
          input_value: number
          notes?: string | null
          partner_id: string
          patient_id: string
          reference_high?: number | null
          reference_low?: number | null
          reference_sex?: string
          snapshot_category_name: string
          snapshot_category_slug: string
          snapshot_exam_name: string
          snapshot_exam_slug: string
          status?: string
          updated_at?: string
          value_default: number
        }
        Update: {
          collection_id?: string
          conversion_factor_from_default?: number | null
          created_at?: string
          default_unit?: string
          exam_id?: string
          id?: string
          input_unit?: string
          input_value?: number
          notes?: string | null
          partner_id?: string
          patient_id?: string
          reference_high?: number | null
          reference_low?: number | null
          reference_sex?: string
          snapshot_category_name?: string
          snapshot_category_slug?: string
          snapshot_exam_name?: string
          snapshot_exam_slug?: string
          status?: string
          updated_at?: string
          value_default?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_exam_results_collection_fkey"
            columns: ["collection_id", "partner_id", "patient_id"]
            isOneToOne: false
            referencedRelation: "partner_client_exam_collections"
            referencedColumns: ["id", "partner_id", "patient_id"]
          },
          {
            foreignKeyName: "partner_client_exam_results_exam_fkey"
            columns: ["exam_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_exam_definitions"
            referencedColumns: ["id", "partner_id"]
          },
        ]
      }
      partner_client_goals: {
        Row: {
          adherence_target_pct: number
          created_at: string
          id: string
          partner_id: string
          patient_id: string
          target_body_fat_max_pct: number | null
          target_body_fat_min_pct: number | null
          target_weight_kg: number | null
          updated_at: string
        }
        Insert: {
          adherence_target_pct?: number
          created_at?: string
          id?: string
          partner_id: string
          patient_id: string
          target_body_fat_max_pct?: number | null
          target_body_fat_min_pct?: number | null
          target_weight_kg?: number | null
          updated_at?: string
        }
        Update: {
          adherence_target_pct?: number
          created_at?: string
          id?: string
          partner_id?: string
          patient_id?: string
          target_body_fat_max_pct?: number | null
          target_body_fat_min_pct?: number | null
          target_weight_kg?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_goals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_goals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_observations: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          metadata: Json
          observation_type: string
          occurred_at: string
          partner_id: string
          patient_id: string
          severity: string
          title: string
          updated_at: string
          value_text: string | null
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          metadata?: Json
          observation_type: string
          occurred_at: string
          partner_id: string
          patient_id: string
          severity?: string
          title: string
          updated_at?: string
          value_text?: string | null
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          metadata?: Json
          observation_type?: string
          occurred_at?: string
          partner_id?: string
          patient_id?: string
          severity?: string
          title?: string
          updated_at?: string
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_observations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_observations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_photo_comparison_notes: {
        Row: {
          after_session_id: string
          before_session_id: string
          created_at: string
          id: string
          notes: string
          partner_id: string
          patient_id: string
          updated_at: string
        }
        Insert: {
          after_session_id: string
          before_session_id: string
          created_at?: string
          id?: string
          notes: string
          partner_id: string
          patient_id: string
          updated_at?: string
        }
        Update: {
          after_session_id?: string
          before_session_id?: string
          created_at?: string
          id?: string
          notes?: string
          partner_id?: string
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_photo_comparison_notes_after_fkey"
            columns: ["after_session_id"]
            isOneToOne: false
            referencedRelation: "partner_client_photo_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_photo_comparison_notes_before_fkey"
            columns: ["before_session_id"]
            isOneToOne: false
            referencedRelation: "partner_client_photo_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_photo_comparison_notes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_photo_comparison_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_photo_events: {
        Row: {
          actor_name: string | null
          created_at: string
          detail: string
          details: Json
          event_type: string
          id: string
          partner_id: string
          patient_id: string | null
          session_id: string | null
        }
        Insert: {
          actor_name?: string | null
          created_at?: string
          detail: string
          details?: Json
          event_type: string
          id?: string
          partner_id: string
          patient_id?: string | null
          session_id?: string | null
        }
        Update: {
          actor_name?: string | null
          created_at?: string
          detail?: string
          details?: Json
          event_type?: string
          id?: string
          partner_id?: string
          patient_id?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_photo_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_photo_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_photo_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "partner_client_photo_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_photo_items: {
        Row: {
          angle: string
          created_at: string
          crop_data: Json
          height_px: number | null
          id: string
          mime_type: string
          original_filename: string
          partner_id: string
          patient_id: string
          session_id: string
          size_bytes: number
          storage_path: string
          updated_at: string
          width_px: number | null
        }
        Insert: {
          angle: string
          created_at?: string
          crop_data?: Json
          height_px?: number | null
          id?: string
          mime_type: string
          original_filename: string
          partner_id: string
          patient_id: string
          session_id: string
          size_bytes: number
          storage_path: string
          updated_at?: string
          width_px?: number | null
        }
        Update: {
          angle?: string
          created_at?: string
          crop_data?: Json
          height_px?: number | null
          id?: string
          mime_type?: string
          original_filename?: string
          partner_id?: string
          patient_id?: string
          session_id?: string
          size_bytes?: number
          storage_path?: string
          updated_at?: string
          width_px?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_photo_items_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_photo_items_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_photo_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "partner_client_photo_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_photo_sessions: {
        Row: {
          captured_at: string
          created_at: string
          id: string
          notes: string | null
          partner_id: string
          patient_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          captured_at: string
          created_at?: string
          id?: string
          notes?: string | null
          partner_id: string
          patient_id: string
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          captured_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          partner_id?: string
          patient_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_photo_sessions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_photo_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_plan_contracts: {
        Row: {
          billing_interval_snapshot: string
          category_snapshot: string
          created_at: string
          duration_cycles_snapshot: number
          end_date: string | null
          first_due_date: string
          id: string
          includes_diet_snapshot: boolean
          includes_training_snapshot: boolean
          notes: string | null
          partner_id: string
          patient_id: string
          plan_name_snapshot: string
          price_cents_snapshot: number
          renewal_reminder: boolean
          service_plan_id: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          billing_interval_snapshot: string
          category_snapshot: string
          created_at?: string
          duration_cycles_snapshot: number
          end_date?: string | null
          first_due_date: string
          id?: string
          includes_diet_snapshot?: boolean
          includes_training_snapshot?: boolean
          notes?: string | null
          partner_id: string
          patient_id: string
          plan_name_snapshot: string
          price_cents_snapshot: number
          renewal_reminder?: boolean
          service_plan_id?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          billing_interval_snapshot?: string
          category_snapshot?: string
          created_at?: string
          duration_cycles_snapshot?: number
          end_date?: string | null
          first_due_date?: string
          id?: string
          includes_diet_snapshot?: boolean
          includes_training_snapshot?: boolean
          notes?: string | null
          partner_id?: string
          patient_id?: string
          plan_name_snapshot?: string
          price_cents_snapshot?: number
          renewal_reminder?: boolean
          service_plan_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_plan_contracts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_plan_contracts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_plan_contracts_service_plan_id_fkey"
            columns: ["service_plan_id"]
            isOneToOne: false
            referencedRelation: "partner_service_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_plan_modules: {
        Row: {
          created_at: string
          id: string
          module_type: string
          partner_id: string
          patient_id: string
          primary_summary: string
          secondary_summary: string | null
          subscription_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_type: string
          partner_id: string
          patient_id: string
          primary_summary: string
          secondary_summary?: string | null
          subscription_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          module_type?: string
          partner_id?: string
          patient_id?: string
          primary_summary?: string
          secondary_summary?: string | null
          subscription_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_plan_modules_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_plan_modules_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_plan_modules_subscription_match_fkey"
            columns: ["partner_id", "patient_id", "subscription_id"]
            isOneToOne: false
            referencedRelation: "partner_client_plan_subscriptions"
            referencedColumns: ["partner_id", "patient_id", "id"]
          },
        ]
      }
      partner_client_plan_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          custom_plan_id: string
          id: string
          partner_id: string
          patient_id: string
          status: string
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          custom_plan_id: string
          id?: string
          partner_id: string
          patient_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          custom_plan_id?: string
          id?: string
          partner_id?: string
          patient_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_plan_subscriptions_custom_plan_id_fkey"
            columns: ["custom_plan_id"]
            isOneToOne: false
            referencedRelation: "partner_custom_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_plan_subscriptions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_plan_subscriptions_partner_plan_match"
            columns: ["partner_id", "custom_plan_id"]
            isOneToOne: false
            referencedRelation: "partner_custom_plans"
            referencedColumns: ["partner_id", "id"]
          },
          {
            foreignKeyName: "partner_client_plan_subscriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_prescription_notes: {
        Row: {
          archived_at: string | null
          content: string
          created_at: string
          created_by_profile_id: string | null
          id: string
          instructions: string | null
          partner_id: string
          patient_id: string
          prescription_type: string
          published_at: string | null
          status: string
          summary: string | null
          title: string
          updated_at: string
          version_number: number
        }
        Insert: {
          archived_at?: string | null
          content: string
          created_at?: string
          created_by_profile_id?: string | null
          id?: string
          instructions?: string | null
          partner_id: string
          patient_id: string
          prescription_type?: string
          published_at?: string | null
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          version_number: number
        }
        Update: {
          archived_at?: string | null
          content?: string
          created_at?: string
          created_by_profile_id?: string | null
          id?: string
          instructions?: string | null
          partner_id?: string
          patient_id?: string
          prescription_type?: string
          published_at?: string | null
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_prescription_notes_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_prescription_notes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_prescription_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_receivables: {
        Row: {
          amount_cents: number
          contract_id: string
          created_at: string
          due_date: string
          id: string
          installment_number: number
          paid_at: string | null
          partner_id: string
          patient_id: string
          payment_method: string | null
          payment_notes: string | null
          payment_reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          paid_at?: string | null
          partner_id: string
          patient_id: string
          payment_method?: string | null
          payment_notes?: string | null
          payment_reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          paid_at?: string | null
          partner_id?: string
          patient_id?: string
          payment_method?: string | null
          payment_notes?: string | null
          payment_reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_receivables_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "partner_client_plan_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_receivables_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_receivables_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_client_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          partner_id: string
          patient_id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          partner_id: string
          patient_id: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          partner_id?: string
          patient_id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_client_tasks_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_client_tasks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_clients: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          partner_id: string
          patient_id: string
          service_scope: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          partner_id: string
          patient_id: string
          service_scope: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          partner_id?: string
          patient_id?: string
          service_scope?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_clients_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_clients_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_custom_plans: {
        Row: {
          billing_interval: string
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          partner_id: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          billing_interval?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          partner_id: string
          price_cents: number
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          partner_id?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_custom_plans_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_documents: {
        Row: {
          created_at: string
          document_type: string
          due_at: string | null
          id: string
          partner_id: string
          reviewed_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type: string
          due_at?: string | null
          id?: string
          partner_id: string
          reviewed_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          due_at?: string | null
          id?: string
          partner_id?: string
          reviewed_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_documents_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_exam_alternative_units: {
        Row: {
          created_at: string
          exam_id: string
          factor_from_default: number
          id: string
          partner_id: string
          status: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          factor_from_default: number
          id?: string
          partner_id: string
          status?: string
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          factor_from_default?: number
          id?: string
          partner_id?: string
          status?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_exam_alternative_units_exam_fkey"
            columns: ["exam_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_exam_definitions"
            referencedColumns: ["id", "partner_id"]
          },
        ]
      }
      partner_exam_categories: {
        Row: {
          created_at: string
          icon_key: string
          id: string
          name: string
          partner_id: string
          slug: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon_key?: string
          id?: string
          name: string
          partner_id: string
          slug: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon_key?: string
          id?: string
          name?: string
          partner_id?: string
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_exam_categories_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_exam_definitions: {
        Row: {
          category_id: string
          created_at: string
          default_unit: string
          id: string
          name: string
          notes: string | null
          partner_id: string
          slug: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          default_unit: string
          id?: string
          name: string
          notes?: string | null
          partner_id: string
          slug: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          default_unit?: string
          id?: string
          name?: string
          notes?: string | null
          partner_id?: string
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_exam_definitions_category_fkey"
            columns: ["category_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_exam_categories"
            referencedColumns: ["id", "partner_id"]
          },
        ]
      }
      partner_exam_reference_ranges: {
        Row: {
          created_at: string
          exam_id: string
          high_value: number | null
          id: string
          label: string | null
          low_value: number | null
          partner_id: string
          sex: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          high_value?: number | null
          id?: string
          label?: string | null
          low_value?: number | null
          partner_id: string
          sex?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          high_value?: number | null
          id?: string
          label?: string | null
          low_value?: number | null
          partner_id?: string
          sex?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_exam_reference_ranges_exam_fkey"
            columns: ["exam_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_exam_definitions"
            referencedColumns: ["id", "partner_id"]
          },
        ]
      }
      partner_financial_events: {
        Row: {
          contract_id: string | null
          created_at: string
          detail: string
          event_type: string
          id: string
          metadata: Json
          partner_id: string
          patient_id: string | null
          receivable_id: string | null
          service_plan_id: string | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          detail: string
          event_type: string
          id?: string
          metadata?: Json
          partner_id: string
          patient_id?: string | null
          receivable_id?: string | null
          service_plan_id?: string | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          detail?: string
          event_type?: string
          id?: string
          metadata?: Json
          partner_id?: string
          patient_id?: string | null
          receivable_id?: string | null
          service_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_financial_events_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "partner_client_plan_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_financial_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_financial_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_financial_events_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "partner_client_receivables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_financial_events_service_plan_id_fkey"
            columns: ["service_plan_id"]
            isOneToOne: false
            referencedRelation: "partner_service_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_form_assignment_clients: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          opened_at: string | null
          partner_id: string
          patient_id: string
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          opened_at?: string | null
          partner_id: string
          patient_id: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          opened_at?: string | null
          partner_id?: string
          patient_id?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_form_assignment_clients_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "partner_form_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_form_assignment_clients_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_form_assignment_clients_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_form_assignments: {
        Row: {
          created_at: string
          created_by_profile_id: string | null
          due_at: string | null
          id: string
          message: string | null
          partner_id: string
          request_key: string | null
          sent_at: string | null
          status: string
          template_id: string
          template_snapshot: Json
          template_version_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_profile_id?: string | null
          due_at?: string | null
          id?: string
          message?: string | null
          partner_id: string
          request_key?: string | null
          sent_at?: string | null
          status?: string
          template_id: string
          template_snapshot: Json
          template_version_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_profile_id?: string | null
          due_at?: string | null
          id?: string
          message?: string | null
          partner_id?: string
          request_key?: string | null
          sent_at?: string | null
          status?: string
          template_id?: string
          template_snapshot?: Json
          template_version_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_form_assignments_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_form_assignments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_form_assignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "partner_form_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_form_assignments_template_version_id_fkey"
            columns: ["template_version_id"]
            isOneToOne: false
            referencedRelation: "partner_form_template_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_form_questions: {
        Row: {
          created_at: string
          help_text: string | null
          id: string
          options: Json
          partner_id: string
          prompt: string
          question_type: string
          required: boolean
          scale_max: number | null
          scale_min: number | null
          settings: Json
          sort_order: number
          template_id: string
          template_version_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          help_text?: string | null
          id?: string
          options?: Json
          partner_id: string
          prompt: string
          question_type: string
          required?: boolean
          scale_max?: number | null
          scale_min?: number | null
          settings?: Json
          sort_order: number
          template_id: string
          template_version_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          help_text?: string | null
          id?: string
          options?: Json
          partner_id?: string
          prompt?: string
          question_type?: string
          required?: boolean
          scale_max?: number | null
          scale_min?: number | null
          settings?: Json
          sort_order?: number
          template_id?: string
          template_version_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_form_questions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_form_questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "partner_form_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_form_questions_template_version_id_fkey"
            columns: ["template_version_id"]
            isOneToOne: false
            referencedRelation: "partner_form_template_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_form_response_answers: {
        Row: {
          created_at: string
          id: string
          partner_id: string
          patient_id: string
          question_id: string
          response_id: string
          updated_at: string
          value_json: Json
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id: string
          patient_id: string
          question_id: string
          response_id: string
          updated_at?: string
          value_json?: Json
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: string
          patient_id?: string
          question_id?: string
          response_id?: string
          updated_at?: string
          value_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "partner_form_response_answers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_form_response_answers_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_form_response_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "partner_form_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_form_response_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "partner_form_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_form_responses: {
        Row: {
          assignment_client_id: string
          assignment_id: string
          created_at: string
          id: string
          partner_id: string
          patient_id: string
          started_at: string
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assignment_client_id: string
          assignment_id: string
          created_at?: string
          id?: string
          partner_id: string
          patient_id: string
          started_at?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assignment_client_id?: string
          assignment_id?: string
          created_at?: string
          id?: string
          partner_id?: string
          patient_id?: string
          started_at?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_form_responses_assignment_client_id_fkey"
            columns: ["assignment_client_id"]
            isOneToOne: true
            referencedRelation: "partner_form_assignment_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_form_responses_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "partner_form_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_form_responses_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_form_responses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_form_template_versions: {
        Row: {
          created_at: string
          created_by_profile_id: string | null
          default_message: string | null
          description: string | null
          id: string
          partner_id: string
          published_at: string | null
          questions_snapshot: Json
          status: string
          template_id: string
          title: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by_profile_id?: string | null
          default_message?: string | null
          description?: string | null
          id?: string
          partner_id: string
          published_at?: string | null
          questions_snapshot: Json
          status: string
          template_id: string
          title: string
          version_number: number
        }
        Update: {
          created_at?: string
          created_by_profile_id?: string | null
          default_message?: string | null
          description?: string | null
          id?: string
          partner_id?: string
          published_at?: string | null
          questions_snapshot?: Json
          status?: string
          template_id?: string
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_form_template_versions_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_form_template_versions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_form_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "partner_form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_form_templates: {
        Row: {
          created_at: string
          created_by_profile_id: string | null
          default_message: string | null
          description: string | null
          id: string
          partner_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_profile_id?: string | null
          default_message?: string | null
          description?: string | null
          id?: string
          partner_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_profile_id?: string | null
          default_message?: string | null
          description?: string | null
          id?: string
          partner_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_form_templates_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_form_templates_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_material_events: {
        Row: {
          details: Json
          event_type: string
          id: string
          material_id: string
          occurred_at: string
          partner_id: string
          patient_id: string | null
        }
        Insert: {
          details?: Json
          event_type: string
          id?: string
          material_id: string
          occurred_at?: string
          partner_id: string
          patient_id?: string | null
        }
        Update: {
          details?: Json
          event_type?: string
          id?: string
          material_id?: string
          occurred_at?: string
          partner_id?: string
          patient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_material_events_material_partner_fkey"
            columns: ["material_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_materials"
            referencedColumns: ["id", "partner_id"]
          },
          {
            foreignKeyName: "partner_material_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_material_shares: {
        Row: {
          created_at: string
          id: string
          material_id: string
          message: string | null
          partner_id: string
          patient_id: string
          revoked_at: string | null
          shared_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          message?: string | null
          partner_id: string
          patient_id: string
          revoked_at?: string | null
          shared_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          message?: string | null
          partner_id?: string
          patient_id?: string
          revoked_at?: string | null
          shared_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_material_shares_material_partner_fkey"
            columns: ["material_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_materials"
            referencedColumns: ["id", "partner_id"]
          },
          {
            foreignKeyName: "partner_material_shares_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_materials: {
        Row: {
          category: string
          cover_storage_path: string | null
          created_at: string
          description: string | null
          external_url: string | null
          file_type: string
          id: string
          is_favorite: boolean
          material_kind: string
          mime_type: string | null
          original_filename: string | null
          partner_id: string
          size_bytes: number | null
          status: string
          storage_path: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          cover_storage_path?: string | null
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_type: string
          id?: string
          is_favorite?: boolean
          material_kind: string
          mime_type?: string | null
          original_filename?: string | null
          partner_id: string
          size_bytes?: number | null
          status?: string
          storage_path?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_storage_path?: string | null
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_type?: string
          id?: string
          is_favorite?: boolean
          material_kind?: string
          mime_type?: string | null
          original_filename?: string | null
          partner_id?: string
          size_bytes?: number | null
          status?: string
          storage_path?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_materials_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_protocol_events: {
        Row: {
          details: Json
          event_type: string
          exercise_id: string | null
          food_id: string | null
          id: string
          item_type: string
          occurred_at: string
          partner_id: string
        }
        Insert: {
          details?: Json
          event_type: string
          exercise_id?: string | null
          food_id?: string | null
          id?: string
          item_type: string
          occurred_at?: string
          partner_id: string
        }
        Update: {
          details?: Json
          event_type?: string
          exercise_id?: string | null
          food_id?: string | null
          id?: string
          item_type?: string
          occurred_at?: string
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_protocol_events_exercise_partner_fkey"
            columns: ["exercise_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_protocol_exercises"
            referencedColumns: ["id", "partner_id"]
          },
          {
            foreignKeyName: "partner_protocol_events_food_partner_fkey"
            columns: ["food_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_protocol_foods"
            referencedColumns: ["id", "partner_id"]
          },
          {
            foreignKeyName: "partner_protocol_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_protocol_exercises: {
        Row: {
          cadence: string | null
          created_at: string
          default_reps: string
          default_sets: number
          equipment: string
          id: string
          instructions: string | null
          level: string
          muscle_group: string
          name: string
          objective: string
          partner_id: string
          rest_seconds: number
          secondary_muscle_groups: string[]
          status: string
          tags: string[]
          thumbnail_url: string | null
          updated_at: string
          usage_count: number
          variations: string[]
          video_url: string | null
        }
        Insert: {
          cadence?: string | null
          created_at?: string
          default_reps?: string
          default_sets?: number
          equipment?: string
          id?: string
          instructions?: string | null
          level?: string
          muscle_group: string
          name: string
          objective?: string
          partner_id: string
          rest_seconds?: number
          secondary_muscle_groups?: string[]
          status?: string
          tags?: string[]
          thumbnail_url?: string | null
          updated_at?: string
          usage_count?: number
          variations?: string[]
          video_url?: string | null
        }
        Update: {
          cadence?: string | null
          created_at?: string
          default_reps?: string
          default_sets?: number
          equipment?: string
          id?: string
          instructions?: string | null
          level?: string
          muscle_group?: string
          name?: string
          objective?: string
          partner_id?: string
          rest_seconds?: number
          secondary_muscle_groups?: string[]
          status?: string
          tags?: string[]
          thumbnail_url?: string | null
          updated_at?: string
          usage_count?: number
          variations?: string[]
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_protocol_exercises_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_protocol_foods: {
        Row: {
          carbs_g: number
          category: string
          created_at: string
          fat_g: number
          fiber_g: number
          household_measure: string | null
          id: string
          kcal: number
          name: string
          notes: string | null
          partner_id: string
          protein_g: number
          serving_size: number
          serving_unit: string
          sodium_mg: number
          source: string
          status: string
          suggested_uses: string[]
          tags: string[]
          updated_at: string
          usage_count: number
        }
        Insert: {
          carbs_g?: number
          category?: string
          created_at?: string
          fat_g?: number
          fiber_g?: number
          household_measure?: string | null
          id?: string
          kcal?: number
          name: string
          notes?: string | null
          partner_id: string
          protein_g?: number
          serving_size?: number
          serving_unit?: string
          sodium_mg?: number
          source?: string
          status?: string
          suggested_uses?: string[]
          tags?: string[]
          updated_at?: string
          usage_count?: number
        }
        Update: {
          carbs_g?: number
          category?: string
          created_at?: string
          fat_g?: number
          fiber_g?: number
          household_measure?: string | null
          id?: string
          kcal?: number
          name?: string
          notes?: string | null
          partner_id?: string
          protein_g?: number
          serving_size?: number
          serving_unit?: string
          sodium_mg?: number
          source?: string
          status?: string
          suggested_uses?: string[]
          tags?: string[]
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_protocol_foods_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_protocol_use_drafts: {
        Row: {
          created_at: string
          exercise_id: string | null
          food_id: string | null
          id: string
          item_type: string
          notes: string | null
          partner_id: string
          patient_id: string | null
          plan_context: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exercise_id?: string | null
          food_id?: string | null
          id?: string
          item_type: string
          notes?: string | null
          partner_id: string
          patient_id?: string | null
          plan_context?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exercise_id?: string | null
          food_id?: string | null
          id?: string
          item_type?: string
          notes?: string | null
          partner_id?: string
          patient_id?: string | null
          plan_context?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_protocol_use_drafts_exercise_partner_fkey"
            columns: ["exercise_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_protocol_exercises"
            referencedColumns: ["id", "partner_id"]
          },
          {
            foreignKeyName: "partner_protocol_use_drafts_food_partner_fkey"
            columns: ["food_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_protocol_foods"
            referencedColumns: ["id", "partner_id"]
          },
          {
            foreignKeyName: "partner_protocol_use_drafts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_protocol_use_drafts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_service_plans: {
        Row: {
          billing_interval: string
          category: string
          created_at: string
          currency: string
          description: string | null
          duration_cycles: number
          id: string
          includes_diet: boolean
          includes_training: boolean
          interval_count: number
          name: string
          notes: string | null
          partner_id: string
          price_cents: number
          status: string
          updated_at: string
        }
        Insert: {
          billing_interval: string
          category: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_cycles?: number
          id?: string
          includes_diet?: boolean
          includes_training?: boolean
          interval_count?: number
          name: string
          notes?: string | null
          partner_id: string
          price_cents: number
          status?: string
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_cycles?: number
          id?: string
          includes_diet?: boolean
          includes_training?: boolean
          interval_count?: number
          name?: string
          notes?: string | null
          partner_id?: string
          price_cents?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_service_plans_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_subscription_financial_summaries: {
        Row: {
          active_client_quantity: number
          active_client_subtotal_cents: number
          active_client_unit_amount_cents: number
          created_at: string
          currency: string
          discount_amount_cents: number
          discount_code: string | null
          discount_duration: string | null
          discount_label: string | null
          partner_id: string
          plan_base_amount_cents: number
          source: string
          stripe_coupon_id: string | null
          stripe_event_created_at: string | null
          stripe_invoice_id: string | null
          stripe_promotion_code_id: string | null
          stripe_subscription_id: string | null
          subscription_id: string
          subtotal_cents: number
          synced_at: string
          total_after_discount_cents: number
          updated_at: string
        }
        Insert: {
          active_client_quantity?: number
          active_client_subtotal_cents?: number
          active_client_unit_amount_cents?: number
          created_at?: string
          currency?: string
          discount_amount_cents?: number
          discount_code?: string | null
          discount_duration?: string | null
          discount_label?: string | null
          partner_id: string
          plan_base_amount_cents?: number
          source?: string
          stripe_coupon_id?: string | null
          stripe_event_created_at?: string | null
          stripe_invoice_id?: string | null
          stripe_promotion_code_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id: string
          subtotal_cents?: number
          synced_at?: string
          total_after_discount_cents?: number
          updated_at?: string
        }
        Update: {
          active_client_quantity?: number
          active_client_subtotal_cents?: number
          active_client_unit_amount_cents?: number
          created_at?: string
          currency?: string
          discount_amount_cents?: number
          discount_code?: string | null
          discount_duration?: string | null
          discount_label?: string | null
          partner_id?: string
          plan_base_amount_cents?: number
          source?: string
          stripe_coupon_id?: string | null
          stripe_event_created_at?: string | null
          stripe_invoice_id?: string | null
          stripe_promotion_code_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string
          subtotal_cents?: number
          synced_at?: string
          total_after_discount_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_subscription_financial_summaries_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_subscription_financial_summaries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: true
            referencedRelation: "partner_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_subscription_items: {
        Row: {
          billing_addon_id: string | null
          billing_plan_id: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          item_kind: string
          lookup_key: string
          partner_id: string
          quantity: number
          stripe_subscription_item_id: string | null
          subscription_id: string
          unit_amount_cents: number
          updated_at: string
        }
        Insert: {
          billing_addon_id?: string | null
          billing_plan_id?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          item_kind: string
          lookup_key: string
          partner_id: string
          quantity?: number
          stripe_subscription_item_id?: string | null
          subscription_id: string
          unit_amount_cents: number
          updated_at?: string
        }
        Update: {
          billing_addon_id?: string | null
          billing_plan_id?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          item_kind?: string
          lookup_key?: string
          partner_id?: string
          quantity?: number
          stripe_subscription_item_id?: string | null
          subscription_id?: string
          unit_amount_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_subscription_items_billing_addon_id_fkey"
            columns: ["billing_addon_id"]
            isOneToOne: false
            referencedRelation: "billing_plan_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_subscription_items_billing_plan_id_fkey"
            columns: ["billing_plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_subscription_items_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_subscription_items_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "partner_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_subscriptions: {
        Row: {
          active_client_quantity: number
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          default_payment_method_id: string | null
          ended_at: string | null
          id: string
          last_quantity_synced_at: string | null
          latest_invoice_id: string | null
          metadata: Json
          partner_id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_last_event_created_at: string | null
          stripe_status: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
        }
        Insert: {
          active_client_quantity?: number
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          default_payment_method_id?: string | null
          ended_at?: string | null
          id?: string
          last_quantity_synced_at?: string | null
          latest_invoice_id?: string | null
          metadata?: Json
          partner_id: string
          plan_id: string
          status: string
          stripe_customer_id?: string | null
          stripe_last_event_created_at?: string | null
          stripe_status?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Update: {
          active_client_quantity?: number
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          default_payment_method_id?: string | null
          ended_at?: string | null
          id?: string
          last_quantity_synced_at?: string | null
          latest_invoice_id?: string | null
          metadata?: Json
          partner_id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_last_event_created_at?: string | null
          stripe_status?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_subscriptions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_workout_events: {
        Row: {
          actor_name: string | null
          created_at: string
          detail: string
          details: Json
          event_type: string
          id: string
          partner_id: string
          patient_id: string | null
          program_id: string
          version: number
        }
        Insert: {
          actor_name?: string | null
          created_at?: string
          detail: string
          details?: Json
          event_type: string
          id?: string
          partner_id: string
          patient_id?: string | null
          program_id: string
          version?: number
        }
        Update: {
          actor_name?: string | null
          created_at?: string
          detail?: string
          details?: Json
          event_type?: string
          id?: string
          partner_id?: string
          patient_id?: string | null
          program_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_workout_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_workout_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_workout_events_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "partner_workout_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_workout_exercises: {
        Row: {
          biset_group_id: string | null
          biset_position: number | null
          cadence: string | null
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          partner_id: string
          rest_seconds: number
          session_id: string
          snapshot_muscle_group: string
          snapshot_name: string
          snapshot_secondary_muscle_groups: string[]
          snapshot_thumbnail_url: string | null
          sort_order: number
          technique: string
          updated_at: string
          variation_name: string | null
        }
        Insert: {
          biset_group_id?: string | null
          biset_position?: number | null
          cadence?: string | null
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          partner_id: string
          rest_seconds?: number
          session_id: string
          snapshot_muscle_group: string
          snapshot_name: string
          snapshot_secondary_muscle_groups?: string[]
          snapshot_thumbnail_url?: string | null
          sort_order?: number
          technique?: string
          updated_at?: string
          variation_name?: string | null
        }
        Update: {
          biset_group_id?: string | null
          biset_position?: number | null
          cadence?: string | null
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          partner_id?: string
          rest_seconds?: number
          session_id?: string
          snapshot_muscle_group?: string
          snapshot_name?: string
          snapshot_secondary_muscle_groups?: string[]
          snapshot_thumbnail_url?: string | null
          sort_order?: number
          technique?: string
          updated_at?: string
          variation_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_workout_exercises_library_partner_fkey"
            columns: ["exercise_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_protocol_exercises"
            referencedColumns: ["id", "partner_id"]
          },
          {
            foreignKeyName: "partner_workout_exercises_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_workout_exercises_session_partner_fkey"
            columns: ["session_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_workout_sessions"
            referencedColumns: ["id", "partner_id"]
          },
        ]
      }
      partner_workout_programs: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          partner_id: string
          patient_id: string | null
          program_kind: string
          published_at: string | null
          sent_at: string | null
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          partner_id: string
          patient_id?: string | null
          program_kind?: string
          published_at?: string | null
          sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          partner_id?: string
          patient_id?: string | null
          program_kind?: string
          published_at?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_workout_programs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_workout_programs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_workout_sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          frequency_per_week: number
          id: string
          objective: string
          partner_id: string
          program_id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          frequency_per_week?: number
          id?: string
          objective?: string
          partner_id: string
          program_id: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          frequency_per_week?: number
          id?: string
          objective?: string
          partner_id?: string
          program_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_workout_sessions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_workout_sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "partner_workout_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_workout_sessions_program_partner_fkey"
            columns: ["program_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_workout_programs"
            referencedColumns: ["id", "partner_id"]
          },
        ]
      }
      partner_workout_sets: {
        Row: {
          created_at: string
          id: string
          intensity: string
          load_kg: number | null
          partner_id: string
          prescribed_exercise_id: string
          reps: number | null
          set_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          intensity?: string
          load_kg?: number | null
          partner_id: string
          prescribed_exercise_id: string
          reps?: number | null
          set_number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          intensity?: string
          load_kg?: number | null
          partner_id?: string
          prescribed_exercise_id?: string
          reps?: number | null
          set_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_workout_sets_exercise_partner_fkey"
            columns: ["prescribed_exercise_id", "partner_id"]
            isOneToOne: false
            referencedRelation: "partner_workout_exercises"
            referencedColumns: ["id", "partner_id"]
          },
          {
            foreignKeyName: "partner_workout_sets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string
          id: string
          professional_name: string
          professional_registry_number: string | null
          professional_registry_type: string | null
          professional_type: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          professional_name: string
          professional_registry_number?: string | null
          professional_registry_type?: string | null
          professional_type: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          professional_name?: string
          professional_registry_number?: string | null
          professional_registry_type?: string | null
          professional_type?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          auth_user_id: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          profile_id: string
          reset_session_hash: string | null
          role: string
          session_expires_at: string | null
          token_hash: string
          validated_at: string | null
        }
        Insert: {
          auth_user_id: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          profile_id: string
          reset_session_hash?: string | null
          role: string
          session_expires_at?: string | null
          token_hash: string
          validated_at?: string | null
        }
        Update: {
          auth_user_id?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          profile_id?: string
          reset_session_hash?: string | null
          role?: string
          session_expires_at?: string | null
          token_hash?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          avatar_url: string | null
          biological_sex: string
          birth_date: string | null
          cpf: string | null
          created_at: string
          gender: string | null
          id: string
          objective: string | null
          phone: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          biological_sex?: string
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          objective?: string | null
          phone?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          biological_sex?: string
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          objective?: string | null
          phone?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_activity_events: {
        Row: {
          actor_profile_id: string | null
          created_at: string
          detail: string
          event_type: string
          id: string
          metadata: Json
          partner_id: string | null
          patient_id: string | null
          payment_id: string | null
          title: string
        }
        Insert: {
          actor_profile_id?: string | null
          created_at?: string
          detail: string
          event_type: string
          id?: string
          metadata?: Json
          partner_id?: string | null
          patient_id?: string | null
          payment_id?: string | null
          title: string
        }
        Update: {
          actor_profile_id?: string | null
          created_at?: string
          detail?: string
          event_type?: string
          id?: string
          metadata?: Json
          partner_id?: string | null
          patient_id?: string | null
          payment_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_activity_events_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_activity_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_activity_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_activity_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "billing_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_integrations: {
        Row: {
          category: string
          config: Json
          created_at: string
          id: string
          integration_key: string
          last_test_message: string | null
          last_test_status: string | null
          last_tested_at: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          config?: Json
          created_at?: string
          id?: string
          integration_key: string
          last_test_message?: string | null
          last_test_status?: string | null
          last_tested_at?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string
          id?: string
          integration_key?: string
          last_test_message?: string | null
          last_test_status?: string | null
          last_tested_at?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          updated_by_profile_id: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          updated_by_profile_id?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          updated_by_profile_id?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_profile_id_fkey"
            columns: ["updated_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings_activity: {
        Row: {
          action: string
          actor_profile_id: string | null
          created_at: string
          detail: string
          id: string
          metadata: Json
          title: string
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          created_at?: string
          detail: string
          id?: string
          metadata?: Json
          title: string
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          created_at?: string
          detail?: string
          id?: string
          metadata?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_activity_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          email: string
          email_confirmed_at: string | null
          first_access_completed_at: string | null
          id: string
          last_auth_flow_at: string | null
          phone: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          email_confirmed_at?: string | null
          first_access_completed_at?: string | null
          id?: string
          last_auth_flow_at?: string | null
          phone?: string | null
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          email_confirmed_at?: string | null
          first_access_completed_at?: string | null
          id?: string
          last_auth_flow_at?: string | null
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provisioning_operations: {
        Row: {
          auth_user_id: string | null
          caller_profile_id: string
          created_at: string
          error_code: string | null
          id: string
          idempotency_key: string
          invite_status: string
          operation_type: string
          request_hash: string
          resource_partner_id: string | null
          resource_patient_id: string | null
          resource_profile_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          caller_profile_id: string
          created_at?: string
          error_code?: string | null
          id?: string
          idempotency_key: string
          invite_status?: string
          operation_type: string
          request_hash: string
          resource_partner_id?: string | null
          resource_patient_id?: string | null
          resource_profile_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          caller_profile_id?: string
          created_at?: string
          error_code?: string | null
          id?: string
          idempotency_key?: string
          invite_status?: string
          operation_type?: string
          request_hash?: string
          resource_partner_id?: string | null
          resource_patient_id?: string | null
          resource_profile_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provisioning_operations_caller_profile_id_fkey"
            columns: ["caller_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisioning_operations_resource_partner_id_fkey"
            columns: ["resource_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisioning_operations_resource_patient_id_fkey"
            columns: ["resource_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisioning_operations_resource_profile_id_fkey"
            columns: ["resource_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          api_version: string | null
          attempts: number
          event_type: string
          id: string
          last_error_code: string | null
          last_error_message: string | null
          livemode: boolean
          partner_id: string | null
          payload_summary: Json
          processed_at: string | null
          received_at: string
          status: string
          stripe_customer_id: string | null
          stripe_event_created_at: string | null
          stripe_event_id: string
          stripe_invoice_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          api_version?: string | null
          attempts?: number
          event_type: string
          id?: string
          last_error_code?: string | null
          last_error_message?: string | null
          livemode?: boolean
          partner_id?: string | null
          payload_summary?: Json
          processed_at?: string | null
          received_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_event_created_at?: string | null
          stripe_event_id: string
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          api_version?: string | null
          attempts?: number
          event_type?: string
          id?: string
          last_error_code?: string | null
          last_error_message?: string | null
          livemode?: boolean
          partner_id?: string | null
          payload_summary?: Json
          processed_at?: string | null
          received_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_event_created_at?: string | null
          stripe_event_id?: string
          stripe_invoice_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_webhook_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          opened_by_profile_id: string | null
          partner_id: string
          priority: string
          resolved_at: string | null
          sla_due_at: string
          status: string
          subject: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          opened_by_profile_id?: string | null
          partner_id: string
          priority?: string
          resolved_at?: string | null
          sla_due_at: string
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          opened_by_profile_id?: string | null
          partner_id?: string
          priority?: string
          resolved_at?: string | null
          sla_due_at?: string
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_opened_by_profile_id_fkey"
            columns: ["opened_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_active_profile_count: { Args: never; Returns: number }
      admin_actor_is_active: {
        Args: { p_actor_profile_id: string }
        Returns: boolean
      }
      admin_create_user_record: {
        Args: {
          p_actor_profile_id: string
          p_auth_user_id: string
          p_display_name: string
          p_email: string
          p_invite_status: string
          p_status: string
        }
        Returns: {
          active_admin_count: number
          admin_id: string
          profile_id: string
          result_status: string
        }[]
      }
      admin_delete_user_record: {
        Args: { p_actor_profile_id: string; p_target_profile_id: string }
        Returns: {
          active_admin_count: number
          profile_id: string
          result_status: string
        }[]
      }
      admin_update_user_record: {
        Args: {
          p_actor_profile_id: string
          p_display_name: string
          p_status: string
          p_target_profile_id: string
        }
        Returns: {
          active_admin_count: number
          profile_id: string
          result_status: string
        }[]
      }
      billing_active_client_count: {
        Args: { target_partner_id: string }
        Returns: number
      }
      billing_partner_trial_available: {
        Args: { target_partner_id: string }
        Returns: boolean
      }
      billing_public_catalog: {
        Args: never
        Returns: {
          billing_interval: string
          currency: string
          is_active: boolean
          item_kind: string
          lookup_key: string
          name: string
          price_cents: number
          slug: string
          sort_order: number
          trial_days: number
        }[]
      }
      billing_public_plans: {
        Args: never
        Returns: {
          active_client_unit_cents: number
          billing_interval: string
          currency: string
          lookup_key: string
          name: string
          price_cents: number
          slug: string
          trial_days: number
        }[]
      }
      client_diet_add_water: {
        Args: { p_amount_ml?: number; p_log_date?: string }
        Returns: Json
      }
      client_diet_apply_substitution: {
        Args: {
          p_food_id: string
          p_item_id: string
          p_log_date?: string
          p_meal_id: string
        }
        Returns: Json
      }
      client_diet_attach_meal_photo: {
        Args: {
          p_log_date?: string
          p_meal_id: string
          p_mime_type?: string
          p_original_filename?: string
          p_storage_path?: string
        }
        Returns: Json
      }
      client_diet_dashboard: { Args: { p_date?: string }; Returns: Json }
      client_diet_mark_meal: {
        Args: { p_completed?: boolean; p_log_date?: string; p_meal_id: string }
        Returns: Json
      }
      client_diet_request_substitution: {
        Args: { p_detail?: string; p_log_date?: string; p_meal_id: string }
        Returns: Json
      }
      client_diet_save_meal_note: {
        Args: { p_log_date?: string; p_meal_id: string; p_notes?: string }
        Returns: Json
      }
      client_diet_set_meal_status: {
        Args: { p_log_date?: string; p_meal_id: string; p_status?: string }
        Returns: Json
      }
      client_evolution_dashboard: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      client_health_complete_action: {
        Args: { p_action_key: string; p_log_date?: string }
        Returns: Json
      }
      client_health_dashboard: { Args: { p_date?: string }; Returns: Json }
      client_health_mark_medication: {
        Args: {
          p_log_date?: string
          p_medication_id: string
          p_taken?: boolean
        }
        Returns: Json
      }
      client_workout_dashboard: { Args: { p_date?: string }; Returns: Json }
      client_workout_finish_session: {
        Args: { p_client_session_id: string }
        Returns: Json
      }
      client_workout_log_set: {
        Args: {
          p_client_session_id: string
          p_completed?: boolean
          p_load_kg?: number
          p_reps?: number
          p_set_id: string
        }
        Returns: Json
      }
      client_workout_skip_exercise: {
        Args: { p_client_session_id: string; p_exercise_id: string }
        Returns: Json
      }
      client_workout_start_session: {
        Args: { p_session_id: string }
        Returns: Json
      }
      complete_partner_client_profile: {
        Args: {
          p_biological_sex: string
          p_birth_date: string
          p_objective: string
          p_patient_id: string
        }
        Returns: boolean
      }
      create_partner_protocol_use_draft: {
        Args: {
          p_item_id: string
          p_item_type: string
          p_notes?: string
          p_patient_id: string
          p_plan_context: string
        }
        Returns: string
      }
      current_active_admin_id: { Args: never; Returns: string }
      current_active_partner_id: { Args: never; Returns: string }
      current_active_patient_id: { Args: never; Returns: string }
      current_active_profile_id: { Args: never; Returns: string }
      current_client_diet_plan: {
        Args: { target_date?: string }
        Returns: {
          calorie_strategy: string
          created_at: string
          id: string
          notes: string | null
          partner_id: string
          patient_id: string
          published_at: string | null
          review_on: string | null
          sent_at: string | null
          starts_on: string | null
          status: string
          target_carbs_g: number
          target_fat_g: number
          target_kcal: number
          target_protein_g: number
          title: string
          updated_at: string
          version: number
          water_liters: number
        }
        SetofOptions: {
          from: "*"
          to: "partner_client_diet_plans"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_client_health_partner_id: { Args: never; Returns: string }
      current_client_workout_program: {
        Args: never
        Returns: {
          created_at: string
          id: string
          notes: string | null
          partner_id: string
          patient_id: string | null
          program_kind: string
          published_at: string | null
          sent_at: string | null
          status: string
          title: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "partner_workout_programs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_partner_has_active_patient_link: {
        Args: { target_patient_id: string }
        Returns: boolean
      }
      current_partner_has_patient_link: {
        Args: { target_patient_id: string }
        Returns: boolean
      }
      ensure_client_workout_exercise_logs: {
        Args: { p_client_session_id: string }
        Returns: undefined
      }
      increment_partner_protocol_usage: {
        Args: { p_item_id: string; p_item_type: string }
        Returns: number
      }
      partner_client_assessments: {
        Args: { p_patient_id: string }
        Returns: Json
      }
      partner_client_assessments_legacy_20260727: {
        Args: { p_patient_id: string }
        Returns: Json
      }
      partner_client_cardio: { Args: { p_patient_id: string }; Returns: Json }
      partner_client_diet: { Args: { p_patient_id: string }; Returns: Json }
      partner_client_exams: { Args: { p_patient_id: string }; Returns: Json }
      partner_client_overview: { Args: { p_patient_id: string }; Returns: Json }
      partner_client_photos: { Args: { p_patient_id: string }; Returns: Json }
      partner_client_real_adherence: {
        Args: {
          p_patient_id: string
          p_reference_date?: string
          p_weeks?: number
        }
        Returns: Json
      }
      partner_client_workouts: { Args: { p_patient_id: string }; Returns: Json }
      partner_clients_list: {
        Args: never
        Returns: {
          age_years: number
          display_name: string
          email: string
          last_update_at: string
          objective: string
          patient_id: string
          phone: string
          profile_id: string
          relationship_status: string
          service_scopes: string[]
          started_at: string
        }[]
      }
      partner_clone_workout_program: {
        Args: {
          p_as_template?: boolean
          p_patient_id: string
          p_source_program_id: string
        }
        Returns: string
      }
      provision_client_for_partner_records:
        | {
            Args: {
              p_auth_user_id: string
              p_biological_sex: string
              p_birth_date: string
              p_caller_profile_id: string
              p_cpf: string
              p_display_name: string
              p_email: string
              p_idempotency_key: string
              p_invite_status: string
              p_objective: string
              p_phone: string
              p_request_hash: string
              p_service_scopes: string[]
            }
            Returns: {
              patient_id: string
              profile_id: string
              relationship_ids: string[]
              result_invite_status: string
              result_service_scopes: string[]
              result_status: string
            }[]
          }
        | {
            Args: {
              p_auth_user_id: string
              p_birth_date: string
              p_caller_profile_id: string
              p_cpf: string
              p_display_name: string
              p_email: string
              p_idempotency_key: string
              p_invite_status: string
              p_objective: string
              p_phone: string
              p_request_hash: string
              p_service_scopes: string[]
            }
            Returns: {
              patient_id: string
              profile_id: string
              relationship_ids: string[]
              result_invite_status: string
              result_service_scopes: string[]
              result_status: string
            }[]
          }
      provision_partner_records: {
        Args: {
          p_auth_user_id: string
          p_caller_profile_id: string
          p_display_name: string
          p_email: string
          p_idempotency_key: string
          p_invite_status: string
          p_phone: string
          p_professional_name: string
          p_professional_registry_number: string
          p_professional_registry_type: string
          p_professional_type: string
          p_request_hash: string
        }
        Returns: {
          partner_id: string
          profile_id: string
          result_invite_status: string
          result_status: string
        }[]
      }
      save_partner_client_anamnesis_entry: {
        Args: {
          p_content: string
          p_patient_id: string
          p_summary: string
          p_title: string
        }
        Returns: string
      }
      save_partner_client_prescription_note: {
        Args: {
          p_content: string
          p_instructions: string
          p_patient_id: string
          p_prescription_type: string
          p_status: string
          p_summary: string
          p_title: string
        }
        Returns: string
      }
      save_partner_form_template: {
        Args: {
          p_default_message: string
          p_description: string
          p_questions: Json
          p_status: string
          p_template_id: string
          p_title: string
        }
        Returns: string
      }
      send_partner_form_template: {
        Args: {
          p_due_at: string
          p_message: string
          p_patient_ids: string[]
          p_request_key: string
          p_template_id: string
        }
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

