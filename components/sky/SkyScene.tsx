'use client';
/* oxlint-disable next/no-html-link-for-pages */

import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type PointerEvent, type SyntheticEvent, type TouchEvent, type WheelEvent } from 'react';
import Image from 'next/image';
import { activityFor, activityStyles, activityTags, constellationPairs, memoryStars, mobileStarPositions, starDepths, type ActivityTag, type MemoryStarData } from '@/lib/memory-stars';
import { getStoredMemories, saveStoredMemories } from '@/lib/memory-store';

const MAX_TRAVEL = 1.78;
type BulkGroup = { key: string; date: string; name: string; files: File[]; previews: string[]; enabled: boolean; activity: ActivityTag | null };

function depthFor(id: number, customDepth?: number) {
  if (customDepth != null) return customDepth;
  const band = starDepths[id] ?? 'far';
  const base = band === 'near' ? 0.38 : band === 'mid' ? 0.92 : 1.48;
  return base + ((id * 17) % 11) / 42;
}

function project(x: number, y: number, depth: number, travel: number) {
  const distance = depth - travel;
  const scale = Math.min(4.8, Math.max(.62, .5 + 1 / Math.max(.23, distance + .52)));
  return {
    distance,
    scale,
    x: 50 + (x - 50) * scale,
    y: 46 + (y - 46) * scale,
    opacity: distance < -.34 ? 0 : distance < .08 ? Math.max(0, (distance + .34) / .42) : Math.min(1, .48 + scale * .3),
    selectable: distance >= .03 && distance <= .78,
  };
}

function dateFromFile(file: File) {
  const filenameDate = file.name.match(/(20\d{2})[-_.]?(0[1-9]|1[0-2])[-_.]?([0-2]\d|3[01])/);
  if (filenameDate) return `${filenameDate[1]}-${filenameDate[2]}-${filenameDate[3]}`;
  const date = new Date(file.lastModified || Date.now());
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function groupFilesByDate(files: File[]): BulkGroup[] {
  const groups = new Map<string, File[]>();
  files.forEach((file) => {
    const date = dateFromFile(file);
    groups.set(date, [...(groups.get(date) ?? []), file]);
  });
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, groupedFiles], index) => ({
    key: `${date}-${index}`,
    date,
    name: `${date.replaceAll('-', '. ')}의 기억`,
    files: groupedFiles,
    previews: groupedFiles.map((file) => URL.createObjectURL(file)),
    enabled: true,
    activity: null,
  }));
}

