export interface TriageInput {
  equipmentType: string;
  equipmentIdentifier: string;
  issueDescription: string;
  operatingEvents: string[];
  sensorResults: SensorThresholdResult[];
  retrievedContext: RetrievedChunk[];
  maintenanceHistory?: string[];
}

export interface SensorThresholdResult {
  sensor: string;
  value: number | null;
  unit: string;
  threshold?: number;
  operator?: string;
  status: 'NORMAL' | 'WARNING' | 'EXCEEDED' | 'CONFLICTING' | 'MISSING';
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message?: string;
}

export interface RetrievedChunk {
  content: string;
  documentTitle: string;
  section?: string;
  page?: number;
  relevanceScore: number;
  chunkId: string;
  documentId: string;
}

export interface TriageResult {
  observations: string[];
  possibleCauses: string[];
  confirmedFindings: string[];
  followUpQuestions: string[];
  inspectionSteps: InspectionStep[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasoningSummary: string;
  evidence: EvidenceItem[];
}

export interface InspectionStep {
  step: string;
  evidenceSource?: string;
}

export interface EvidenceItem {
  type: string;
  description: string;
  sourceType: 'MANUAL' | 'SENSOR' | 'EVENT' | 'HISTORY';
  sourceId?: string;
  section?: string;
  page?: number;
}

export interface AIProvider {
  generateTriageAnalysis(input: TriageInput): Promise<TriageResult>;
  generateEmbedding(text: string): Promise<number[]>;
  isAvailable(): Promise<boolean>;
}
