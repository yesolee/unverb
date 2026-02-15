#!/usr/bin/env python3
"""
Paper Collector v2 - 개선된 버전
Semantic Scholar API를 중심으로 Abstract이 있는 논문 우선 수집
"""

import json
import time
import requests
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Set, Optional
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
CROSSREF_API = "https://api.crossref.org/v1/works"

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


def search_crossref(keyword: str, retry_count: int = 0) -> List[Dict]:
    """
    CrossRef API로 논문 검색
    Abstract을 포함하는 결과를 우선적으로 반환
    """
    global total_requests

    if retry_count > 3:
        log_message(f"[ERROR] CrossRef - 최대 재시도 횟수 초과: {keyword}")
        return []

    params = {
        "query": keyword,
        "rows": 50,
        "sort": "cited",
        "order": "desc",
        "filter": f"from-pub-date:{YEAR_MIN}-01-01,until-pub-date:{YEAR_MAX}-12-31,has-abstract:true"
    }

    try:
        log_message(f"CrossRef 검색 중... [{keyword}]")
        total_requests += 1
        response = requests.get(CROSSREF_API, params=params, timeout=15, headers={"User-Agent": "unverb-bot"})

        if response.status_code == 429:
            log_message("[RATE_LIMIT] 429 응답 - 5초 대기 후 재시도")
            rate_limit_delay(5)
            return search_crossref(keyword, retry_count + 1)

        response.raise_for_status()
        data = response.json()
        papers = data.get("message", {}).get("items", [])

        log_message(f"  → {len(papers)}편 조회 (Abstract 보유 필터 적용)")
        rate_limit_delay(0.5)
        return papers

    except Exception as e:
        log_message(f"[ERROR] CrossRef - {keyword}: {str(e)}")
        if retry_count < 3:
            log_message(f"  → 재시도 ({retry_count + 1}/3)")
            rate_limit_delay(2)
            return search_crossref(keyword, retry_count + 1)
        return []


def search_semantic_scholar(keyword: str, retry_count: int = 0) -> List[Dict]:
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
        "limit": 50,
        "year": f"{YEAR_MIN}-{YEAR_MAX}"
    }

    try:
        log_message(f"Semantic Scholar 검색 중... [{keyword}]")
        total_requests += 1
        response = requests.get(SEMANTIC_SCHOLAR_API, params=params, timeout=10)

        if response.status_code == 429:
            log_message("[RATE_LIMIT] 429 응답 - 10초 대기 후 재시도")
            rate_limit_delay(10)
            return search_semantic_scholar(keyword, retry_count + 1)

        response.raise_for_status()
        data = response.json()
        papers = data.get("data", [])

        log_message(f"  → {len(papers)}편 조회 (raw)")
        rate_limit_delay(1)
        return papers

    except Exception as e:
        log_message(f"[ERROR] Semantic Scholar - {keyword}: {str(e)}")
        if retry_count < 3:
            log_message(f"  → 재시도 ({retry_count + 1}/3)")
            rate_limit_delay(2)
            return search_semantic_scholar(keyword, retry_count + 1)
        return []


def extract_doi(external_ids: Dict) -> Optional[str]:
    """외부 ID에서 DOI 추출"""
    if not external_ids:
        return None
    return external_ids.get("DOI")


def filter_semantic_scholar_paper(paper: Dict, keyword: str) -> Optional[Dict]:
    """
    Semantic Scholar 논문 필터링 및 변환
    Abstract 필수
    """
    # 필수 필드 확인
    if not paper.get("title"):
        return None
    if not paper.get("abstract"):  # Abstract 필수
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


