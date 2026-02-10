import type {
  User,
  PooRecord,
  HeartReaction,
  ReminderCard,
  ReminderSettings,
  ShapeOption,
  MoodOption,
  ApiResponse,
  CreateRecordRequest,
  CreateReactionRequest,
  BindRequest,
} from '../types';

// Mock 数据存储
class MockDataStore {
  private users: Map<string, User> = new Map();
  private records: Map<string, PooRecord> = new Map();
  private reactions: Map<string, HeartReaction> = new Map();
  private reminderCards: Map<string, ReminderCard> = new Map();
  private reminderSettings: Map<string, ReminderSettings> = new Map();
  private inviteCodes: Map<string, string> = new Map(); // code -> userId

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // 创建示例用户
    const user1: User = {
      id: 'user-001',
      name: '小明',
      avatar: '👦',
      partnerId: 'user-002',
      createdAt: new Date().toISOString(),
    };

    const user2: User = {
      id: 'user-002',
      name: '小红',
      avatar: '👧',
      partnerId: 'user-001',
      createdAt: new Date().toISOString(),
    };

    this.users.set(user1.id, user1);
    this.users.set(user2.id, user2);

    // 创建邀请码
    this.inviteCodes.set('LOVE2024', user2.id);

    // 创建示例今日记录
    const today = new Date();
    today.setHours(8, 30, 0, 0);

    const record1: PooRecord = {
      id: 'record-001',
      userId: user1.id,
      timestamp: today.toISOString(),
      shapeId: 'shape-3',
      moodId: 'mood-happy',
      note: '今天感觉很顺畅',
      isNotified: false,
    };

    today.setHours(9, 15, 0, 0);
    const record2: PooRecord = {
      id: 'record-002',
      userId: user2.id,
      timestamp: today.toISOString(),
      shapeId: 'shape-4',
      moodId: 'mood-normal',
      isNotified: true,
    };

    this.records.set(record1.id, record1);
    this.records.set(record2.id, record2);

    // 创建示例提醒卡片
    const reminderCard: ReminderCard = {
      id: 'reminder-001',
      userId: user2.id,
      message: '记得多喝水哦 💧',
      backgroundColor: '#E3F2FD',
      textColor: '#1976D2',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.reminderCards.set(reminderCard.id, reminderCard);

    // 创建默认提醒设置
    const defaultSettings: ReminderSettings = {
      morningReminder: true,
      morningTime: '08:00',
      eveningReminder: true,
      eveningTime: '20:00',
      customReminder: false,
    };

    this.reminderSettings.set(user1.id, { ...defaultSettings });
    this.reminderSettings.set(user2.id, { ...defaultSettings });
  }

  // 获取当前用户
  getCurrentUser(): User | undefined {
    return this.users.get('user-001');
  }

  // 根据ID获取用户
  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  // 获取伴侣
  getPartner(userId: string): User | undefined {
    const user = this.users.get(userId);
    if (user?.partnerId) {
      return this.users.get(user.partnerId);
    }
    return undefined;
  }

