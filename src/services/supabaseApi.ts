import { supabase } from '../lib/supabase';
import type { 
  User, 
  PooRecord, 
  HeartReaction, 
  ReminderCard,
  ShapeOption,
  MoodOption,
  ApiResponse,
  CreateRecordRequest,
  CreateReactionRequest,
  BindRequest 
} from '../types';

// API 响应包装
const createResponse = <T>(data: T, success = true, message?: string): ApiResponse<T> => ({
  success,
  data,
  message
});

const handleError = (error: any): ApiResponse<any> => ({
  success: false,
  data: null as any,
  message: error?.message || '操作失败'
});

// 获取当前认证用户ID
const getCurrentAuthId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// 将 Supabase 用户数据转换为应用 User 类型
const transformUser = (data: any): User => ({
  id: data.id,
  name: data.name,
  avatar: data.avatar_emoji,
  partnerId: data.partner_id,
  inviteCode: data.invite_code,
  createdAt: data.created_at
});

// 将 Supabase 记录数据转换为应用 PooRecord 类型
const transformRecord = (data: any): PooRecord => ({
  id: data.id,
  userId: data.user_id,
  timestamp: data.happened_at,
  shapeId: `shape-${data.shape_type}`,
  moodId: `mood-${data.mood}`,
  note: data.note,
  isNotified: false
});

// 将 Supabase 卡片数据转换为应用 ReminderCard 类型
const transformCard = (data: any): ReminderCard => ({
  id: data.id,
  userId: data.from_user_id,
  message: data.message,
  backgroundColor: data.bg_color,
  textColor: data.text_color,
  isActive: data.is_active,
  createdAt: data.created_at
});

