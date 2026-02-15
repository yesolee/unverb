#!/usr/bin/env python3
"""
Abstract 보충 도구
CrossRef API와 Semantic Scholar API를 이용하여 부족한 Abstract을 채운다.
"""

import json
import time
import requests
from pathlib import Path
from typing import Dict, Optional

CROSSREF_API = "https://api.crossref.org/v1/works/{doi}"
SEMANTIC_SCHOLAR_DOI = "https://api.semanticscholar.org/graph/v1/paper/DOI:{doi}"


def log_message(msg: str):
    """로그 메시지 출력"""
    print(msg)


def get_abstract_from_crossref(doi: str) -> Optional[str]:
    """CrossRef API에서 Abstract 조회"""
    try:
        url = CROSSREF_API.format(doi=doi)
        response = requests.get(url, timeout=10)

        if response.status_code == 404:
            return None

        response.raise_for_status()
        data = response.json()

        if data.get("status") == "ok":
            message = data.get("message", {})
            abstract = message.get("abstract")
            if abstract:
                return abstract
        return None

    except Exception as e:
        return None


def get_abstract_from_semantic_scholar(doi: str) -> Optional[str]:
    """Semantic Scholar API에서 Abstract 조회"""
    try:
        url = SEMANTIC_SCHOLAR_DOI.format(doi=doi)
        params = {
            "fields": "abstract"
        }
        response = requests.get(url, params=params, timeout=10)

        if response.status_code == 404:
            return None

        response.raise_for_status()
        data = response.json()
        abstract = data.get("abstract")

        if abstract:
            return abstract
        return None

    except Exception as e:
        return None


def enrich_abstracts():
    """
    현재 저장된 논문 파일에서 Abstract이 없는 논문들을 보충
    """
    filepath = Path(__file__).parent / "content" / "01-papers-raw.json"

    if not filepath.exists():
        log_message(f"파일이 없습니다: {filepath}")
        return

    data = json.loads(filepath.read_text())
    papers = data["papers"]

    log_message("=" * 70)
    log_message("Abstract 보충 시작")
    log_message("=" * 70)

    # Abstract이 없는 논문 찾기
    missing = [p for p in papers if not p.get("abstract") or not p["abstract"].strip()]
    log_message(f"\n보충할 논문: {len(missing)}편 / {len(papers)}편\n")

    enriched_count = 0
    sources = {}

    for idx, paper in enumerate(missing, 1):
        if idx % 5 == 0:
            time.sleep(1)

        doi = paper.get("doi")
        if not doi:
            continue

        log_message(f"[{idx}/{len(missing)}] {paper['title'][:60]}...")

        # CrossRef 시도
        abstract = get_abstract_from_crossref(doi)
        if abstract:
            paper["abstract"] = abstract
            enriched_count += 1
            sources["crossref"] = sources.get("crossref", 0) + 1
            log_message(f"  → CrossRef에서 조회 (길이: {len(abstract)})")
            time.sleep(0.5)
            continue

        # Semantic Scholar 시도
        abstract = get_abstract_from_semantic_scholar(doi)
        if abstract:
            paper["abstract"] = abstract
            enriched_count += 1
            sources["semantic_scholar"] = sources.get("semantic_scholar", 0) + 1
            log_message(f"  → Semantic Scholar에서 조회 (길이: {len(abstract)})")
            time.sleep(0.5)
            continue

        log_message(f"  → 조회 실패")
        time.sleep(0.3)

    # 결과 저장
    log_message("")
    log_message("=" * 70)
    log_message(f"완료: {enriched_count}편 Abstract 추가됨")
    log_message(f"소스 분포: {sources}")
    log_message("=" * 70)

    # 최종 통계
    final_missing = sum(1 for p in papers if not p.get("abstract") or not p["abstract"].strip())
    log_message(f"\n최종 상태:")
    log_message(f"  - Abstract 있음: {len(papers) - final_missing}편")
    log_message(f"  - Abstract 없음: {final_missing}편")

    # 저장
    filepath.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    log_message(f"\n파일 저장: {filepath}")


if __name__ == "__main__":
    enrich_abstracts()
