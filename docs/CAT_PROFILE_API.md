# 고양이 프로필 저장 계약 (Codex UI 연동용)

중심별(고양이 자체) — 이름·집사·만난 날·설명·사진 — 을 **Supabase에 저장**해서 기기가 바뀌어도 유지되게 하는 API입니다.

## 왜 필요한가

지금 `SkyScene`의 `saveCatProfileDetails()`는 프로필을 **브라우저(IndexedDB)에만** 저장합니다(`saveStoredCatProfile`). 그래서 다른 기기/브라우저에서는 고양이 정보가 사라집니다. 기억별은 이미 클라우드에 저장되는데 정작 감정의 중심인 고양이 프로필만 로컬에 남아 있었습니다.

백엔드는 저장 API를 준비했습니다. **프론트는 로컬 저장 대신 아래 헬퍼를 호출하면 됩니다.** (Supabase 직접 호출은 불필요)

## 사용할 헬퍼 (`lib/memory-api.ts`)

```ts
import { updateApiCatProfile, uploadApiCatProfilePortrait } from '@/lib/memory-api';

// 1) 텍스트 필드 저장 (이름·집사·만난 날·생일·설명)
await updateApiCatProfile({
  name,            // 선택
  guardianName,    // 선택
  metDate,         // 선택, 'YYYY-MM-DD'
  birthday,        // 선택, 'YYYY-MM-DD'
  description,     // 선택
});

// 2) 프로필 사진 저장 (File 하나)
const profile = await uploadApiCatProfilePortrait(file); // profile.portraitUrl 로 표시
```

- 두 헬퍼 모두 저장 후 최신 프로필 객체(`{ id, name, guardianName, metDate, birthday, description, portraitUrl }`)를 반환합니다.
- 내부적으로 `cat-star-memory-store-changed` 이벤트도 발생시키므로, 다른 화면이 자동으로 최신 상태를 반영합니다.

## 프론트에서 바꿀 곳 (요지)

`components/sky/SkyScene.tsx` 의 `saveCatProfileDetails()` 에서:

- **지금**: `await saveStoredCatProfile(nextProfile)` (로컬 저장)
- **바꿀 것**:
  1. 텍스트는 `await updateApiCatProfile({ name, guardianName, metDate, birthday, description })`
  2. 새 사진(`profilePortraitBlob` 이 새 File일 때)은 `await uploadApiCatProfilePortrait(file)`
  3. 실패 시(오프라인 등) 기존처럼 `saveStoredCatProfile` 로 폴백해도 됩니다 (기억별 흐름과 동일 패턴)

프로필을 **불러오는** 쪽(`getApiCatProfile`)은 이미 API를 쓰고 있으니, 저장만 API로 바꾸면 됩니다. 로드 시 `profile.portraitUrl` 이 있으면 그 URL로 사진을 보여주면 됩니다(현재도 그렇게 처리 중).

## 엔드포인트 (참고)

| 엔드포인트 | 동작 |
|---|---|
| `GET /api/cat-profile` | 프로필 조회 (없으면 기본값 생성) — 이미 사용 중 |
| `PATCH /api/cat-profile` | 텍스트 필드 저장 |
| `POST /api/cat-profile/portrait` | 사진 업로드(multipart, 필드명 `portrait`) → 스토리지 저장 + URL 반환 |

- 사진 제한: 이미지 파일, 최대 8MB. 교체 시 이전 사진은 스토리지에서 정리됩니다.
- 저장 위치: `memory-photos` 버킷의 `{사용자}/_profile/` 폴더 (사용자별 격리, RLS 보호).

## 구현 위치 (백엔드)

- `app/api/cat-profile/route.ts` (GET/PATCH)
- `app/api/cat-profile/portrait/route.ts` (POST)
- `lib/memory-api.ts` (`updateApiCatProfile`, `uploadApiCatProfilePortrait`)