def filter_crossref_paper(paper: Dict, keyword: str) -> Optional[Dict]:
    """
    CrossRef 논문 필터링 및 변환
    """
    # 필수 필드 확인
    if not paper.get("title"):
        return None

    # DOI 추출
    doi = paper.get("DOI")
    if not doi:
        return None
    # DOI 정규화 (소문자)
    doi = doi.lower()

    # 인용 횟수 필터
    citation_count = paper.get("cited-by-count", 0)
    if citation_count < MIN_CITATION_COUNT:
        return None

    # 연도 필터
    year = paper.get("published", {}).get("date-parts", [[None]])[0][0]
    if not year or year < YEAR_MIN or year > YEAR_MAX:
        return None

    # Abstract 확인
    abstract = paper.get("abstract")
    if not abstract:
        return None

    # Journal 정보
    journal = ""
    if paper.get("container-title"):
        journal = paper["container-title"][0] if isinstance(paper["container-title"], list) else paper["container-title"]

    is_trusted = journal in TRUSTED_JOURNALS if journal else False

    # 저자 정보
    authors = []
    if paper.get("author"):
        for author in paper["author"]:
            name = ""
            if author.get("family"):
                name = author["family"]
                if author.get("given"):
                    name = f"{author['given']} {name}"
            if name:
                authors.append(name)

    return {
        "title": paper.get("title", [""])[0] if isinstance(paper.get("title"), list) else paper.get("title", ""),
        "authors": authors,
        "year": year,
        "journal": journal,
        "doi": doi,
        "citation_count": citation_count,
        "abstract": abstract,
        "publication_type": paper.get("type", "article"),
        "keywords_matched": [keyword],
        "source_api": "crossref",
        "url": f"https://doi.org/{doi}",
        "is_trusted_journal": is_trusted
    }


def collect_papers():
    """
    논문 수집 (CrossRef + Semantic Scholar)
    Abstract 우선 필터링
    """
    log_message("=" * 60)
    log_message("논문 수집 시작 (v2)")
    log_message("=" * 60)
    log_message(f"Primary 키워드: {', '.join(PRIMARY_KEYWORDS)}")
    log_message(f"최소 인용 횟수: {MIN_CITATION_COUNT}")
    log_message("")

    # Step 1: CrossRef로 Abstract 있는 논문 검색
    log_message("[Step 1] CrossRef - Abstract 보유 논문 검색")
    log_message("-" * 60)

    for keyword in PRIMARY_KEYWORDS:
        papers = search_crossref(keyword)
        for paper in papers:
            filtered = filter_crossref_paper(paper, keyword)
            if filtered:
                doi = filtered["doi"]
                if doi not in papers_by_doi:
                    papers_by_doi[doi] = filtered
                else:
                    if keyword not in papers_by_doi[doi]["keywords_matched"]:
                        papers_by_doi[doi]["keywords_matched"].append(keyword)

    log_message(f"\nCrossRef 검색 완료: {len(papers_by_doi)}편")

    # Step 2: Semantic Scholar로 보충 (Abstract 있는 것만)
    log_message("")
    log_message("[Step 2] Semantic Scholar - 보충 검색 (Abstract 필수)")
    log_message("-" * 60)

    if len(papers_by_doi) < 50:
        keywords_to_search = PRIMARY_KEYWORDS + SECONDARY_KEYWORDS
        for keyword in keywords_to_search:
            if len(papers_by_doi) >= 50:
                break

            papers = search_semantic_scholar(keyword)
            for paper in papers:
                if len(papers_by_doi) >= 50:
                    break

                filtered = filter_semantic_scholar_paper(paper, keyword)
                if filtered:
                    doi = filtered["doi"]
                    if doi not in papers_by_doi:
                        papers_by_doi[doi] = filtered
                    else:
                        if keyword not in papers_by_doi[doi]["keywords_matched"]:
                            papers_by_doi[doi]["keywords_matched"].append(keyword)

    log_message(f"\n보충 검색 완료: {len(papers_by_doi)}편")

    # Step 3: 순위 매기기 및 상위 50편 선정
    log_message("")
    log_message("[Step 3] 순위 매기기")
    log_message("-" * 60)

    sorted_papers = sorted(
        papers_by_doi.values(),
        key=lambda p: (p.get("is_trusted_journal", False), p.get("citation_count", 0)),
        reverse=True
    )

    final_papers = sorted_papers[:50]

    log_message(f"최종 선정: {len(final_papers)}편")
    log_message(f"  - 신뢰 저널에서의 논문 수: {sum(1 for p in final_papers if p.get('is_trusted_journal'))}")
    log_message(f"  - 평균 인용 횟수: {sum(p.get('citation_count', 0) for p in final_papers) / len(final_papers):.1f}")

    # Abstract 상태
    final_abstract_count = sum(1 for p in final_papers if p.get("abstract"))
    log_message(f"  - Abstract 보유: {final_abstract_count}편")

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
            "sources": ["crossref", "semantic_scholar"],
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
