<p align="center">
  <img src="./assets/logo.svg" alt="Token Usage Logo" width="88" height="88" />
</p>

<h1 align="center">Token Usage</h1>

<p align="center">
  <strong><a href="https://antigravity.google">Antigravity</a>를 위한 실시간 토큰·컨텍스트·비용·세션 상태 분석 플러그인 — 100% 로컬, 외부 의존성 제로, 프라이버시 우선.</strong>
</p>

<p align="center">
  <a href="./README.md">简体中文</a> ·
  <a href="./README.en.md">English</a> ·
  <a href="./README.ja.md">日本語</a> ·
  <strong>한국어</strong> ·
  <a href="./README.es.md">Español</a>
</p>

<p align="center">
  <a href="./plugin.json"><img src="https://img.shields.io/badge/version-1.1.0-blue.svg" alt="Version" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-yellow.svg" alt="MIT License" /></a>
  <a href="./sidecars/token_panel/package.json"><img src="https://img.shields.io/badge/dependencies-zero-brightgreen.svg" alt="Zero Dependencies" /></a>
  <a href="#-프라이버시-및-보안"><img src="https://img.shields.io/badge/privacy-100%25%20local-emerald.svg" alt="100% Local" /></a>
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg" alt="Cross-Platform" />
</p>

---

## ⚡ 빠른 설치 (추천: Agent에게 한 문장으로 설치)

터미널을 열거나 저장소를 직접 복제하고 파일을 복사할 필요가 없습니다. **아래 문장을 Antigravity 채팅창에 그대로 붙여넣기만 하면** Agent가 설치부터 검증, 활성화 안내까지 자동으로 처리합니다:

> ```text
> https://github.com/RanFeng/token-usage Antigravity 플러그인을 ~/.gemini/config/plugins/token-usage 에 설치해 줘 (sync.sh가 있으면 실행). 설치된 파일을 검증하고 Token Usage 패널을 활성화해서 열 수 있는 링크를 알려줘.
> ```

**Agent가 자동으로 수행하는 작업:**
1. `https://github.com/RanFeng/token-usage` 저장소를 로컬로 클론합니다.
2. 플러그인 파일(`plugin.json`, `assets/`, `sidecars/`, `skills/`)을 `~/.gemini/config/plugins/token-usage`에 동기화합니다.
3. 설치 무결성을 확인한 뒤, **Customizations / Plugins** 페이지로 바로 이동할 수 있는 링크를 제공하여 원클릭으로 **Token Usage**를 켤 수 있게 해줍니다.

### 🔄 한 문장으로 최신 버전 업데이트

새 버전이 출시되면 Antigravity에 한 문장만 입력하세요:

> ```text
> token-usage 플러그인을 https://github.com/RanFeng/token-usage 최신 버전으로 업데이트하고 ~/.gemini/config/plugins/token-usage 에 동기화해 줘.
> ```

<details>
<summary><strong>🛠️ 수동 설치(CLI)를 원하시나요? 클릭해서 펼치기</strong></summary>

#### 사전 요구 사항
- **Antigravity** 설치됨
- **Node.js 18+** (의존성 없는 Sidecar 웹 패널 실행용)
- **Python 3.8+** (채팅 Skill 및 CLI 통계 스크립트 실행용)

#### macOS / Linux (`sync.sh` 사용 권장)
```bash
git clone https://github.com/RanFeng/token-usage.git
cd token-usage
./sync.sh
```
또는 Antigravity 플러그인 디렉터리로 직접 클론:
```bash
git clone https://github.com/RanFeng/token-usage.git ~/.gemini/config/plugins/token-usage
```

#### Windows (PowerShell)
```powershell
git clone https://github.com/RanFeng/token-usage.git "$env:USERPROFILE\.gemini\config\plugins\token-usage"
```

#### 플러그인 활성화
1. **Antigravity** → **Customizations / Plugins**로 이동합니다.
2. **Token Usage**를 활성화합니다(재시작 없이 즉시 적용).
3. 사이드바 보조 패널(**Aux Pane**)에서 **Token Usage** 패널을 엽니다.

</details>

---

## 📖 상세 사용 방법

Token Usage는 **세 가지 방식**으로 활용할 수 있습니다.

### 1. 실시간 Sidecar 패널 (Aux Pane)

