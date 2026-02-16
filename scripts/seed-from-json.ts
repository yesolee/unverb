/**
 * content/03-content-validated.json → Supabase missions/questions 시드
 * 실행: cd scripts && npm install && npm run seed
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// .env.local 로드
config({ path: '.env.local' });

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('❌ .env.local에 SUPABASE_URL과 SUPABASE_SECRET_KEY를 설정해주세요');
  process.exit(1);
}

// Service Role Key로 RLS 우회
const supabase = createClient(supabaseUrl, supabaseSecretKey);

async function seed() {
  console.log('🌱 시드 작업 시작...');

  // JSON 파일 읽기
  const filePath = join(__dirname, '../content/03-content-validated.json');
  const rawData = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(rawData);

  // 미션 데이터 준비
  const observeMissions = data.validated_content.missions.observe;
  const exploreMissions = data.validated_content.missions.explore;
  const allMissions = [...observeMissions, ...exploreMissions].map((m: any) => ({
    mission_id: m.mission_id,
    mission_type: m.mission_type,
    mission_text: m.mission_text,
    meaning_text: m.meaning_text,
    source_doi: m.source_doi,
    source_title: m.source_title,
    category: m.category,
    safety_level: m.safety_level,
  }));

  console.log(`📋 미션 ${allMissions.length}개 삽입 중...`);

  const { error: missionsError } = await supabase
    .from('missions')
    .upsert(allMissions, { onConflict: 'mission_id' });

  if (missionsError) {
    console.error('❌ 미션 삽입 실패:', missionsError.message);
    process.exit(1);
  }
  console.log(`✅ 미션 ${allMissions.length}개 완료`);

  // 질문 데이터 준비
  const questions = data.validated_content.questions.map((q: any) => ({
    question_id: q.question_id,
    question_text: q.question_text,
    options: q.options, // JSONB 배열
    source_doi: q.source_doi,
    source_title: q.source_title,
    category: q.category || null,
  }));

  console.log(`📋 질문 ${questions.length}개 삽입 중...`);

  const { error: questionsError } = await supabase
    .from('questions')
    .upsert(questions, { onConflict: 'question_id' });

  if (questionsError) {
    console.error('❌ 질문 삽입 실패:', questionsError.message);
    process.exit(1);
  }
  console.log(`✅ 질문 ${questions.length}개 완료`);

  console.log('🎉 시드 작업 완료!');
}

seed();
