export interface TopicOption {
  id: string;
  title: string;
  summary: string;
}

export interface ImageQuality {
  quality: string;
  confidenceScore: number;
}

export interface SubjectInfo {
  subjectName: string;
  topics: string[];
  confidence: number;
}

export interface GeneratedNotes {
  short: string;
  detailed: string;
}

export interface QuizQuestion {
  question: string;
  type: string;
  options?: string[];
  answer: string;
}

export interface Resource {
  title: string;
  url: string;
  type: string;
}

export interface User {
  username: string;
  role: 'student' | 'admin';
  uid: string;
  apiKey?: string;
}

export interface HistoryItem {
  id: string;
  date: number;
  topicTitle: string;
  inputType: 'image' | 'text' | 'audio';
  textInput?: string;
  result: BoardAnalysisResult;
}

export interface BoardAnalysisResult {
  imageQuality: ImageQuality;
  subjects: SubjectInfo[];
  lectureSummary: string;
  homework: string[];
  keyConcepts: string[];
  generatedNotes: GeneratedNotes;
  generatedQuiz: QuizQuestion[];
  resources: Resource[];
  transcription?: string;
}