Antigravity 보조 사이드바에서 **Token Usage** 패널을 열어 실시간 시각 분석을 확인하세요.

#### 📊 Current 탭 — 현재 세션 실시간 분석
- **컨텍스트 윈도우 게이지**: 사용량 / 남은 용량 / 한도, 누적 `input`·`cache_read`·`output` 토큰, API 환산 비용 및 캐시 절감액을 실시간으로 표시합니다.
- **컨텍스트 증가 곡선**: 턴별 컨텍스트 확장을 추적하고 **Compact(압축) 시점**을 자동으로 강조 표시합니다.
- **실시간 세션 상태 진단**: 다음 4가지 이상 징후를 자동 감지합니다(개별 닫기 가능):
  - Compact 임박(`≥80%` 경고 / `≥90%` 위험)
  - 연속 오류 반복 루프
  - 단일 턴 토큰 급증
  - 낮은 프롬프트 캐시 적중률
- **100% 로컬 Lite DLP 민감 정보 탐지**: 7종의 고신뢰 자격 증명(`API Key`, `AWS Key`, `GitHub Token`, `Google Key`, `JWT`, 개인 키, `DB URI`)을 로컬에서 스캔합니다. **원본 비밀 값은 절대 저장하거나 표시하지 않으며**, 마스킹된 스니펫만 보여주고 클릭 한 번으로 해당 턴으로 이동할 수 있습니다.
- **턴별 분석 & JSON 트리 뷰어**:
  - 각 턴을 **모델 사고 시간 vs 도구 실행 시간**으로 분리하고 모델·도구별 기여도를 보여줍니다.
  - 키워드 검색 및 빠른 필터(`전체` / `고소비` / `오류` / `미디어`)를 지원합니다.
  - 검색·접기·복사가 가능한 내장 **JSON 트리 뷰어**로 도구 입력값과 결과를 손쉽게 확인할 수 있습니다.
- **비식별 세션 진단 카드 (PNG)**: 2× 고해상도 진단 스냅샷(컨텍스트 곡선, 토큰, 캐시율, 모델/도구 통계)을 복사 또는 저장합니다. **프롬프트 내용, 파일 경로, 프로젝트명, 민감 정보는 100% 제거됩니다**.

#### 📈 Overview 탭 — 12가지 이상의 전체·트렌드 분석
- **구독 ROI 대시보드**: 구독 카드를 클릭해 플랜(`$20 Pro` / `$100 Ultra` / `$200 Ultra` 또는 커스텀 요금·월간/주간 주기·초기화일)을 설정하고 ROI 배수, 월말 소비 예측, 캐시 절감 가치를 확인하세요.
- **활동 및 코딩 페르소나**: 90일 GitHub 스타일 히트맵, 최근 14일 일별 막대 차트, 24시간 코딩 성향 및 평일/주말 비교, 전체 Top 10 모델 & 도구, 컨텍스트 건강 점수, 로컬 업적 배지, 명예의 전당.
- **프로젝트별 비용 귀속**: 도구 파일 경로를 분석해 활성 워크스페이스 Top 10을 자동으로 추론합니다.
- **로컬 Multi-Tool 레이더**: **Claude Code**, **Codex**, **Cursor**, **Gemini CLI**의 로컬 세션 수를 읽기 전용으로 가볍게 감지합니다.
- **2× Retina 리포트 공유 카드 (PNG)**: 다크/라이트 테마와 모듈을 커스터마이징해 클립보드에 바로 복사하거나 `~/Downloads`에 저장할 수 있습니다.

#### 🕒 History 탭 & 툴바 기능
- **History 탭**: 이전 Antigravity 대화를 빠르게 탐색하고 전환합니다.
- **언어 전환 (`EN / 中`)**: 클릭 한 번으로 패널 UI 언어를 전환합니다.
- **설정 모달**:
  - 통화 전환(`USD ($)` / `CNY (¥)`, 환율 수정 가능).
  - `Pro`, `Flash`, `Claude`, `GPT/Codex` 모델군별 100만 토큰 단가 커스터마이징.
  - GitHub Releases 기반 업데이트 확인.
