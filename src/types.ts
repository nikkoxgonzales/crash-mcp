// Extended purpose types with more flexibility
export type PurposeType = 
  | 'analysis' 
  | 'action' 
  | 'reflection' 
  | 'decision' 
  | 'summary'
  | 'validation'
  | 'exploration'
  | 'hypothesis'
  | 'correction'
  | 'planning'
  | string; // Allow custom purposes

// Structured action for better tool integration
export interface StructuredAction {
  tool?: string;
  action: string;
  parameters?: Record<string, any>;
  expectedOutput?: string;
}

// Enhanced step with new optional fields
export interface CrashStep {
  // Required fields (backward compatible)
  step_number: number;
  estimated_total: number;
  purpose: PurposeType;
  context: string;
  thought: string;
  outcome: string;
  next_action: string | StructuredAction; // Now supports both formats
  rationale: string;
  
  // New optional fields for enhanced functionality
  confidence?: number; // 0-1 scale
  uncertainty_notes?: string;
  
  // Revision support
  revises_step?: number;
  revision_reason?: string;
  
  // Branching support
  branch_from?: number;
  branch_id?: string;
  branch_name?: string;
  
  // Tool integration
  tools_used?: string[];
  external_context?: Record<string, any>;
  dependencies?: number[]; // Step numbers this depends on
  
  // Metadata
  timestamp?: string;
  duration_ms?: number;
  
  // Session support
  session_id?: string;
}

// Branch tracking
export interface Branch {
  id: string;
  name: string;
  from_step: number;
  steps: CrashStep[];
  status: 'active' | 'merged' | 'abandoned';
  created_at: string;
}

// Enhanced history with branching support
export interface CrashHistory {
  steps: CrashStep[];
  branches?: Branch[];
  completed: boolean;
  session_id?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: {
    total_duration_ms?: number;
    revisions_count?: number;
    branches_created?: number;
    tools_used?: string[];
  };
}

// Session management
export interface CrashSession {
  id: string;
  history: CrashHistory;
  config: any; // Reference to config used
  created_at: string;
  last_active: string;
}

// Export formats
export interface ExportOptions {
  format: 'json' | 'markdown' | 'text';
  include_metadata: boolean;
  include_branches: boolean;
  compact: boolean;
}