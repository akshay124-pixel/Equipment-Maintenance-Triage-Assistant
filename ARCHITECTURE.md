# System Architecture

## Overview

The Equipment Maintenance Triage Assistant is a production-ready web application that combines deterministic sensor analysis with AI-powered diagnostics to assist maintenance technicians in equipment troubleshooting.

## Architecture Principles

1. **Safety First** - Advisory system only, never controls equipment
2. **Evidence-Based** - All recommendations cite sources
3. **Transparency** - Explicit failure states, no fake results
4. **Human-in-the-Loop** - Mandatory approval for all maintenance actions
5. **Separation of Concerns** - Clean layered architecture

## System Layers

### Presentation Layer (Frontend)
- **Technology**: Next.js 14+ App Router, React Server Components
- **Rendering**: Server-side rendering (SSR) for initial loads, client components for interactions
- **Styling**: Tailwind CSS for responsive, accessible UI
- **State Management**: React hooks, server actions for mutations

### API Layer
- **Technology**: Next.js API Routes
- **Pattern**: RESTful endpoints with consistent response format
- **Authentication**: JWT tokens in httpOnly cookies
- **Authorization**: Role-based access control (USER, TECHNICIAN, ADMIN)
- **Validation**: Server-side validation with Zod schemas

### Business Logic Layer (Services)

#### Threshold Engine Service
- **Purpose**: Deterministic evaluation of sensor readings against configured thresholds
- **Key Features**:
  - Multiple threshold operators (>, <, =, !=, >=, <=)
  - Severity levels (INFO, LOW, MEDIUM, HIGH, CRITICAL)
  - Conflict detection for multiple readings of same sensor
  - Missing data handling
- **Safety**: Never invents sensor values, explicit about missing data

#### RAG (Retrieval-Augmented Generation) Service
- **Components**:
  1. Document Processor - Extracts, chunks, and embeds documents
  2. RAG Retrieval - Semantic search with pgvector
  3. Evidence Tracker - Maintains citations to source material
- **Flow**:
  ```
  Document Upload → Text Extraction → Chunking → Embedding Generation → Vector Storage
  Query → Embedding → Similarity Search → Context Retrieval → AI Analysis
  ```
- **Safety**: Returns empty results on failure, never pretends retrieval succeeded

#### Triage Service
- **Purpose**: Orchestrates complete triage workflow
- **Workflow**:
  1. Fetch maintenance report with equipment and sensor data
  2. Evaluate sensor thresholds deterministically
  3. Retrieve relevant knowledge base chunks via RAG
  4. Query recent maintenance history
  5. Build structured input for AI provider
  6. Call AI provider for analysis
  7. Handle AI failures with fallback analysis
  8. Store results with evidence
  9. Update sensor reading statuses
- **Fallback**: If AI fails, provides deterministic analysis based on threshold violations

#### AI Provider Abstraction
- **Pattern**: Strategy pattern for pluggable AI providers
- **Interface**:
  ```typescript
  interface AIProvider {
    generateTriageAnalysis(input: TriageInput): Promise<TriageResult>;
    generateEmbedding(text: string): Promise<number[]>;
    isAvailable(): Promise<boolean>;
  }
  ```
- **Implementations**:
  - OpenAI Provider (GPT-4, text-embedding-3-small)
  - Ollama Provider (Local LLMs, nomic-embed-text)
- **Safety**: Structured output with schema validation, graceful failure handling

#### Audit Logger Service
- **Purpose**: Track all critical system actions
- **Events Logged**:
  - User authentication
  - Equipment creation/modification
  - Report creation
  - Triage analysis generation
  - Work order lifecycle (create, edit, approve, reject)
  - Document upload/processing
- **Data**: User ID, action, entity type, entity ID, metadata, timestamp

### Data Layer

#### Database: PostgreSQL with pgvector
- **ORM**: Prisma for type-safe queries
- **Extensions**: pgvector for vector similarity search
- **Connection**: Singleton client with connection pooling

#### Key Models

**Equipment Domain**:
- Equipment - Core equipment registry
- SensorDefinition - Sensor types and units per equipment
- SensorThreshold - Configurable threshold rules
- SensorReading - Actual measurements
- EquipmentEvent - Operational events (startups, alerts)

**Maintenance Domain**:
- MaintenanceReport - Issue reports with context
- TriageAnalysis - AI/deterministic analysis results
- Evidence - Citations supporting recommendations
- WorkOrder - Maintenance requests with approval workflow
- MaintenanceHistory - Completed work records

