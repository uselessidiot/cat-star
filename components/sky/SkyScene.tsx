'use client';

import { useRef, useState, type CSSProperties, type PointerEvent, type SyntheticEvent, type TouchEvent, type WheelEvent } from 'react';
import { constellationPairs, memoryStars, mobileStarPositions, starDepths, type MemoryStarData } from '@/lib/memory-stars';

const MAX_TRAVEL = 1.78;
type BulkGroup = { key: string; date: string; name: string; files: File[]; previews: string[]; enabled: boolean };

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
  }));
}

export function SkyScene() {
  const [addedStars, setAddedStars] = useState<MemoryStarData[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<number, string[]>>({});
  const [addedNotes, setAddedNotes] = useState<Record<number, string>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'bulk' | 'single'>('bulk');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [bulkGroups, setBulkGroups] = useState<BulkGroup[]>([]);
  const [bornIds, setBornIds] = useState<number[]>([]);
  const [draft, setDraft] = useState({ name: '', date: '', note: '' });
  const [travel, setTravel] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [walking, setWalking] = useState(false);
  const walkingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  function beginWalking() {
    setWalking(true);
    if (walkingTimer.current) clearTimeout(walkingTimer.current);
    walkingTimer.current = setTimeout(() => setWalking(false), 1350);
  }

  function focusStar(id: number, customDepth?: number) {
    const target = Math.min(MAX_TRAVEL, Math.max(0, depthFor(id, customDepth) - .34));
    setSelectedId(id);
    setPan({ x: 0, y: 0 });
    setTravel(target);
    beginWalking();
  }

  function handleWheel(event: WheelEvent<HTMLElement>) {
    const rawDelta = Math.sign(event.deltaY) * Math.min(.28, Math.abs(event.deltaY) / 420);
    setTravel((value) => {
      const nextDistance = allStars.map((star) => depthFor(star.id, star.depth) - value).filter((distance) => distance > 0).sort((a, b) => a - b)[0] ?? 1;
      const brake = rawDelta > 0 && nextDistance < .24 ? .34 + Math.max(0, nextDistance) / .24 * .66 : 1;
      return Math.min(MAX_TRAVEL, Math.max(0, value + rawDelta * brake));
    });
    setSelectedId(null);
    beginWalking();
  }

  function createStars(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const sources = createMode === 'bulk'
      ? Object.values(bulkGroups.filter((group) => group.enabled && group.files.length > 0).reduce<Record<string, BulkGroup>>((groups, group) => {
        const existing = groups[group.date];
        groups[group.date] = existing ? { ...existing, files: [...existing.files, ...group.files], previews: [...existing.previews, ...group.previews] } : group;
        return groups;
      }, {})).sort((a, b) => a.date.localeCompare(b.date))
      : pendingFiles.slice(0, 1).map((file) => ({ key: 'single', date: draft.date || dateFromFile(file), name: draft.name.trim() || file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), files: [file], previews: [URL.createObjectURL(file)], enabled: true }));
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
        shape: (['dot', 'four', 'six', 'orb'] as const)[id % 4],
        tone: (['cream', 'peach', 'rose'] as const)[id % 3],
        depth: createMode === 'single' ? nextSingleDepth : chronologicalDepth,
        photoCount: source.files.length,
        created: true,
      };
    });
    const urls = Object.fromEntries(created.map((star, index) => [star.id, sources[index].previews]));
    const notes = Object.fromEntries(created.map((star) => [star.id, createMode === 'single' && draft.note.trim() ? draft.note.trim() : '사진 속 순간을 천천히 기억별로 정리해요.']));
    setAddedStars((stars) => [...stars, ...created]);
    setPhotoUrls((current) => ({ ...current, ...urls }));
    setAddedNotes((current) => ({ ...current, ...notes }));
    setBornIds(created.map((star) => star.id));
    setTimeout(() => setBornIds([]), 2400);
    setCreateOpen(false);
    setPendingFiles([]);
    setBulkGroups([]);
    setDraft({ name: '', date: '', note: '' });
    focusStar(created[created.length - 1].id, created[created.length - 1].depth);
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button')) return;
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
        <button className="quiet-menu" type="button" aria-label="메뉴"><span /><span /></button>
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

        <button className="main-star" type="button" aria-label="루루의 중심별"><span>✦</span></button>
        {projected.map(({ star, x, y, scale, opacity, selectable, distance }) => {
          const mobilePosition = mobileStarPositions[star.id] ?? [star.x, star.y];
          const mobile = project(mobilePosition[0], mobilePosition[1], depthFor(star.id), travel);
          return <button key={star.id} type="button" data-reachability={selectable ? 'selectable' : 'approach'}
            data-depth={starDepths[star.id] ?? 'far'} data-distance={distance < .03 ? 'passed' : selectable ? 'close' : 'far'}
            className={`memory-star shape-${star.shape} tone-${star.tone}${star.favorite ? ' favorite' : ''}${bornIds.includes(star.id) ? ' newly-born' : ''}${selectedId === star.id ? ' selected' : ''}${selectedId && selectedId !== star.id ? ' dimmed' : ''}`}
            style={{ left:`${x}%`, top:`${y}%`, opacity, '--depth-scale': scale, '--mobile-x':`${mobile.x}%`, '--mobile-y':`${mobile.y}%`, '--star-size':`${star.size}px`, '--twinkle-delay':`${(-((star.id * 1.37) % 8)).toFixed(2)}s`, '--twinkle-duration':`${(5.4 + (star.id % 5) * 1.1).toFixed(1)}s`, '--arrival-delay':`${120 + star.id * 42}ms` } as CSSProperties}
            aria-label={`${star.name}, ${star.date}${selectable ? ', 가까운 기억' : ', 멀리 있는 기억, 가까이 이동'}`} aria-pressed={selectedId === star.id}
            onClick={() => selectable ? setSelectedId(selectedId === star.id ? null : star.id) : focusStar(star.id, star.depth)}><span className="proximity-ring" /><span className="star-core" /><span className="star-label"><strong>{star.name}</strong><small>{distance < .26 ? '지금 열어볼 수 있어요' : '조금 더 가까이'}</small></span></button>;
        })}

        <div className={`cat-wrap${walking ? ' walking' : ''}`} aria-hidden="true"><div className="cat-art" /></div>
        <div className="horizon-haze" aria-hidden="true" />
      </section>

      <div className="journey-guide" aria-hidden="true"><span>{travel < .1 ? '스크롤로 가까이 · 드래그로 둘러보기' : closest ? `${closest.star.name} 가까이` : '더 먼 기억으로 걷는 중'}</span><div className="journey-track"><i style={{ width: `${(travel / MAX_TRAVEL) * 100}%` }} /></div></div>
      <aside className={`memory-detail${selected ? ' visible' : ''}`} aria-live="polite">
        {selected && <><button type="button" aria-label="기억 닫기" onClick={() => setSelectedId(null)}>×</button><figure className={`memory-photo${photoUrls[selected.id]?.[0] ? ' has-photo' : ''}`} aria-label={`${selected.name}의 사진`} style={photoUrls[selected.id]?.[0] ? { backgroundImage: `url(${photoUrls[selected.id][0]})` } : undefined}>{!photoUrls[selected.id]?.[0] && <><span>✦</span><small>사진이 머물 자리</small></>}{selected.photoCount && selected.photoCount > 1 ? <b>{selected.photoCount}장의 기억</b> : null}</figure><div className="memory-copy"><i className="memory-detail-glint" aria-hidden="true">✦</i><span className="memory-kicker">MEMORY STAR · {selected.date}</span><strong>{selected.name}</strong><p>{addedNotes[selected.id] ?? memoryNotes[(selected.id - 1) % memoryNotes.length]}</p><small className="memory-distance">가까이 머무는 기억</small></div></>}
      </aside>
      <p className="whisper">함께한 기억은,<br />조금 멀리서도 계속 빛나요.</p>
      <button className="add-memory" type="button" onClick={() => setCreateOpen(true)}><span>＋</span> 기억별 만들기</button>
      {createOpen && <div className="creator-backdrop" role="presentation">
        <form className="memory-creator" onSubmit={createStars} aria-label="기억별 만들기">
          <button className="creator-close" type="button" aria-label="만들기 닫기" onClick={() => setCreateOpen(false)}>×</button>
          <span className="creator-kicker">NEW MEMORY STAR</span><h2>어떻게 기억을 데려올까요?</h2>
          <div className="creator-modes" role="tablist" aria-label="사진 올리기 방법">
            <button type="button" role="tab" aria-selected={createMode === 'bulk'} onClick={() => { setCreateMode('bulk'); setPendingFiles([]); setBulkGroups([]); }}><strong>사진 전체 올리기</strong><small>날짜별로 묶어 별 초안 생성</small></button>
            <button type="button" role="tab" aria-selected={createMode === 'single'} onClick={() => { setCreateMode('single'); setPendingFiles([]); setBulkGroups([]); }}><strong>하나씩 만들기</strong><small>새 기억은 밤하늘 안쪽부터</small></button>
          </div>
          <label className={`photo-drop${pendingFiles.length ? ' ready' : ''}`}><input type="file" accept="image/*" multiple={createMode === 'bulk'} onChange={(event) => { const files = Array.from(event.target.files ?? []); setPendingFiles(files); setBulkGroups(createMode === 'bulk' ? groupFilesByDate(files) : []); }} /><span>{pendingFiles.length ? `사진 ${pendingFiles.length}장이 머물 준비가 됐어요` : createMode === 'bulk' ? '여러 사진을 한 번에 선택해요' : '기억이 담긴 사진 한 장을 선택해요'}</span><small>{createMode === 'bulk' ? '촬영 날짜가 같은 사진은 하나의 기억별로 묶어요' : '새로운 기억일수록 밤하늘 안쪽에 놓여요'}</small></label>
          {createMode === 'bulk' && bulkGroups.length > 0 && <section className="bulk-review" aria-label="날짜별 기억 검토"><header><strong>{bulkGroups.filter((group) => group.enabled).length}개의 기억별</strong><span>오래된 기억은 가깝게, 최근 기억은 더 깊이</span></header><div className="bulk-group-list">{bulkGroups.map((group, groupIndex) => <article key={group.key} className={group.enabled ? '' : 'excluded'}><button className="group-toggle" type="button" aria-pressed={group.enabled} onClick={() => setBulkGroups((groups) => groups.map((item, index) => index === groupIndex ? { ...item, enabled: !item.enabled } : item))}>{group.enabled ? '포함' : '제외'}</button><div className="group-thumbs">{group.previews.slice(0, 3).map((preview) => <span className="group-thumb" key={preview} style={{ backgroundImage: `url(${preview})` }} />)}{group.files.length > 3 && <span className="thumb-count">+{group.files.length - 3}</span>}</div><div className="group-fields"><input aria-label="기억별 이름" value={group.name} onChange={(event) => setBulkGroups((groups) => groups.map((item, index) => index === groupIndex ? { ...item, name: event.target.value } : item))} /><label><span>날짜</span><input type="date" value={group.date} onChange={(event) => setBulkGroups((groups) => groups.map((item, index) => index === groupIndex ? { ...item, date: event.target.value } : item))} /></label><small>사진 {group.files.length}장 · 별 1개</small></div></article>)}</div></section>}
          {createMode === 'single' && <div className="single-fields"><label><span>기억 이름</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="예: 창가에서 보낸 오후" /></label><label><span>날짜</span><input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label><label className="note-field"><span>짧은 기억</span><textarea value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="그날의 온기를 한두 문장으로 남겨요" rows={3} /></label></div>}
          <button className="create-submit" type="submit" disabled={createMode === 'bulk' ? !bulkGroups.some((group) => group.enabled) : pendingFiles.length === 0}>{createMode === 'bulk' ? `${bulkGroups.filter((group) => group.enabled).length || ''}개의 기억별 띄우기` : '기억별 하나 띄우기'} <span>✦</span></button>
          <p className="creator-note">지금은 저장되지 않는 시각 프로토타입이에요.</p>
        </form>
      </div>}
    </main>
  );
}
