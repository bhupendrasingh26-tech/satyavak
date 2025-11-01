import { GroundingChunk } from "@google/genai";

// Fix: Export the GroundingChunk type so it can be used in other files.
export type { GroundingChunk };

export interface ChatMessage {
  role: 'user' | 'model';
  text: string; // The text displayed in the UI, in the selected language.
  englishText: string; // The text in English, for API calls and history.
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}

export interface ExpertLocationResult {
  title: string;
  distance: string;
  rating: number;
  description: string;
  mapUri: string;
  contactNumber?: string;
}

export interface LegalNewsArticle {
  headline: string;
  summary: string;
  publisher: string;
  date: string;
  detailedBrief: string;
  keyPoints: string[];
  sources?: { title: string; uri: string; }[];
}

export interface GeneratedDocument {
  id: string;
  docType: string;
  createdAt: string;
  content: string; // The generated HTML content
}

export interface User {
  name: string;
  email: string;
  avatarUrl: string;
  generatedDocuments: GeneratedDocument[];
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}