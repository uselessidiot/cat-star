# 고양이의 별 Backend Handoff

이 문서는 Claude Code 또는 백엔드 담당자가 `고양이의 별` 데이터/저장 계층을 작업할 때 참고하는 작업 계약서입니다.

가장 중요한 원칙은 백엔드 기능을 붙이더라도 메인 화면의 감성, 별 배치, 고양이 이동감, 기억이 되살아나는 UX를 깨지 않는 것입니다.

## 역할 분리

### Codex 담당

- 메인 밤하늘 UI/UX
- 고양이, 중심별, 기억별, 안개빛, hover/click/scroll 인터랙션
- 기억 생성/수정/삭제 화면 흐름
- `/memories` 기억 보관함 화면
- 감성 문구와 시각적 밀도 조정

### Claude Code / Backend 담당

- 데이터 모델 설계
- 로컬 저장소를 대체할 Repository/API 계층
- Supabase 또는 다른 DB 연결 준비
- 사진 저장/조회/삭제 구조
- 마이그레이션과 seed/test data 관리
- 인증은 아직 MVP 이후 범위로 둔다

## 절대 피해야 할 충돌 영역

백엔드 작업자는 아래 파일을 가급적 수정하지 않습니다.

- `components/sky/SkyScene.tsx`
- `components/memories/MemoryAlbum.tsx`
- `app/globals.css`
- `public/assets/**`

필요하면 먼저 데이터 계약을 확장하고, 프론트 적용은 Codex 쪽에서 진행합니다.

백엔드 작업자가 주로 작업할 영역:

- `lib/memory-store.ts`
- `lib/memory-stars.ts`
- `lib/**/*.ts`
- `types/**/*.ts`
- `app/api/**`
- `supabase/**`
- `docs/**`

## 현재 프론트 상태 요약

현재는 IndexedDB 기반 local preview 저장소를 사용합니다.

- `lib/memory-stars.ts`
  - 기본 별 20개
  - 활동 태그별 별 모양/색상
  - 데스크톱/모바일 별 위치
  - 별 깊이
- `lib/memory-store.ts`
  - `StoredMemory`
  - `CatProfile`
  - IndexedDB 저장/조회/수정/삭제
  - `MEMORY_STORE_CHANGED` 이벤트

현재 MVP 방향:

- 메인 화면의 `+ 기억별 만들기`는 한 번에 하나의 기억별만 만든다.
- 초기 별은 빈 별일 수 있다.
- 빈 별을 클릭하면 `별 채우기`로 기존 위치를 유지한 채 실제 기억별로 전환한다.
- 별 하나에는 사진이 여러 장 들어갈 수 있어야 한다.
- 전체 사진을 한 번에 자동 분류하는 흐름은 당장 핵심이 아니다.

## 핵심 데이터 철학

기억별은 단순한 사진 레코드가 아니라, 밤하늘 위의 위치를 가진 감성 객체입니다.

따라서 백엔드는 아래를 분리해서 보관해야 합니다.

1. 기억 내용
2. 사진/미디어
3. 별의 시각적 위치와 상태
4. 고양이 프로필
5. 활동 태그/분류

프론트는 “별이 어디에 있고 어떻게 빛나는지”를 안정적으로 받아야 합니다.  
백엔드는 “데이터가 어디에 저장되는지”를 숨기고, 프론트에는 같은 형태로 넘겨야 합니다.

## 권장 TypeScript 데이터 계약

백엔드 구현 시 아래 타입을 기준으로 삼습니다.  
실제 DB에서는 snake_case를 써도 되지만, 프론트로 전달할 때는 camelCase DTO를 권장합니다.

