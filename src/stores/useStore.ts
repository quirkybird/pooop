import { create } from 'zustand';
import type { AppState, User, PooRecord, HeartReaction, ReminderCard, ReminderSettings } from '../types';

export const useStore = create<AppState>((set, get) => ({
  // 状态
  currentUser: null,
  partner: null,
  todayRecords: [],
  partnerTodayRecords: [],
  heartReactions: [],
  reminderCards: [],
  reminderSettings: {
    morningReminder: true,
    morningTime: '08:00',
    eveningReminder: true,
    eveningTime: '20:00',
    customReminder: false,
  },

  // Actions
  setCurrentUser: (user: User | null) => {
    set({ currentUser: user });
  },

  setPartner: (partner: User | null) => {
    set({ partner });
  },

  addRecord: (record: PooRecord) => {
    const { currentUser, partner } = get();
    
    if (record.userId === currentUser?.id) {
      set((state) => ({
        todayRecords: [record, ...state.todayRecords],
      }));
    } else if (record.userId === partner?.id) {
      set((state) => ({
        partnerTodayRecords: [record, ...state.partnerTodayRecords],
      }));
    }
  },

  addHeartReaction: (reaction: HeartReaction) => {
    set((state) => ({
      heartReactions: [reaction, ...state.heartReactions],
    }));
  },

  updateReminderSettings: (settings: Partial<ReminderSettings>) => {
    set((state) => ({
      reminderSettings: { ...state.reminderSettings, ...settings },
    }));
  },

  addReminderCard: (card: ReminderCard) => {
    set((state) => ({
      reminderCards: [card, ...state.reminderCards],
    }));
  },

  removeReminderCard: (id: string) => {
    set((state) => ({
      reminderCards: state.reminderCards.filter((card) => card.id !== id),
    }));
  },

  // 初始化数据的方法
  setTodayRecords: (records: PooRecord[]) => {
    set({ todayRecords: records });
  },

  setPartnerTodayRecords: (records: PooRecord[]) => {
    set({ partnerTodayRecords: records });
  },

  setReminderCards: (cards: ReminderCard[]) => {
    set({ reminderCards: cards });
  },

  setReminderSettings: (settings: ReminderSettings) => {
    set({ reminderSettings: settings });
  },
}));

// 扩展 store 类型以包含初始化方法
type ExtendedAppState = AppState & {
  setTodayRecords: (records: PooRecord[]) => void;
  setPartnerTodayRecords: (records: PooRecord[]) => void;
  setReminderCards: (cards: ReminderCard[]) => void;
  setReminderSettings: (settings: ReminderSettings) => void;
};

// 重新导出带类型的 hook
export const useExtendedStore = create<ExtendedAppState>((set, get) => ({
  currentUser: null,
  partner: null,
  todayRecords: [],
  partnerTodayRecords: [],
  heartReactions: [],
  reminderCards: [],
  reminderSettings: {
    morningReminder: true,
    morningTime: '08:00',
    eveningReminder: true,
    eveningTime: '20:00',
    customReminder: false,
  },

  setCurrentUser: (user: User | null) => {
    set({ currentUser: user });
  },

  setPartner: (partner: User | null) => {
    set({ partner });
  },

  addRecord: (record: PooRecord) => {
    const { currentUser, partner } = get();
    
    if (record.userId === currentUser?.id) {
      set((state) => ({
        todayRecords: [record, ...state.todayRecords],
      }));
    } else if (record.userId === partner?.id) {
      set((state) => ({
        partnerTodayRecords: [record, ...state.partnerTodayRecords],
      }));
    }
  },

  addHeartReaction: (reaction: HeartReaction) => {
    set((state) => ({
      heartReactions: [reaction, ...state.heartReactions],
    }));
  },

  updateReminderSettings: (settings: Partial<ReminderSettings>) => {
    set((state) => ({
      reminderSettings: { ...state.reminderSettings, ...settings },
    }));
  },

  addReminderCard: (card: ReminderCard) => {
    set((state) => ({
      reminderCards: [card, ...state.reminderCards],
    }));
  },

  removeReminderCard: (id: string) => {
    set((state) => ({
      reminderCards: state.reminderCards.filter((card) => card.id !== id),
    }));
  },

  setTodayRecords: (records: PooRecord[]) => {
    set({ todayRecords: records });
  },

  setPartnerTodayRecords: (records: PooRecord[]) => {
    set({ partnerTodayRecords: records });
  },

  setReminderCards: (cards: ReminderCard[]) => {
    set({ reminderCards: cards });
  },

  setReminderSettings: (settings: ReminderSettings) => {
    set({ reminderSettings: settings });
  },
}));

export default useExtendedStore;
