export interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export interface TimelineMediaItem {
  type: 'image' | 'youtube';
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string; // For YouTube videos
}

export interface TimelineContentData {
  text?: string;
  media?: TimelineMediaItem[];
  features?: string[];
}

export interface TimelineConfigEntry {
  title: string;
  content: TimelineContentData;
}
