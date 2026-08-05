/* ══════════════════════════════════════════════════════════════
   어드민 프로토타입 — 앱 로직 (라우팅 + 정책 파생계산 + 인터랙션)
   기준: 어드민 v0.5 · Phase1 v0.44 · 포인트_정책서 v0.1
════════════════════════════════════════════════════════════════ */

/* ── 공용 상태 ── */
const state = {
  route: 'dashboard',
  memberId: null,          // 회원 상세 대상
  memTab: 'info',          // info | points
  set: { role:'master', status:'active' },
  setSelId: null,          // 관리자 상세 대상 계정 ID
  adminList: [],           // 관리자 계정 목록 (등록 시 누적)
  // 목록 화면 검색·필터·정렬 상태 (기간필터: mode = all | range)
  mem:  { q:'', mode:'all', from:'', to:'', sort:'joinDate', dir:'desc', page:1 },
  cb01: { q:'', status:'all', mode:'all', fromMonth:'', toMonth:'', sort:'default', dir:'desc' },
  cb02: { mode:'all', fromMonth:'', toMonth:'' },
};
const PAGE_SIZE = 50;

/* ── 정책 유틸 ── */
const floorP = v => Math.floor(Number(v) || 0);         // 포인트 소수점 이하 버림 (포인트 v0.1 2-2절)
const fmtP   = v => floorP(v).toLocaleString('ko-KR') + 'P';
const fmtKRW = v => '₩' + (Number(v)||0).toLocaleString('ko-KR');
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MUTED_DASH  = '<span style="color:#9ca3af;font-weight:400">—</span>';
const MUTED_DASH2 = '<span style="color:#9ca3af">—</span>';
const MUTED_GUEST = '<span style="color:#9ca3af">(비로그인)</span>';

// 상태 배지 (9-4절)
const STATUS_BADGE = {
  Active:    ['badge-waiting',  '적립예정'],
  Approved:  ['badge-approved', '적립완료'],   // (변경) 지급완료 → 적립완료 · 용어 통일
  Cancelled: ['badge-cancelled','취소·만료'],
};
const GUEST_LABEL = '<span style="color:#6b7280">비회원</span>';   // 비회원(labels 없는 건)
function statusBadge(s){ const [c,t]=STATUS_BADGE[s]||['badge-inactive',s]; return `<span class="wf-badge ${c}">${t}</span>`; }
function typeBadge(t){
  const label = t==='NONE' ? '미설정' : t;   // CashbackType null = 미설정 (화면기획서 반영)
  const c = t==='PERCENTAGE' ? 'badge-active' : 'badge-inactive';
  return `<span class="wf-badge ${c}" style="font-size:9px">${label}</span>`;
}
// 포인트 금액 셀 표기 (타입 힌트 포함)
function pointCell(r){
  if (r.pointType==='NONE' || floorP(r.pointAmount)===0) return '<span style="color:#9ca3af;font-size:11px">—</span>';
  const hint = r.pointType==='PERCENTAGE' ? ` (${r.rate}%)` : (r.pointType==='FLAT' ? ' (flat)' : '');
  return `<span style="font-weight:600;color:#f59e0b">${fmtP(r.pointAmount)}${hint}</span>`;
}

/* ── 파생 계산 (회원별) ── */
// 예약 수 = 지급완료(Approved) 건수 (4-1절 CN4)
function memberApprovedCount(email){
  return RESERVATIONS.filter(r => r.memberEmail===email && r.status==='Approved').length;
}
// 누적 포인트(P) = Approved & type≠NONE 포인트 floor 합. 없으면 0 (6-4절 CN5)
function memberCumulativePoints(email){
  return RESERVATIONS
    .filter(r => r.memberEmail===email && r.status==='Approved' && r.pointType!=='NONE')
    .reduce((s,r)=> s + floorP(r.pointAmount), 0);
}
// 회원 포인트 내역 (CB01 규칙: NONE·0P 미표시)
function memberPointRows(email){
  return RESERVATIONS.filter(r => r.memberEmail===email && !(r.pointType==='NONE' || floorP(r.pointAmount)===0));
}
function resMonth(r){ return r.payMonth || r.checkIn.slice(0,7); }

/* ── DOM 헬퍼 ── */
const $ = id => document.getElementById(id);
function toast(msg, kind){
  const t=$('toast'); t.className=''; t.textContent=msg;
  if(kind) t.classList.add(kind); t.classList.add('show');
  clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'), 2200);
}
function openModal(html){ $('modal-inner').innerHTML=html; $('modal').classList.add('show'); }
function closeModal(){ $('modal').classList.remove('show'); $('modal-inner').innerHTML=''; }
$('modal').addEventListener('click', e=>{ if(e.target===$('modal')) closeModal(); });

/* ════════ 로그인 ════════ */
function doLogin(){
  const id=$('login-id').value.trim(), pw=$('login-pw').value;
  const errBox=$('login-error');
  $('login-id').classList.remove('err'); $('login-pw').classList.remove('err');
  if(!id && !pw){   // 케이스 C — 세션 만료 재현
    errBox.textContent='세션이 만료되었습니다. 다시 로그인해 주세요.';
    errBox.style.background='#fefce8'; errBox.style.borderColor='#fde68a'; errBox.style.color='#92400e';
    errBox.classList.add('show'); return;
  }
  if(id===ADMIN_ACCOUNT.loginId && pw===ADMIN_ACCOUNT.password){
    errBox.classList.remove('show');
    $('login-view').style.display='none';
    $('app-shell').style.display='block';
    $('proto-session').textContent='세션 활성 · '+ADMIN_ACCOUNT.email;
    go('dashboard');
    return;
  }
  // 케이스 B — 로그인 오류
  errBox.textContent='아이디 또는 비밀번호가 올바르지 않습니다. 다시 확인해 주세요.';
  errBox.style.background='#fee2e2'; errBox.style.borderColor='#fca5a5'; errBox.style.color='#991b1b';
  errBox.classList.add('show');
  $('login-id').classList.add('err'); $('login-pw').classList.add('err');
  $('login-pw').value='';
}
function doLogout(){
  $('app-shell').style.display='none';
  $('login-view').style.display='flex';
  $('login-id').value=''; $('login-pw').value=''; $('login-error').classList.remove('show');
  toast('로그아웃되었습니다');
}

/* ════════ 라우팅 ════════ */
const ROUTE_META = {
  dashboard:['대시보드','dashboard'],
  mem:['회원 목록','mem'], memDetail:['회원 상세·수정','mem'],
  cb01:['포인트 내역','cb01'], cb02:['공급사별 현황','cb02'],
  set:['관리자 설정','set'], setDetail:['관리자 계정 상세','set'], setNew:['관리자 계정 등록','set'],
};
function go(route){
  state.route=route;
  const [title,navKey]=ROUTE_META[route]||['',''];
  $('nav-route').textContent='— '+title;
  document.querySelectorAll('.adm-nav-item').forEach(el=>{
    el.classList.toggle('active', el.dataset.route===navKey);
  });
  window.scrollTo(0,0);
  ({dashboard:renderDashboard, mem:renderMemList, memDetail:renderMemDetail,
    cb01:renderCB01, cb02:renderCB02, set:renderSet, setDetail:renderSetDetail, setNew:renderSetNew}[route])();
}

