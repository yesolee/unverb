// Supabase 테이블 TypeScript 타입 정의

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          notification_time: NotificationTime;
          fcm_token: string | null;
          onboarding_completed: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          nickname?: string;
          notification_time?: NotificationTime;
          fcm_token?: string | null;
          onboarding_completed?: boolean;
        };
        Update: {
          nickname?: string;
          notification_time?: NotificationTime;
          fcm_token?: string | null;
          onboarding_completed?: boolean;
        };
      };
      missions: {
        Row: {
          id: number;
          mission_id: string;
          mission_type: "observe" | "explore";
          mission_text: string;
          meaning_text: string;
          source_doi: string;
          source_title: string;
          category: string;
          safety_level: string;
          created_at: string;
        };
        Insert: {
          mission_id: string;
          mission_type: "observe" | "explore";
          mission_text: string;
          meaning_text: string;
          source_doi: string;
          source_title: string;
          category: string;
          safety_level?: string;
        };
        Update: {
          mission_text?: string;
          meaning_text?: string;
          safety_level?: string;
        };
      };
      questions: {
        Row: {
          id: number;
          question_id: string;
          question_text: string;
          options: string[];
          source_doi: string;
          source_title: string;
          category: string | null;
          created_at: string;
        };
        Insert: {
          question_id: string;
          question_text: string;
          options: string[];
          source_doi: string;
          source_title: string;
          category?: string | null;
        };
        Update: {
          question_text?: string;
          options?: string[];
        };
      };
      user_missions: {
        Row: {
          id: string;
          user_id: string;
          mission_id: number;
          assigned_date: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          mission_id: number;
          assigned_date: string;
          completed?: boolean;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
        };
      };
      recordings: {
        Row: {
          id: string;
          user_id: string;
          user_mission_id: string | null;
          photo_url: string | null;
          text_content: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          user_mission_id?: string | null;
          photo_url?: string | null;
          text_content?: string | null;
        };
        Update: {
          photo_url?: string | null;
          text_content?: string | null;
        };
      };
      user_reflections: {
        Row: {
          id: string;
          user_id: string;
          recording_id: string;
          question_id: number;
          response_text: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          recording_id: string;
          question_id: number;
          response_text: string;
        };
        Update: {
          response_text?: string;
        };
      };
      ai_feedbacks: {
        Row: {
          id: string;
          user_id: string;
          recording_id: string;
          empathy: string;
          discovery: string;
          hint: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          recording_id: string;
          empathy: string;
          discovery: string;
          hint: string;
        };
        Update: {
          empathy?: string;
          discovery?: string;
          hint?: string;
        };
      };
    };
  };
};

export type NotificationTime = {
  mission: string;
  record: string;
};

// 편의 타입
export type Mission = Database["public"]["Tables"]["missions"]["Row"];
export type Question = Database["public"]["Tables"]["questions"]["Row"];
export type UserMission = Database["public"]["Tables"]["user_missions"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Recording = Database["public"]["Tables"]["recordings"]["Row"];
export type UserReflection = Database["public"]["Tables"]["user_reflections"]["Row"];
export type AiFeedback = Database["public"]["Tables"]["ai_feedbacks"]["Row"];

// 미션 + 조인 데이터
export type UserMissionWithDetails = UserMission & {
  missions: Mission;
};

// AI 피드백 응답 구조 (공감 → 발견 → 힌트)
export type AiFeedbackResponse = {
  empathy: string;
  discovery: string;
  hint: string;
};

// 위기 감지 결과
export type CrisisDetectionResult = {
  crisis_detected: boolean;
  level: 1 | 2 | 3;
  action: "empathy_only" | "suggest_support" | "show_crisis_screen";
  matched_keyword?: string;
  helplines?: { name: string; number: string }[];
};

// 기록 플로우 스텝
export type RecordStep = "idle" | "recording" | "reflection" | "feedback" | "done";
