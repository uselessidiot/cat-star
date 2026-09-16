import type { User } from '@supabase/supabase-js';

export const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials(email: unknown, password: unknown): string | null {
  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    return '올바른 이메일 주소를 입력해 주세요.';
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 해요.`;
  }
  return null;
}

// A Supabase user is "anonymous" when it was created via signInAnonymously.
// The flag lives in app_metadata; older sessions expose is_anonymous on the user.
export function isAnonymousUser(user: User | null): boolean {
  if (!user) return false;
  const metadataFlag = (user.app_metadata as { is_anonymous?: boolean } | undefined)?.is_anonymous;
  const topLevelFlag = (user as unknown as { is_anonymous?: boolean }).is_anonymous;
  return Boolean(metadataFlag ?? topLevelFlag ?? (!user.email && (user.identities?.length ?? 0) === 0));
}

// Map Supabase auth errors to short, user-facing Korean messages the UI can show as-is.
export function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('already registered') || lower.includes('already been registered') || lower.includes('email_exists')) {
    return '이미 가입된 이메일이에요. 로그인해 주세요.';
  }
  if (lower.includes('invalid login credentials')) {
    return '이메일 또는 비밀번호가 맞지 않아요.';
  }
  if (lower.includes('email not confirmed')) {
    return '이메일 확인이 필요해요. 메일함을 확인하거나 관리자에게 문의해 주세요.';
  }
  if (lower.includes('weak password') || lower.includes('password should be')) {
    return `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 해요.`;
  }
  return '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.';
}