/* ════════ 대시보드 ════════ */
function renderDashboard(){
  const totalMembers=MEMBERS.length;
  const approved=RESERVATIONS.filter(r=>r.status==='Approved');
  const active=RESERVATIONS.filter(r=>r.status==='Active');
  const cancelled=RESERVATIONS.filter(r=>r.status==='Cancelled');
  const approvedPts=approved.filter(r=>r.pointType!=='NONE').reduce((s,r)=>s+floorP(r.pointAmount),0);
  const activePts=active.filter(r=>r.pointType!=='NONE').reduce((s,r)=>s+floorP(r.pointAmount),0);

  const recentRes=[...RESERVATIONS].sort((a,b)=>b.resId.localeCompare(a.resId)).slice(0,5);
  const recentMem=[...MEMBERS].sort((a,b)=>b.joinDate.localeCompare(a.joinDate)).slice(0,5);

  $('view').innerHTML=`
    <div class="adm-page-hdr">
      <div class="adm-page-title">대시보드</div>
      <div class="adm-page-sub">주요 운영 지표 한눈에 보기 · 더미데이터 집계
        <br><span style="color:#f59e0b;font-size:12px;font-weight:600">⚠️ 우선순위 낮음 — 핵심 화면(회원·포인트) 완성 후 구현 (v0.5 8조 미결 3)</span>
      </div>
    </div>

    <div class="sec-title">핵심 지표</div>
    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:28px">
      <div class="stat-card blue"><div class="stat-card-label">전체 회원</div><div class="stat-card-value">${totalMembers.toLocaleString()}</div><div class="stat-card-sub">활성 회원 기준</div></div>
      <div class="stat-card blue"><div class="stat-card-label">총 적립완료 건수</div><div class="stat-card-value">${approved.length.toLocaleString()}</div><div class="stat-card-sub">Approved 누적 건수</div></div>
      <div class="stat-card amber"><div class="stat-card-label">총 적립완료 포인트</div><div class="stat-card-value" style="font-size:20px">${fmtP(approvedPts)}</div><div class="stat-card-sub">Approved 누적 합계</div></div>
      <div class="stat-card amber"><div class="stat-card-label">적립예정 포인트</div><div class="stat-card-value" style="font-size:20px">${fmtP(activePts)}</div><div class="stat-card-sub">Active</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div>
        <div class="sec-title">포인트 적립 현황 <span class="sec-badge" style="font-size:10px">최신 5건</span></div>
        <div class="adm-table-wrap"><table class="adm-table">
          <thead><tr><th>회원 이메일</th><th>OTA</th><th>포인트 금액</th><th>상태</th></tr></thead>
          <tbody>${recentRes.map(r=>{
            const who=r.memberEmail? esc(r.memberEmail) : GUEST_LABEL;
            const amt=r.status==='Cancelled' ? MUTED_DASH2 : pointCell(r);
            return `<tr><td style="font-size:11px">${who}</td><td>${esc(r.ota)}</td><td>${amt}</td><td>${statusBadge(r.status)}</td></tr>`;
          }).join('')}</tbody>
        </table></div>
        <div style="text-align:right;margin-top:8px"><span class="wf-btn wf-btn-outline wf-btn-sm" onclick="go('cb01')">전체 포인트 보기 →</span></div>
      </div>
      <div>
        <div class="sec-title">최근 가입 회원 <span class="sec-badge" style="font-size:10px">최신 5명</span></div>
        <div class="adm-table-wrap"><table class="adm-table">
          <thead><tr><th>회원번호</th><th>이메일</th><th>가입일</th></tr></thead>
          <tbody>${recentMem.map(m=>`<tr class="row-click" onclick="openMember('${m.id}')"><td style="font-family:monospace;font-size:11px">${m.id}</td><td style="font-size:11px">${esc(m.email)}</td><td style="font-size:11px">${m.joinDate.slice(5)}</td></tr>`).join('')}</tbody>
        </table></div>
        <div style="text-align:right;margin-top:8px"><span class="wf-btn wf-btn-outline wf-btn-sm" onclick="go('mem')">전체 회원 보기 →</span></div>
      </div>
    </div>`;
}

/* ════════ 회원 목록 (ADM-MEM01) ════════ */
function memFiltered(){
  const s=state.mem;
  let rows=MEMBERS.filter(m=>{
    if(s.q){ const q=s.q.toLowerCase(); if(!(m.email.toLowerCase().includes(q)||m.id.toLowerCase().includes(q))) return false; }
    if(s.mode==='range' && s.from){ const t=s.to||s.from; if(m.joinDate < s.from || m.joinDate > t) return false; }
    return true;
  });
  const dir=s.dir==='asc'?1:-1;
  rows.sort((a,b)=>{
    if(s.sort==='joinDate') return a.joinDate.localeCompare(b.joinDate)*dir;
    if(s.sort==='points')   return (memberCumulativePoints(a.email)-memberCumulativePoints(b.email))*dir;
    if(s.sort==='res')      return (memberApprovedCount(a.email)-memberApprovedCount(b.email))*dir;
    return 0;
  });
  return rows;
}
function sortInd(view,key){ return state[view].sort===key ? `<span class="sort-ind">${state[view].dir==='asc'?'▲':'▼'}</span>` : ''; }

