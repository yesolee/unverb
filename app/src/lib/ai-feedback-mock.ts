// AI 피드백 Mock 생성 함수 (개발용)
// Phase 1 Week 2: Claude API 대신 사용
// → Phase 2: Claude API 직접 호출로 전환 예정

import type { AiFeedbackResponse } from "@/types/database";

// Level 2 위험 키워드 (공감 강화 트리거)
const LEVEL_2_KEYWORDS = ["우울", "불안", "무기력", "외롭다", "슬프다", "공허하다"];

// 관찰 미션(observe) 피드백 템플릿
const OBSERVE_TEMPLATES: AiFeedbackResponse[] = [
  {
    empathy: "일상 속에서 무언가를 발견하셨네요. 평소라면 지나쳤을 순간을 기록해주셨어요.",
    discovery: "같은 공간인데 시간대가 다르니 느낌도 달라진다는 게 흥미로워요. 혹시 '장소'보다 '시간'이 더 중요했던 건 아닐까요?",
    hint: "다음에도 비슷한 시간대에 어떤 기분이 드는지 한 번 살펴보세요.",
  },
  {
    empathy: "평소 무의식적으로 선택하던 것을 의식적으로 관찰하셨네요. 쉽지 않은 일이에요.",
    discovery: "첫 번째로 떠오른 것과 실제 선택한 것이 달랐다는 점이 재미있어요. 그 사이에 어떤 생각이 있었는지 궁금하네요.",
    hint: "다음번엔 '왜 바꿨지?' 하는 순간에 잠깐 멈춰서 생각해보세요.",
  },
  {
    empathy: "하루 중 가장 편안했던 순간을 찾으셨네요. 그 순간을 기록으로 남기셨어요.",
    discovery: "편안함을 느낀 순간의 공통점을 찾아보면 흥미로울 것 같아요. 혹시 '혼자'였나요, 아니면 '누군가와 함께'였나요?",
    hint: "앞으로 며칠 동안 편안한 순간들을 모아보면 패턴이 보일 거예요.",
  },
  {
    empathy: "가장 오래 머무른 장소를 찾아내셨네요. 그곳에서 어떤 느낌이었는지 궁금해요.",
    discovery: "오래 머물렀다는 건 무언가 이끌리는 요소가 있었다는 뜻이에요. 장소 자체인지, 그곳에서 하던 일인지 한 번 떠올려보세요.",
    hint: "다음엔 그곳에서 '왜 떠나기 싫었는지' 물어보는 것도 좋을 것 같아요.",
  },
  {
    empathy: "일상 속 작은 순간을 포착하셨네요. 지나가버릴 수 있는 경험을 기록으로 남기셨어요.",
    discovery: "같은 행동인데 오늘은 뭔가 다르게 느껴졌다면, 그 차이가 어디서 왔는지 생각해보면 재미있을 거예요.",
    hint: "비슷한 순간이 또 오면, 그때의 기분을 이번 기록과 비교해보세요.",
  },
];

// 탐색 미션(explore) 피드백 템플릿
const EXPLORE_TEMPLATES: AiFeedbackResponse[] = [
  {
    empathy: "익숙한 것을 벗어나보는 건 작은 용기가 필요한 일이에요. 그런데 그 안에서 뭔가를 발견하셨네요.",
    discovery: "새로운 경험을 했을 때 첫 반응이 어땠는지가 흥미로운 포인트예요. 기대했던 것과 실제 느낌이 같았나요, 달랐나요?",
    hint: "다음에 비슷한 새로운 시도를 할 때, 그 첫 반응을 한 번 기억해보세요.",
  },
  {
    empathy: "평소 안 하던 것을 해보셨네요. 결과보다 '해봤다'는 것 자체가 의미 있어요.",
    discovery: "새로운 경험 후에 기분이 어땠는지가 중요해요. 혹시 '새로운 가능성을 발견하는 것' 자체가 즐거웠던 건 아닐까요?",
    hint: "이번 경험이 일회성일지, 또 해보고 싶을지 며칠 뒤에 다시 떠올려보세요.",
  },
  {
    empathy: "낯선 환경에 들어가보셨네요. 익숙한 것에서 벗어나는 건 언제나 약간의 긴장이 따라요.",
    discovery: "같은 '혼자 있기'인데 장소가 바뀌니 느낌도 달라졌을 것 같아요. 어떤 차이가 있었는지 궁금하네요.",
    hint: "다음엔 또 다른 장소에서 같은 행동을 해보면 재미있을 것 같아요.",
  },
  {
    empathy: "처음 해보는 선택을 하셨네요. 선택 자체보다 그 과정에서 느낀 걸 기록하셨어요.",
    discovery: "평소 선택과 다른 선택을 했을 때 기분이 어땠는지가 흥미로워요. 불편했나요, 신선했나요?",
    hint: "앞으로 비슷한 선택지가 나오면, 이번 경험을 떠올려보세요.",
  },
  {
    empathy: "작은 변화를 시도해보셨네요. 큰 것보다 작은 변화가 더 많은 걸 알려주기도 해요.",
    discovery: "새로운 시도를 하고 나서 '다음에도 해볼까?' 하는 생각이 들었는지 궁금해요. 그 반응이 당신의 무의식적 취향을 보여줄 수 있어요.",
    hint: "이번 주 안에 또 다른 작은 새로운 것 하나를 시도해보세요.",
  },
];