export const supabaseApi = {
  // 认证相关
  auth: {
    getCurrentUser: async (): Promise<ApiResponse<User>> => {
      try {
        const authId = await getCurrentAuthId();
        if (!authId) {
          return handleError({ message: '用户未登录' });
        }

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', authId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('用户资料不存在');

        return createResponse(transformUser(data));
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // 用户相关
  user: {
    getById: async (id: string): Promise<ApiResponse<User>> => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return createResponse(transformUser(data));
      } catch (error) {
        return handleError(error);
      }
    },

    getPartner: async (userId: string): Promise<ApiResponse<User | null>> => {
      try {
        // 先获取当前用户的 partner_id
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('partner_id')
          .eq('id', userId)
          .single();

        if (userError) throw userError;
        if (!userData?.partner_id) {
          return createResponse(null);
        }

        // 获取伴侣信息
        const { data: partnerData, error: partnerError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userData.partner_id)
          .single();

        if (partnerError) throw partnerError;
        return createResponse(transformUser(partnerData));
      } catch (error) {
        return handleError(error);
      }
    },

    bindPartner: async (request: BindRequest): Promise<ApiResponse<User>> => {
      try {
        // 调用数据库函数绑定伴侣
        const { data, error } = await supabase
          .rpc('bind_partner', {
            current_user_id: request.userId,
            target_invite_code: request.inviteCode
          });

        if (error) throw error;
        if (!data) {
          return handleError({ message: '绑定失败，邀请码无效或对方已有伴侣' });
        }

        // 返回伴侣信息
        const partnerRes = await supabaseApi.user.getPartner(request.userId);
        if (!partnerRes.success || !partnerRes.data) {
          return handleError({ message: '绑定成功但获取伴侣信息失败' });
        }

        return createResponse(partnerRes.data);
      } catch (error) {
        return handleError(error);
      }
    },

    updateAvatar: async (userId: string, avatarSeed: string): Promise<ApiResponse<User>> => {
      try {
        const { data, error } = await supabase
          .from('users')
          .update({ avatar_emoji: avatarSeed })
          .eq('id', userId)
          .select()
          .single();

        if (error) throw error;
        return createResponse(transformUser(data));
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // 记录相关
  record: {
    getTodayRecords: async (userId: string): Promise<ApiResponse<PooRecord[]>> => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data, error } = await supabase
          .from('poo_records')
          .select('*')
          .eq('user_id', userId)
          .gte('happened_at', today.toISOString())
          .lt('happened_at', tomorrow.toISOString())
          .order('happened_at', { ascending: false });

        if (error) throw error;
        return createResponse((data || []).map(transformRecord));
      } catch (error) {
        return handleError(error);
      }
    },

    getRecordsByDateRange: async (userId: string, startDate: Date, endDate: Date): Promise<ApiResponse<PooRecord[]>> => {
      try {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
          .from('poo_records')
          .select('*')
          .eq('user_id', userId)
          .gte('happened_at', start.toISOString())
          .lte('happened_at', end.toISOString())
          .order('happened_at', { ascending: false });

        if (error) throw error;
        return createResponse((data || []).map(transformRecord));
      } catch (error) {
        return handleError(error);
      }
    },

    create: async (request: CreateRecordRequest): Promise<ApiResponse<PooRecord>> => {
      try {
        // 从 shapeId 提取 shape_type (例如 'shape-3' -> 3)
        const shapeType = parseInt(request.shapeId.replace('shape-', ''));
        // 从 moodId 提取 mood (例如 'mood-happy' -> 'happy')
        const mood = request.moodId.replace('mood-', '');

        const { data, error } = await supabase
          .from('poo_records')
          .insert({
            user_id: request.userId,
            happened_at: request.timestamp,
            shape_type: shapeType,
            mood: mood,
            note: request.note
          })
          .select()
          .single();

        if (error) throw error;
        return createResponse(transformRecord(data));
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // 互动相关
  reaction: {
    create: async (request: CreateReactionRequest): Promise<ApiResponse<HeartReaction>> => {
      try {
        // 软删除方案：先查询是否已有记录
        const { data: existingData, error: queryError } = await supabase
          .from('heart_reactions')
          .select('id, is_liked')
          .eq('from_user_id', request.fromUserId)
          .eq('record_id', request.recordId)
          .limit(1);

        if (queryError) throw queryError;

        if (existingData && existingData.length > 0) {
          // 已有记录，更新为 is_liked = true
          const { data, error } = await supabase
            .from('heart_reactions')
            .update({ is_liked: true })
            .eq('id', existingData[0].id)
            .select()
            .single();

          if (error) throw error;
          return createResponse({
            id: data.id,
            fromUserId: data.from_user_id,
            toUserId: data.to_user_id,
            recordId: data.record_id,
            isActive: data.is_liked,
            createdAt: data.created_at
          });
        } else {
          // 没有记录，插入新记录
          const { data, error } = await supabase
            .from('heart_reactions')
            .insert({
              from_user_id: request.fromUserId,
              to_user_id: request.toUserId,
              record_id: request.recordId,
              is_liked: true
            })
            .select()
            .single();

          if (error) throw error;
          return createResponse({
            id: data.id,
            fromUserId: data.from_user_id,
            toUserId: data.to_user_id,
            recordId: data.record_id,
            isActive: data.is_liked,
            createdAt: data.created_at
          });
        }
      } catch (error) {
        return handleError(error);
      }
    },

    remove: async (fromUserId: string, _toUserId: string, recordId: string): Promise<ApiResponse<boolean>> => {
      try {
        // 软删除：将 is_liked 设置为 false
        const { error } = await supabase
          .from('heart_reactions')
          .update({ is_liked: false })
          .eq('from_user_id', fromUserId)
          .eq('record_id', recordId);

        if (error) throw error;
        return createResponse(true);
      } catch (error) {
        return handleError(error);
      }
    },

    getReactionsForRecords: async (recordIds: string[], toUserId?: string): Promise<ApiResponse<HeartReaction[]>> => {
      try {
        if (recordIds.length === 0) {
          return createResponse([]);
        }

        let query = supabase
          .from('heart_reactions')
          .select('*')
          .in('record_id', recordIds)
          .eq('is_liked', true); // 只查询有效的点赞

        if (toUserId) {
          query = query.eq('to_user_id', toUserId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return createResponse(
          (data || []).map((item) => ({
            id: item.id,
            fromUserId: item.from_user_id,
            toUserId: item.to_user_id,
            recordId: item.record_id,
            isActive: item.is_liked,
            createdAt: item.created_at
          }))
        );
      } catch (error) {
        return handleError(error);
      }
    },

    getCount: async (recordId: string): Promise<ApiResponse<number>> => {
      try {
        const { count, error } = await supabase
          .from('heart_reactions')
          .select('*', { count: 'exact', head: true })
          .eq('record_id', recordId);

        if (error) throw error;
        return createResponse(count || 0);
      } catch (error) {
        return handleError(error);
      }
    },

    hasReacted: async (userId: string, recordId: string): Promise<ApiResponse<boolean>> => {
      try {
        const { data, error } = await supabase
          .from('heart_reactions')
          .select('id')
          .eq('from_user_id', userId)
          .eq('record_id', recordId)
          .eq('is_liked', true)
          .limit(1);

        if (error) throw error;
        return createResponse((data?.length || 0) > 0);
      } catch (error) {
        return handleError(error);
      }
    },

    // 获取今天收到的爱心（to_user_id 是当前用户）
    getTodayReceivedHearts: async (userId: string): Promise<ApiResponse<HeartReaction[]>> => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data, error } = await supabase
          .from('heart_reactions')
          .select('*')
          .eq('to_user_id', userId)
          .eq('is_liked', true)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .order('created_at', { ascending: false });

        if (error) throw error;
        return createResponse(
          (data || []).map((item) => ({
            id: item.id,
            fromUserId: item.from_user_id,
            toUserId: item.to_user_id,
            recordId: item.record_id,
            isActive: item.is_liked,
            createdAt: item.created_at
          }))
        );
      } catch (error) {
        return handleError(error);
      }
    },
  },

  // 提醒相关
  reminder: {
    getCards: async (userId: string): Promise<ApiResponse<ReminderCard[]>> => {
      try {
        const { data, error } = await supabase
          .from('reminder_cards')
          .select('*')
          .eq('to_user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return createResponse((data || []).map(transformCard));
      } catch (error) {
        return handleError(error);
      }
    },

    createCard: async (card: Omit<ReminderCard, 'id' | 'createdAt'>): Promise<ApiResponse<ReminderCard>> => {
      try {
        const { data, error } = await supabase
          .from('reminder_cards')
          .insert({
            from_user_id: card.userId,
            to_user_id: card.userId, // 这里需要传入目标用户ID，简化处理
            message: card.message,
            bg_color: card.backgroundColor,
            text_color: card.textColor,
            is_active: card.isActive
          })
          .select()
          .single();

        if (error) throw error;
        return createResponse(transformCard(data));
      } catch (error) {
        return handleError(error);
      }
    },

    deleteCard: async (id: string): Promise<ApiResponse<boolean>> => {
      try {
        const { error } = await supabase
          .from('reminder_cards')
          .update({ is_active: false })
          .eq('id', id);

        if (error) throw error;
        return createResponse(true);
      } catch (error) {
        return handleError(error);
      }
    },
  },
};

// 导出形状和心情选项（保持和之前一致）
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

export const MOOD_OPTIONS: MoodOption[] = [
  { id: 'mood-great', emoji: '🤩', label: '超棒', color: '#FFD700' },
  { id: 'mood-happy', emoji: '😊', label: '开心', color: '#FFB74D' },
  { id: 'mood-normal', emoji: '😐', label: '一般', color: '#90A4AE' },
  { id: 'mood-tired', emoji: '😫', label: '疲惫', color: '#B0BEC5' },
  { id: 'mood-uncomfortable', emoji: '😣', label: '不舒服', color: '#EF5350' },
];

export const CARD_COLORS = [
  { bg: '#FFE5EC', text: '#FF6B9D' },
  { bg: '#E3F2FD', text: '#1976D2' },
  { bg: '#FFF9E6', text: '#F9CB66' },
  { bg: '#E8F5E9', text: '#388E3C' },
  { bg: '#FFF3E0', text: '#F57C00' },
  { bg: '#F3E5F5', text: '#7B1FA2' },
  { bg: '#E0F2F1', text: '#00796B' },
  { bg: '#FFFDE7', text: '#FBC02D' },
];

export default supabaseApi;