function renderMemList(){
  const s=state.mem;
  const all=memFiltered();
  const total=all.length;
  const start=(s.page-1)*PAGE_SIZE;
  const rows=all.slice(start, start+PAGE_SIZE);

  $('view').innerHTML=`
    <div class="adm-page-hdr">
      <div class="adm-page-title">회원 목록</div>
      <div class="adm-page-sub">가입 회원 전체 · 검색·필터·상세 진입 · 활성(탈퇴하지 않은) 회원만 표시 (v0.5 4-1절)</div>
    </div>

    <div class="filter-bar">
      <span class="filter-label">검색</span>
      <input class="wf-input" id="mem-q" style="width:200px" placeholder="이메일·회원ID 검색" value="${esc(s.q)}">
      <span class="filter-sep"></span>
      <span class="filter-label">가입기간</span>
      <label class="radio-opt"><input type="radio" name="mem-mode" value="all" ${s.mode==='all'?'checked':''} onclick="memMode('all')"> 전체</label>
      <label class="radio-opt"><input type="radio" name="mem-mode" value="range" ${s.mode==='range'?'checked':''} onclick="memMode('range')"> 기간 선택</label>
      <input class="wf-input" id="mem-from" style="width:150px" type="date" value="${s.from}" ${s.mode==='all'?'disabled':''} onchange="memFromInput()">
      <span>~</span>
      <input class="wf-input" id="mem-to" style="width:150px" type="date" value="${s.to}" ${(s.mode==='all'||!s.from)?'disabled':''}>
      <div class="filter-actions">
        <button class="wf-btn wf-btn-primary wf-btn-sm" onclick="memSearch()">검색</button>
        <button class="wf-btn wf-btn-ghost wf-btn-sm" onclick="memReset()">초기화</button>
      </div>
    </div>
    <div class="wf-hint" style="margin:-8px 0 14px">가입기간: <strong>전체</strong>(기본) 또는 <strong>기간 선택</strong> · 시작일만 입력하면 그 날 하루만 조회(종료일=시작일) · 종료일은 시작일 입력 후 활성화 · 형식 YYYY-MM-DD</div>

    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead><tr>
          <th>회원ID</th><th>이메일</th><th>상태</th>
          <th class="sortable" onclick="memSort('joinDate')">가입일${sortInd('mem','joinDate')}</th>
          <th class="sortable" onclick="memSort('res')" style="text-align:center">예약 수${sortInd('mem','res')}</th>
          <th class="sortable" onclick="memSort('points')" style="text-align:right">누적 포인트(P)${sortInd('mem','points')}</th>
          <th>관리</th>
        </tr></thead>
        <tbody>
          ${rows.length? rows.map(m=>{
            const cnt=memberApprovedCount(m.email), pts=memberCumulativePoints(m.email);
            return `<tr class="row-click" onclick="openMember('${m.id}')">
              <td style="font-family:monospace;font-size:11px">${m.id}</td>
              <td>${esc(m.email)}</td>
              <td><span class="wf-badge badge-active">활성</span></td>
              <td>${m.joinDate}</td>
              <td style="text-align:center">${cnt}</td>
              <td style="text-align:right;font-weight:600">${pts>0? fmtP(pts) : MUTED_DASH}</td>
              <td><span class="wf-btn wf-btn-outline wf-btn-sm" onclick="event.stopPropagation();openMember('${m.id}')">상세</span></td>
            </tr>`;
          }).join('') : `<tr><td colspan="7" class="adm-table-empty">조건에 맞는 회원이 없습니다.</td></tr>`}
        </tbody>
      </table>
      <div class="adm-pagination">
        <div class="adm-pagination-info">총 ${total.toLocaleString()}명 · ${total? (start+1)+'–'+Math.min(start+PAGE_SIZE,total):'0'} 표시 중</div>
        ${memPager(total)}
      </div>
    </div>`;
  $('mem-q').addEventListener('keydown', e=>{ if(e.key==='Enter') memSearch(); });
}
function memPager(total){
  const pages=Math.max(1, Math.ceil(total/PAGE_SIZE)), cur=state.mem.page;
  if(pages<=1) return '';
  let btns='<span class="adm-pagination-btn" onclick="memPage('+Math.max(1,cur-1)+')">«</span>';
  for(let i=1;i<=pages;i++) btns+=`<span class="adm-pagination-btn ${i===cur?'active':''}" onclick="memPage(${i})">${i}</span>`;
  btns+='<span class="adm-pagination-btn" onclick="memPage('+Math.min(pages,cur+1)+')">»</span>';
  return '<div class="adm-pagination-btns">'+btns+'</div>';
}
function memMode(m){
  const from=$('mem-from'), to=$('mem-to');
  if(m==='all'){ from.value=''; to.value=''; from.disabled=true; to.disabled=true; }
  else { from.disabled=false; to.disabled=!from.value; }
}
function memFromInput(){ const from=$('mem-from'), to=$('mem-to'); to.disabled=!from.value; if(!from.value){to.value='';} else if(to.value && to.value<from.value){to.value=from.value;} }
function memSearch(){
  const mode=document.querySelector('input[name=mem-mode]:checked').value;
  state.mem.mode=mode;
  if(mode==='all'){ state.mem.from=''; state.mem.to=''; }
  else { const f=$('mem-from').value; state.mem.from=f; state.mem.to = f ? ($('mem-to').value||f) : ''; }
  state.mem.q=$('mem-q').value.trim(); state.mem.page=1; renderMemList();
}
function memReset(){ state.mem={q:'',mode:'all',from:'',to:'',sort:'joinDate',dir:'desc',page:1}; renderMemList(); }
function memSort(k){ const s=state.mem; if(s.sort===k) s.dir=s.dir==='asc'?'desc':'asc'; else {s.sort=k;s.dir='desc';} renderMemList(); }
function memPage(p){ state.mem.page=p; renderMemList(); }
function openMember(id){ state.memberId=id; state.memTab='info'; go('memDetail'); }

/* ════════ 회원 상세·수정 (ADM-MEM02) ════════ */
function renderMemDetail(){
  const m=MEMBERS.find(x=>x.id===state.memberId); if(!m) return go('mem');
  const nm=(m.firstName+' '+m.lastName).trim()||'(이름 미입력)';
  $('view').innerHTML=`
    <div class="adm-page-hdr">
      <div class="adm-page-title">회원 상세 — ${esc(nm)}</div>
      <div class="adm-page-sub">회원ID: ${m.id} · 가입일: ${m.joinDate} · 마지막 로그인: ${m.lastLogin||'—'}</div>
      <div class="adm-page-actions">
        <span class="wf-btn wf-btn-ghost" onclick="go('mem')">← 목록으로</span>
      </div>
    </div>

    <div class="adm-tabs">
      <button class="adm-tab ${state.memTab==='info'?'active':''}" onclick="memTab('info')">회원정보</button>
      <button class="adm-tab ${state.memTab==='points'?'active':''}" onclick="memTab('points')">포인트 내역</button>
    </div>
    <div id="mem-tab-body"></div>`;
  renderMemTab();
}
function memTab(t){ state.memTab=t; renderMemTab();
  document.querySelectorAll('.adm-tab').forEach((b,i)=>b.classList.toggle('active', (i===0)===(t==='info'))); }