// Level 2 키워드용 공감 강화 템플릿
const SUPPORTIVE_TEMPLATES: Record<"observe" | "explore", AiFeedbackResponse[]> = {
  observe: [
    {
      empathy: "힘든 순간 속에서도 기록을 남기셨네요. 그 자체로 의미 있는 일이에요.",
      discovery: "어려운 감정을 느낄 때 어떤 행동을 하는지 관찰하는 것도 자기 이해의 한 방법이에요. 혹시 특정 장소나 시간대에 그런 기분이 더 자주 드나요?",
      hint: "힘들 때는 무리하지 않아도 괜찮아요. 필요하다면 전문 상담도 도움이 될 수 있어요.",
    },
    {
      empathy: "지금 느끼고 계신 감정을 있는 그대로 기록해주셨네요. 용기가 필요한 일이에요.",
      discovery: "어려운 감정 속에서도 일상을 관찰하려는 시도를 하셨어요. 그 순간 뭔가 작은 위로가 되는 것이 있었나요?",
      hint: "힘들 때는 천천히 가도 괜찮아요. 전문가의 도움을 받는 것도 좋은 선택이 될 수 있어요.",
    },
  ],
  explore: [
    {
      empathy: "쉽지 않은 상황에서도 새로운 시도를 해보셨네요. 그 용기가 대단해요.",
      discovery: "새로운 경험이 지금 느끼는 감정에 어떤 영향을 줬는지 궁금해요. 잠시라도 다른 느낌이 들었나요?",
      hint: "힘들 때는 스스로를 몰아붙이지 않아도 괜찮아요. 필요하면 전문 상담을 받아보는 것도 도움이 될 수 있어요.",
    },
    {
      empathy: "어려운 마음 속에서도 작은 변화를 시도해보셨네요. 그 자체로 의미가 있어요.",
      discovery: "새로운 경험이 현재 기분에 조금이라도 영향을 줬는지 관찰해보세요. 때로는 작은 변화가 큰 차이를 만들기도 해요.",
      hint: "힘든 시기에는 혼자 견디지 않아도 돼요. 전문가와 이야기하는 것도 좋은 방법이에요.",
    },
  ],
};

/**
 * Mock AI 피드백 생성 함수
 *
 * 개발 단계에서 Claude API 대신 사용
 * 미션 타입과 텍스트 내용 기반으로 적절한 피드백 템플릿 선택
 *
 * @param input.missionText - 미션 지시문
 * @param input.missionType - 미션 타입 (observe: 관찰, explore: 탐색)
 * @param input.meaningText - 미션 의미 설명
 * @param input.textContent - 사용자가 작성한 기록 텍스트
 * @returns 공감 → 발견 → 힌트 3단계 피드백
 */
export async function generateMockFeedback(input: {
  missionText: string;
  missionType: "observe" | "explore";
  meaningText: string;
  textContent: string;
}): Promise<AiFeedbackResponse> {
  const { missionType, textContent } = input;

  // 500ms 인위적 딜레이 (로딩 UX 테스트용)
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Level 2 위험 키워드 감지
  const hasLevel2Keyword = LEVEL_2_KEYWORDS.some((keyword) =>
    textContent.includes(keyword)
  );

  // Level 2 키워드가 있으면 공감 강화 템플릿 사용
  if (hasLevel2Keyword) {
    const templates = SUPPORTIVE_TEMPLATES[missionType];
    const selectedIndex = Math.floor(Math.random() * templates.length);
    return templates[selectedIndex];
  }

  // 일반 템플릿 선택
  const templates = missionType === "observe" ? OBSERVE_TEMPLATES : EXPLORE_TEMPLATES;

  // 텍스트 길이 기반 선택 + 랜덤성
  const textLength = textContent.length;
  let selectedIndex: number;

  if (textLength < 50) {
    // 짧은 기록: 앞쪽 템플릿 선호
    selectedIndex = Math.floor(Math.random() * 2);
  } else if (textLength < 150) {
    // 중간 길이: 중간 템플릿 선호
    selectedIndex = 2 + Math.floor(Math.random() * 2);
  } else {
    // 긴 기록: 전체 랜덤
    selectedIndex = Math.floor(Math.random() * templates.length);
  }

  return templates[selectedIndex];
}

/**
 * Level 2 위험 키워드 감지 여부 확인 (외부 사용용)
 */
export function detectLevel2Keywords(textContent: string): boolean {
  return LEVEL_2_KEYWORDS.some((keyword) => textContent.includes(keyword));
}
