export interface User {
  id: string;
  name: string;
  pronouns: string;
  avatar: string;
  headline: string;
  location: string;
  degree: '1º grau' | '2º grau';
  degreeVia?: string;
  memberSince: string;
  mutualConnectionsCount: number;
  about: string;
  verifiedLinks: { label: string; url: string; platform: 'github' | 'portfolio' | 'company' | 'web' }[];
  projects: { id: string; title: string; description: string; tags: string[] }[];
  communitiesCount: number;
  testimonialTokensRemaining: number; // 1 por mês
}

export interface Comment {
  id: string;
  author: User;
  authorRole?: 'Fundador' | 'Moderador' | 'Membro Ativo' | 'Visitante';
  content: string;
  createdAt: string;
  replies?: Comment[];
}

export type AspectRatio = '1:1' | '3:4' | '9:16' | '16:9';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  aspectRatio: AspectRatio;
  caption?: string;
  duration?: string;
}

export interface AudioAttachment {
  url?: string;
  duration: string;
  waveform: number[];
  title?: string;
}

export type PostType =
  | 'text_short'
  | 'text_long'
  | 'image'
  | 'video'
  | 'carousel'
  | 'audio'
  | 'code'
  | 'file';

export interface Post {
  id: string;
  author: User;
  source: 'conexoes' | 'radar';
  radarContext?: {
    connectionsDebating: User[];
    extraCount: number;
  };
  postType?: PostType;
  title?: string;
  content: string;
  media?: MediaItem;
  carousel?: MediaItem[];
  audio?: AudioAttachment;
  codeSnippet?: {
    language: string;
    code: string;
  };
  attachments?: {
    type: 'image' | 'poll' | 'file';
    url?: string;
    fileName?: string;
    fileSize?: string;
    pollOptions?: { id: string; text: string; votes: number }[];
  };
  communityName?: string;
  privacy: 'anyone' | 'connections_only' | 'members_only';
  responsesCount: number;
  savedCount: number;
  supportedByMe: boolean;
  savedByMe: boolean;
  userReaction?: string;
  reactionsSummary?: { type: string; emoji: string; count: number }[];
  createdAt: string;
  comments: Comment[];
}

export interface CommunityTopic {
  id: string;
  communityId: string;
  communityName: string;
  author: User;
  authorRole: 'Fundador' | 'Moderador' | 'Membro Ativo' | 'Visitante';
  title: string;
  content: string;
  responsesCount: number;
  lastActive: string;
  comments: Comment[];
}

export interface Community {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  membersCount: number;
  isPinned: boolean;
  unreadTopicsCount: number;
  topics: CommunityTopic[];
}

export interface Testimonial {
  id: string;
  fromUser: User;
  toUserId: string;
  content: string;
  createdAt: string;
  status: 'approved' | 'pending';
}

export interface AppNotification {
  id: string;
  tab: 'pessoal' | 'comunidades';
  type:
    | 'reaction'
    | 'comment'
    | 'connection_request'
    | 'reply'
    | 'mention'
    | 'testimonial'
    | 'new_topic'
    | 'tracked_topic_reply';
  actor: User;
  title: string;
  detail: string;
  timestamp: string;
  isRead: boolean;
  testimonialId?: string;
  reactionType?: 'heart' | 'applause' | 'insightful' | 'support' | 'fire' | 'thoughtful';
  postPreview?: {
    id?: string;
    imageUrl?: string;
    textSnippet?: string;
    mediaType?: 'image' | 'video' | 'text' | 'audio';
  };
  timeGroup?: 'hoje' | 'esta_semana' | 'anteriores';
  connectionStatus?: 'pending' | 'accepted' | 'ignored';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  audioNote?: {
    duration: string;
    transcription: string;
  };
  fileAttachment?: {
    name: string;
    size: string;
    type: string;
  };
}

export interface Conversation {
  id: string;
  tab: 'diretas' | 'solicitacoes';
  participant: User;
  subject?: string; // Obrigatório até 140 chars para solicitações
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
  status: 'active' | 'archived' | 'pending_request';
  messages: ChatMessage[];
}

export interface Momento {
  id: string;
  author: User;
  mediaUrl?: string;
  textNote?: string;
  createdAt: string;
  expiresInHours: number;
  hasViewed: boolean;
}