- **내보내기 모달**:
  - 기간별(`이번 달` / `최근 30일` / `전체`) 사용 내역을 UTF-8 BOM **CSV** 또는 **JSON**으로 내보내기.
  - 현재 세션을 Markdown 보고서 또는 비식별 요약본으로 `~/Downloads`에 바로 저장.

---

### 2. 채팅 내 Skill 사용 (`/token-usage` 또는 자연어)

플러그인을 활성화하면 내장 `token-usage` Skill이 자동으로 로드됩니다. `/token-usage`를 입력하거나 자연어로 질문해 보세요:

- *"최근 10개 세션의 토큰 사용량을 요약해 줘"*
- *"현재 세션의 턴별 토큰 사용 내역을 보여줘"*
- *"모델별 전체 토큰 소비량을 집계해 줘"*
- *"토큰을 가장 많이 사용한 상위 5개 세션은?"*

---

### 3. 독립 실행형 CLI 스크립트 (`token_stats.py`)

터미널에서 직접 로컬 로그를 조회할 수도 있습니다(Python 3 표준 라이브러리만 사용):

```bash
# 1. 최근 세션 요약 (--sort: recent | tokens, --limit: 기본값 15)
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py summary --limit 15 --sort recent

# 2. 단일 세션 턴별 상세 ("latest", 8자리 ID 접두사 또는 전체 UUID 입력)
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py session latest

# 3. 전체 및 모델별 누적 토큰 합계
python3 ~/.gemini/config/plugins/token-usage/skills/token-usage/scripts/token_stats.py models
```

> **토큰 정의**: `input` = 캐시되지 않은 입력 토큰, `cache_read` = 프롬프트 캐시 적중 토큰, `output` = 모델 출력 토큰(기본 `total = input + output`).

---

## 🔒 프라이버시 및 보안

- **100% 로컬 & 읽기 전용**: 로컬 Antigravity 로그(`~/.gemini/antigravity/brain/<conversation-id>/.system_generated/logs/transcript.jsonl`)를 직접 읽기만 하며, 앱 바이너리를 수정하거나 대화 데이터를 외부로 전송하지 않습니다.
- **외부 의존성 제로**: 순수 Node.js ESM 내장 모듈, 바닐라 HTML/CSS/Canvas/JS, Python 표준 라이브러리만 사용합니다.
- **안전한 공유**: 세션 진단 PNG는 모든 프롬프트, 파일 경로, 워크스페이스 이름, 탐지된 자격 증명을 완전히 제거합니다.
- **네트워크 투명성**: 텔레메트리 및 분석 전송 없음. 선택적 업데이트 확인 기능만 GitHub Releases 공개 API를 조회합니다(7일간 로컬 캐시).

---

## ❓ 자주 묻는 질문 (FAQ)

<details>
<summary><strong>설치 후 Token Usage 사이드 패널이 보이지 않습니다</strong></summary>

1. `~/.gemini/config/plugins/token-usage/plugin.json` 파일이 존재하는지 확인하세요.
2. Antigravity → **Customizations / Plugins**에서 **Token Usage**가 활성화되어 있는지 확인하세요.
3. Sidecar 서버 실행을 위해 시스템 `PATH`에서 `node`(Node.js 18+)를 실행할 수 있는지 확인하세요.
</details>

<details>
<summary><strong>예상 비용이 실제 구독료나 API 청구서와 다르게 표시됩니다</strong></summary>

패널의 비용은 각 모델군(`Pro`, `Flash`, `Claude`, `GPT/Codex`)의 기본 100만 토큰 단가를 기준으로 한 API 환산 추정치입니다. **설정** 모달에서 모델별 단가, 통화/환율, 구독 요금 및 주기를 언제든 직접 수정할 수 있습니다.
</details>

<details>
<summary><strong>Token Usage를 제거하려면 어떻게 하나요?</strong></summary>

Antigravity에 *"token-usage 플러그인을 제거해 줘"*라고 말하거나, **Customizations / Plugins**에서 비활성화/제거하거나, `~/.gemini/config/plugins/token-usage` 폴더를 직접 삭제하면 됩니다.
</details>

---

## 📚 문서 및 링크

- [프로젝트 아키텍처 맵 (`.ai_map.md`)](./.ai_map.md)
- [GitHub 저장소](https://github.com/RanFeng/token-usage)
- [Discussions & 로드맵](https://github.com/RanFeng/token-usage/discussions)