function renderMemTab(){
  const m=MEMBERS.find(x=>x.id===state.memberId); const body=$('mem-tab-body');
  if(state.memTab==='info'){
    body.innerHTML=`
      <div class="sec-title">기본 정보</div>
      <div class="adm-form" style="max-width:640px">
        <div class="adm-form-section">
          <div class="adm-form-section-title">계정 식별 정보 (읽기전용)</div>
          <div class="adm-form-row"><div class="adm-form-label">회원 ID</div><div class="adm-form-readonly">${m.id}</div></div>
          <div class="adm-form-row"><div class="adm-form-label">이메일</div>
            <div class="adm-form-readonly" style="display:flex;align-items:center;gap:8px">${esc(m.email)}
              <span class="wf-badge badge-approved" style="font-size:10px">인증완료</span></div></div>
          <div class="adm-form-row"><div class="adm-form-label">가입일</div><div class="adm-form-readonly">${m.joinDate}</div></div>
        </div>
        <div class="adm-form-section">
          <div class="adm-form-section-title">수정 가능 정보</div>
          <div class="adm-form-row"><div class="adm-form-label">이름 (First)</div>
            <div><input class="wf-input" id="f-first" value="${esc(m.firstName)}" placeholder="영문 이름">
            <div class="field-err" id="err-first">영문(알파벳)만 입력할 수 있습니다.</div></div></div>
          <div class="adm-form-row"><div class="adm-form-label">성 (Last)</div>
            <div><input class="wf-input" id="f-last" value="${esc(m.lastName)}" placeholder="영문 성">
            <div class="field-err" id="err-last">영문(알파벳)만 입력할 수 있습니다.</div></div></div>
          <div class="adm-form-row"><div class="adm-form-label">국적</div>
            <div class="adm-form-readonly" style="display:flex;align-items:center;gap:8px" id="f-nat-box">
              <span id="f-nat">${m.nationality.flag} ${m.nationality.name} (${m.nationality.code})</span>
              <button class="wf-btn wf-btn-ghost wf-btn-sm" onclick="openNationality()">변경</button></div></div>
          <div class="adm-form-row"><div class="adm-form-label">전화번호</div>
            <div><div style="display:flex;gap:6px;align-items:center">
              <input class="wf-input" id="f-code" style="width:70px" value="${esc(m.phoneCode)}">
              <input class="wf-input" id="f-phone" value="${esc(m.phone)}" placeholder="번호 입력"></div>
            <div class="field-err" id="err-phone">숫자와 하이픈(-)만 입력할 수 있습니다.</div></div></div>
        </div>
        <div style="text-align:right"><button class="wf-btn wf-btn-primary" onclick="saveMember()">저장</button></div>
      </div>
      <div style="margin-top:14px;background:#f0fdf4;border:1px solid #bbf7d0;border-left:3px solid #16a34a;border-radius:6px;padding:10px 14px;font-size:12px;color:#166534;max-width:640px">
        수정 가능 필드 = 이름·성·국적·전화번호. 이메일·회원ID·가입일은 읽기전용 · 마케팅 수신 동의는 MVP 미노출 (v0.5 4-2절)
      </div>`;
  } else {
    const rows=memberPointRows(m.email);
    const cum=memberCumulativePoints(m.email);
    body.innerHTML=`
      <div class="sec-sub">${esc((m.firstName+' '+m.lastName).trim()||m.email)} 기준 · ADM-CB01과 동일 규칙 · MVP 조회전용 · 미설정(CashbackType null)·0P 건 미표시 (6조)</div>
      <div class="pt-summary">적립완료(Approved) 누적 포인트: <strong>${cum>0?fmtP(cum):'0P'}</strong></div>
      <div class="adm-table-wrap"><table class="adm-table">
        <thead><tr><th>예약 ID</th><th>호텔명</th><th>체크인</th><th>체크아웃</th><th>공급사(OTA)</th><th>포인트 금액</th><th>타입</th><th>상태</th><th>적립일</th></tr></thead>
        <tbody>${rows.length? rows.map(r=>`<tr>
          <td style="font-family:monospace;font-size:11px">${r.resId}</td>
          <td>${esc(r.hotel)}</td><td>${r.checkIn}</td><td>${r.checkOut}</td><td>${esc(r.ota)}</td>
          <td>${pointCell(r)}</td><td>${typeBadge(r.pointType)}</td><td>${statusBadge(r.status)}</td><td>${r.payMonth?r.payMonth+'-01':'—'}</td>
        </tr>`).join('') : `<tr><td colspan="9" class="adm-table-empty">표시할 포인트 내역이 없습니다.</td></tr>`}</tbody>
      </table>
      <div class="adm-pagination"><div class="adm-pagination-info">총 ${rows.length}건 · 전체 표시</div></div>
      </div>
      <div style="margin-top:14px;background:#fef3c7;border:1px solid #fde68a;border-left:3px solid #f59e0b;border-radius:6px;padding:10px 14px;font-size:12px;color:#92400e">
        <strong>Phase 2 예정:</strong> 포인트 수동 지급·삭제·회수 기능. MVP에서는 조회만 가능.
      </div>`;
  }
}
function validName(v){ return v==='' || /^[A-Za-z\s'-]+$/.test(v); }
function validPhone(v){ return v==='' || /^[0-9-]+$/.test(v); }
function saveMember(){
  const m=MEMBERS.find(x=>x.id===state.memberId);
  const first=$('f-first').value.trim(), last=$('f-last').value.trim(), phone=$('f-phone').value.trim(), code=$('f-code').value.trim();
  let ok=true;
  toggleErr('f-first','err-first', validName(first)); if(!validName(first)) ok=false;
  toggleErr('f-last','err-last', validName(last)); if(!validName(last)) ok=false;
  toggleErr('f-phone','err-phone', validPhone(phone)); if(!validPhone(phone)) ok=false;
  if(!ok){ toast('입력값을 확인해 주세요','err'); return; }
  m.firstName=first; m.lastName=last; m.phone=phone; m.phoneCode=code||m.phoneCode;
  toast('저장되었습니다','ok');
  $('nav-route').textContent='— 회원 상세·수정';
  // 상단 제목 갱신
  renderMemDetail();
}
function toggleErr(inputId,errId,valid){ $(inputId).classList.toggle('err',!valid); $(errId).classList.toggle('show',!valid); }

// 국적 변경 모달
const NATIONS=[
  {code:'KR',flag:'🇰🇷',name:'대한민국'},{code:'JP',flag:'🇯🇵',name:'일본'},{code:'US',flag:'🇺🇸',name:'미국'},
  {code:'TW',flag:'🇹🇼',name:'대만'},{code:'VN',flag:'🇻🇳',name:'베트남'},{code:'MX',flag:'🇲🇽',name:'멕시코'},
  {code:'ID',flag:'🇮🇩',name:'인도네시아'},{code:'SG',flag:'🇸🇬',name:'싱가포르'},{code:'TH',flag:'🇹🇭',name:'태국'},
  {code:'HK',flag:'🇭🇰',name:'홍콩'},{code:'CN',flag:'🇨🇳',name:'중국'},{code:'GB',flag:'🇬🇧',name:'영국'},
];
function openNationality(){
  const m=MEMBERS.find(x=>x.id===state.memberId);
  openModal(`<div class="modal-box">
    <div class="modal-hdr">국적 선택<span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">${NATIONS.map(n=>`<div class="nat-item ${n.code===m.nationality.code?'sel':''}" onclick="pickNation('${n.code}')">${n.flag} ${n.name} (${n.code})</div>`).join('')}</div>
  </div>`);
}
function pickNation(code){
  const m=MEMBERS.find(x=>x.id===state.memberId);
  m.nationality=NATIONS.find(n=>n.code===code);
  $('f-nat').textContent=`${m.nationality.flag} ${m.nationality.name} (${m.nationality.code})`;
  closeModal(); toast('국적이 변경되었습니다. [저장]을 눌러 확정하세요');
}

/* ════════ 포인트 내역 (ADM-CB01) ════════ */
function cb01Filtered(){
  const s=state.cb01;
  // NONE·0P 미표시 (6-2절)
  let rows=RESERVATIONS.filter(r=> !(r.pointType==='NONE' || floorP(r.pointAmount)===0));
  rows=rows.filter(r=>{
    if(s.q){ const q=s.q.toLowerCase(); if(!((r.memberEmail||'').toLowerCase().includes(q)||r.resId.toLowerCase().includes(q))) return false; }
    if(s.status!=='all' && r.status!==s.status) return false;
    if(s.mode==='range' && s.fromMonth){ const t=s.toMonth||s.fromMonth; if(!(r.payMonth && r.payMonth>=s.fromMonth && r.payMonth<=t)) return false; }
    return true;
  });
  if(s.sort==='point'){ const d=s.dir==='asc'?1:-1; rows.sort((a,b)=>(floorP(a.pointAmount)-floorP(b.pointAmount))*d); }
  else if(s.sort==='payMonth'){ const d=s.dir==='asc'?1:-1; rows.sort((a,b)=>String(a.payMonth||'').localeCompare(String(b.payMonth||''))*d); }
  else rows.sort((a,b)=>b.resId.localeCompare(a.resId));
  return rows;
}
function renderCB01(){
  const s=state.cb01; const rows=cb01Filtered();
  $('view').innerHTML=`
    <div class="adm-page-hdr">
      <div class="adm-page-title">포인트 내역</div>
      <div class="adm-page-sub">회원별 포인트 적립 현황 · KAYAK Reporting API 기반 · MVP 조회전용 · 비회원 건 포함 · 미설정(CashbackType null)·0P 미표시 (v0.5 6조)</div>
    </div>

    <div class="filter-bar">
      <span class="filter-label">검색</span>
      <input class="wf-input" id="cb-q" style="width:170px" placeholder="이메일·예약ID 검색" value="${esc(s.q)}">
      <span class="filter-sep"></span>
      <span class="filter-label">상태</span>
      <select class="wf-select" id="cb-status">
        <option value="all" ${s.status==='all'?'selected':''}>전체</option>
        <option value="Active" ${s.status==='Active'?'selected':''}>적립예정 (Active)</option>
        <option value="Approved" ${s.status==='Approved'?'selected':''}>적립완료 (자사 확정)</option>
        <option value="Cancelled" ${s.status==='Cancelled'?'selected':''}>취소·만료 (Cancelled)</option>
      </select>
      <span class="filter-sep"></span>
      <span class="filter-label">적립월</span>
      <label class="radio-opt"><input type="radio" name="cb-mode" value="all" ${s.mode==='all'?'checked':''} onclick="cb01Mode('all')"> 전체</label>
      <label class="radio-opt"><input type="radio" name="cb-mode" value="range" ${s.mode==='range'?'checked':''} onclick="cb01Mode('range')"> 기간 선택</label>
      <input class="wf-input" id="cb-from" style="width:130px" type="month" value="${s.fromMonth}" ${s.mode==='all'?'disabled':''} onchange="cb01FromInput()">
      <span>~</span>
      <input class="wf-input" id="cb-to" style="width:130px" type="month" value="${s.toMonth}" ${(s.mode==='all'||!s.fromMonth)?'disabled':''}>
      <div class="filter-actions">
        <button class="wf-btn wf-btn-primary wf-btn-sm" onclick="cb01Search()">검색</button>
        <button class="wf-btn wf-btn-ghost wf-btn-sm" onclick="cb01Reset()">초기화</button>
      </div>
    </div>
    <div class="wf-hint" style="margin:-8px 0 14px">적립월: <strong>전체</strong>(기본) 또는 <strong>기간 선택</strong> · 시작월만 입력하면 그 달만 조회(종료월=시작월) · 종료월은 시작월 입력 후 활성화 · 형식 YYYY-MM</div>

    <div class="adm-table-wrap"><table class="adm-table">
      <thead><tr>
        <th>회원</th><th>호텔명</th><th>체크인</th><th>체크아웃</th><th>공급사(OTA)</th>
        <th class="sortable" onclick="cb01Sort('point')">포인트 금액${sortInd('cb01','point')}</th>
        <th>포인트 타입</th><th>상태</th>
        <th class="sortable" onclick="cb01Sort('payMonth')">적립일${sortInd('cb01','payMonth')}</th>
      </tr></thead>
      <tbody>${rows.length? rows.map(r=>`<tr>
        <td style="font-size:12px">${r.memberEmail? esc(r.memberEmail):GUEST_LABEL}</td>
        <td>${esc(r.hotel)}</td><td>${r.checkIn}</td><td>${r.checkOut}</td><td>${esc(r.ota)}</td>
        <td>${pointCell(r)}</td><td>${typeBadge(r.pointType)}</td><td>${statusBadge(r.status)}</td>
        <td>${r.payMonth? r.payMonth+'-01':'—'}</td>
      </tr>`).join('') : `<tr><td colspan="9" class="adm-table-empty">조건에 맞는 포인트 내역이 없습니다.</td></tr>`}</tbody>
    </table>
      <div class="adm-pagination"><div class="adm-pagination-info">총 ${rows.length}건 · 전체 표시</div></div>
    </div>
    <div style="margin-top:14px;background:#fef3c7;border:1px solid #fde68a;border-left:3px solid #f59e0b;border-radius:6px;padding:10px 14px;font-size:12px;color:#92400e">
      <strong>Phase 2 예정:</strong> 포인트 수동 지급·삭제·회수 기능. MVP에서는 조회만 가능. · <strong>비회원(labels 없는 건)도 포함</strong> 표시(KAYAK 정산 대사 목적) · 적립완료(Approved) 전환은 <strong>체크아웃+7일 자사 배치</strong> 기준 — KAYAK paymentMonth 단독 아님 (포인트_정책서 v0.1 2-1절)
    </div>`;
  $('cb-q').addEventListener('keydown', e=>{ if(e.key==='Enter') cb01Search(); });
}
function cb01Mode(m){
  const from=$('cb-from'), to=$('cb-to');
  if(m==='all'){ from.value=''; to.value=''; from.disabled=true; to.disabled=true; }
  else { from.disabled=false; to.disabled=!from.value; }
}
function cb01FromInput(){ const from=$('cb-from'), to=$('cb-to'); to.disabled=!from.value; if(!from.value){to.value='';} else if(to.value && to.value<from.value){to.value=from.value;} }
function cb01Search(){
  const mode=document.querySelector('input[name=cb-mode]:checked').value;
  state.cb01.mode=mode;
  if(mode==='all'){ state.cb01.fromMonth=''; state.cb01.toMonth=''; }
  else { const f=$('cb-from').value; state.cb01.fromMonth=f; state.cb01.toMonth = f ? ($('cb-to').value||f) : ''; }
  state.cb01.q=$('cb-q').value.trim(); state.cb01.status=$('cb-status').value; renderCB01();
}
function cb01Reset(){ state.cb01={q:'',status:'all',mode:'all',fromMonth:'',toMonth:'',sort:'default',dir:'desc'}; renderCB01(); }
function cb01Sort(k){ const s=state.cb01; if(s.sort===k) s.dir=s.dir==='asc'?'desc':'asc'; else{s.sort=k;s.dir='desc';} renderCB01(); }

/* ════════ 공급사별 현황 (ADM-CB02) ════════ */
function renderCB02(){
  const s=state.cb02;
  const inMonth = r => {
    if(s.mode!=='range' || !s.fromMonth) return true;
    const t=s.toMonth||s.fromMonth, rm=resMonth(r);
    return rm>=s.fromMonth && rm<=t;
  };
  const providers=Object.keys(PROVIDERS).map(name=>{
    const rs=RESERVATIONS.filter(r=>r.ota===name && inMonth(r));
    const active=rs.filter(r=>r.status==='Active').length;
    const approved=rs.filter(r=>r.status==='Approved');
    const cancelled=rs.filter(r=>r.status==='Cancelled').length;
    const sum=approved.filter(r=>r.pointType!=='NONE').reduce((s,r)=>s+floorP(r.pointAmount),0);
    return {name, meta:PROVIDERS[name], count:rs.length, active, approved:approved.length, cancelled, sum};
  }).filter(p=>p.count>0);

  $('view').innerHTML=`
    <div class="adm-page-hdr">
      <div class="adm-page-title">공급사별 포인트 현황</div>
      <div class="adm-page-sub">OTA 공급사별 포인트 발생·집계 현황 · 포인트 합계 = 적립완료(Approved) 누적합계 (v0.5 6-2·6-4절)</div>
    </div>

    <div class="filter-bar" style="margin-bottom:8px">
      <span class="filter-label">기준 월</span>
      <label class="radio-opt"><input type="radio" name="cb2-mode" value="all" ${s.mode==='all'?'checked':''} onclick="cb02Mode('all')"> 전체</label>
      <label class="radio-opt"><input type="radio" name="cb2-mode" value="range" ${s.mode==='range'?'checked':''} onclick="cb02Mode('range')"> 기간 선택</label>
      <input class="wf-input" id="cb2-from" style="width:130px" type="month" value="${s.fromMonth}" ${s.mode==='all'?'disabled':''} onchange="cb02FromInput()">
      <span>~</span>
      <input class="wf-input" id="cb2-to" style="width:130px" type="month" value="${s.toMonth}" ${(s.mode==='all'||!s.fromMonth)?'disabled':''}>
      <div class="filter-actions">
        <button class="wf-btn wf-btn-primary wf-btn-sm" onclick="cb02Search()">조회</button>
      </div>
    </div>
    <div class="wf-hint" style="margin:0 0 16px">기준 월: <strong>전체</strong>(기본) 또는 <strong>기간 선택</strong> · 시작월만 입력하면 그 달만 조회(종료월=시작월) · 종료월은 시작월 입력 후 활성화 · 형식 YYYY-MM</div>

    <div class="sec-title">공급사별 상세</div>
    <div class="adm-table-wrap"><table class="adm-table">
      <thead><tr><th>공급사 (OTA)</th><th style="text-align:center">예약 건수</th><th style="text-align:center">적립예정</th><th style="text-align:center">적립완료</th><th style="text-align:center">Cancelled</th><th style="text-align:right">포인트 합계</th><th>포인트율/금액</th><th>타입</th></tr></thead>
      <tbody>${providers.length? providers.map(p=>{
        const rateCell = p.meta.type==='PERCENTAGE' ? p.meta.rate+'%'
          : p.meta.type==='FLAT' ? fmtP(p.meta.flat)
          : '<span style="color:#9ca3af">—</span>';
        return `<tr>
          <td><div style="display:flex;align-items:center;gap:8px">
            <div style="width:24px;height:16px;background:${p.meta.color};border-radius:2px;display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;font-weight:700">${p.meta.short}</div>
            <strong>${esc(p.name)}</strong></div></td>
          <td style="text-align:center">${p.count}</td>
          <td style="text-align:center">${p.active? '<span class="wf-badge badge-waiting">'+p.active+'</span>':'0'}</td>
          <td style="text-align:center">${p.approved? '<span class="wf-badge badge-approved">'+p.approved+'</span>':'0'}</td>
          <td style="text-align:center">${p.cancelled? '<span class="wf-badge badge-cancelled">'+p.cancelled+'</span>':'0'}</td>
          <td style="text-align:right;font-weight:600;color:#f59e0b">${p.sum>0? fmtP(p.sum) : MUTED_DASH}</td>
          <td>${rateCell}</td>
          <td>${typeBadge(p.meta.type)}</td>
        </tr>`;
      }).join('') : `<tr><td colspan="8" class="adm-table-empty">해당 월에 집계된 데이터가 없습니다.</td></tr>`}</tbody>
    </table></div>
    <div style="margin-top:14px;background:#f0fdf4;border:1px solid #bbf7d0;border-left:3px solid #16a34a;border-radius:6px;padding:10px 14px;font-size:12px;color:#166534">
      포인트 합계 = Approved 누적합계(1P=1원, 소수점 버림). 포인트율·타입은 KAYAK 기준 그대로 표시하며 자사 재계산 없음. 포인트율 조정은 KAYAK 담당자 양식 제출 방식 (6-4절)
    </div>`;
}
function cb02Mode(m){
  const from=$('cb2-from'), to=$('cb2-to');
  if(m==='all'){ from.value=''; to.value=''; from.disabled=true; to.disabled=true; }
  else { from.disabled=false; to.disabled=!from.value; }
}
function cb02FromInput(){ const from=$('cb2-from'), to=$('cb2-to'); to.disabled=!from.value; if(!from.value){to.value='';} else if(to.value && to.value<from.value){to.value=from.value;} }
function cb02Search(){
  const mode=document.querySelector('input[name=cb2-mode]:checked').value;
  state.cb02.mode=mode;
  if(mode==='all'){ state.cb02.fromMonth=''; state.cb02.toMonth=''; }
  else { const f=$('cb2-from').value; state.cb02.fromMonth=f; state.cb02.toMonth = f ? ($('cb2-to').value||f) : ''; }
  renderCB02();
}
function cb02Reset(){ state.cb02={mode:'all',fromMonth:'',toMonth:''}; renderCB02(); }

/* ════════ 관리자 설정 목록 (ADM-SET01) ════════ */
function renderSet(){
  const list=state.adminList;
  $('view').innerHTML=`
    <div class="adm-page-hdr">
      <div class="adm-page-title">관리자 계정 목록</div>
      <div class="adm-page-sub">어드민 접근 계정 관리 · MVP = 마스터 단일 계정</div>
      <div class="adm-page-actions">
        <button class="wf-btn wf-btn-primary wf-btn-sm" onclick="go('setNew')">+ 관리자 추가</button>
      </div>
    </div>
    <div class="adm-table-wrap"><table class="adm-table">
      <thead><tr><th>계정 ID</th><th>이름</th><th>이메일</th><th>권한</th><th>마지막 로그인</th><th>상태</th><th>관리</th></tr></thead>
      <tbody>${list.map(a=>`<tr class="row-click" onclick="openAdmin('${a.accountId}')">
        <td style="font-family:monospace;font-size:11px">${a.accountId}</td>
        <td>${a.name? esc(a.name):MUTED_DASH2}</td>
        <td>${esc(a.email)}</td>
        <td><span class="wf-badge badge-active">마스터</span></td>
        <td>${a.lastLogin||'—'}</td>
        <td>${a.status==='active'? '<span class="wf-badge badge-approved">활성</span>':'<span class="wf-badge badge-cancelled">비활성</span>'}</td>
        <td><span class="wf-btn wf-btn-outline wf-btn-sm" onclick="event.stopPropagation();openAdmin('${a.accountId}')">상세</span></td>
      </tr>`).join('')}</tbody>
    </table>
      <div class="adm-pagination"><div class="adm-pagination-info">총 ${list.length}개 계정</div></div>
    </div>
    <div style="margin-top:16px;background:#eff6ff;border:1px solid #bfdbfe;border-left:3px solid #3b82f6;border-radius:6px;padding:12px 16px;font-size:12px;color:#1d4ed8">
      <strong>Phase 2 예정:</strong> 서브 관리자 계정 추가 및 기능별 권한 설정. 권한 체계는 운영팀·개발팀 협의 후 별도 정의 예정.
    </div>`;
}
function openAdmin(id){ state.setSelId=id; go('setDetail'); }

/* ════════ 관리자 계정 상세·수정 (ADM-SET02) ════════ */
function renderSetDetail(){
  const a=state.adminList.find(x=>x.accountId===state.setSelId) || state.adminList[0];
  const isMaster = a.accountId===ADMIN_ACCOUNT.accountId;
  $('view').innerHTML=`
    <div class="adm-page-hdr">
      <div class="adm-page-title">계정 상세 — ${esc(a.name||a.loginId)}</div>
      <div class="adm-page-sub">계정 상태 조회 및 비밀번호 변경</div>
      <div class="adm-page-actions"><span class="wf-btn wf-btn-ghost" onclick="go('set')">← 목록으로</span></div>
    </div>

    <div style="max-width:660px">
      <div class="sec-title">계정 정보</div>
      <div class="adm-form" style="margin-bottom:24px">
        <div class="adm-form-row"><div class="adm-form-label">마지막 로그인</div><div class="adm-form-readonly">${a.lastLogin}</div></div>
        <hr class="divider" style="margin:12px 0">
        <div class="adm-form-row"><div class="adm-form-label">아이디</div>
          <div class="adm-form-readonly" style="display:flex;align-items:center;gap:8px">${a.loginId}
            <span class="wf-badge badge-active">마스터</span></div></div>
        <div class="adm-form-row"><div class="adm-form-label">이메일</div><div class="adm-form-readonly">${esc(a.email)}</div></div>
        <div class="adm-form-row"><div class="adm-form-label">계정 생성일</div><div class="adm-form-readonly">${a.createdAt}</div></div>
        <div class="adm-form-row"><div class="adm-form-label">권한</div>
          <div><select class="wf-select" id="set-role" style="width:220px">
            <option value="master" selected>마스터</option>
            <option value="sub" disabled>서브 (Phase 2 — 사용 불가)</option>
          </select><div class="wf-hint">서브 권한은 Phase 2에서 활성화 예정</div></div></div>
        <div class="adm-form-row"><div class="adm-form-label">상태</div>
          <div><select class="wf-select" id="set-status" style="width:180px">
            <option value="active" ${a.status==='active'?'selected':''}>활성</option>
            <option value="inactive" ${a.status==='inactive'?'selected':''}>비활성</option>
          </select><div class="wf-hint">비활성 선택 시 해당 계정 로그인이 즉시 차단됩니다</div></div></div>
        <div style="text-align:right;margin-top:8px"><button class="wf-btn wf-btn-primary" onclick="saveSetStatus()">저장</button></div>
      </div>

      <div class="sec-title">비밀번호 변경</div>
      <div style="margin-bottom:24px">
        <p style="font-size:13px;color:#374151;margin-bottom:12px">비밀번호를 변경하려면 아래 버튼을 클릭하세요.</p>
        <button class="wf-btn wf-btn-outline" onclick="openPwModal()">비밀번호 변경</button>
      </div>

      <div class="sec-title" style="color:#9ca3af;border-bottom-color:#e5e7eb">서브계정 관리 <span class="wf-badge" style="background:#fef3c7;color:#92400e">Phase 2</span></div>
      <div class="adm-form" style="opacity:.5;pointer-events:none">
        <div style="text-align:center;padding:32px;color:#9ca3af">
          <div style="font-size:24px;margin-bottom:10px">🔒</div>
          <div style="font-size:13px;font-weight:600;color:#6b7280">Phase 2 기능</div>
          <div style="font-size:12px;margin-top:4px">서브계정 생성·권한 분리는 Phase 2에서 설계 예정. 현재 마스터 단일 계정만 운영.</div>
        </div>
      </div>
    </div>`;
}
function saveSetStatus(){
  const a=state.adminList.find(x=>x.accountId===state.setSelId)||state.adminList[0];
  a.status=$('set-status').value;
  toast(a.status==='inactive'? '비활성으로 저장되었습니다 (로그인 차단)':'저장되었습니다','ok');
}
// 비밀번호 변경 팝업 (SET02 케이스 A — CN6·CN7)
function openPwModal(){
  openModal(`<div class="modal-box" style="max-width:440px">
    <div class="modal-hdr">비밀번호 변경<span class="modal-close" onclick="closeModal()">✕</span></div>
    <div style="padding:20px">
      <div style="margin-bottom:12px">
        <div class="adm-form-label required" style="margin-bottom:5px">현재 비밀번호</div>
        <input class="wf-input" type="password" id="pw-cur" placeholder="현재 비밀번호 입력">
        <div class="field-err" id="err-cur">현재 비밀번호가 올바르지 않습니다.</div>
      </div>
      <div style="margin-bottom:12px">
        <div class="adm-form-label required" style="margin-bottom:5px">새 비밀번호</div>
        <input class="wf-input" type="password" id="pw-new" placeholder="새 비밀번호 입력">
        <div class="wf-hint">영문+숫자+특수문자 조합, 8자 이상</div>
        <div class="field-err" id="err-new">영문·숫자·특수문자를 모두 포함해야 합니다 (8자 이상)</div>
      </div>
      <div style="margin-bottom:12px">
        <div class="adm-form-label required" style="margin-bottom:5px">새 비밀번호 확인</div>
        <input class="wf-input" type="password" id="pw-conf" placeholder="새 비밀번호 다시 입력">
        <div class="field-err" id="err-conf">비밀번호가 일치하지 않습니다.</div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
        <button class="wf-btn wf-btn-ghost" onclick="closeModal()">취소</button>
        <button class="wf-btn wf-btn-primary" onclick="changePw()">변경</button>
      </div>
    </div>
  </div>`);
}
function changePw(){
  const a=state.adminList.find(x=>x.accountId===state.setSelId)||state.adminList[0];
  const cur=$('pw-cur').value, nw=$('pw-new').value, cf=$('pw-conf').value;
  const rule=/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  let ok=true;
  const curOk = cur===a.password;
  toggleErr('pw-cur','err-cur',curOk); if(!curOk) ok=false;
  const ruleOk=rule.test(nw), diffOk=nw!==cur;
  if(!ruleOk) $('err-new').textContent='영문·숫자·특수문자를 모두 포함해야 합니다 (8자 이상)';
  else if(!diffOk) $('err-new').textContent='현재 비밀번호와 다른 비밀번호를 입력해 주세요';
  toggleErr('pw-new','err-new', ruleOk&&diffOk); if(!(ruleOk&&diffOk)) ok=false;
  const confOk = nw!=='' && nw===cf;
  toggleErr('pw-conf','err-conf',confOk); if(!confOk) ok=false;
  if(!ok) return;
  a.password=nw;
  if(a.accountId===ADMIN_ACCOUNT.accountId) ADMIN_ACCOUNT.password=nw;  // 로그인 계정 동기화
  closeModal();
  toast('비밀번호가 변경되었습니다','ok');
}

/* ════════ 관리자 계정 등록 (ADM-SET02 케이스 B) ════════ */
function renderSetNew(){
  $('view').innerHTML=`
    <div class="adm-page-hdr">
      <div class="adm-page-title">관리자 계정 등록</div>
      <div class="adm-page-sub">신규 관리자(마스터 권한) 등록 · 케이스 B</div>
      <div class="adm-page-actions"><span class="wf-btn wf-btn-ghost" onclick="go('set')">← 목록으로</span></div>
    </div>

    <div style="max-width:640px">
      <div class="sec-title">신규 관리자 정보</div>
      <div class="adm-form" style="margin-bottom:20px">
        <div class="adm-form-row" style="margin-bottom:14px"><div class="adm-form-label required">아이디</div>
          <div><input class="wf-input" id="na-id" placeholder="영문·숫자 4자 이상">
          <div class="wf-hint">영문·숫자 조합 4자 이상</div>
          <div class="field-err" id="err-na-id">아이디는 영문·숫자 4자 이상이어야 합니다.</div></div></div>
        <div class="adm-form-row" style="margin-bottom:14px"><div class="adm-form-label required">이메일</div>
          <div><input class="wf-input" id="na-email" placeholder="admin@example.com">
          <div class="field-err" id="err-na-email">올바른 이메일 형식이 아닙니다.</div></div></div>
        <div class="adm-form-row" style="margin-bottom:14px"><div class="adm-form-label">이름</div>
          <div><input class="wf-input" id="na-name" placeholder="선택 입력"></div></div>
        <div class="adm-form-row" style="margin-bottom:14px"><div class="adm-form-label required">초기 비밀번호</div>
          <div><input class="wf-input" type="password" id="na-pw" placeholder="영문+숫자+특수문자 8자 이상">
          <div class="wf-hint">영문+숫자+특수문자 조합, 8자 이상</div>
          <div class="field-err" id="err-na-pw">비밀번호 규칙(영문+숫자+특수문자, 8자 이상)에 맞지 않습니다.</div></div></div>
        <div class="adm-form-row" style="margin-bottom:14px"><div class="adm-form-label required">비밀번호 확인</div>
          <div><input class="wf-input" type="password" id="na-pw2" placeholder="비밀번호 다시 입력">
          <div class="field-err" id="err-na-pw2">비밀번호가 일치하지 않습니다.</div></div></div>
        <div class="adm-form-row"><div class="adm-form-label">권한</div>
          <div><select class="wf-select" style="width:220px" disabled>
            <option>마스터 (고정)</option>
          </select><div class="wf-hint">MVP 권한은 마스터 고정 · 서브 권한은 Phase 2</div></div></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="wf-btn wf-btn-ghost" onclick="go('set')">취소</button>
        <button class="wf-btn wf-btn-primary" onclick="registerAdmin()">등록</button>
      </div>
    </div>`;
}
function registerAdmin(){
  const id=$('na-id').value.trim(), email=$('na-email').value.trim(), name=$('na-name').value.trim();
  const pw=$('na-pw').value, pw2=$('na-pw2').value;
  const idOk=/^[A-Za-z0-9]{4,}$/.test(id);
  const emailOk=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwRule=/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  const pwOk=pwRule.test(pw);
  const pw2Ok=pw!=='' && pw===pw2;
  let ok=true;
  toggleErr('na-id','err-na-id',idOk); if(!idOk) ok=false;
  toggleErr('na-email','err-na-email',emailOk); if(!emailOk) ok=false;
  toggleErr('na-pw','err-na-pw',pwOk); if(!pwOk) ok=false;
  toggleErr('na-pw2','err-na-pw2',pw2Ok); if(!pw2Ok) ok=false;
  // 아이디 중복 체크
  if(idOk && state.adminList.some(a=>a.loginId===id)){ toggleErr('na-id','err-na-id',false); $('err-na-id').textContent='이미 사용 중인 아이디입니다.'; ok=false; }
  if(!ok){ toast('입력값을 확인해 주세요','err'); return; }
  const num=state.adminList.length+1;
  state.adminList.push({
    accountId:'ADM-'+String(num).padStart(3,'0'), loginId:id, name, email,
    role:'master', status:'active', password:pw, lastLogin:'—', createdAt:'2026-08-05',
  });
  toast('관리자 계정이 등록되었습니다.','ok');
  go('set');
}

/* ════════ 이벤트 바인딩 ════════ */
// 관리자 계정 목록 초기화 (마스터 계정 1개로 시작)
state.adminList=[{
  accountId:ADMIN_ACCOUNT.accountId, loginId:ADMIN_ACCOUNT.loginId, name:ADMIN_ACCOUNT.name,
  email:ADMIN_ACCOUNT.email, role:'master', status:'active', password:ADMIN_ACCOUNT.password,
  lastLogin:ADMIN_ACCOUNT.lastLogin, createdAt:ADMIN_ACCOUNT.createdAt,
}];
state.setSelId=ADMIN_ACCOUNT.accountId;

$('login-btn').addEventListener('click', doLogin);
$('login-pw').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
$('login-id').addEventListener('keydown', e=>{ if(e.key==='Enter') $('login-pw').focus(); });
$('nav-logout').addEventListener('click', doLogout);
$('side-logout').addEventListener('click', doLogout);
document.querySelectorAll('.adm-nav-item').forEach(el=> el.addEventListener('click', ()=>go(el.dataset.route)));