export function SkyScene() {
  const [addedStars, setAddedStars] = useState<MemoryStarData[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<number, string[]>>({});
  const [addedNotes, setAddedNotes] = useState<Record<number, string>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [centerOpen, setCenterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'bulk' | 'single'>('bulk');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [singlePreview, setSinglePreview] = useState<string | null>(null);
  const [memoryPreviews, setMemoryPreviews] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [bulkGroups, setBulkGroups] = useState<BulkGroup[]>([]);
  const [bornIds, setBornIds] = useState<number[]>([]);
  const [creationNotice, setCreationNotice] = useState<{ id: number; count: number; name: string } | null>(null);
  const [draft, setDraft] = useState<{ name: string; date: string; note: string; activity: ActivityTag }>({ name: '', date: '', note: '', activity: '함께한 일상' });
  const [travel, setTravel] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [walking, setWalking] = useState(false);
  const walkingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pointerDrag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const touchGesture = useRef<{ x: number; y: number; panX: number; panY: number; distance: number | null; travel: number } | null>(null);
  const allStars = [...memoryStars, ...addedStars];
  const selected = allStars.find((star) => star.id === selectedId);
  const projected = allStars.map((star) => ({ star, ...project(star.x, star.y, depthFor(star.id, star.depth), travel) }));
  const closest = projected.filter((item) => item.selectable).sort((a, b) => a.distance - b.distance)[0];
  const memoryNotes = [
    '햇빛이 오래 머물던 자리에서, 우리는 아무 말 없이 같은 풍경을 바라봤어요.',
    '작고 따뜻했던 순간은 멀어져도 사라지지 않고 조용히 빛나요.',
    '평범해서 더 소중했던 하루. 네가 곁에 있다는 것만으로 충분했어요.',
    '문득 돌아보면 언제나 그 자리에 있던 온기를 기억해요.',
  ];

  useEffect(() => {
    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') { setCreateOpen(false); setCenterOpen(false); }
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    getStoredMemories().then((stored) => {
      if (!active) return;
      setAddedStars(stored.map((memory) => memory.star));
      setAddedNotes(Object.fromEntries(stored.map((memory) => [memory.id, memory.note])));
      setPhotoUrls(Object.fromEntries(stored.map((memory) => {
        const photos = memory.photos.map((photo) => { const url = URL.createObjectURL(photo); urls.push(url); return url; });
        return [memory.id, photos];
      })));
      const requestedId = Number(new URLSearchParams(window.location.search).get('memory'));
      const requested = [...memoryStars, ...stored.map((memory) => memory.star)].find((star) => star.id === requestedId);
      if (requested) focusStar(requested.id, requested.depth);
    }).catch(() => undefined);
    return () => { active = false; urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, []);

  function beginWalking() {
    setWalking(true);
    if (walkingTimer.current) clearTimeout(walkingTimer.current);
    walkingTimer.current = setTimeout(() => setWalking(false), 1350);
  }

  function resetUploadDraft(mode: 'bulk' | 'single') {
    setCreateMode(mode);
    setPendingFiles([]);
    setBulkGroups([]);
    setSinglePreview(null);
  }

  function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const accepted = files;
    setPendingFiles(accepted);
    const file = accepted[0];
    const previews = accepted.map((item) => URL.createObjectURL(item));
    setBulkGroups([]);
    setMemoryPreviews(previews);
    setCoverIndex(0);
    setSinglePreview(previews[0] ?? null);
    if (file) setDraft((current) => ({
      ...current,
      name: current.name || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      date: current.date || dateFromFile(file),
    }));
  }

  function focusStar(id: number, customDepth?: number) {
    const target = Math.min(MAX_TRAVEL, Math.max(0, depthFor(id, customDepth) - .34));
    setSelectedId(id);
    setCenterOpen(false);
    setPan({ x: 0, y: 0 });
    setTravel(target);
    beginWalking();
  }

  function handleWheel(event: WheelEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest('.memory-creator')) return;
    const rawDelta = Math.sign(event.deltaY) * Math.min(.28, Math.abs(event.deltaY) / 420);
    setTravel((value) => {
      const nextDistance = allStars.map((star) => depthFor(star.id, star.depth) - value).filter((distance) => distance > 0).sort((a, b) => a - b)[0] ?? 1;
      const brake = rawDelta > 0 && nextDistance < .24 ? .34 + Math.max(0, nextDistance) / .24 * .66 : 1;
      return Math.min(MAX_TRAVEL, Math.max(0, value + rawDelta * brake));
    });
    setSelectedId(null);
    beginWalking();
  }

  function stepJourney(direction: -1 | 1) {
    setTravel((value) => Math.min(MAX_TRAVEL, Math.max(0, value + direction * .2)));
    setSelectedId(null);
    beginWalking();
  }

  async function createStars(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const orderedFiles = pendingFiles.length ? [pendingFiles[coverIndex], ...pendingFiles.filter((_, index) => index !== coverIndex)] : [];
    const orderedPreviews = memoryPreviews.length ? [memoryPreviews[coverIndex], ...memoryPreviews.filter((_, index) => index !== coverIndex)] : [];
    const sources = orderedFiles.slice(0, 1).map((file) => ({ key: 'single', date: draft.date || dateFromFile(file), name: draft.name.trim() || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), files: orderedFiles, previews: orderedPreviews, enabled: true, activity: draft.activity }));
    if (sources.length === 0) return;
    const nextId = 21 + addedStars.length;
    const nextSingleDepth = Math.min(1.74, Math.max(1.48, ...addedStars.map((star) => star.depth ?? 1.48)) + .06);
    const created = sources.map((source, index): MemoryStarData => {
      const id = nextId + index;
      const angle = (id * 137.5) * Math.PI / 180;
      const radius = 11 + (index % 5) * 3.8;
      const chronologicalDepth = sources.length === 1 ? 1.56 : .68 + index / (sources.length - 1) * .96;
      return {
        id,
        name: source.name,
        date: source.date.replaceAll('-', '. '),
        x: 50 + Math.cos(angle) * radius,
        y: 43 + Math.sin(angle) * radius * .68,
        size: 7 + id % 5,
        shape: activityStyles[source.activity ?? '함께한 일상'].shape,
        tone: activityStyles[source.activity ?? '함께한 일상'].tone,
        activity: source.activity ?? undefined,
        depth: nextSingleDepth,
        photoCount: source.files.length,
        created: true,
      };
    });
    const urls = Object.fromEntries(created.map((star, index) => [star.id, sources[index].previews]));
    const notes = Object.fromEntries(created.map((star) => [star.id, draft.note.trim() || '사진 속 순간을 천천히 기억별로 정리해요.']));
    await saveStoredMemories(created.map((star, index) => ({ id: star.id, star, note: notes[star.id], photos: sources[index].files, createdAt: new Date().toISOString() })));
    setAddedStars((stars) => [...stars, ...created]);
    setPhotoUrls((current) => ({ ...current, ...urls }));
    setAddedNotes((current) => ({ ...current, ...notes }));
    setBornIds(created.map((star) => star.id));
    setCreationNotice({ id: created[created.length - 1].id, count: created.length, name: created[created.length - 1].name });
    setTimeout(() => setBornIds([]), 2400);
    setTimeout(() => setCreationNotice(null), 6200);
    setCreateOpen(false);
    setPendingFiles([]);
    setBulkGroups([]);
    setSinglePreview(null);
    setMemoryPreviews([]);
    setCoverIndex(0);
    setDraft({ name: '', date: '', note: '', activity: '함께한 일상' });
    focusStar(created[created.length - 1].id, created[created.length - 1].depth);
  }

  async function createMockMemories() {
    const nextId = 21 + addedStars.length;
    const mocks: MemoryStarData[] = [{ id: nextId, name: '창가에서 보낸 저녁', date: '2020. 09. 03', x: 56, y: 36, size: 10, shape: 'four', tone: 'blue', activity: '창가 구경', depth: 1.62, photoCount: 2, created: true }];
    const mockPhotos = await Promise.all(['/assets/mock-memory-window.png', '/assets/mock-memory-rain.png'].map(async (url) => (await fetch(url)).blob()));
    const mockNotes = ['햇빛과 빗소리가 번갈아 머물던 창가의 조용한 기억.'];
    await saveStoredMemories([{ id: mocks[0].id, star: mocks[0], note: mockNotes[0], photos: mockPhotos, createdAt: new Date().toISOString() }]);
    setAddedStars((stars) => [...stars, ...mocks]);
    setPhotoUrls((current) => ({ ...current, [nextId]: ['/assets/mock-memory-window.png', '/assets/mock-memory-rain.png'] }));
    setAddedNotes((current) => ({ ...current, [nextId]: mockNotes[0] }));
    setBornIds(mocks.map((star) => star.id));
    setCreationNotice({ id: nextId, count: 1, name: mocks[0].name });
    setCreateOpen(false);
    setTimeout(() => setBornIds([]), 2400);
    setTimeout(() => setCreationNotice(null), 6200);
    focusStar(mocks[0].id, mocks[0].depth);
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button, a, input, textarea, label')) return;
    pointerDrag.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (!pointerDrag.current || event.pointerType !== 'mouse') return;
    setPan({ x: Math.max(-120, Math.min(120, pointerDrag.current.panX + event.clientX - pointerDrag.current.x)), y: Math.max(-80, Math.min(80, pointerDrag.current.panY + event.clientY - pointerDrag.current.y)) });
  }

  function handleTouchMove(event: TouchEvent<HTMLElement>) {
    const gesture = touchGesture.current;
    if (!gesture) return;
    if (event.touches.length === 2) {
      const a = event.touches[0]; const b = event.touches[1];
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (gesture.distance != null) setTravel(Math.min(MAX_TRAVEL, Math.max(0, gesture.travel + (distance - gesture.distance) / 320)));
      setSelectedId(null); beginWalking(); return;
    }
    const touch = event.touches[0];
    if (!touch) return;
    setPan({ x: Math.max(-70, Math.min(70, gesture.panX + touch.clientX - gesture.x)), y: Math.max(-54, Math.min(54, gesture.panY + touch.clientY - gesture.y)) });
  }

  return (
    <main className="sky-scene" onWheel={handleWheel} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={() => { pointerDrag.current = null; }} onPointerCancel={() => { pointerDrag.current = null; }} onTouchStart={(event) => { const a = event.touches[0]; const b = event.touches[1]; if (!a) return; touchGesture.current = { x:a.clientX, y:a.clientY, panX:pan.x, panY:pan.y, distance:b ? Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY) : null, travel }; }} onTouchMove={handleTouchMove} onTouchEnd={() => { touchGesture.current = null; }} style={{ '--travel': travel, '--pan-x':`${pan.x}px`, '--pan-y':`${pan.y}px`, '--cat-shift': `${Math.sin(travel * 4.2) * 3.2}vw` } as CSSProperties}>
      <div className="sky-background" aria-hidden="true"><div className="mist mist-one" /><div className="mist mist-two" /><div className="stardust" /></div>
      <header className="sky-header">
        <div className="brand" aria-label="고양이의 별"><span className="brand-star">✦</span><span>고양이의 별</span><small>CAT&apos;S ORBIT</small></div>
        <a className="memory-library" href="/memories">다시 보는 기억</a>
      </header>

      <section className="star-world" aria-label="스크롤하여 기억별 사이를 걷는 루루의 밤하늘">
        <div className="depth-dust depth-far" aria-hidden="true" />
        <div className="depth-dust depth-near" aria-hidden="true" />
        <svg className="constellations" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {constellationPairs.map(([a, b]) => {
            const from = projected[a - 1]; const to = projected[b - 1];
            const active = selectedId === a || selectedId === b;
            if (from.opacity < .08 || to.opacity < .08) return null;
            return <path key={`${a}-${b}`} className={active ? 'active' : ''} style={{ opacity: Math.min(from.opacity, to.opacity) }} d={`M ${from.x} ${from.y} Q ${(from.x + to.x) / 2 + 1.5} ${(from.y + to.y) / 2 - 1} ${to.x} ${to.y}`} />;
          })}
        </svg>

        <button className={`main-star${centerOpen ? ' selected' : ''}`} type="button" aria-label="루루의 중심별 열기" aria-expanded={centerOpen} onClick={() => { setSelectedId(null); setCenterOpen((open) => !open); }}><span>✦</span></button>
        {projected.map(({ star, x, y, scale, opacity, selectable, distance }) => {
          const activity = activityFor(star);
          const visual = activityStyles[activity];
          const related = selected && selected.id !== star.id && activityFor(selected) === activity;
          const mobilePosition = mobileStarPositions[star.id] ?? [star.x, star.y];
          const mobile = project(mobilePosition[0], mobilePosition[1], depthFor(star.id), travel);
          return <button key={star.id} type="button" data-reachability={selectable ? 'selectable' : 'approach'}
            data-depth={starDepths[star.id] ?? 'far'} data-distance={distance < .03 ? 'passed' : selectable ? 'close' : 'far'}
            className={`memory-star shape-${visual.shape} tone-${visual.tone}${star.favorite ? ' favorite' : ''}${bornIds.includes(star.id) ? ' newly-born' : ''}${selectedId === star.id ? ' selected' : ''}${related ? ' tag-related' : ''}${selectedId && selectedId !== star.id && !related ? ' dimmed' : ''}`}
            style={{ left:`${x}%`, top:`${y}%`, opacity, '--depth-scale': scale, '--mobile-x':`${mobile.x}%`, '--mobile-y':`${mobile.y}%`, '--star-size':`${star.size}px`, '--twinkle-delay':`${(-((star.id * 1.37) % 8)).toFixed(2)}s`, '--twinkle-duration':`${(5.4 + (star.id % 5) * 1.1).toFixed(1)}s`, '--arrival-delay':`${120 + star.id * 42}ms` } as CSSProperties}
            aria-label={`${star.name}, ${star.date}${selectable ? ', 가까운 기억' : ', 멀리 있는 기억, 가까이 이동'}`} aria-pressed={selectedId === star.id}
            onClick={() => { setCenterOpen(false); selectable ? setSelectedId(selectedId === star.id ? null : star.id) : focusStar(star.id, star.depth); }}><span className="proximity-ring" /><span className="star-core" /><span className="star-label"><strong>{star.name}</strong><small>{distance < .26 ? '지금 열어볼 수 있어요' : '조금 더 가까이'}</small></span></button>;
        })}

        <div className={`cat-wrap${walking ? ' walking' : ''}`} aria-hidden="true">
          <div className="cat-art"><Image className="cat-idle" src="/assets/cat-back-v3.webp" alt="" fill sizes="(max-width: 640px) 42vw, 16vw" style={{ objectFit: 'contain', objectPosition: 'center bottom' }} priority unoptimized /></div>
        </div>
        <div className="horizon-haze" aria-hidden="true" />
      </section>

      <div className="journey-guide"><span aria-live="polite">{travel < .1 ? '스크롤로 가까이 · 드래그로 둘러보기' : closest ? `${closest.star.name} 가까이` : '더 먼 기억으로 걷는 중'}</span><div className="journey-track" aria-hidden="true"><i style={{ width: `${(travel / MAX_TRAVEL) * 100}%` }} /></div><div className="journey-actions"><button type="button" onClick={() => stepJourney(-1)} disabled={travel <= 0} aria-label="가까운 기억 쪽으로 한 걸음">‹</button><button type="button" onClick={() => stepJourney(1)} disabled={travel >= MAX_TRAVEL} aria-label="먼 기억 쪽으로 한 걸음">›</button></div></div>
      <aside className={`memory-detail${selected ? ' visible' : ''}`} aria-live="polite">
        {selected && <><button type="button" aria-label="기억 닫기" onClick={() => setSelectedId(null)}>×</button><figure className={`memory-photo${photoUrls[selected.id]?.[0] ? ' has-photo' : ''}`} aria-label={`${selected.name}의 사진`} style={photoUrls[selected.id]?.[0] ? { backgroundImage: `url(${photoUrls[selected.id][0]})` } : undefined}>{!photoUrls[selected.id]?.[0] && <><span>✦</span><small>사진이 머물 자리</small></>}{selected.photoCount && selected.photoCount > 1 ? <b>{selected.photoCount}장의 기억</b> : null}</figure><div className="memory-copy"><i className="memory-detail-glint" aria-hidden="true">✦</i><span className="memory-kicker">MEMORY STAR · {selected.date}</span><strong>{selected.name}</strong><em className={`activity-chip tone-${activityStyles[activityFor(selected)].tone}`}>{activityFor(selected)}</em><p>{addedNotes[selected.id] ?? memoryNotes[(selected.id - 1) % memoryNotes.length]}</p><small className="memory-distance">같은 활동의 별도 은은하게 빛나요</small></div></>}
      </aside>
      <aside className={`center-star-detail${centerOpen ? ' visible' : ''}`} aria-live="polite">
        {centerOpen && <><button className="center-close" type="button" aria-label="루루의 별 닫기" onClick={() => setCenterOpen(false)}>×</button><figure><Image src="/assets/mock-memory-window.png" alt="창가에 앉은 루루" fill sizes="180px" /></figure><div><span>LULU&apos;S ORBIT</span><h2>루루의 별</h2><p>한 장면을 담은 기억별과 달리, 이 별은 모든 기억이 돌아오는 중심이에요. 루루와 함께한 시간 전체를 품고 있어요.</p><dl><div><dt>함께한 기억</dt><dd>{allStars.length}개의 별</dd></div><div><dt>첫 기억</dt><dd>2012. 04. 18부터</dd></div></dl><div className="center-actions"><button type="button" onClick={() => { setCenterOpen(false); focusStar(1); }}>첫 기억 만나기</button><a href="/memories">다시 보는 기억</a></div></div></>}
      </aside>
      <aside className={`creation-notice${creationNotice ? ' visible' : ''}`} aria-live="polite">{creationNotice && <><span>새 기억별 {creationNotice.count}개가 생겼어요</span><strong>{creationNotice.name}</strong><small>가장 새로운 별은 밤하늘 안쪽에 놓였어요.</small><button type="button" onClick={() => focusStar(creationNotice.id, allStars.find((star) => star.id === creationNotice.id)?.depth)}>별 위치 보기 <b>✦</b></button></>}</aside>
      <p className="whisper">함께한 기억은,<br />조금 멀리서도 계속 빛나요.</p>
      <button className="add-memory" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => setCreateOpen(true)}><span>＋</span> 기억별 만들기</button>
      <div className={`creator-backdrop${createOpen ? ' open' : ''}`} role="presentation">
        <button className="creator-dismiss-layer" type="button" aria-label="만들기 창 바깥을 눌러 닫기" onClick={() => setCreateOpen(false)} />
        <form className="memory-creator" onSubmit={createStars} aria-label="기억별 만들기">
          <button className="creator-close" type="button" aria-label="만들기 닫기" onClick={() => setCreateOpen(false)}>×</button>
          <span className="creator-kicker">NEW MEMORY STAR</span><h2>어떤 기억을 별로 띄울까요?</h2>
          <input ref={fileInputRef} className="photo-file-input" aria-label="이 기억의 사진 선택" type="file" accept="image/*" multiple onChange={handleFilesSelected} />
          <button className={`photo-drop${pendingFiles.length ? ' ready' : ''}${singlePreview ? ' single-ready' : ''}`} type="button" onClick={() => fileInputRef.current?.click()} style={singlePreview ? { '--single-preview': `url(${singlePreview})` } as CSSProperties : undefined}><span>{pendingFiles.length ? `사진 ${pendingFiles.length}장이 한 기억에 머물 준비가 됐어요` : '이 기억이 담긴 사진을 골라주세요'}</span><small>{pendingFiles.length ? '아래에서 대표 사진을 고를 수 있어요' : '한 장 또는 같은 순간의 여러 장을 선택할 수 있어요'}</small></button>
          {memoryPreviews.length > 0 && <section className="memory-photo-picks" aria-label="대표 사진 선택"><header><strong>대표 사진</strong><span>앨범과 별 상세에 먼저 보여요</span></header><div>{memoryPreviews.map((preview, index) => <button key={preview} type="button" aria-pressed={coverIndex === index} onClick={() => { setCoverIndex(index); setSinglePreview(preview); }} style={{ backgroundImage:`url(${preview})` }}><span>{coverIndex === index ? '대표' : index + 1}</span></button>)}</div></section>}
          <fieldset className="activity-picker"><legend>어떤 활동의 기억인가요?</legend>{activityTags.map((activity) => <button key={activity} type="button" aria-pressed={draft.activity === activity} className={`tone-${activityStyles[activity].tone}`} onClick={() => setDraft({ ...draft, activity })}><i className={`tag-star shape-${activityStyles[activity].shape}`} />{activity}</button>)}</fieldset>
          <div className="single-fields"><label><span>기억 이름</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="예: 창가에서 보낸 오후" /></label><label><span>날짜</span><input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label><label className="note-field"><span>짧은 기억</span><textarea value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="그날의 온기를 한두 문장으로 남겨요" rows={3} /></label></div>
          <button className="create-submit" type="submit" disabled={pendingFiles.length === 0}>밤하늘에 기억별 띄우기 <span>✦</span></button>
          <button className="mock-create" type="button" onClick={createMockMemories}>목업 사진 2장으로 별 하나 띄우기</button>
          <p className="creator-note">이 기기의 미리보기 앨범에도 함께 저장돼요.</p>
        </form>
      </div>
    </main>
  );
}
