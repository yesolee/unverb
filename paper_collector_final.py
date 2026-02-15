#!/usr/bin/env python3
"""
Paper Collector Final - 최종 버전
Semantic Scholar API와 OpenAlex API 통합
Abstract 없어도 포함하되, DOI와 인용수 필터는 유지
"""

import json
import time
import requests
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from collections import defaultdict

# 설정 파일 로드
config_dir = Path(__file__).parent / "config"
keywords_config = json.loads((config_dir / "keywords.json").read_text())
trusted_config = json.loads((config_dir / "trusted_sources.json").read_text())

PRIMARY_KEYWORDS = keywords_config["primary_keywords"]
SECONDARY_KEYWORDS = keywords_config["secondary_keywords"]
TRUSTED_JOURNALS = set(trusted_config["trusted_journals"])
MIN_CITATION_COUNT = trusted_config["minimum_citation_count"]
YEAR_MIN = trusted_config["year_range"]["min"]
YEAR_MAX = trusted_config["year_range"]["max"]

SEMANTIC_SCHOLAR_API = "https://api.semanticscholar.org/graph/v1/paper/search"
SEMANTIC_SCHOLAR_DOI = "https://api.semanticscholar.org/graph/v1/paper/DOI:{doi}"
OPENALEX_API = "https://api.openalex.org/works"

# 결과 저장소
papers_by_doi: Dict[str, Dict] = {}
total_requests = 0


