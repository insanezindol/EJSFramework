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
└── views/             # EJS 템플릿 파일들
    ├── index.ejs
    ├── header.ejs
    └── body.ejs
```

## 기술 스택

-   **Node.js**: JavaScript 런타임 환경
-   **Express.js**: 웹 애플리케이션 프레임워크
-   **EJS**: 템플릿 엔진
-   **Express Session**: 세션 관리
-   **Body Parser**: HTTP 요청 본문 파싱

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 서버 실행

```bash
node server.js
```

서버가 성공적으로 시작되면 `http://localhost:3000`에서 애플리케이션에 접근할 수 있습니다.

## 주요 기능

-   **홈페이지**: 메인 인덱스 페이지 (`/`)
-   **사용자 목록**: 전체 사용자 리스트 보기 (`/list`)
-   **사용자 상세**: 특정 사용자 정보 조회 (`/getUser/:username`)
-   **세션 관리**: Express Session을 통한 사용자 세션 관리
-   **정적 파일 서빙**: CSS, 이미지 등 정적 파일 제공

## API 엔드포인트

| 메서드 | 경로                 | 설명                    |
| ------ | -------------------- | ----------------------- |
| GET    | `/`                  | 메인 홈페이지           |
| GET    | `/list`              | 전체 사용자 목록 (JSON) |
| GET    | `/getUser/:username` | 특정 사용자 정보 (JSON) |

## 개발 환경

### 포트 설정

기본 포트: `3000`

### 세션 설정

세션 비밀키는 `server.js`에서 설정되어 있으며, 프로덕션 환경에서는 환경변수로 관리하는 것을 권장합니다.

## 개발 도구

이 프로젝트는 [Nodeclipse](https://github.com/Nodeclipse/nodeclipse-1)를 사용하여 개발되었습니다.

-   [Eclipse Marketplace](http://marketplace.eclipse.org/content/nodeclipse)
-   [공식 사이트](http://www.nodeclipse.org)

Nodeclipse는 커뮤니티 기여를 통해 성장하는 무료 오픈소스 프로젝트입니다.