  // 获取用户今日记录
  getTodayRecords(userId: string): PooRecord[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Array.from(this.records.values())
      .filter(
        (record) =>
          record.userId === userId &&
          new Date(record.timestamp) >= today &&
          new Date(record.timestamp) < tomorrow
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  // 创建记录
  createRecord(request: CreateRecordRequest): PooRecord {
    const record: PooRecord = {
      id: `record-${Date.now()}`,
      userId: request.userId,
      timestamp: request.timestamp,
      shapeId: request.shapeId,
      moodId: request.moodId,
      note: request.note,
      isNotified: false,
    };

    this.records.set(record.id, record);
    return record;
  }

  // 创建爱心反馈
  createReaction(request: CreateReactionRequest): HeartReaction {
    const reaction: HeartReaction = {
      id: `reaction-${Date.now()}`,
      fromUserId: request.fromUserId,
      toUserId: request.toUserId,
      recordId: request.recordId,
      createdAt: new Date().toISOString(),
    };

    this.reactions.set(reaction.id, reaction);
    return reaction;
  }

  // 获取记录的反馈数
  getReactionCount(recordId: string): number {
    return Array.from(this.reactions.values()).filter(
      (r) => r.recordId === recordId
    ).length;
  }

  // 检查用户是否已对记录发送过爱心
  hasReacted(userId: string, recordId: string): boolean {
    return Array.from(this.reactions.values()).some(
      (r) => r.fromUserId === userId && r.recordId === recordId
    );
  }

  // 绑定伴侣
  bindPartner(request: BindRequest): User | null {
    const partnerId = this.inviteCodes.get(request.inviteCode);
    if (!partnerId) return null;

    const user = this.users.get(request.userId);
    const partner = this.users.get(partnerId);

    if (user && partner) {
      user.partnerId = partner.id;
      partner.partnerId = user.id;
      return partner;
    }

    return null;
  }

  // 获取提醒设置
  getReminderSettings(userId: string): ReminderSettings {
    return (
      this.reminderSettings.get(userId) || {
        morningReminder: true,
        morningTime: '08:00',
        eveningReminder: true,
        eveningTime: '20:00',
        customReminder: false,
      }
    );
  }

  // 更新提醒设置
  updateReminderSettings(
    userId: string,
    settings: Partial<ReminderSettings>
  ): ReminderSettings {
    const current = this.getReminderSettings(userId);
    const updated = { ...current, ...settings };
    this.reminderSettings.set(userId, updated);
    return updated;
  }

  // 获取提醒卡片
  getReminderCards(userId: string): ReminderCard[] {
    return Array.from(this.reminderCards.values())
      .filter((card) => card.userId === userId && card.isActive)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  // 创建提醒卡片
  createReminderCard(card: Omit<ReminderCard, 'id' | 'createdAt'>): ReminderCard {
    const newCard: ReminderCard = {
      ...card,
      id: `reminder-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    this.reminderCards.set(newCard.id, newCard);
    return newCard;
  }

  // 删除提醒卡片
  deleteReminderCard(id: string): boolean {
    const card = this.reminderCards.get(id);
    if (card) {
      card.isActive = false;
      this.reminderCards.set(id, card);
      return true;
    }
    return false;
  }
}

// 形状选项 - 布里斯托粪便分类法
export const SHAPE_OPTIONS: ShapeOption[] = [
  {
    id: 'shape-1',
    emoji: '🥜',
    label: '1型 - 硬球状',
    description: '分散的硬球状，像兔子粪或坚果，很难排出',
    healthMeaning: '严重便秘',
    commonCause: '水分/纤维摄取不足，食物在肠道停留太久',
    color: '#8D6E63',
  },
  {
    id: 'shape-2',
    emoji: '🍇',
    label: '2型 - 凹凸块状',
    description: '香肠状，但表面凹凸不平、有块状',
    healthMeaning: '轻度便秘',
    commonCause: '类似1型，但稍好一些',
    color: '#A1887F',
  },
  {
    id: 'shape-3',
    emoji: '🥒',
    label: '3型 - 裂纹状',
    description: '香肠状，表面有裂痕',
    healthMeaning: '正常（偏硬），接近理想',
    commonCause: '排便顺畅，肠道健康',
    color: '#7BD95B',
  },
  {
    id: 'shape-4',
    emoji: '🍌',
    label: '4型 - 光滑柔软',
    description: '像香肠或蛇一样，光滑柔软',
    healthMeaning: '最理想的正常便便',
    commonCause: '肠道健康、水分和纤维平衡',
    color: '#66BB6A',
  },
  {
    id: 'shape-5',
    emoji: '🍦',
    label: '5型 - 软块状',
    description: '柔软块状，边缘光滑，容易排出',
    healthMeaning: '正常（偏软），可能趋向轻微腹泻',
    commonCause: '纤维摄取充足，但消化较快',
    color: '#81C784',
  },
  {
    id: 'shape-6',
    emoji: '🍮',
    label: '6型 - 蓬松糊状',
    description: '蓬松块状、糊状，边缘粗糙',
    healthMeaning: '轻度腹泻',
    commonCause: '肠道蠕动过快',
    color: '#FFB74D',
  },
  {
    id: 'shape-7',
    emoji: '💧',
    label: '7型 - 完全水状',
    description: '完全水状，无固体块',
    healthMeaning: '严重腹泻',
    commonCause: '感染、食物中毒或肠道问题',
    color: '#4FC3F7',
  },
];

// 心情选项
export const MOOD_OPTIONS: MoodOption[] = [
  { id: 'mood-great', emoji: '🤩', label: '超棒', color: '#FFD700' },
  { id: 'mood-happy', emoji: '😊', label: '开心', color: '#FFB74D' },
  { id: 'mood-normal', emoji: '😐', label: '一般', color: '#90A4AE' },
  { id: 'mood-tired', emoji: '😫', label: '疲惫', color: '#B0BEC5' },
  { id: 'mood-uncomfortable', emoji: '😣', label: '不舒服', color: '#EF5350' },
];

// 预定义颜色选项（用于提醒卡片）
export const CARD_COLORS = [
  { bg: '#FFE5EC', text: '#FF6B9D' }, // 粉色
  { bg: '#E3F2FD', text: '#1976D2' }, // 蓝色
  { bg: '#FFF9E6', text: '#F9CB66' }, // 黄色
  { bg: '#E8F5E9', text: '#388E3C' }, // 绿色
  { bg: '#FFF3E0', text: '#F57C00' }, // 橙色
  { bg: '#F3E5F5', text: '#7B1FA2' }, // 紫色
  { bg: '#E0F2F1', text: '#00796B' }, // 青色
  { bg: '#FFFDE7', text: '#FBC02D' }, // 浅黄
];

// 单例导出
export const mockDataStore = new MockDataStore();

// API 服务
export const api = {
  // 认证相关
  auth: {
    getCurrentUser: (): Promise<ApiResponse<User>> => {
      const user = mockDataStore.getCurrentUser();
      return Promise.resolve({
        success: !!user,
        data: user!,
        message: user ? undefined : '用户未登录',
      });
    },
  },

  // 用户相关
  user: {
    getById: (id: string): Promise<ApiResponse<User>> => {
      const user = mockDataStore.getUserById(id);
      return Promise.resolve({
        success: !!user,
        data: user!,
        message: user ? undefined : '用户不存在',
      });
    },

    getPartner: (userId: string): Promise<ApiResponse<User | null>> => {
      const partner = mockDataStore.getPartner(userId);
      return Promise.resolve({
        success: true,
        data: partner || null,
      });
    },

    bindPartner: (request: BindRequest): Promise<ApiResponse<User>> => {
      const partner = mockDataStore.bindPartner(request);
      return Promise.resolve({
        success: !!partner,
        data: partner!,
        message: partner ? undefined : '邀请码无效',
      });
    },
  },

  // 记录相关
  record: {
    getTodayRecords: (userId: string): Promise<ApiResponse<PooRecord[]>> => {
      const records = mockDataStore.getTodayRecords(userId);
      return Promise.resolve({
        success: true,
        data: records,
      });
    },

    create: (request: CreateRecordRequest): Promise<ApiResponse<PooRecord>> => {
      const record = mockDataStore.createRecord(request);
      return Promise.resolve({
        success: true,
        data: record,
      });
    },
  },

  // 互动相关
  reaction: {
    create: (request: CreateReactionRequest): Promise<ApiResponse<HeartReaction>> => {
      const reaction = mockDataStore.createReaction(request);
      return Promise.resolve({
        success: true,
        data: reaction,
      });
    },

    getCount: (recordId: string): Promise<ApiResponse<number>> => {
      const count = mockDataStore.getReactionCount(recordId);
      return Promise.resolve({
        success: true,
        data: count,
      });
    },

    hasReacted: (userId: string, recordId: string): Promise<ApiResponse<boolean>> => {
      const hasReacted = mockDataStore.hasReacted(userId, recordId);
      return Promise.resolve({
        success: true,
        data: hasReacted,
      });
    },
  },

  // 提醒相关
  reminder: {
    getSettings: (userId: string): Promise<ApiResponse<ReminderSettings>> => {
      const settings = mockDataStore.getReminderSettings(userId);
      return Promise.resolve({
        success: true,
        data: settings,
      });
    },

    updateSettings: (
      userId: string,
      settings: Partial<ReminderSettings>
    ): Promise<ApiResponse<ReminderSettings>> => {
      const updated = mockDataStore.updateReminderSettings(userId, settings);
      return Promise.resolve({
        success: true,
        data: updated,
      });
    },

    getCards: (userId: string): Promise<ApiResponse<ReminderCard[]>> => {
      const cards = mockDataStore.getReminderCards(userId);
      return Promise.resolve({
        success: true,
        data: cards,
      });
    },

    createCard: (
      card: Omit<ReminderCard, 'id' | 'createdAt'>
    ): Promise<ApiResponse<ReminderCard>> => {
      const newCard = mockDataStore.createReminderCard(card);
      return Promise.resolve({
        success: true,
        data: newCard,
      });
    },

    deleteCard: (id: string): Promise<ApiResponse<boolean>> => {
      const success = mockDataStore.deleteReminderCard(id);
      return Promise.resolve({
        success,
        data: success,
      });
    },
  },
};

export default api;
