<<<<<<< HEAD
# Need-It-FE
Need-It 프론트엔드
=======
# NEED IT — React + Vite 프론트엔드 (점진적 전환)

## 실행
```bash
npm install
npm run dev
```
브라우저에서 `http://localhost:5173`에 접속합니다. Spring Boot는 `localhost:8080`에서 실행하면 `/api` 요청이 프록시됩니다.

## 현재 변환 수준 (중요)
- **React + Vite에서 실행되는 프로젝트로 전환**했으며 기존 화면 HTML/CSS/JavaScript를 유지합니다.
- `src/LegacyApp.jsx`가 기존 마크업을 렌더링하고 `public/legacy/js/app.js`가 기존 DOM 이벤트를 처리하는 **호환 단계**입니다.
- **모든 화면을 독립적인 React 컴포넌트/상태 관리로 재작성한 것은 아닙니다.** 기존 기능은 여전히 localStorage 기반 데모입니다.
- React 컴포넌트로 개별 화면을 이전할 때는 해당 기능의 기존 DOM 이벤트 핸들러를 제거하고 API 기반 상태 관리로 교체해야 합니다.
- 개발 중 React StrictMode는 레거시 이벤트 중복 등록을 피하기 위해 사용하지 않았습니다.

## 파일
- `src/LegacyApp.jsx`: 기존 HTML 마크업을 React에서 1회 마운트
- `src/legacy-markup.html`: 기존 페이지 마크업
- `public/legacy/css/`: 원래 디자인 스타일
- `public/legacy/js/app.js`: 기존 데모 기능 (API 미연동)
- `src/api/http.js`: Vite 환경변수와 프록시를 지원하는 신규 fetch 유틸
- `src/api/members.js`, `requests.js`: 백엔드 계약 **예시** (아직 UI에서 사용하지 않음)
- `vite.config.js`: 개발 중 Spring Boot 8080으로 `/api` 프록시

## 권장 전환 순서
1. 회원가입/로그인/프로필 → React 컴포넌트 + 인증 API
2. 요청 게시글 목록/상세/CRUD → React 컴포넌트 + API
3. 나눔 제안 및 이미지 업로드
4. 채팅(WebSocket), 알림, 관리자

**주의:** 브라우저에서 전체 기능의 회귀 테스트는 아직 수행하지 않았습니다. 외부 주소 검색 SDK는 인터넷 연결이 필요합니다.
>>>>>>> dfb43e2 (FE 생성)