**Knowledge Domain**:
- KnowledgeDocument - Uploaded manuals
- KnowledgeChunk - Vectorized text segments with embeddings

**System Domain**:
- User - Authentication and roles
- AuditLog - Complete audit trail

## Data Flow

### Issue Reporting Flow
```
User Input → Validation → MaintenanceReport Creation → SensorReading Creation → Response
```

### Triage Analysis Flow
```
Report + Equipment + Sensors
    ↓
Threshold Engine (Deterministic)
    ↓
RAG Retrieval (Semantic Search)
    ↓
Maintenance History Query
    ↓
AI Provider (OpenAI/Ollama)
    ↓
Schema Validation
    ↓
Evidence Storage
    ↓
Result Persistence
```

### Work Order Workflow
```
DRAFT → (Edit) → PENDING_APPROVAL → (Technician Review) → APPROVED or REJECTED
```

## Security Architecture

### Authentication
- **Method**: JWT tokens stored in httpOnly cookies
- **Password**: bcrypt hashing with 12 rounds
- **Session**: Server-side validation on every protected route

### Authorization
- **Model**: Role-Based Access Control (RBAC)
- **Roles**:
  - USER: Create reports, view own reports
  - TECHNICIAN: All USER permissions + review triage, manage work orders
  - ADMIN: All permissions + equipment management, user management, audit logs

### Input Security
- **Validation**: Server-side Zod schemas for all inputs
- **Sanitization**: XSS prevention, SQL injection prevention
- **File Upload**: Type validation, size limits, filename sanitization
- **Rate Limiting**: Per-endpoint rate limits (in-memory, Redis-ready)

### HTTP Security
- **Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Cookies**: httpOnly, secure (production), sameSite=lax
- **CORS**: Same-origin policy
- **CSRF**: Token validation for state-changing operations

## Scalability Considerations

### Current Architecture (Monolith)
- Single Next.js application
- Suitable for: 100-1000 concurrent users
- Deployment: Single server or serverless

### Scaling Path
1. **Database**: Read replicas for report/equipment queries
2. **Caching**: Redis for sessions, rate limiting, frequently accessed data
3. **Background Jobs**: Bull/BullMQ for document processing, long-running triage
4. **CDN**: Static assets and cached pages
5. **Load Balancing**: Multiple application instances
6. **Microservices** (if needed): Separate triage service, knowledge service

## AI Safety Architecture

### Input Control
- Structured prompts with explicit instructions
- Evidence-only context (no invention allowed)
- Clear role definition (advisory only)

### Output Control
- JSON schema validation
- Required field enforcement
- Citation verification
- Distinction enforcement (observations vs. possible causes)

### Failure Handling
- Explicit error states
- Fallback to deterministic analysis
- Never fake AI responses
- User notification of failures

### Monitoring
- AI success/failure rates
- Retrieval quality metrics
- Citation coverage
- User acceptance of recommendations

## Deployment Architecture

### Development
```
Developer Machine → Next.js Dev Server → Local PostgreSQL
```

### Production (Suggested)
```
User → CDN → Load Balancer → Next.js Apps → PostgreSQL Primary
                                ↓
                          Background Jobs (BullMQ)
                                ↓
                          Redis (Sessions, Cache, Queue)
```

## Technology Choices Rationale

### Next.js
- Server-side rendering for security-sensitive operations
- API routes co-located with frontend
- TypeScript support
- Production-ready framework

### PostgreSQL + pgvector
- Relational data with complex relationships
- Vector similarity search in same database
- ACID compliance for critical operations
- Proven reliability

### Prisma
- Type-safe database access
- Migration management
- Schema-first development
- Excellent TypeScript integration

### Zod
- Runtime type validation
- Composable schemas
- TypeScript inference
- Consistent error messages

## Maintenance & Operations

### Monitoring Needs
- API response times
- Database query performance
- AI provider availability and latency
- Error rates by endpoint
- Authentication failures
- Work order approval times

### Backup Strategy
- Database: Daily full backups, point-in-time recovery
- Uploaded documents: Object storage with versioning
- Audit logs: Long-term retention (7+ years)

### Disaster Recovery
- Database restore procedures
- Application redeployment
- Configuration management
- Secret rotation procedures

## Future Enhancements

1. **Real-time Updates**: WebSocket for live triage status
2. **Mobile App**: React Native for field technicians
3. **Predictive Maintenance**: ML models for failure prediction
4. **IoT Integration**: Direct sensor data ingestion
5. **Advanced Analytics**: Dashboards for maintenance trends
6. **Multi-tenant**: Support for multiple organizations
7. **Workflow Automation**: Automatic work order routing
