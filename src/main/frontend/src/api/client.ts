import axios from 'axios'

const api = axios.create({ baseURL: '' })

export type ConversionTargetFormat = 'MT940' | 'MT942' | 'CAMT052' | 'CAMT053'
export type ConversionEngine = 'PROWIDE' | 'VELOCITY' | 'JAKARTA_XML_BINDING'
export type LoadProfile = 'LOW' | 'HIGH'

export interface RandomStatementResponse {
  firstStatementId: number
  statementsGenerated: number
  transactionsGenerated: number
  timestamp: string
}

export interface ConversionJobRequest {
  statementId: number
  targetFormat: ConversionTargetFormat
  engine: ConversionEngine
}

export interface ConversionJobResponse {
  jobId: number
  targetFormat: ConversionTargetFormat
  engine: ConversionEngine
  status: string
  outputFile: string
  fileContent: string
  timestamp: string
}

export interface ConversionJobStatus {
  jobId: number
  status: string
  exitDescription: string
  targetFormat: string
  engine: string
  outputFile: string
  createTime: string | null
  startTime: string | null
  endTime: string | null
  durationMs: number
  timestamp: string
}

export interface HealthResponse {
  status: 'UP' | 'DOWN' | string
  components?: Record<string, unknown>
}

export interface AppInfo {
  app?: {
    name?: string
    version?: string
    description?: string
    author?: string
  }
  build?: {
    version?: string
    time?: string
  }
}

export const generateStatements = (loadProfile: LoadProfile = 'LOW') =>
  api
    .post<RandomStatementResponse>('/api/random-statements', null, { params: { loadProfile } })
    .then((r) => r.data)

export const runConversion = (req: ConversionJobRequest) =>
  api.post<ConversionJobResponse>('/api/conversions', req).then((r) => r.data)

export const getConversionJobs = () =>
  api.get<ConversionJobStatus[]>('/api/conversions/jobs').then((r) => r.data)

export const getJobById = (jobId: number) =>
  api.get<ConversionJobStatus>(`/api/conversions/jobs/${jobId}`).then((r) => r.data)

export const getHealth = () => api.get<HealthResponse>('/actuator/health').then((r) => r.data)

export const getInfo = () => api.get<AppInfo>('/actuator/info').then((r) => r.data)