def log_message(msg: str):
    """로그 메시지 출력"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {msg}")


def rate_limit_delay(delay: float = 1.0):
    """API 요청 간 지연"""
    time.sleep(delay)


def search_semantic_scholar(keyword: str, offset: int = 0, retry_count: int = 0) -> List[Dict]:
    """
    Semantic Scholar API로 논문 검색
    """
    global total_requests

    if retry_count > 3:
        log_message(f"[ERROR] Semantic Scholar - 최대 재시도 횟수 초과: {keyword}")
        return []

    params = {
        "query": keyword,
        "fields": "title,authors,year,venue,citationCount,abstract,externalIds,publicationTypes,url",
        "limit": 100,
        "offset": offset,
        "year": f"{YEAR_MIN}-{YEAR_MAX}"
    }

    try:
        total_requests += 1
        response = requests.get(SEMANTIC_SCHOLAR_API, params=params, timeout=10)

        if response.status_code == 429:
            log_message("[RATE_LIMIT] 429 응답 - 10초 대기 후 재시도")
            rate_limit_delay(10)
            return search_semantic_scholar(keyword, offset, retry_count + 1)

        response.raise_for_status()
        data = response.json()
        papers = data.get("data", [])

        log_message(f"  → {len(papers)}편 조회")
        rate_limit_delay(1)
        return papers

    except Exception as e:
        log_message(f"[ERROR] Semantic Scholar: {str(e)}")
        if retry_count < 3:
            log_message(f"  → 재시도 ({retry_count + 1}/3)")
            rate_limit_delay(2)
            return search_semantic_scholar(keyword, offset, retry_count + 1)
        return []


def get_semantic_scholar_by_doi(doi: str, retry_count: int = 0) -> Optional[Dict]:
    """
    Semantic Scholar API에서 DOI로 논문 정보 조회
    """
    global total_requests

    if retry_count > 2:
        return None

    url = SEMANTIC_SCHOLAR_DOI.format(doi=doi)
    params = {
        "fields": "title,authors,year,venue,citationCount,abstract,externalIds,publicationTypes,url"
    }

    try:
        total_requests += 1
        response = requests.get(url, params=params, timeout=10)

        if response.status_code == 429:
            rate_limit_delay(5)
            return get_semantic_scholar_by_doi(doi, retry_count + 1)

        if response.status_code == 404:
            return None

        response.raise_for_status()
        data = response.json()
        rate_limit_delay(0.5)
        return data

    except Exception:
        if retry_count < 2:
            rate_limit_delay(1)
            return get_semantic_scholar_by_doi(doi, retry_count + 1)
        return None


def search_openalex(keyword: str, retry_count: int = 0) -> List[Dict]:
    """
    OpenAlex API로 논문 검색
    """
    global total_requests

    if retry_count > 3:
        log_message(f"[ERROR] OpenAlex - 최대 재시도 횟수 초과: {keyword}")
        return []

    params = {
        "search": keyword,
        "filter": f"cited_by_count:>{MIN_CITATION_COUNT},publication_year:{YEAR_MIN}-{YEAR_MAX}",
        "per_page": 50
    }

    try:
        total_requests += 1
        response = requests.get(OPENALEX_API, params=params, timeout=10)

        if response.status_code == 429:
            log_message("[RATE_LIMIT] 429 응답 - 10초 대기 후 재시도")
            rate_limit_delay(10)
            return search_openalex(keyword, retry_count + 1)

        response.raise_for_status()
        data = response.json()
        papers = data.get("results", [])

        log_message(f"  → {len(papers)}편 조회")
        rate_limit_delay(1)
        return papers

    except Exception as e:
        log_message(f"[ERROR] OpenAlex: {str(e)}")
        if retry_count < 3:
            log_message(f"  → 재시도 ({retry_count + 1}/3)")
            rate_limit_delay(2)
            return search_openalex(keyword, retry_count + 1)
        return []


def extract_doi(external_ids: Dict) -> Optional[str]:
    """외부 ID에서 DOI 추출"""
    if not external_ids:
        return None
    return external_ids.get("DOI")


def filter_semantic_scholar_paper(paper: Dict, keyword: str) -> Optional[Dict]:
    """
    Semantic Scholar 논문 필터링 및 변환
    """
    # 필수 필드 확인
    if not paper.get("title"):
        return None

    doi = extract_doi(paper.get("externalIds", {}))
    if not doi:
        return None

    # 인용 횟수 필터
    citation_count = paper.get("citationCount", 0)
    if citation_count < MIN_CITATION_COUNT:
        return None

    # 연도 필터
    year = paper.get("year")
    if not year or year < YEAR_MIN or year > YEAR_MAX:
        return None

    venue = paper.get("venue", "")
    is_trusted = venue in TRUSTED_JOURNALS if venue else False

    return {
        "title": paper.get("title"),
        "authors": [a.get("name", "Unknown") for a in paper.get("authors", [])],
        "year": year,
        "journal": venue,
        "doi": doi,
        "citation_count": citation_count,
        "abstract": paper.get("abstract", ""),
        "publication_type": paper.get("publicationTypes", ["article"])[0] if paper.get("publicationTypes") else "article",
        "keywords_matched": [keyword],
        "source_api": "semantic_scholar",
        "url": paper.get("url", ""),
        "is_trusted_journal": is_trusted
    }


def filter_openalex_paper(paper: Dict, keyword: str) -> Optional[Dict]:
    """
    OpenAlex 논문 필터링 및 변환
    """
    # 필수 필드 확인
    if not paper.get("title"):
        return None

    # DOI 추출
    doi = paper.get("doi")
    if not doi:
        return None
    # DOI URL을 ID로 정규화
    if doi.startswith("https://"):
        doi = doi.replace("https://doi.org/", "").lower()

    # 인용 횟수 필터
    citation_count = paper.get("cited_by_count", 0)
    if citation_count < MIN_CITATION_COUNT:
        return None

    # 연도 필터
    year = paper.get("publication_year")
    if not year or year < YEAR_MIN or year > YEAR_MAX:
        return None

    # Abstract는 OpenAlex에서 제공되지 않을 수 있음
    abstract = paper.get("abstract") or ""

    # Journal 정보
    journal = ""
    if paper.get("primary_location") and paper["primary_location"].get("source"):
        journal = paper["primary_location"]["source"].get("display_name", "")

    is_trusted = journal in TRUSTED_JOURNALS if journal else False

    return {
        "title": paper.get("title"),
        "authors": [author.get("author", {}).get("display_name", "Unknown") for author in paper.get("authorships", [])],
        "year": year,
        "journal": journal,
        "doi": doi,
        "citation_count": citation_count,
        "abstract": abstract,
        "publication_type": paper.get("type", "article"),
        "keywords_matched": [keyword],
        "source_api": "openalex",
        "url": paper.get("url", paper.get("doi", "")),
        "is_trusted_journal": is_trusted
    }


def enrich_abstract_from_semantic_scholar(paper: Dict):
    """
    OpenAlex에서 가져온 논문의 Abstract를 Semantic Scholar에서 보충
    """
    if paper.get("abstract"):
        return

    doi = paper.get("doi")
    if not doi:
        return

    ss_paper = get_semantic_scholar_by_doi(doi)
    if ss_paper and ss_paper.get("abstract"):
        paper["abstract"] = ss_paper["abstract"]


def collect_papers():
    """
    논문 수집
    """
    log_message("=" * 60)
    log_message("논문 수집 시작 (최종 버전)")
    log_message("=" * 60)
    log_message(f"Primary 키워드: {', '.join(PRIMARY_KEYWORDS)}")
    log_message(f"최소 인용 횟수: {MIN_CITATION_COUNT}")
    log_message("")

    # Step 1: Primary 키워드로 Semantic Scholar 검색
    log_message("[Step 1] Semantic Scholar - Primary 키워드 검색")
    log_message("-" * 60)

    for keyword in PRIMARY_KEYWORDS:
        papers = search_semantic_scholar(keyword, offset=0)
        for paper in papers:
            filtered = filter_semantic_scholar_paper(paper, keyword)
            if filtered:
                doi = filtered["doi"]
                if doi not in papers_by_doi:
                    papers_by_doi[doi] = filtered
                else:
                    if keyword not in papers_by_doi[doi]["keywords_matched"]:
                        papers_by_doi[doi]["keywords_matched"].append(keyword)

    log_message(f"\nPrimary 키워드 검색 완료: {len(papers_by_doi)}편")

    # Step 2: 부족시 OpenAlex 검색
    current_count = len(papers_by_doi)
    log_message("")
    log_message("[Step 2] OpenAlex - 보충 검색")
    log_message("-" * 60)

    if current_count < 50:
        for keyword in SECONDARY_KEYWORDS:
            if len(papers_by_doi) >= 50:
                break

            papers = search_openalex(keyword)
            for paper in papers:
                if len(papers_by_doi) >= 50:
                    break

                filtered = filter_openalex_paper(paper, keyword)
                if filtered:
                    doi = filtered["doi"]
                    if doi not in papers_by_doi:
                        papers_by_doi[doi] = filtered
                    else:
                        if keyword not in papers_by_doi[doi]["keywords_matched"]:
                            papers_by_doi[doi]["keywords_matched"].append(keyword)

    log_message(f"\nOpenAlex 검색 완료: {len(papers_by_doi)}편")

    # Step 3: Abstract 보충
    if len(papers_by_doi) < 50:
        log_message("")
        log_message("[Step 3] Abstract 보충 (Semantic Scholar)")
        log_message("-" * 60)

        openalex_count = sum(1 for p in papers_by_doi.values() if p["source_api"] == "openalex")
        missing_abstract = sum(1 for p in papers_by_doi.values() if not p.get("abstract") and p["source_api"] == "openalex")
        log_message(f"OpenAlex 논문: {openalex_count}편, Abstract 누락: {missing_abstract}편")

        if missing_abstract > 0:
            log_message("Semantic Scholar에서 Abstract 조회 중...")
            enriched = 0
            for paper in papers_by_doi.values():
                if not paper.get("abstract") and paper["source_api"] == "openalex":
                    enrich_abstract_from_semantic_scholar(paper)
                    if paper.get("abstract"):
                        enriched += 1
            log_message(f"  → {enriched}편 Abstract 추가됨")

    # Step 4: 순위 매기기 및 상위 50편 선정
    log_message("")
    log_message("[Step 4] 순위 매기기 및 선정")
    log_message("-" * 60)

    # 신뢰 저널 여부와 인용수로 정렬
    sorted_papers = sorted(
        papers_by_doi.values(),
        key=lambda p: (p.get("is_trusted_journal", False), p.get("citation_count", 0)),
        reverse=True
    )

    # 상위 50편
    final_papers = sorted_papers[:50]

    log_message(f"최종 선정: {len(final_papers)}편")
    log_message(f"  - 신뢰 저널에서의 논문 수: {sum(1 for p in final_papers if p.get('is_trusted_journal'))}")
    log_message(f"  - 평균 인용 횟수: {sum(p.get('citation_count', 0) for p in final_papers) / len(final_papers):.1f}")

    final_with_abstract = sum(1 for p in final_papers if p.get("abstract") and p["abstract"].strip())
    log_message(f"  - Abstract 보유: {final_with_abstract}편")

    return final_papers


def save_results(papers: List[Dict]):
    """
    결과를 JSON 파일로 저장
    """
    output_dir = Path(__file__).parent / "content"
    output_dir.mkdir(exist_ok=True)

    # 논문에 ID 부여
    for idx, paper in enumerate(papers, 1):
        paper["paper_id"] = f"P-{idx:03d}"

    result = {
        "metadata": {
            "agent": "paper-collector",
            "collected_at": datetime.now().isoformat(),
            "total_papers": len(papers),
            "sources": ["semantic_scholar", "openalex"],
            "keywords_used": PRIMARY_KEYWORDS + SECONDARY_KEYWORDS,
            "total_api_requests": total_requests
        },
        "papers": papers
    }

    output_file = output_dir / "01-papers-raw.json"
    output_file.write_text(json.dumps(result, ensure_ascii=False, indent=2))

    log_message("")
    log_message("=" * 60)
    log_message("완료")
    log_message("=" * 60)
    log_message(f"파일 저장: {output_file}")
    log_message(f"수집된 논문: {len(papers)}편")
    log_message(f"API 요청 총 횟수: {total_requests}")


def main():
    """메인 실행 함수"""
    papers = collect_papers()
    save_results(papers)


if __name__ == "__main__":
    main()
