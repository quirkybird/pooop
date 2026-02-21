// 用户类型
export interface User {
  id: string;
  name: string;
  avatar?: string;
  partnerId?: string;
  inviteCode?: string;
  createdAt: string;
}

// 便便形状选项
export interface ShapeOption {
  id: string;
  emoji: string;
  label: string;
  description: string;
  healthMeaning?: string;
  commonCause?: string;
  color: string;
}

// 心情选项
export interface MoodOption {
  id: string;
  emoji: string;
  label: string;
  color: string;
}

// 便便记录
export interface PooRecord {
  id: string;
  userId: string;
  timestamp: string;
  shapeId: string;
  moodId: string;
  note?: string;
  isNotified: boolean;
}

// 反馈（爱心互动）
export interface HeartReaction {
  id: string;
  fromUserId: string;
  toUserId: string;
  recordId: string;
  isActive: boolean;
  createdAt: string;
}

// 温柔提醒卡片
export interface ReminderCard {
  id: string;
  userId: string;
  message: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  createdAt: string;
}

// 提醒设置
export interface ReminderSettings {
  morningReminder: boolean;
  morningTime: string;
  eveningReminder: boolean;
  eveningTime: string;
  customReminder: boolean;
  customTime?: string;
}

// 应用状态
export interface AppState {
  currentUser: User | null;
  partner: User | null;
  todayRecords: PooRecord[];
  partnerTodayRecords: PooRecord[];
  heartReactions: HeartReaction[];
  reminderCards: ReminderCard[];
  reminderSettings: ReminderSettings;
  
  // Actions
  setCurrentUser: (user: User | null) => void;
  setPartner: (partner: User | null) => void;
  addRecord: (record: PooRecord) => void;
  addHeartReaction: (reaction: HeartReaction) => void;
  updateReminderSettings: (settings: Partial<ReminderSettings>) => void;
  addReminderCard: (card: ReminderCard) => void;
  removeReminderCard: (id: string) => void;
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 绑定请求
export interface BindRequest {
  userId: string;
  inviteCode: string;
}

// 创建记录请求
export interface CreateRecordRequest {
  userId: string;
  timestamp: string;
  shapeId: string;
  moodId: string;
  note?: string;
}

// 创建反馈请求
export interface CreateReactionRequest {
  fromUserId: string;
  toUserId: string;
  recordId: string;
}

// AI 健康分析总结
export interface AiHealthSummary {
  userId: string;
  periodType: 'weekly' | 'monthly' | 'yearly';
  summary: string;
  createdAt: string;
}
