import { z } from 'zod';

// =====================
// BASIC SCHEMAS
// =====================

// Enhanced Subtask with timing
export const SubtaskSchema = z.object({
  title: z.string().min(1),
  estimatedSeconds: z.number().optional(),
  estimatedMinutes: z.number().optional(),
  isCheckpoint: z.boolean().optional(), // Good stopping point
});

// Photo Quality Assessment
export const PhotoQualitySchema = z.object({
  lighting: z.enum(['good', 'dim', 'overexposed']),
  coverage: z.enum(['full', 'partial', 'limited']),
  clarity: z.enum(['clear', 'blurry', 'mixed']),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional(),
  suggestedRetake: z.string().optional(),
});

// =====================
// ZONE SCHEMAS
// =====================

export const ZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['floor', 'surface', 'storage', 'fixture']),
  description: z.string(),
  clutterDensity: z.enum(['low', 'medium', 'high', 'extreme']),
  itemCount: z.number().min(0),
  estimatedClearTime: z.number().min(0),
  priority: z.enum(['high', 'medium', 'low']),
  priorityReason: z.string(),
});

// =====================
// OBJECT DETECTION SCHEMAS
// =====================

export const DetectedObjectSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  category: z.enum(['trash', 'dishes', 'clothes', 'papers', 'belongs_elsewhere', 'misc']).optional(),
  zone: z.string().optional(), // Zone ID reference
  location: z.string().optional(),
  condition: z.enum(['clean', 'dirty', 'damaged', 'misplaced', 'unknown']).optional(),
  suggestedAction: z.string().optional(),
  suggestedDestination: z.string().optional(),
  needsAction: z.boolean().default(true),
  bbox_2d: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  priority: z.enum(['high', 'medium', 'low', 'keep']).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

// =====================
// DESTINATION SCHEMA
// =====================

export const DestinationSchema = z.object({
  location: z.string(),
  instructions: z.string().optional(),
  requiresSetup: z.string().optional(), // e.g., "Get donate box from garage first"
});

// =====================
// DECISION SUPPORT SCHEMAS
// =====================

export const DecisionOptionSchema = z.object({
  answer: z.string(),
  action: z.string(),
  nextTask: z.string().optional(),
});

export const DecisionPointSchema = z.object({
  id: z.string().optional(),
  trigger: z.string(),
  question: z.string(),
  options: z.array(DecisionOptionSchema),
  fiveSecondDefault: z.string().optional(),
  emotionalSupport: z.string().optional(),
  adhd_tip: z.string().optional(),
});

// =====================
// ENHANCED TASK SCHEMA
// =====================

export const AITaskSchema = z.object({
  // Original fields
  title: z.string().min(1).default('Task'),
  description: z.string().default(''),
  emoji: z.string().default('📋'),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  difficulty: z.enum(['quick', 'medium', 'challenging']).default('medium'),
  estimatedMinutes: z.number().min(1).max(120).default(5),
  tips: z.array(z.string()).optional().default([]),
  subtasks: z.array(SubtaskSchema).optional().default([]),
  
  // NEW: Spatial Context
  zone: z.string().optional(), // Zone ID this task addresses
  
  // NEW: Object References
  targetObjects: z.array(z.string()).optional(), // Names of objects this task handles
  
  // NEW: Destination Mapping
  destination: DestinationSchema.optional(),
  
  // NEW: Task Dependencies
  dependencies: z.array(z.string()).optional(), // Task IDs that must complete first
  enables: z.array(z.string()).optional(), // Task IDs this unlocks
  parallelWith: z.array(z.string()).optional(), // Tasks that can run simultaneously
  
  // NEW: Behavioral Metadata
  category: z.enum([
    'trash_removal',
    'surface_clearing',
    'dishes',
    'laundry',
    'organization',
    'deep_cleaning',
    'maintenance',
    'donation_sorting',
    'setup'
  ]).optional(),
  energyRequired: z.enum(['minimal', 'low', 'moderate', 'high']).optional(),
  decisionLoad: z.enum(['none', 'low', 'medium', 'high']).optional(),
  visualImpact: z.enum(['low', 'medium', 'high']).optional(),
  
  // NEW: Psychological Support
  whyThisMatters: z.string().optional(),
  resistanceHandler: z.string().optional(),

  // NEW: Supplies needed for this task
  suppliesNeeded: z.array(z.string()).optional(),

  // NEW: Decision Points
  decisionPoints: z.array(DecisionPointSchema).optional(),
});

// =====================
// TASK GRAPH SCHEMA
// =====================

export const TaskGraphSchema = z.object({
  criticalPath: z.array(z.string()), // Most important sequence
  parallelGroups: z.array(z.array(z.string())), // Tasks that can run together
  setupTasks: z.array(z.string()).optional(), // Tasks that enable others
  optionalTasks: z.array(z.string()).optional(), // Nice-to-have tasks
});