```ts
export type MemoryStarId = string;
export type MemoryPhotoId = string;
export type CatProfileId = string;

export type MemoryStarStatus = 'empty' | 'filled' | 'archived';

export type ActivityTag =
  | '낮잠'
  | '창가 구경'
  | '놀이'
  | '산책·외출'
  | '식사·간식'
  | '함께한 일상'
  | '특별한 날'
  | string;

export type StarShape =
  | 'dot'
  | 'four'
  | 'six'
  | 'orb'
  | 'comet'
  | 'flower'
  | 'crystal'
  | string;

export type StarTone =
  | 'cream'
  | 'blue'
  | 'peach'
  | 'lavender'
  | 'gold'
  | 'white'
  | 'rose'
  | string;

export type StarPosition = {
  x: number;              // desktop 기준 0-100
  y: number;              // desktop 기준 0-100
  mobileX?: number;       // 모바일 개별 튜닝, 없으면 x 사용
  mobileY?: number;       // 모바일 개별 튜닝, 없으면 y 사용
  depth: number;          // 스크롤/거리감 계산용. 값이 클수록 더 먼 별
  layer?: 'far' | 'mid' | 'near';
  order?: number;         // 시간순/생성순 배치 보조값
};

export type StarVisual = {
  size: number;           // 프론트에서 최종 clamp 가능
  shape: StarShape;
  tone: StarTone;
  glow?: 'faint' | 'soft' | 'warm' | 'deep';
  favorite?: boolean;
};

export type MemoryPhoto = {
  id: MemoryPhotoId;
  url: string;
  storagePath?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  sizeBytes?: number;
  takenAt?: string | null;      // EXIF/파일명 기반 촬영일
  uploadedAt: string;
  order: number;
  alt?: string;
  dominantColor?: string;
  blurDataUrl?: string;
};

export type MemoryStar = {
  id: MemoryStarId;
  catProfileId: CatProfileId;
  status: MemoryStarStatus;

  name: string;
  date: string;                 // 표시/정렬 기준 날짜. ISO date 권장: YYYY-MM-DD
  activity?: ActivityTag;
  note?: string;

  photos: MemoryPhoto[];
  coverPhotoId?: MemoryPhotoId | null;

  position: StarPosition;
  visual: StarVisual;

  createdAt: string;
  updatedAt: string;
  filledAt?: string | null;
  deletedAt?: string | null;

  source?: {
    kind: 'initial-empty' | 'single-upload' | 'album-import' | 'test-seed' | string;
    batchId?: string;
  };

  metadata?: Record<string, unknown>;
};

export type CatProfile = {
  id: CatProfileId;
  name: string;
  guardianName?: string;
  metDate?: string;
  birthday?: string;
  description?: string;
  portraitUrl?: string;
  portraitStoragePath?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
};
```

## 유연성을 위한 중요한 규칙

### 1. 숫자 id에 의존하지 않기

현재 프론트 mock은 `number id`를 쓰지만, 백엔드는 `string id`를 권장합니다.

마이그레이션 기간에는 adapter가 필요합니다.

```ts
type LegacyMemoryStarId = number;
type BackendMemoryStarId = string;
```

프론트가 당장 숫자를 요구하면 API adapter에서 안정적인 숫자 surrogate를 만들어도 됩니다.  
최종적으로는 프론트도 string id로 옮기는 것이 좋습니다.

### 2. 별 위치는 기억과 함께 저장하기

별 위치는 단순한 UI 상태가 아닙니다.  
사용자가 빈 별을 채우면 기존 별의 위치를 유지해야 하므로 `position`은 DB에 저장해야 합니다.

새 별 생성 시 추천 규칙:

- 최근 기억일수록 사용자와 가까운 쪽 또는 현재 여행 지점 근처
- 오래된 기억일수록 깊은 밤하늘 안쪽
- 단, 너무 규칙적으로 줄 세우지 말고 약간의 deterministic jitter를 둔다
- 같은 id/date로 다시 계산하면 같은 위치가 나와야 한다

### 3. 사진은 별과 1:N 관계

별 하나에 사진 여러 장이 들어갈 수 있습니다.

- `MemoryStar.photos[]`는 정렬된 배열
- `coverPhotoId`가 없으면 `photos[0]`를 대표 사진으로 사용
- 사진 순서는 `order`로 관리
- 나중에 대표 사진 변경, 사진 추가/삭제, 순서 변경 가능해야 함

### 4. 빈 별과 채워진 별은 같은 객체

빈 별을 채우는 것은 새 별을 만드는 것이 아니라 `status: 'empty'`에서 `status: 'filled'`로 전환하는 작업입니다.

중요:

