'use client';
/* oxlint-disable next/no-html-link-for-pages */

import Image from 'next/image';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { activityFor, activityStyles, activityTags, type ActivityTag, type MemoryStarData } from '@/lib/memory-stars';
import { deleteStoredMemory, getStoredMemories, MEMORY_STORE_CHANGED, updateStoredMemory } from '@/lib/memory-store';

type AlbumMemory = { id: string; starId: number; name: string; date: string; note: string; activity: ActivityTag; images: string[]; photos?: Blob[]; uploaded?: boolean; testSeed?: boolean; source: 'personal' | 'test'; star?: MemoryStarData };

export function MemoryAlbum() {
  const [memories, setMemories] = useState<AlbumMemory[]>([]);
  const [selected, setSelected] = useState<AlbumMemory | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [activityFilter, setActivityFilter] = useState<ActivityTag | '전체'>('전체');
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [edit, setEdit] = useState<{ name: string; date: string; note: string; activity: ActivityTag }>({ name: '', date: '', note: '', activity: '함께한 일상' });
  const [editImage, setEditImage] = useState<string | null>(null);
  const [editPhoto, setEditPhoto] = useState<Blob | null>(null);

  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    function loadMemoriesFromStore() {
      getStoredMemories().then((stored) => {
        if (!active) return;
        const uploaded = stored.map((memory): AlbumMemory => {
          const images = memory.photos.map((photo) => { const url = URL.createObjectURL(photo); urls.push(url); return url; });
          const testSeed = Boolean(memory.testSeed || memory.note.startsWith('[cat-star-test-seed]'));
          return { id: `stored-${memory.id}`, starId: memory.id, name: memory.star.name, date: memory.star.date, note: memory.note.replace('[cat-star-test-seed] ', ''), activity: activityFor(memory.star), images, photos: memory.photos, uploaded: true, testSeed, source: testSeed ? 'test' : 'personal', star: memory.star };
        });
        setMemories(uploaded);
      }).catch(() => undefined);
    }
    function handleStorage(event: StorageEvent) {
      if (event.key === MEMORY_STORE_CHANGED) loadMemoriesFromStore();
    }
    loadMemoriesFromStore();
    window.addEventListener(MEMORY_STORE_CHANGED, loadMemoriesFromStore);
    window.addEventListener('storage', handleStorage);
    return () => {
      active = false;
      window.removeEventListener(MEMORY_STORE_CHANGED, loadMemoriesFromStore);
      window.removeEventListener('storage', handleStorage);
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const personalMemories = useMemo(() => memories.filter((memory) => memory.source === 'personal'), [memories]);
  const testMemories = useMemo(() => memories.filter((memory) => memory.source === 'test'), [memories]);
  const albumSource = personalMemories.length ? personalMemories : [];
  const isFirstPersonalMemory = personalMemories.length === 1;
  const albumIntro = personalMemories.length === 0
    ? '아직 다시 볼 기억별이 없어요. 사진 한 장을 남기면 이곳에 첫 별의 장면이 조용히 모여요.'
    : isFirstPersonalMemory
      ? '첫 기억별이 이곳에 머물고 있어요. 이 별에서 루루의 밤하늘이 시작됐어요.'
      : '밤하늘에 올려둔 순간들을 조용히 다시 만나는 자리예요.';

  const visibleMemories = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko');
    return albumSource.filter((memory) => (activityFilter === '전체' || memory.activity === activityFilter) && (!keyword || `${memory.name} ${memory.note} ${memory.date} ${memory.activity}`.toLocaleLowerCase('ko').includes(keyword))).sort((a, b) => {
      const order = a.date.localeCompare(b.date);
      return sort === 'newest' ? -order : order;
    });
  }, [albumSource, query, sort, activityFilter]);

  function openMemory(memory: AlbumMemory) {
    setSelected(memory);
    setEditing(false);
    setEdit({ name: memory.name, date: memory.date, note: memory.note, activity: memory.activity });
    setEditImage(memory.images[0] ?? null);
    setEditPhoto(memory.photos?.[0] ?? null);
  }
  async function saveEdit() {
    if (!selected) return;
    const style = activityStyles[edit.activity];
    const nextPhoto = editPhoto ?? selected.photos?.[0];
    const nextImages = editImage ? [editImage] : selected.images.slice(0, 1);
    const nextPhotos = nextPhoto ? [nextPhoto] : selected.photos?.slice(0, 1) ?? [];
    const updatedStar = selected.star ? { ...selected.star, name: edit.name, date: edit.date, activity: edit.activity, shape: style.shape, tone: style.tone, photoCount: nextImages.length ? 1 : 0, created: true } : undefined;
    const updated = { ...selected, ...edit, images: nextImages, photos: nextPhotos, star: updatedStar };
    if (selected.uploaded && updatedStar) await updateStoredMemory(selected.starId, { star: updatedStar, note: edit.note, photos: nextPhotos });
    setMemories((items) => items.map((item) => item.id === selected.id ? updated : item)); setSelected(updated); setEditing(false);
  }
  function replaceEditPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setEditPhoto(file);
    setEditImage(URL.createObjectURL(file));
  }
  async function removeMemory() {
    if (!selected) return;
    if (selected.uploaded) await deleteStoredMemory(selected.starId);
    setMemories((items) => items.filter((item) => item.id !== selected.id)); setDeleteOpen(false); setSelected(null);
  }

  return <main className={`memory-gallery-page${isFirstPersonalMemory ? ' first-memory-album' : ''}${personalMemories.length === 0 ? ' empty-personal-album' : ''}`}>
    <header className="gallery-header"><a href="/" aria-label="별자리로 돌아가기">← 별자리로 돌아가기</a><div><span>{isFirstPersonalMemory ? 'FIRST MEMORY ALBUM' : 'MEMORY ALBUM'}</span><h1>{isFirstPersonalMemory ? '첫 별의 기록' : '다시 보는 기억'}</h1><p>{albumIntro}</p>{testMemories.length > 0 && <small className="album-dev-note">개발 테스트 별 {testMemories.length}개는 실제 앨범 판단에서 제외했어요.</small>}</div></header>
    {personalMemories.length > 0 && <><section className="album-tools" aria-label="기억 찾기와 정렬"><label><span className="sr-only">기억 검색</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 메모, 활동으로 기억 찾기" /></label><div role="group" aria-label="날짜 정렬"><button type="button" aria-pressed={sort === 'newest'} onClick={() => setSort('newest')}>최근에 밝힌 별</button><button type="button" aria-pressed={sort === 'oldest'} onClick={() => setSort('oldest')}>오래된 별부터</button></div></section>
    <nav className="activity-filters" aria-label="활동 태그 필터">{(['전체', ...activityTags] as const).map((activity) => <button key={activity} type="button" aria-pressed={activityFilter === activity} onClick={() => setActivityFilter(activity)}>{activity}</button>)}</nav></>}
    {visibleMemories.length ? <section className="memory-gallery" aria-label="기억 사진 모음">{visibleMemories.map((memory, index) => <article key={memory.id} className={`gallery-card card-${index + 1}${isFirstPersonalMemory ? ' first-memory-card' : ''}`}><button className="gallery-card-open" type="button" onClick={() => openMemory(memory)} aria-label={`${memory.name} 자세히 보기`}><figure>{memory.images[0] ? <Image src={memory.images[0]} alt={`${memory.name}의 고양이 사진`} fill sizes="(max-width: 720px) 92vw, 45vw" priority={index === 0} unoptimized={memory.uploaded} /> : <span className="gallery-image-placeholder">✦</span>}</figure><div><time>{memory.date}</time><h2>{memory.name}</h2><p>{memory.note}</p><span>{isFirstPersonalMemory ? '이 별에서 밤하늘이 시작됐어요 · ✦' : '이 별 곁에 머물기 · ✦'}</span></div></button></article>)}</section> : <section className="album-empty"><span>아직 다시 볼 기억별이 없어요</span><p>사진 한 장을 남기면, 이곳에 첫 별의 장면이 조용히 모여요.</p><a href="/">첫 기억별 만들러 가기 <b>✦</b></a>{testMemories.length > 0 && <small>테스트 별 {testMemories.length}개는 개발용으로만 남겨두었어요.</small>}</section>}
    {personalMemories.length > 0 && <p className="gallery-footnote">{isFirstPersonalMemory ? '첫 별은 혼자 있어도 충분히 밝아요. 다음 기억을 남기면 이곳에 천천히 이어져요.' : '새로 밝힌 기억별도 이곳에 조용히 이어져요.'}</p>}

    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <DialogContent className="memory-album-dialog" showCloseButton={false}>
        {selected && <><button className="album-detail-close" type="button" aria-label="기억 닫기" onClick={() => setSelected(null)}>×</button><section className="album-photo-viewer" aria-label={`${selected.name}의 사진`}><figure>{selected.images[0] ? <Image src={selected.images[0]} alt={`${selected.name}의 사진`} fill sizes="(max-width: 720px) 92vw, 58vw" unoptimized={selected.uploaded} /> : <span className="gallery-image-placeholder">✦</span>}</figure></section><section className="album-detail-copy">{editing ? <div className="memory-edit-form"><label className="album-photo-replace"><span>이 별의 사진</span><figure>{editImage ? <Image src={editImage} alt={`${edit.name || selected.name}의 사진`} fill sizes="160px" unoptimized /> : <span className="gallery-image-placeholder">✦</span>}</figure><b>사진 바꾸기<input type="file" accept="image/*" onChange={replaceEditPhoto} /></b></label><label>기억 이름<input value={edit.name} onChange={(e) => setEdit({ ...edit, name:e.target.value })} /></label><label>날짜<input value={edit.date} onChange={(e) => setEdit({ ...edit, date:e.target.value })} /></label><label>활동<select value={edit.activity} onChange={(e) => setEdit({ ...edit, activity:e.target.value as ActivityTag })}>{activityTags.map((tag) => <option key={tag}>{tag}</option>)}</select></label><label>메모<textarea rows={4} value={edit.note} onChange={(e) => setEdit({ ...edit, note:e.target.value })} /></label><div><button type="button" onClick={() => setEditing(false)}>취소</button><button type="button" onClick={saveEdit}>저장</button></div></div> : <><span>MEMORY STAR · {selected.date}</span><DialogTitle>{selected.name}</DialogTitle><em className="album-activity-tag">{selected.activity}</em><DialogDescription>{selected.note}</DialogDescription><a href={`/?memory=${selected.starId}`}>밤하늘에서 별 위치 보기 <b>✦</b></a><div className="memory-manage-actions"><button type="button" onClick={() => setEditing(true)}>기억 수정</button><button type="button" onClick={() => setDeleteOpen(true)}>삭제</button></div></>}</section></>}
      </DialogContent>
    </Dialog>
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent className="memory-delete-dialog"><AlertDialogHeader><AlertDialogTitle>이 기억별을 지울까요?</AlertDialogTitle><AlertDialogDescription>앨범과 밤하늘에서 함께 사라집니다. 이 작업은 되돌릴 수 없어요.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><AlertDialogAction onClick={removeMemory}>기억별 삭제</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main>;
}
