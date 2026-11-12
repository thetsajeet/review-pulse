export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          google_place_id: string | null;
          access_token: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          google_place_id?: string | null;
          access_token?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          google_place_id?: string | null;
          access_token?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          location_id: string;
          author_name: string;
          rating: number;
          review_text: string;
          review_date: string;
          sentiment: "Positive" | "Neutral" | "Negative" | null;
          draft_response: string | null;
          status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          author_name: string;
          rating: number;
          review_text: string;
          review_date: string;
          sentiment?: "Positive" | "Neutral" | "Negative" | null;
          draft_response?: string | null;
          status?: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          author_name?: string;
          rating?: number;
          review_text?: string;
          review_date?: string;
          sentiment?: "Positive" | "Neutral" | "Negative" | null;
          draft_response?: string | null;
          status?: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