- `id` 유지
- `position` 유지
- `visual.shape`는 활동 태그에 따라 바뀔 수 있음
- `visual.tone`도 활동 태그에 따라 바뀔 수 있음
- `filledAt` 기록

### 5. ActivityTag는 고정 enum처럼 보이지만 확장 가능해야 함

현재 기본 태그:

- 낮잠
- 창가 구경
- 놀이
- 산책·외출
- 식사·간식
- 함께한 일상
- 특별한 날

추후 사용자가 직접 태그를 만들 수 있으므로 DB에서는 문자열로 저장합니다.  
기본 태그만 특별한 별 모양/색상 매핑을 갖고, 모르는 태그는 fallback visual을 사용합니다.

## 권장 API / Repository 인터페이스

프론트가 실제 DB, IndexedDB, mock seed를 몰라도 되게 repository 계층을 둡니다.

```ts
export type CreateMemoryStarInput = {
  catProfileId: string;
  name: string;
  date: string;
  activity?: string;
  note?: string;
  photos?: File[];
  preferredPosition?: Partial<StarPosition>;
};

export type FillEmptyStarInput = {
  starId: string;
  name: string;
  date: string;
  activity?: string;
  note?: string;
  photos: File[];
};

export type UpdateMemoryStarInput = {
  starId: string;
  name?: string;
  date?: string;
  activity?: string;
  note?: string;
  coverPhotoId?: string | null;
  visual?: Partial<StarVisual>;
};

export type MemoryRepository = {
  listStars(catProfileId: string): Promise<MemoryStar[]>;
  getStar(starId: string): Promise<MemoryStar | null>;
  createStar(input: CreateMemoryStarInput): Promise<MemoryStar>;
  fillEmptyStar(input: FillEmptyStarInput): Promise<MemoryStar>;
  updateStar(input: UpdateMemoryStarInput): Promise<MemoryStar>;
  deleteStar(starId: string): Promise<void>;

  addPhotos(starId: string, photos: File[]): Promise<MemoryStar>;
  reorderPhotos(starId: string, photoIds: string[]): Promise<MemoryStar>;
  deletePhoto(starId: string, photoId: string): Promise<MemoryStar>;

  getCatProfile(catProfileId: string): Promise<CatProfile | null>;
  updateCatProfile(profile: Partial<CatProfile> & { id: string }): Promise<CatProfile>;
};
```

## API Route 후보

Next/Vinext route 구조에 맞춰 조정합니다.

```txt
GET    /api/cat-profile
PATCH  /api/cat-profile

GET    /api/memory-stars
POST   /api/memory-stars

GET    /api/memory-stars/:id
PATCH  /api/memory-stars/:id
DELETE /api/memory-stars/:id

POST   /api/memory-stars/:id/fill
POST   /api/memory-stars/:id/photos
PATCH  /api/memory-stars/:id/photos/order
DELETE /api/memory-stars/:id/photos/:photoId
```

## Supabase 설계 후보

MVP 이후 Supabase를 붙일 경우의 초안입니다.

### `cat_profiles`

```sql
id uuid primary key default gen_random_uuid(),
owner_id uuid null,
name text not null,
guardian_name text null,
met_date date null,
birthday date null,
description text null,
portrait_path text null,
metadata jsonb not null default '{}',
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

### `memory_stars`

```sql
id uuid primary key default gen_random_uuid(),
cat_profile_id uuid not null references cat_profiles(id) on delete cascade,
status text not null default 'empty',
name text not null,
memory_date date null,
activity text null,
note text null,
cover_photo_id uuid null,

position jsonb not null,
visual jsonb not null,
source jsonb not null default '{}',
metadata jsonb not null default '{}',