// =====================
// TIME & ENERGY PROFILES
// =====================

export const TimeProfileSchema = z.object({
  tasks: z.array(z.string()), // Task IDs
  expectedImpact: z.number().min(0).max(100),
  estimatedMinutes: z.number().optional(),
});

export const TimeProfilesSchema = z.object({
  minimal: TimeProfileSchema, // 5-minute version
  quick: TimeProfileSchema, // 15-minute version
  standard: TimeProfileSchema, // 30-minute version
  complete: TimeProfileSchema, // Full clean
});

export const EnergyProfilesSchema = z.object({
  exhausted: z.array(z.string()), // Task IDs for very low energy
  low: z.array(z.string()),
  moderate: z.array(z.string()),
  high: z.array(z.string()),
});

// =====================
// QUICK WIN SCHEMA
// =====================

export const QuickWinSchema = z.object({
  taskId: z.string().optional(),
  task: z.string().optional(), // Backward compat: plain string description
  visualImpact: z.enum(['high', 'medium']).optional(),
  timeMinutes: z.number().optional(),
  reason: z.string().optional(),
});

// =====================
// COMPLETE ANALYSIS RESPONSE
// =====================

export const AIAnalysisResponseSchema = z.object({
  // Photo Assessment
  photoQuality: PhotoQualitySchema.optional(),
  
  // Basic Info
  messLevel: z.number().min(0).max(100).default(50),
  summary: z.string().default('Room analyzed successfully.'),
  encouragement: z.string().default("You've got this! Every small step counts."),
  roomType: z.enum([
    'bedroom',
    'kitchen',
    'bathroom',
    'livingRoom',
    'office',
    'garage',
    'closet',
    'other',
  ]).optional(),
  
  // Spatial Analysis
  zones: z.array(ZoneSchema).optional(),
  
  // Object Detection
  detectedObjects: z.array(DetectedObjectSchema).optional(),
  
  // Tasks
  tasks: z.array(AITaskSchema).default([]),
  
  // Task Relationships
  taskGraph: TaskGraphSchema.optional(),
  
  // Time Profiles
  timeProfiles: TimeProfilesSchema.optional(),
  
  // Energy Profiles
  energyProfiles: EnergyProfilesSchema.optional(),
  
  // Quick Wins (enhanced)
  quickWins: z.union([
    z.array(z.string()), // Backward compat: plain strings
    z.array(QuickWinSchema), // New: rich objects
  ]).default([]),
  
  // Decision Support
  decisionPoints: z.array(DecisionPointSchema).optional(),
  
  // Totals
  estimatedTotalTime: z.number().min(0).optional(),
  
  // Success Metrics
  beforeAfterMetrics: z.array(z.string()).optional(),
});

// =====================
// PROGRESS ANALYSIS
// =====================

export const ProgressAnalysisResponseSchema = z.object({
  progressPercentage: z.number().min(0).max(100).default(50),
  completedTasks: z.array(z.string()).default([]),
  remainingTasks: z.array(z.string()).default([]),
  encouragement: z.string().default('Great progress! Keep going!'),

  // Structured result fields (aliases for UI consumption)
  percentImproved: z.number().min(0).max(100).optional(),
  areasImproved: z.array(z.string()).optional(),
  areasRemaining: z.array(z.string()).optional(),
  encouragingMessage: z.string().optional(),

  // NEW: Detailed comparison
  improvements: z.array(z.object({
    area: z.string(),
    before: z.string(),
    after: z.string(),
  })).optional(),

  celebrationLevel: z.enum(['small', 'medium', 'big', 'massive']).optional(),
});

// =====================
// TYPE EXPORTS
// =====================

export type AIAnalysisResponse = z.infer<typeof AIAnalysisResponseSchema>;
export type ProgressAnalysisResponse = z.infer<typeof ProgressAnalysisResponseSchema>;
export type AITask = z.infer<typeof AITaskSchema>;
export type DetectedObject = z.infer<typeof DetectedObjectSchema>;
export type Zone = z.infer<typeof ZoneSchema>;
export type PhotoQuality = z.infer<typeof PhotoQualitySchema>;
export type TaskGraph = z.infer<typeof TaskGraphSchema>;
export type TimeProfile = z.infer<typeof TimeProfileSchema>;
export type TimeProfiles = z.infer<typeof TimeProfilesSchema>;
export type EnergyProfiles = z.infer<typeof EnergyProfilesSchema>;
export type DecisionPoint = z.infer<typeof DecisionPointSchema>;
export type QuickWin = z.infer<typeof QuickWinSchema>;
export type Destination = z.infer<typeof DestinationSchema>;
export type Subtask = z.infer<typeof SubtaskSchema>;
