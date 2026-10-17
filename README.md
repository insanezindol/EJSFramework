# EJS 프레임워크

Express.js와 EJS 템플릿 엔진을 사용한 간단한 웹 애플리케이션 프레임워크입니다.

## 프로젝트 구조

```
EJSFramework/
├── server.js          # 메인 서버 파일
├── package.json       # 프로젝트 의존성 관리
├── data/
│   └── user.json      # 사용자 데이터 저장
├── public/
│   └── css/
│       └── style.css  # 스타일시트
├── router/
│   └── main.js        # 라우팅 설정
├── test/
│   └── smoke.test.js  # 스모크 테스트 (node:test)
└── views/             # EJS 템플릿 파일들
    ├── index.ejs
    ├── header.ejs
    └── body.ejs
```

## 기술 스택

| 구성 요소       | 버전   | 설명                     |
| --------------- | ------ | ------------------------ |
| Node.js         | 24 LTS | JavaScript 런타임 환경   |
| Express         | 5.x    | 웹 애플리케이션 프레임워크 |
| EJS             | 7.x    | 템플릿 엔진              |
| express-session | 1.19.x | 세션 관리                |

요청 본문 파싱은 별도 `body-parser` 없이 Express 내장 `express.json()` / `express.urlencoded()`를 사용합니다.

## 설치 및 실행

### 요구 사항

-   Node.js 24 이상

### 1. 의존성 설치

```bash
npm install
```

### 2. 서버 실행

```bash
npm start
```

서버가 성공적으로 시작되면 `http://localhost:3000`에서 애플리케이션에 접근할 수 있습니다.

### 3. 테스트

```bash
npm test
```

테스트는 앱을 임시 디렉터리에 복사해서 실행하므로 `data/user.json` 원본은 변경되지 않습니다.

## 주요 기능

-   **홈페이지**: 메인 인덱스 페이지 (`/`)
-   **사용자 관리**: 사용자 목록/조회/추가/수정/삭제 RESTful API
-   **세션 관리**: Express Session을 통한 로그인/로그아웃
-   **정적 파일 서빙**: CSS, 이미지 등 정적 파일 제공

## API 엔드포인트

| 메서드 | 경로                            | 설명                                         |
| ------ | ------------------------------- | -------------------------------------------- |
| GET    | `/`                             | 메인 홈페이지                                |
| GET    | `/list`                         | 전체 사용자 목록 (JSON)                      |
| GET    | `/getUser/:username`            | 특정 사용자 정보 (JSON)                      |
| POST   | `/addUser/:username`            | 사용자 추가 (본문: `password`, `name` 필수)  |
| PUT    | `/updateUser/:username`         | 사용자 추가/수정 (본문: `password`, `name` 필수) |
| DELETE | `/deleteUser/:username`         | 사용자 삭제                                  |
| GET    | `/login/:username/:password`    | 로그인 (세션 생성)                           |
| GET    | `/logout`                       | 로그아웃 후 `/`로 리다이렉트                 |

추가/수정/삭제/로그인 API는 `{ "success": 1 }` 또는 `{ "success": 0, "error": "..." }` 형태로 응답합니다.
`user.json`을 읽거나 쓰지 못하면 HTTP 500과 함께 `{ "success": 0, "error": "server error" }`를 응답합니다.

## 개발 환경

### 포트 설정

기본 포트는 `3000`이며, `PORT` 환경변수로 변경할 수 있습니다.

```bash
PORT=8080 npm start
```

### 세션 설정

세션 비밀키는 `server.js`에서 설정되어 있으며, 프로덕션 환경에서는 환경변수로 관리하는 것을 권장합니다.