created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
filled_at timestamptz null,
deleted_at timestamptz null
```

### `memory_photos`

```sql
id uuid primary key default gen_random_uuid(),
memory_star_id uuid not null references memory_stars(id) on delete cascade,
storage_path text not null,
public_url text null,
mime_type text null,
size_bytes bigint null,
width integer null,
height integer null,
taken_at timestamptz null,
uploaded_at timestamptz not null default now(),
sort_order integer not null default 0,
alt text null,
dominant_color text null,
blur_data_url text null,
metadata jsonb not null default '{}'
```

## 백엔드 구현 단계 추천

### Phase 1 — Adapter 먼저 만들기

목표: 프론트가 IndexedDB를 직접 몰라도 되게 한다.

- `lib/memory-repository.ts` 생성
- 현재 `memory-store.ts`를 감싸는 local repository 구현
- 프론트는 추후 `memory-store.ts` 직접 호출 대신 repository를 사용하도록 전환 가능

### Phase 2 — 타입 정리

목표: legacy mock 타입과 backend-ready 타입을 공존시킨다.

- `types/memory.ts` 또는 `lib/memory-types.ts` 생성
- `MemoryStarData`와 `MemoryStar` 사이 adapter 작성
- 숫자 id/string id 변환 정책 결정

### Phase 3 — API route mock

목표: DB 없이도 API 형태를 먼저 고정한다.

- `/api/memory-stars`
- `/api/memory-stars/:id`
- `/api/cat-profile`
- 내부 저장소는 당분간 local/mock이어도 됨

### Phase 4 — Supabase 연결

목표: storage, DB, RLS를 붙인다.

- migration 작성
- 사진 upload storage bucket 설계
- repository 구현을 Supabase 버전으로 교체
- 프론트 DTO는 기존과 동일하게 유지

## 별 위치 생성 규칙 초안

새 기억별 생성 시 백엔드 또는 프론트 adapter에서 아래 규칙을 따를 수 있습니다.

```ts
function suggestStarPosition(input: {
  date: string;
  createdCount: number;
  totalCount: number;
  seed: string;
}): StarPosition {
  // 1. 오래된 기억일수록 depth를 크게 둔다.
  // 2. 최신 기억은 고양이에게 조금 가까운 y/layer를 사용한다.
  // 3. seed 기반 deterministic jitter로 매번 같은 위치를 만든다.
  // 4. 중심별 주변이 너무 복잡하면 바깥쪽 arc로 밀어낸다.
  return {
    x: 50,
    y: 42,
    depth: 1.4,
    layer: 'mid',
  };
}
```

주의: 위치 자동 생성은 “정확한 데이터 시각화”가 아니라 “감성적인 별자리 구성”입니다.

## 테스트 데이터 정책

개발용 seed는 실제 사용자 데이터와 섞이면 안 됩니다.

권장:

- `source.kind === 'test-seed'`
- 테스트 seed 삭제 기능은 이 값만 삭제
- `/memories`에서는 테스트 별과 실제 기억을 분리해서 보여주거나 숨길 수 있게 함

## Claude Code에게 넘길 작업 프롬프트 예시

```txt
이 프로젝트에서 백엔드/데이터 계층을 담당해줘.

중요:
- 프론트 감성 UI는 Codex가 담당한다.
- components/sky, components/memories, app/globals.css는 가능한 한 수정하지 마.
- 먼저 BACKEND_HANDOFF.md의 데이터 계약을 기준으로 repository/type/api 계층을 준비해줘.
- Supabase 실제 연결은 바로 붙이지 말고, 교체 가능한 구조를 먼저 만들어줘.

우선순위:
1. 유연한 MemoryStar / MemoryPhoto / CatProfile 타입 정의
2. 현재 IndexedDB 기반 memory-store를 감싸는 MemoryRepository 인터페이스 추가
3. 빈 별 채우기, 사진 여러 장, 수정/삭제를 표현할 수 있는 input/output 타입 추가
4. 나중에 Supabase로 바꿀 수 있게 adapter 경계를 명확히 하기

주의:
- 한 번에 대규모 UI 리팩터링하지 말 것
- 별 위치/깊이/visual 정보는 반드시 유지
- 빈 별을 채울 때 기존 id와 position을 유지
- 활동 태그는 문자열 확장을 허용
```

## 현재 결정된 제품 방향

- 기억 하나를 별 하나로 천천히 만든다.
- 빈 별은 밤하늘을 심심하지 않게 채우는 “기다리는 별”이다.
- 기억을 담으면 그 별이 더 따뜻하게 빛난다.
- 별 하나에는 사진 여러 장이 머무를 수 있다.
- 메인 화면은 관리 도구가 아니라 고양이가 머무는 밤하늘이다.
- 관리/조회는 `/memories`에서 차분하게 처리한다.

