'use client';
/* oxlint-disable next/no-html-link-for-pages */

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { activityFor, activityTags, type ActivityTag, type MemoryStarData } from '@/lib/memory-stars';
import { deleteStoredMemory, getStoredMemories, updateStoredMemory } from '@/lib/memory-store';

type AlbumMemory = { id: string; starId: number; name: string; date: string; note: string; activity: ActivityTag; images: string[]; photos?: Blob[]; uploaded?: boolean; star?: MemoryStarData };

const mockMemories: AlbumMemory[] = [
  { id: 'mock-window', starId: 1, name: '창가의 늦은 오후', date: '2018. 05. 12', note: '햇빛이 길게 머물던 창가에서 함께 보낸 조용한 오후.', activity: '창가 구경', images: ['/assets/mock-memory-window.png', '/assets/mock-memory-rain.png'] },
  { id: 'mock-rain', starId: 2, name: '비가 오던 저녁', date: '2020. 09. 03', note: '빗소리와 작은 숨소리가 방 안을 따뜻하게 채우던 저녁.', activity: '낮잠', images: ['/assets/mock-memory-rain.png'] },
];

export function MemoryAlbum() {
  const [memories, setMemories] = useState<AlbumMemory[]>(mockMemories);
  const [selected, setSelected] = useState<AlbumMemory | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [activityFilter, setActivityFilter] = useState<ActivityTag | '전체'>('전체');
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [edit, setEdit] = useState<{ name: string; date: string; note: string; activity: ActivityTag }>({ name: '', date: '', note: '', activity: '함께한 일상' });
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editPhotos, setEditPhotos] = useState<Blob[]>([]);

  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    getStoredMemories().then((stored) => {
      if (!active) return;
      const uploaded = stored.map((memory): AlbumMemory => {
        const images = memory.photos.map((photo) => { const url = URL.createObjectURL(photo); urls.push(url); return url; });
        return { id: `stored-${memory.id}`, starId: memory.id, name: memory.star.name, date: memory.star.date, note: memory.note, activity: activityFor(memory.star), images, photos: memory.photos, uploaded: true, star: memory.star };
      });
      const seen = new Set(uploaded.map((memory) => `${memory.name}-${memory.date}`));
      setMemories([...uploaded, ...mockMemories.filter((memory) => !seen.has(`${memory.name}-${memory.date}`))]);
    }).catch(() => undefined);
    return () => { active = false; urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, []);

  const visibleMemories = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko');
    return memories.filter((memory) => (activityFilter === '전체' || memory.activity === activityFilter) && (!keyword || `${memory.name} ${memory.note} ${memory.date} ${memory.activity}`.toLocaleLowerCase('ko').includes(keyword))).sort((a, b) => {
      const order = a.date.localeCompare(b.date);
      return sort === 'newest' ? -order : order;
    });
  }, [memories, query, sort, activityFilter]);

  function openMemory(memory: AlbumMemory) { setSelected(memory); setPhotoIndex(0); setEditing(false); setEdit({ name: memory.name, date: memory.date, note: memory.note, activity: memory.activity }); setEditImages(memory.images); setEditPhotos(memory.photos ?? []); }
  function movePhoto(direction: -1 | 1) {
    if (!selected) return;
    setPhotoIndex((index) => (index + direction + selected.images.length) % selected.images.length);
  }
  async function saveEdit() {
    if (!selected) return;
    const updated = { ...selected, ...edit, images: editImages, photos: editPhotos };
    if (selected.uploaded && selected.star) await updateStoredMemory(selected.starId, { star: { ...selected.star, name: edit.name, date: edit.date, activity: edit.activity, photoCount: editPhotos.length }, note: edit.note, photos: editPhotos });
    setMemories((items) => items.map((item) => item.id === selected.id ? updated : item)); setSelected(updated); setEditing(false);
  }
  function addEditPhotos(files: FileList | null) { const added = Array.from(files ?? []); setEditPhotos((photos) => [...photos, ...added]); setEditImages((images) => [...images, ...added.map((file) => URL.createObjectURL(file))]); }
  function removeEditPhoto(index: number) { setEditImages((images) => images.filter((_, itemIndex) => itemIndex !== index)); setEditPhotos((photos) => photos.filter((_, itemIndex) => itemIndex !== index)); }
  function makeCover(index: number) { setEditImages((images) => [images[index], ...images.filter((_, itemIndex) => itemIndex !== index)]); setEditPhotos((photos) => photos.length ? [photos[index], ...photos.filter((_, itemIndex) => itemIndex !== index)] : photos); }
  function moveEditPhoto(index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= editImages.length) return; setEditImages((images) => { const next = [...images]; [next[index], next[target]] = [next[target], next[index]]; return next; }); setEditPhotos((photos) => { if (!photos.length) return photos; const next = [...photos]; [next[index], next[target]] = [next[target], next[index]]; return next; }); }
  async function removeMemory() {
    if (!selected) return;
    if (selected.uploaded) await deleteStoredMemory(selected.starId);
    setMemories((items) => items.filter((item) => item.id !== selected.id)); setDeleteOpen(false); setSelected(null);
  }

  return <main className="memory-gallery-page">
    <header className="gallery-header"><a href="/" aria-label="별자리로 돌아가기">← 별자리로 돌아가기</a><div><span>MEMORY ALBUM</span><h1>다시 보는 기억</h1><p>별이 되기 전의 순간들을 조용히 모아두는 자리예요.</p></div></header>
    <section className="album-tools" aria-label="기억 찾기와 정렬"><label><span className="sr-only">기억 검색</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="기억 이름이나 활동으로 찾아보기" /></label><div role="group" aria-label="날짜 정렬"><button type="button" aria-pressed={sort === 'newest'} onClick={() => setSort('newest')}>최근 기억부터</button><button type="button" aria-pressed={sort === 'oldest'} onClick={() => setSort('oldest')}>오래된 기억부터</button></div></section>
    <nav className="activity-filters" aria-label="활동 태그 필터">{(['전체', ...activityTags] as const).map((activity) => <button key={activity} type="button" aria-pressed={activityFilter === activity} onClick={() => setActivityFilter(activity)}>{activity}</button>)}</nav>
    {visibleMemories.length ? <section className="memory-gallery" aria-label="기억 사진 모음">{visibleMemories.map((memory, index) => <article key={memory.id} className={`gallery-card card-${index + 1}`}><button className="gallery-card-open" type="button" onClick={() => openMemory(memory)} aria-label={`${memory.name} 자세히 보기`}><figure>{memory.images[0] ? <Image src={memory.images[0]} alt={`${memory.name}의 고양이 사진`} fill sizes="(max-width: 720px) 92vw, 45vw" priority={index === 0} unoptimized={memory.uploaded} /> : <span className="gallery-image-placeholder">✦</span>}{memory.images.length > 1 && <b className="gallery-photo-count">사진 {memory.images.length}장</b>}</figure><div><time>{memory.date}</time><h2>{memory.name}</h2><p>{memory.note}</p><span>기억별 자세히 보기 · ✦</span></div></button></article>)}</section> : <p className="album-empty">찾으시는 기억이 아직 이 밤하늘에는 없어요.</p>}
    <p className="gallery-footnote">새로 만든 기억별의 사진도 이곳에 바로 이어져요.</p>

    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <DialogContent className="memory-album-dialog" showCloseButton={false}>
        {selected && editing && <section className="edit-photo-manager"><header><span>사진 {editImages.length}장</span><label>＋ 사진 추가<input type="file" accept="image/*" multiple onChange={(event) => addEditPhotos(event.target.files)} /></label></header><div>{editImages.map((image, index) => <article key={`${image}-${index}`}><figure style={{ backgroundImage:`url(${image})` }}><span>{index === 0 ? '대표' : index + 1}</span></figure><div><button type="button" onClick={() => makeCover(index)} disabled={index === 0}>대표</button><button type="button" onClick={() => moveEditPhoto(index, -1)} disabled={index === 0}>←</button><button type="button" onClick={() => moveEditPhoto(index, 1)} disabled={index === editImages.length - 1}>→</button><button type="button" onClick={() => removeEditPhoto(index)}>제거</button></div></article>)}</div></section>}
        {selected && <><button className="album-detail-close" type="button" aria-label="기억 닫기" onClick={() => setSelected(null)}>×</button><section className="album-photo-viewer" aria-label={`${selected.name} 사진 ${photoIndex + 1} / ${selected.images.length}`}><figure>{selected.images[photoIndex] ? <Image src={selected.images[photoIndex]} alt={`${selected.name}의 ${photoIndex + 1}번째 사진`} fill sizes="(max-width: 720px) 92vw, 58vw" unoptimized={selected.uploaded} /> : <span className="gallery-image-placeholder">✦</span>}</figure>{selected.images.length > 1 && <><button className="album-photo-prev" type="button" onClick={() => movePhoto(-1)} aria-label="이전 사진">‹</button><button className="album-photo-next" type="button" onClick={() => movePhoto(1)} aria-label="다음 사진">›</button><div className="album-photo-position">{photoIndex + 1} / {selected.images.length}</div><div className="album-thumbnails">{selected.images.map((image, index) => <button type="button" key={image} aria-label={`${index + 1}번째 사진 보기`} aria-current={photoIndex === index} onClick={() => setPhotoIndex(index)}><Image src={image} alt="" fill sizes="58px" unoptimized={selected.uploaded} /></button>)}</div></>}</section><section className="album-detail-copy">{editing ? <div className="memory-edit-form"><label>기억 이름<input value={edit.name} onChange={(e) => setEdit({ ...edit, name:e.target.value })} /></label><label>날짜<input value={edit.date} onChange={(e) => setEdit({ ...edit, date:e.target.value })} /></label><label>활동<select value={edit.activity} onChange={(e) => setEdit({ ...edit, activity:e.target.value as ActivityTag })}>{activityTags.map((tag) => <option key={tag}>{tag}</option>)}</select></label><label>메모<textarea rows={4} value={edit.note} onChange={(e) => setEdit({ ...edit, note:e.target.value })} /></label><div><button type="button" onClick={() => setEditing(false)}>취소</button><button type="button" onClick={saveEdit}>저장</button></div></div> : <><span>MEMORY STAR · {selected.date}</span><DialogTitle>{selected.name}</DialogTitle><em className="album-activity-tag">{selected.activity}</em><DialogDescription>{selected.note}</DialogDescription><a href={`/?memory=${selected.starId}`}>밤하늘에서 별 위치 보기 <b>✦</b></a><div className="memory-manage-actions"><button type="button" onClick={() => setEditing(true)}>기억 수정</button><button type="button" onClick={() => setDeleteOpen(true)}>삭제</button></div></>}</section></>}
      </DialogContent>
    </Dialog>
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent className="memory-delete-dialog"><AlertDialogHeader><AlertDialogTitle>이 기억별을 지울까요?</AlertDialogTitle><AlertDialogDescription>앨범과 밤하늘에서 함께 사라집니다. 이 작업은 되돌릴 수 없어요.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><AlertDialogAction onClick={removeMemory}>기억별 삭제</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main>;
}
