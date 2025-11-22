
export type Role = 'user' | 'model';

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  images?: string[]; // Base64 strings
  isError?: boolean;
  subject?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  subject: Subject;
}

export type Subject = 
  | 'General' 
  | 'Madhyamik (WBBSE)'
  | 'HS (WBCHSE)'
  | 'Mathematics' 
  | 'Physics' 
  | 'Chemistry' 
  | 'Biology' 
  | 'Computer Science' 
  | 'History' 
  | 'Literature' 
  | 'Economics';

export type View = 'chat' | 'history' | 'bookmarks' | 'quiz' | 'settings' | 'imageToPdf';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Bookmark {
  id: string;
  content: string;
  timestamp: number;
  tags: string[];
}

export type ThemeColor = 'red' | 'blue' | 'green' | 'purple' | 'orange';