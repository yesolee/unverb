-- ================================================
-- unverb Phase 1 초기 스키마
-- 7개 테이블 + RLS + Storage 버킷
-- ================================================

-- 1. profiles — Auth 확장 (닉네임, 알림 설정)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL DEFAULT '사용자',
  notification_time JSONB DEFAULT '{"mission": "08:00", "record": "21:00"}'::jsonb,
  fcm_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 프로필 조회" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "본인 프로필 수정" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "본인 프로필 생성" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. missions — 미션 DB (Phase 0 콘텐츠)
CREATE TABLE missions (
  id SERIAL PRIMARY KEY,
  mission_id TEXT UNIQUE NOT NULL,
  mission_type TEXT NOT NULL CHECK (mission_type IN ('observe', 'explore')),
  mission_text TEXT NOT NULL,
  meaning_text TEXT NOT NULL,
  source_doi TEXT NOT NULL,
  source_title TEXT NOT NULL,
  category TEXT NOT NULL,
  safety_level TEXT NOT NULL DEFAULT 'green',
  hints JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "미션 전체 조회" ON missions
  FOR SELECT USING (true);

-- 3. questions — 성찰 질문 DB (Phase 0 콘텐츠)
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  question_id TEXT UNIQUE NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  source_doi TEXT NOT NULL,
  source_title TEXT NOT NULL,
  category TEXT,
  followup_hints JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "질문 전체 조회" ON questions
  FOR SELECT USING (true);

-- 4. user_missions — 사용자별 일일 미션 할당
CREATE TABLE user_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mission_id INTEGER NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, assigned_date)
);

CREATE INDEX idx_user_missions_user_date ON user_missions(user_id, assigned_date);

ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 미션 조회" ON user_missions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 미션 생성" ON user_missions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 미션 수정" ON user_missions
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. recordings — 기록 (사진 + 텍스트)
CREATE TABLE recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_mission_id UUID REFERENCES user_missions(id) ON DELETE SET NULL,
  photo_url TEXT,
  text_content TEXT CHECK (length(text_content) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recordings_user_id ON recordings(user_id);

ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 기록 조회" ON recordings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 기록 생성" ON recordings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 기록 수정" ON recordings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "본인 기록 삭제" ON recordings
  FOR DELETE USING (auth.uid() = user_id);

-- 6. user_reflections — 성찰 질문 응답
CREATE TABLE user_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recording_id UUID REFERENCES recordings(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_reflections_user_id ON user_reflections(user_id);

ALTER TABLE user_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 성찰 조회" ON user_reflections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 성찰 생성" ON user_reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. ai_feedbacks — AI 피드백 (공감+발견+힌트)
CREATE TABLE ai_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  empathy TEXT NOT NULL,
  discovery TEXT NOT NULL,
  hint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_feedbacks_recording_id ON ai_feedbacks(recording_id);

ALTER TABLE ai_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 피드백 조회" ON ai_feedbacks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "본인 피드백 생성" ON ai_feedbacks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================================
-- Storage 버킷
-- ================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('recording-photos', 'recording-photos', true);

CREATE POLICY "본인 사진 업로드" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'recording-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "본인 사진 조회" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'recording-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "본인 사진 삭제" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'recording-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
