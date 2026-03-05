/**
 * Auto-generated TypeScript types for Supabase database schema
 * 
 * Tables:
 *  - profiles: User profiles with role (customer, provider, admin) and provider status
 *  - regions: Sofia regions/districts
 *  - requests: Trash removal service requests
 *  - messages: Chat messages between customer and provider
 *  - provider_regions: Many-to-many relationship between providers and regions they serve
 */

export type UserRole = 'customer' | 'provider' | 'admin';
export type ProviderStatus = 'pending' | 'approved' | 'suspended';
export type RequestStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          phone: string | null;
          provider_status: ProviderStatus | null;
          id_document_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: UserRole;
          full_name: string;
          phone?: string | null;
          provider_status?: ProviderStatus | null;
          id_document_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: UserRole;
          full_name?: string;
          phone?: string | null;
          provider_status?: ProviderStatus | null;
          id_document_url?: string | null;
          updated_at?: string;
        };
      };
      regions: {
        Row: {
          id: number;
          name: string;
        };
        Insert: {
          id?: number;
          name: string;
        };
        Update: {
          name?: string;
        };
      };
      requests: {
        Row: {
          id: string;
          customer_id: string;
          provider_id: string | null;
          region_id: number;
          description: string;
          address: string;
          preferred_time: string | null;
          price_offer: number | null;
          stripe_payment_intent_id: string | null;
          status: RequestStatus;
          completed_at: string | null;
          completion_notes: string | null;
          payment_captured: boolean;
          payment_captured_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          provider_id?: string | null;
          region_id: number;
          description: string;
          address: string;
          preferred_time?: string | null;
          price_offer?: number | null;
          stripe_payment_intent_id?: string | null;
          status?: RequestStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider_id?: string | null;
          status?: RequestStatus;
          description?: string;
          address?: string;
          preferred_time?: string | null;
          price_offer?: number | null;
          stripe_payment_intent_id?: string | null;
          completed_at?: string | null;
          completion_notes?: string | null;
          payment_captured?: boolean;
          payment_captured_at?: string | null;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          request_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          body?: string;
        };
      };
      provider_regions: {
        Row: {
          provider_id: string;
          region_id: number;
        };
        Insert: {
          provider_id: string;
          region_id: number;
        };
        Update: {
          provider_id?: string;
          region_id?: number;
        };
      };
      audit_log: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          actor_id: string;
          action: string;
          old_value: Record<string, any> | null;
          new_value: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          actor_id: string;
          action: string;
          old_value?: Record<string, any> | null;
          new_value?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          action?: string;
          old_value?: Record<string, any> | null;
          new_value?: Record<string, any> | null;
        };
      };
      ratings: {
        Row: {
          id: string;
          request_id: string;
          rater_id: string;
          rated_user_id: string;
          rating: number;
          review_text: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          rater_id: string;
          rated_user_id: string;
          rating: number;
          review_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          rating?: number;
          review_text?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      provider_status: ProviderStatus;
      request_status: RequestStatus;
    };
  };
};

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Region = Database['public']['Tables']['regions']['Row'];
export type Request = Database['public']['Tables']['requests']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type ProviderRegion = Database['public']['Tables']['provider_regions']['Row'];
export type AuditLog = Database['public']['Tables']['audit_log']['Row'];
export type Rating = Database['public']['Tables']['ratings']['Row'];

// Extended types with relationships
export interface RequestWithDetails extends Request {
  customer: Pick<Profile, 'id' | 'full_name' | 'phone'>;
  provider?: Pick<Profile, 'id' | 'full_name' | 'phone'> | null;
  region: Region;
}

export interface MessageWithSender extends Message {
  sender: Pick<Profile, 'id' | 'full_name'>;
}
