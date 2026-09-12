'use client';
/* oxlint-disable next/no-html-link-for-pages */

import Image from 'next/image';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { activityFor, activityStyles, activityTags, type ActivityTag, type MemoryStarData } from '@/lib/memory-stars';
import { deleteStoredMemory, getStoredMemories, MEMORY_STORE_CHANGED, updateStoredMemory } from '@/lib/memory-store';

type AlbumMemory = { id: string; starId: number; name: string; date: string; note: string; activity: ActivityTag; images: string[]; photos?: Blob[]; uploaded?: boolean; star?: MemoryStarData };

const mockMemories: AlbumMemory[] = [
  { id: 'mock-window', starId: 1, name: '창가의 늦은 오후', date: '2018. 05. 12', note: '햇빛이 길게 머물던 창가에서 함께 보낸 조용한 오후.', activity: '창가 구경', images: ['/assets/mock-memory-window.png'] },
  { id: 'mock-rain', starId: 2, name: '비가 오던 저녁', date: '2020. 09. 03', note: '빗소리와 작은 숨소리가 방 안을 따뜻하게 채우던 저녁.', activity: '낮잠', images: ['/assets/mock-memory-rain.png'] },
];

export function MemoryAlbum() {
  const [memories, setMemories] = useState<AlbumMemory[]>(mockMemories);
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
          return { id: `stored-${memory.id}`, starId: memory.id, name: memory.star.name, date: memory.star.date, note: memory.note, activity: activityFor(memory.star), images, photos: memory.photos, uploaded: true, star: memory.star };
        });
        const seen = new Set(uploaded.map((memory) => `${memory.name}-${memory.date}`));
        setMemories([...uploaded, ...mockMemories.filter((memory) => !seen.has(`${memory.name}-${memory.date}`))]);
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

  const visibleMemories = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko');
    return memories.filter((memory) => (activityFilter === '전체' || memory.activity === activityFilter) && (!keyword || `${memory.name} ${memory.note} ${memory.date} ${memory.activity}`.toLocaleLowerCase('ko').includes(keyword))).sort((a, b) => {
      const order = a.date.localeCompare(b.date);
      return sort === 'newest' ? -order : order;
    });
  }, [memories, query, sort, activityFilter]);

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

  return <main className="memory-gallery-page">
    <header className="gallery-header"><a href="/" aria-label="별자리로 돌아가기">← 별자리로 돌아가기</a><div><span>MEMORY ALBUM</span><h1>다시 보는 기억</h1><p>밤하늘에 올려둔 순간들을 조용히 다시 만나는 자리예요.</p></div></header>
    <section className="album-tools" aria-label="기억 찾기와 정렬"><label><span className="sr-only">기억 검색</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 메모, 활동으로 기억 찾기" /></label><div role="group" aria-label="날짜 정렬"><button type="button" aria-pressed={sort === 'newest'} onClick={() => setSort('newest')}>최근에 밝힌 별</button><button type="button" aria-pressed={sort === 'oldest'} onClick={() => setSort('oldest')}>오래된 별부터</button></div></section>
    <nav className="activity-filters" aria-label="활동 태그 필터">{(['전체', ...activityTags] as const).map((activity) => <button key={activity} type="button" aria-pressed={activityFilter === activity} onClick={() => setActivityFilter(activity)}>{activity}</button>)}</nav>
    {visibleMemories.length ? <section className="memory-gallery" aria-label="기억 사진 모음">{visibleMemories.map((memory, index) => <article key={memory.id} className={`gallery-card card-${index + 1}`}><button className="gallery-card-open" type="button" onClick={() => openMemory(memory)} aria-label={`${memory.name} 자세히 보기`}><figure>{memory.images[0] ? <Image src={memory.images[0]} alt={`${memory.name}의 고양이 사진`} fill sizes="(max-width: 720px) 92vw, 45vw" priority={index === 0} unoptimized={memory.uploaded} /> : <span className="gallery-image-placeholder">✦</span>}</figure><div><time>{memory.date}</time><h2>{memory.name}</h2><p>{memory.note}</p><span>이 별 곁에 머물기 · ✦</span></div></button></article>)}</section> : <p className="album-empty">찾으시는 기억이 아직 이 밤하늘에는 없어요.</p>}
    <p className="gallery-footnote">새로 밝힌 기억별도 이곳에 조용히 이어져요.</p>

    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <DialogContent className="memory-album-dialog" showCloseButton={false}>
        {selected && <><button className="album-detail-close" type="button" aria-label="기억 닫기" onClick={() => setSelected(null)}>×</button><section className="album-photo-viewer" aria-label={`${selected.name}의 사진`}><figure>{selected.images[0] ? <Image src={selected.images[0]} alt={`${selected.name}의 사진`} fill sizes="(max-width: 720px) 92vw, 58vw" unoptimized={selected.uploaded} /> : <span className="gallery-image-placeholder">✦</span>}</figure></section><section className="album-detail-copy">{editing ? <div className="memory-edit-form"><label className="album-photo-replace"><span>이 별의 사진</span><figure>{editImage ? <Image src={editImage} alt={`${edit.name || selected.name}의 사진`} fill sizes="160px" unoptimized /> : <span className="gallery-image-placeholder">✦</span>}</figure><b>사진 바꾸기<input type="file" accept="image/*" onChange={replaceEditPhoto} /></b></label><label>기억 이름<input value={edit.name} onChange={(e) => setEdit({ ...edit, name:e.target.value })} /></label><label>날짜<input value={edit.date} onChange={(e) => setEdit({ ...edit, date:e.target.value })} /></label><label>활동<select value={edit.activity} onChange={(e) => setEdit({ ...edit, activity:e.target.value as ActivityTag })}>{activityTags.map((tag) => <option key={tag}>{tag}</option>)}</select></label><label>메모<textarea rows={4} value={edit.note} onChange={(e) => setEdit({ ...edit, note:e.target.value })} /></label><div><button type="button" onClick={() => setEditing(false)}>취소</button><button type="button" onClick={saveEdit}>저장</button></div></div> : <><span>MEMORY STAR · {selected.date}</span><DialogTitle>{selected.name}</DialogTitle><em className="album-activity-tag">{selected.activity}</em><DialogDescription>{selected.note}</DialogDescription><a href={`/?memory=${selected.starId}`}>밤하늘에서 별 위치 보기 <b>✦</b></a><div className="memory-manage-actions"><button type="button" onClick={() => setEditing(true)}>기억 수정</button><button type="button" onClick={() => setDeleteOpen(true)}>삭제</button></div></>}</section></>}
      </DialogContent>
    </Dialog>
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent className="memory-delete-dialog"><AlertDialogHeader><AlertDialogTitle>이 기억별을 지울까요?</AlertDialogTitle><AlertDialogDescription>앨범과 밤하늘에서 함께 사라집니다. 이 작업은 되돌릴 수 없어요.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><AlertDialogAction onClick={removeMemory}>기억별 삭제</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main>;
}
