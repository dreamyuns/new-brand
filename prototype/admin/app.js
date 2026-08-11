/* ══════════════════════════════════════════════════════════════
   어드민 프로토타입 — 앱 로직 (v0.8)
   기준: 어드민 화면기획서 v0.8 · Phase1 v0.45 · 포인트_정책서 v0.1
   화면: 대시보드 / 회원 목록·상세 / 예약내역 목록(BOOK01)·상세(BOOK02)
        / 공급사별 현황(CB02) / 관리자 설정(SET01·02)
════════════════════════════════════════════════════════════════ */

/* ── 공용 상태 ── */
const state = {
  route:'dashboard',
  memberId:null, memTab:'info',
  bookSelId:null,          // 예약 상세 대상
  setSelId:null, adminList:[],
  mem:  { q:'', mode:'all', from:'', to:'', sort:'joinDate', dir:'desc', page:1 },   // mode: all|week|month|custom
  book: { dateType:'booking', mode:'week', from:'', to:'', memberType:'all', status:'all', ota:'all', q:'' }, // mode: week|month|custom
  cb02: { mode:'week', from:'', to:'' },   // 적립완료일 기준 · week|month|custom
  dash: { mode:'week' },                   // 대시보드 조회기간 · week|month
};
const PAGE_SIZE = 50;

/* ── 유틸 ── */
const floorP = v => Math.floor(Number(v)||0);
const fmtP   = v => floorP(v).toLocaleString('ko-KR')+'P';
const fmtKRW = v => '₩'+(Number(v)||0).toLocaleString('ko-KR',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtUSD = v => '$'+(Number(v)||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const DASH = '<span style="color:#9ca3af">—</span>';
const DASH_R = '<span style="color:#9ca3af;font-weight:400">—</span>';
const GUEST = '<span style="color:#6b7280">비회원</span>';

function addDays(ds,n){ const d=new Date(ds+'T00:00:00'); d.setDate(d.getDate()+n);
  const p=x=>String(x).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); }
function nights(ci,co){ return Math.round((new Date(co)-new Date(ci))/86400000); }
function mmdd(ds){ return ds.slice(5).replace('-','.'); }

// 포인트 상태(자사 정의): 취소 / 적립완료(체크아웃+7일<=오늘) / 적립예정
function completeDate(r){ return addDays(r.checkOut,7); }
function statusOf(r){ if(r.cancelled) return 'Cancelled'; return completeDate(r) <= TODAY ? 'Approved' : 'Active'; }

const STATUS_BADGE = { Active:['badge-waiting','적립예정'], Approved:['badge-approved','적립완료'], Cancelled:['badge-cancelled','취소'] };
function statusBadge(s){ const [c,t]=STATUS_BADGE[s]||['badge-inactive',s]; return `<span class="wf-badge ${c}">${t}</span>`; }
// 타입 배지 — dim=true 면 흐리게(취소 건: CashbackType은 살아있으므로 실제 타입 흐림 표시)
function typeBadge(t, dim){ const label = (t==='NONE'||!t)?'미설정':t; const c = t==='PERCENTAGE'?'badge-active':'badge-inactive';
  const op = dim?';opacity:0.45':''; return `<span class="wf-badge ${c}" style="font-size:9px${op}">${label}</span>`; }
// 포인트 셀 — NONE(포인트 미제공 공급사)은 취소 여부와 무관하게 "—" / 취소+타입있음은 0P(방안A) / 그 외 값
function pointCell(r){
  if(r.cashbackType==='NONE' || !r.cashbackType) return DASH;
  if(r.cancelled) return '<span style="color:#9ca3af;font-weight:600">0P</span>';
  if(floorP(r.pointKRW)===0) return DASH;
  return `<span style="color:#f59e0b;font-weight:600">${fmtP(r.pointKRW)}</span>`;
}
// 타입 셀(목록) — NONE은 "—", 그 외는 타입 배지(취소면 흐림)
function typeCell(r){ if(r.cashbackType==='NONE' || !r.cashbackType) return DASH; return typeBadge(r.cashbackType, r.cancelled); }

/* ── 공용 날짜 필터(퀵 버튼 + 직접 입력) ── */
// 최근 1주일 = 오늘 포함 7일 / 최근 1달 = 오늘 포함 30일
function rangeOf(mode){ if(mode==='week') return [addDays(TODAY,-6),TODAY]; if(mode==='month') return [addDays(TODAY,-29),TODAY]; return ['','']; }
function daysBetween(a,b){ return Math.round((new Date(b)-new Date(a))/86400000)+1; }  // 양끝 포함
function rangeValid(from,to){ if(!from||!to) return false; if(to<from) return false; return daysBetween(from,to)<=365; }
// 퀵 버튼 그룹 HTML (prefix로 id 구분, extra=[전체] 버튼 포함 여부)
function quickBtns(prefix, mode, withAll){
  const b=(m,label)=>`<button class="wf-btn wf-btn-sm ${mode===m?'wf-btn-primary':'wf-btn-ghost'}" onclick="${prefix}Quick('${m}')">${label}</button>`;
  return (withAll?b('all','전체'):'')+b('week','최근 1주일')+b('month','최근 1달')
    +`<button class="wf-btn wf-btn-sm ${mode==='custom'?'wf-btn-primary':'wf-btn-ghost'}" onclick="${prefix}Custom()">직접 입력</button>`;
}
// 날짜 입력 필드 HTML (custom이면 흰 배경 활성, 아니면 회색 readonly)
function dateFields(prefix, mode, from, to){
  const custom = mode==='custom';
  const st = custom ? '' : 'background:#f3f4f6;color:#6b7280;cursor:not-allowed';
  const ro = custom ? '' : 'readonly';
  const dis = (mode==='all') ? 'disabled' : '';
  return `<input class="wf-input" id="${prefix}-start" type="date" style="width:150px;${st}" value="${from||''}" ${ro} ${dis}>
    <span>~</span>
    <input class="wf-input" id="${prefix}-end" type="date" style="width:150px;${st}" value="${to||''}" ${ro} ${dis}>`;
}
// 공급사별 집계(적립완료일 기준·적립완료 건만) — cb02/dashboard 공용
function providerAgg(from,to){
  const map={};
  RESERVATIONS.forEach(r=>{
    if(statusOf(r)!=='Approved') return;                 // 적립완료(Approved)만
    if(from){ const cd=completeDate(r); if(cd<from||cd>to) return; }  // 적립완료일 기준
    const m=map[r.ota]||(map[r.ota]={ota:r.ota,cnt:0,sum:0,meta:PROVIDERS[r.ota]||{type:r.cashbackType}});
    m.cnt++; if(r.cashbackType!=='NONE') m.sum+=floorP(r.pointKRW);
  });
  return Object.values(map).sort((a,b)=>b.cnt-a.cnt);
}
function provRateCell(meta){ if(!meta) return DASH_R; if(meta.type==='PERCENTAGE') return meta.rate+'%'; if(meta.type==='FLAT') return '₩'+(meta.flat||0).toLocaleString(); return DASH_R; }
function provTypeBadge(type){ const map={PERCENTAGE:['#eff6ff','#1d4ed8'],FLAT:['#f0fdf4','#15803d'],NONE:['#f3f4f6','#6b7280']};
  const [bg,c]=map[type]||map.NONE; return `<span class="wf-badge" style="font-size:9px;background:${bg};color:${c}">${type||'NONE'}</span>`; }
// 공급사별 5컬럼 행 (cb02/dashboard 공용)
function provRows(from,to){
  const arr=providerAgg(from,to);
  if(!arr.length) return `<tr><td colspan="5" class="adm-table-empty">해당 기간(적립완료일 기준)에 적립완료 건이 없습니다.</td></tr>`;
  return arr.map(p=>`<tr>
    <td><strong>${esc(p.ota)}</strong></td>
    <td style="text-align:right;font-weight:600">${p.cnt}</td>
    <td style="text-align:right;font-weight:600;color:#f59e0b">${p.sum>0?fmtP(p.sum):DASH_R}</td>
    <td style="text-align:right">${provRateCell(p.meta)}</td>
    <td>${provTypeBadge(p.meta?p.meta.type:'NONE')}</td>
  </tr>`).join('');
}

/* ── 파생 (회원별) ── */
function memberApprovedCount(email){ return RESERVATIONS.filter(r=>r.memberEmail===email && statusOf(r)==='Approved').length; }
function memberCumulativePoints(email){ return RESERVATIONS.filter(r=>r.memberEmail===email && statusOf(r)==='Approved' && r.cashbackType!=='NONE').reduce((s,r)=>s+floorP(r.pointKRW),0); }
function memberReservations(email){ return RESERVATIONS.filter(r=>r.memberEmail===email); }

/* ── DOM 헬퍼 ── */
const $ = id => document.getElementById(id);
function toast(msg,kind){ const t=$('toast'); t.className=''; t.textContent=msg; if(kind)t.classList.add(kind); t.classList.add('show');
  clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'),2200); }
function openModal(html){ $('modal-inner').innerHTML=html; $('modal').classList.add('show'); }
function closeModal(){ $('modal').classList.remove('show'); $('modal-inner').innerHTML=''; }
$('modal').addEventListener('click', e=>{ if(e.target===$('modal')) closeModal(); });

/* ════════ 로그인 ════════ */
function doLogin(){
  const id=$('login-id').value.trim(), pw=$('login-pw').value, errBox=$('login-error');
  $('login-id').classList.remove('err'); $('login-pw').classList.remove('err');
  if(!id && !pw){ errBox.textContent='세션이 만료되었습니다. 다시 로그인해 주세요.';
    errBox.style.background='#fefce8';errBox.style.borderColor='#fde68a';errBox.style.color='#92400e'; errBox.classList.add('show'); return; }
  if(id===ADMIN_ACCOUNT.loginId && pw===ADMIN_ACCOUNT.password){
    errBox.classList.remove('show'); $('login-view').style.display='none'; $('app-shell').style.display='block';
    $('proto-session').textContent='세션 활성 · '+ADMIN_ACCOUNT.email; go('dashboard'); return; }
  errBox.textContent='아이디 또는 비밀번호가 올바르지 않습니다. 다시 확인해 주세요.';
  errBox.style.background='#fee2e2';errBox.style.borderColor='#fca5a5';errBox.style.color='#991b1b'; errBox.classList.add('show');
  $('login-id').classList.add('err'); $('login-pw').classList.add('err'); $('login-pw').value='';
}
function doLogout(){ $('app-shell').style.display='none'; $('login-view').style.display='flex';
  $('login-id').value=''; $('login-pw').value=''; $('login-error').classList.remove('show'); toast('로그아웃되었습니다'); }

/* ════════ 라우팅 ════════ */
const ROUTE_META = {
  dashboard:['대시보드','dashboard'],
  mem:['회원 목록','mem'], memDetail:['회원 상세·수정','mem'],
  book01:['예약내역 전체','book01'], book02:['예약 상세','book01'],
  cb02:['공급사별 현황','cb02'],
  set:['관리자 설정','set'], setDetail:['관리자 계정 상세','set'], setNew:['관리자 계정 등록','set'],
};
function go(route){
  state.route=route;
  const [title,navKey]=ROUTE_META[route]||['',''];
  $('nav-route').textContent='— '+title;
  document.querySelectorAll('.adm-nav-item').forEach(el=>el.classList.toggle('active', el.dataset.route===navKey));
  window.scrollTo(0,0);
  ({dashboard:renderDashboard, mem:renderMemList, memDetail:renderMemDetail,
    book01:renderBook01, book02:renderBook02, cb02:renderCB02,
    set:renderSet, setDetail:renderSetDetail, setNew:renderSetNew}[route])();
}

/* ════════ 대시보드 ════════ */
function renderDashboard(){
  const totalMembers=MEMBERS.length;
  const withStatus=RESERVATIONS.map(r=>({r,st:statusOf(r)}));
  const approved=withStatus.filter(x=>x.st==='Approved');
  const active=withStatus.filter(x=>x.st==='Active');
  const approvedPts=approved.filter(x=>x.r.cashbackType!=='NONE').reduce((s,x)=>s+floorP(x.r.pointKRW),0);
  const activePts=active.filter(x=>x.r.cashbackType!=='NONE').reduce((s,x)=>s+floorP(x.r.pointKRW),0);
  const recentRes=[...RESERVATIONS].sort((a,b)=>b.bookingDate.localeCompare(a.bookingDate)).slice(0,5);
  const recentMem=[...MEMBERS].sort((a,b)=>b.joinDate.localeCompare(a.joinDate)).slice(0,5);

  const [dfrom,dto]=rangeOf(state.dash.mode);
  $('view').innerHTML=`
    <div class="adm-page-hdr">
      <div class="adm-page-title">대시보드</div>
      <div class="adm-page-sub">주요 운영 지표 요약</div>
    </div>

    <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px">
      <span style="font-size:12px;font-weight:600;color:#6b7280">조회 기간</span>
      <button class="wf-btn wf-btn-sm ${state.dash.mode==='week'?'wf-btn-primary':'wf-btn-ghost'}" onclick="dashQuick('week')">최근 1주일</button>
      <button class="wf-btn wf-btn-sm ${state.dash.mode==='month'?'wf-btn-primary':'wf-btn-ghost'}" onclick="dashQuick('month')">최근 1달</button>
      <span style="font-size:11px;color:#6b7280;margin-left:4px">${dfrom} ~ ${dto} (오늘)</span>
    </div>

    <div class="sec-title">핵심 지표</div>`;
  renderDashBody(dfrom,dto);
}
function dashQuick(m){ state.dash.mode=m; renderDashboard(); }
function renderDashBody(dfrom,dto){
  const totalMembers=MEMBERS.length;
  const approved=RESERVATIONS.filter(r=>statusOf(r)==='Approved');
  const active=RESERVATIONS.filter(r=>statusOf(r)==='Active');
  const approvedPts=approved.filter(r=>r.cashbackType!=='NONE').reduce((s,r)=>s+floorP(r.pointKRW),0);
  const activePts=active.filter(r=>r.cashbackType!=='NONE').reduce((s,r)=>s+floorP(r.pointKRW),0);
  const recentRes=[...RESERVATIONS].sort((a,b)=>b.bookingDate.localeCompare(a.bookingDate)).slice(0,5);
  const recentMem=[...MEMBERS].sort((a,b)=>b.joinDate.localeCompare(a.joinDate)).slice(0,5);
  $('view').insertAdjacentHTML('beforeend', `
    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:28px">
      <div class="stat-card blue"><div class="stat-card-label">전체 회원</div><div class="stat-card-value">${totalMembers.toLocaleString()}</div><div class="stat-card-sub">활성 회원 기준</div></div>
      <div class="stat-card blue"><div class="stat-card-label">총 적립완료 건수</div><div class="stat-card-value">${approved.length.toLocaleString()}</div><div class="stat-card-sub">Approved 누적 건수</div></div>
      <div class="stat-card amber"><div class="stat-card-label">총 적립완료 포인트</div><div class="stat-card-value" style="font-size:20px">${fmtP(approvedPts)}</div><div class="stat-card-sub">Approved 누적 합계</div></div>
      <div class="stat-card amber"><div class="stat-card-label">적립예정 포인트</div><div class="stat-card-value" style="font-size:20px">${fmtP(activePts)}</div><div class="stat-card-sub">Active</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:28px">
      <div>
        <div class="sec-title">포인트 적립 현황 <span class="sec-badge" style="font-size:10px">최신 5건</span></div>
        <div style="font-size:11px;color:#6b7280;margin-bottom:8px">예약일(BookingDate) 기준</div>
        <div class="adm-table-wrap"><table class="adm-table">
          <thead><tr><th>회원 이메일</th><th>OTA</th><th>포인트 금액</th><th>상태</th></tr></thead>
          <tbody>${recentRes.map(r=>{
            const who=r.memberEmail?esc(r.memberEmail):GUEST;
            return `<tr><td style="font-size:11px">${who}</td><td>${esc(r.ota)}</td><td>${pointCell(r)}</td><td>${statusBadge(statusOf(r))}</td></tr>`;
          }).join('')}</tbody>
        </table></div>
        <div style="text-align:right;margin-top:8px"><span class="wf-btn wf-btn-outline wf-btn-sm" onclick="go('book01')">전체 예약내역 →</span></div>
      </div>
      <div>
        <div class="sec-title">최근 가입 회원 <span class="sec-badge" style="font-size:10px">최신 5명</span></div>
        <div class="adm-table-wrap"><table class="adm-table">
          <thead><tr><th>회원번호</th><th>이메일</th><th>가입일</th></tr></thead>
          <tbody>${recentMem.map(m=>`<tr class="row-click" onclick="openMember('${m.id}')"><td style="font-family:monospace;font-size:11px">${m.id}</td><td style="font-size:11px">${esc(m.email)}</td><td style="font-size:11px">${m.joinDate.slice(5)}</td></tr>`).join('')}</tbody>
        </table></div>
        <div style="text-align:right;margin-top:8px"><span class="wf-btn wf-btn-outline wf-btn-sm" onclick="go('mem')">전체 회원 보기 →</span></div>
      </div>
    </div>

    <div class="sec-title" style="margin-bottom:4px">공급사별 현황</div>
    <div style="font-size:11px;color:#6b7280;margin-bottom:10px">적립완료일 기준 · 적립완료 건수 내림차순 정렬</div>
    <div class="adm-table-wrap" style="overflow-x:auto"><table class="adm-table">
      <thead><tr><th>공급사(OTA)</th><th style="text-align:right">적립완료 건수</th><th style="text-align:right">포인트 합계(P)</th><th style="text-align:right">포인트율/금액</th><th>타입</th></tr></thead>
      <tbody>${provRows(dfrom,dto)}</tbody>
    </table></div>`);
}

/* ════════ 회원 목록 (ADM-MEM01) ════════ */
function memFiltered(){
  const s=state.mem;
  let rows=MEMBERS.filter(m=>{
    if(s.q){ if(!m.email.toLowerCase().includes(s.q.toLowerCase())) return false; }
    if(s.mode!=='all'){ const [from,to]= s.mode==='custom'?[s.from,s.to]:rangeOf(s.mode); if(from && (m.joinDate<from||m.joinDate>to)) return false; }
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
  const s=state.mem, all=memFiltered(), total=all.length;
  const start=(s.page-1)*PAGE_SIZE, rows=all.slice(start,start+PAGE_SIZE);
  const [mfrom,mto] = s.mode==='all' ? ['',''] : (s.mode==='custom'?[s.from,s.to]:rangeOf(s.mode));
  $('view').innerHTML=`
    <div class="adm-page-hdr">
      <div class="adm-page-title">회원 목록</div>
      <div class="adm-page-sub">가입 회원 전체 · 이메일 검색·기간 필터·상세 진입 · 기본 정렬 가입일 최신순</div>
    </div>
    <div class="filter-bar" style="flex-wrap:wrap;gap:8px 12px">
      <span class="filter-label">검색</span>
      <input class="wf-input" id="mem-q" style="width:200px" placeholder="이메일 검색" value="${esc(s.q)}">
      <span class="filter-sep"></span>
      <span class="filter-label">가입기간</span>
      ${quickBtns('mem', s.mode, true)}
      ${dateFields('mem', s.mode, mfrom, mto)}
      <div class="filter-actions">
        <button class="wf-btn wf-btn-primary wf-btn-sm" onclick="memSearch()">검색</button>
        <button class="wf-btn wf-btn-ghost wf-btn-sm" onclick="memReset()">초기화</button>
      </div>
    </div>
    <div class="wf-hint" style="margin:-4px 0 14px">가입기간: <strong>전체</strong>(기본·A안)/<strong>최근 1주일</strong>/<strong>최근 1달</strong>/<strong>직접 입력</strong> · 직접 입력 후 [검색] · 최대 365일</div>
    <div class="adm-table-wrap"><table class="adm-table">
      <thead><tr>
        <th>회원ID</th><th>상태</th>
        <th class="sortable" onclick="memSort('joinDate')">가입일${sortInd('mem','joinDate')}</th>
        <th class="sortable" onclick="memSort('res')" style="text-align:center">예약 수${sortInd('mem','res')}</th>
        <th class="sortable" onclick="memSort('points')" style="text-align:right">누적 포인트(P)${sortInd('mem','points')}</th>
        <th>관리</th>
      </tr></thead>
      <tbody>${rows.length? rows.map(m=>{
        const cnt=memberApprovedCount(m.email), pts=memberCumulativePoints(m.email);
        return `<tr class="row-click" onclick="openMember('${m.id}')">
          <td style="font-size:12px">${esc(m.email)}</td>
          <td><span class="wf-badge badge-active">활성</span></td>
          <td>${m.joinDate}</td>
          <td style="text-align:center">${cnt}</td>
          <td style="text-align:right;font-weight:600">${pts>0?fmtP(pts):DASH_R}</td>
          <td><span class="wf-btn wf-btn-outline wf-btn-sm" onclick="event.stopPropagation();openMember('${m.id}')">상세</span></td>
        </tr>`;
      }).join('') : `<tr><td colspan="6" class="adm-table-empty">조건에 맞는 회원이 없습니다.</td></tr>`}</tbody>
    </table>
      <div class="adm-pagination">
        <div class="adm-pagination-info">총 ${total.toLocaleString()}명 · ${total?(start+1)+'–'+Math.min(start+PAGE_SIZE,total):'0'} 표시 중</div>
        ${memPager(total)}
      </div>
    </div>`;
  $('mem-q').addEventListener('keydown',e=>{ if(e.key==='Enter') memSearch(); });
}
function memPager(total){ const pages=Math.max(1,Math.ceil(total/PAGE_SIZE)),cur=state.mem.page; if(pages<=1)return '';
  let b='<span class="adm-pagination-btn" onclick="memPage('+Math.max(1,cur-1)+')">«</span>';
  for(let i=1;i<=pages;i++) b+=`<span class="adm-pagination-btn ${i===cur?'active':''}" onclick="memPage(${i})">${i}</span>`;
  b+='<span class="adm-pagination-btn" onclick="memPage('+Math.min(pages,cur+1)+')">»</span>';
  return '<div class="adm-pagination-btns">'+b+'</div>'; }
function memQuick(m){ state.mem.q=$('mem-q').value.trim(); state.mem.mode=m; state.mem.from=''; state.mem.to=''; state.mem.page=1; renderMemList(); }
function memCustom(){ state.mem.q=$('mem-q').value.trim(); state.mem.mode='custom'; state.mem.from=''; state.mem.to=''; state.mem.page=1; renderMemList(); }
function memSearch(){ state.mem.q=$('mem-q').value.trim();
  if(state.mem.mode==='custom'){ state.mem.from=$('mem-start').value; state.mem.to=$('mem-end').value; }
  state.mem.page=1; renderMemList(); }
function memReset(){ state.mem={q:'',mode:'all',from:'',to:'',sort:'joinDate',dir:'desc',page:1}; renderMemList(); }
function memSort(k){ const s=state.mem; if(s.sort===k)s.dir=s.dir==='asc'?'desc':'asc'; else{s.sort=k;s.dir='desc';} renderMemList(); }
function memPage(p){ state.mem.page=p; renderMemList(); }
function openMember(id){ state.memberId=id; state.memTab='info'; go('memDetail'); }

/* ════════ 회원 상세·수정 (ADM-MEM02) ════════ */
function renderMemDetail(){
  const m=MEMBERS.find(x=>x.id===state.memberId); if(!m) return go('mem');
  const nm=(m.firstName+' '+m.lastName).trim()||'(이름 미입력)';
  $('view').innerHTML=`
    <div class="adm-page-hdr">
      <div class="adm-page-title">회원 상세 — ${esc(nm)}</div>
      <div class="adm-page-sub">회원ID: ${esc(m.email)} · 가입일: ${m.joinDate} · 마지막 로그인: ${m.lastLogin||'—'}</div>
      <div class="adm-page-actions"><span class="wf-btn wf-btn-ghost" onclick="go('mem')">← 목록으로</span></div>
    </div>
    <div class="adm-tabs">
      <button class="adm-tab ${state.memTab==='info'?'active':''}" onclick="memTab('info')">회원정보</button>
      <button class="adm-tab ${state.memTab==='book'?'active':''}" onclick="memTab('book')">예약·포인트 내역</button>
    </div>
    <div id="mem-tab-body"></div>`;
  renderMemTab();
}
function memTab(t){ state.memTab=t; renderMemTab();
  document.querySelectorAll('.adm-tab').forEach((b,i)=>b.classList.toggle('active',(i===0)===(t==='info'))); }
function renderMemTab(){
  const m=MEMBERS.find(x=>x.id===state.memberId), body=$('mem-tab-body');
  if(state.memTab==='info'){
    body.innerHTML=`
      <div class="sec-title">기본 정보</div>
      <div class="adm-form" style="max-width:640px">
        <div class="adm-form-section">
          <div class="adm-form-section-title">계정 식별 정보 (읽기전용)</div>
          <div class="adm-form-row"><div class="adm-form-label">회원ID (이메일)</div>
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
            <div class="adm-form-readonly" style="display:flex;align-items:center;gap:8px">
              <span id="f-nat">${m.nationality.flag} ${m.nationality.name} (${m.nationality.code})</span>
              <button class="wf-btn wf-btn-ghost wf-btn-sm" onclick="openNationality()">변경</button></div></div>
          <div class="adm-form-row"><div class="adm-form-label">전화번호</div>
            <div><div style="display:flex;gap:6px;align-items:center">
              <input class="wf-input" id="f-code" style="width:70px" value="${esc(m.phoneCode)}">
              <input class="wf-input" id="f-phone" value="${esc(m.phone)}" placeholder="번호 입력"></div>
            <div class="field-err" id="err-phone">숫자와 하이픈(-)만 입력할 수 있습니다.</div></div></div>
        </div>
        <div style="text-align:right"><button class="wf-btn wf-btn-primary" onclick="saveMember()">저장</button></div>
      </div>`;
  } else {
    const rows=memberReservations(m.email), cum=memberCumulativePoints(m.email);
    body.innerHTML=`
      <div class="sec-sub">${esc((m.firstName+' '+m.lastName).trim()||m.email)} 기준 · 행 클릭 시 예약 상세로 이동</div>
      <div class="pt-summary">적립완료 누적 포인트: <strong>${cum>0?fmtP(cum):'0P'}</strong></div>
      <div class="adm-table-wrap"><table class="adm-table">
        <thead><tr><th>예약번호</th><th>호텔명</th><th>투숙기간</th><th>공급사(OTA)</th><th>포인트(P)</th><th>타입</th><th>포인트 상태</th><th>적립완료일</th></tr></thead>
        <tbody>${rows.length? rows.map(r=>{ const st=statusOf(r); return `<tr class="row-click" onclick="openBook('${r.resId}')">
          <td style="font-family:monospace;font-size:11px">${r.resId}</td>
          <td>${esc(r.hotel)}</td><td style="white-space:nowrap;font-size:12px">${mmdd(r.checkIn)} ~ ${mmdd(r.checkOut)}</td><td style="font-size:12px">${esc(r.ota)}</td>
          <td>${pointCell(r)}</td><td>${typeCell(r)}</td><td>${statusBadge(st)}</td>
          <td style="font-size:12px">${st==='Cancelled'?DASH:completeDate(r)}</td>
        </tr>`; }).join('') : `<tr><td colspan="8" class="adm-table-empty">예약 내역이 없습니다.</td></tr>`}</tbody>
      </table>
      <div class="adm-pagination"><div class="adm-pagination-info">총 ${rows.length}건 · 전체 표시</div></div>
      </div>`;
  }
}
function validName(v){ return v===''||/^[A-Za-z\s'-]+$/.test(v); }
function validPhone(v){ return v===''||/^[0-9-]+$/.test(v); }
function saveMember(){
  const m=MEMBERS.find(x=>x.id===state.memberId);
  const first=$('f-first').value.trim(),last=$('f-last').value.trim(),phone=$('f-phone').value.trim(),code=$('f-code').value.trim();
  let ok=true;
  toggleErr('f-first','err-first',validName(first)); if(!validName(first))ok=false;
  toggleErr('f-last','err-last',validName(last)); if(!validName(last))ok=false;
  toggleErr('f-phone','err-phone',validPhone(phone)); if(!validPhone(phone))ok=false;
  if(!ok){ toast('입력값을 확인해 주세요','err'); return; }
  m.firstName=first;m.lastName=last;m.phone=phone;m.phoneCode=code||m.phoneCode;
  toast('저장되었습니다','ok'); renderMemDetail();
}
function toggleErr(i,e,ok){ $(i).classList.toggle('err',!ok); $(e).classList.toggle('show',!ok); }
const NATIONS=[
  {code:'KR',flag:'🇰🇷',name:'대한민국'},{code:'JP',flag:'🇯🇵',name:'일본'},{code:'US',flag:'🇺🇸',name:'미국'},
  {code:'TW',flag:'🇹🇼',name:'대만'},{code:'VN',flag:'🇻🇳',name:'베트남'},{code:'MX',flag:'🇲🇽',name:'멕시코'},
  {code:'ID',flag:'🇮🇩',name:'인도네시아'},{code:'SG',flag:'🇸🇬',name:'싱가포르'},{code:'TH',flag:'🇹🇭',name:'태국'},
  {code:'HK',flag:'🇭🇰',name:'홍콩'},{code:'CN',flag:'🇨🇳',name:'중국'},{code:'GB',flag:'🇬🇧',name:'영국'},
];
function openNationality(){
  const m=MEMBERS.find(x=>x.id===state.memberId);
  openModal(`<div class="modal-box"><div class="modal-hdr">국적 선택<span class="modal-close" onclick="closeModal()">✕</span></div>
    <div class="modal-body">${NATIONS.map(n=>`<div class="nat-item ${n.code===m.nationality.code?'sel':''}" onclick="pickNation('${n.code}')">${n.flag} ${n.name} (${n.code})</div>`).join('')}</div></div>`);
}
function pickNation(code){ const m=MEMBERS.find(x=>x.id===state.memberId); m.nationality=NATIONS.find(n=>n.code===code);
  $('f-nat').textContent=`${m.nationality.flag} ${m.nationality.name} (${m.nationality.code})`; closeModal(); toast('국적이 변경되었습니다. [저장]을 눌러 확정하세요'); }

/* ════════ 예약내역 전체 목록 (ADM-BOOK01) ════════ */
function bookFiltered(){
  const s=state.book;
  const [from,to] = s.mode==='custom' ? [s.from,s.to] : rangeOf(s.mode);
  return RESERVATIONS.filter(r=>{
    const st=statusOf(r);
    const dateField = s.dateType==='checkin' ? r.checkIn : r.bookingDate;
    if(from && (dateField<from || dateField>to)) return false;
    if(s.memberType==='member' && !r.memberEmail) return false;
    if(s.memberType==='guest'  && r.memberEmail)  return false;
    if(s.status!=='all' && st!==s.status) return false;
    if(s.ota!=='all' && r.ota!==s.ota) return false;
    if(s.q){ const q=s.q.toLowerCase(); if(!((r.memberEmail||'').toLowerCase().includes(q)||r.resId.toLowerCase().includes(q))) return false; }
    return true;
  }).sort((a,b)=>b.bookingDate.localeCompare(a.bookingDate));
}
function renderBook01(){
  const s=state.book, rows=bookFiltered();
  const [bfrom,bto] = s.mode==='custom' ? [s.from,s.to] : rangeOf(s.mode);
  const cnt=n=>rows.filter(r=>statusOf(r)===n).length;
  const otas=[...new Set(RESERVATIONS.map(r=>r.ota))].sort();
  $('view').innerHTML=`
    <div class="adm-page-hdr">
      <div class="adm-page-title">예약내역 전체 목록</div>
      <div class="adm-page-sub">예약완료 건 전체 · 검색·필터 · 행 클릭 시 예약 상세로 이동</div>
    </div>

    <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:10px">요약 통계 <span style="font-size:11px;font-weight:400;color:#9ca3af">(현재 필터 반영)</span></div>
    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
      <div class="stat-card blue"><div class="stat-card-label">전체 예약</div><div class="stat-card-value">${rows.length.toLocaleString()}</div><div class="stat-card-sub">적립예정+적립완료+취소</div></div>
      <div class="stat-card amber"><div class="stat-card-label">적립예정</div><div class="stat-card-value">${cnt('Active')}</div><div class="stat-card-sub">체크아웃+7일 미도래</div></div>
      <div class="stat-card green"><div class="stat-card-label">적립완료</div><div class="stat-card-value">${cnt('Approved')}</div><div class="stat-card-sub">자사 배치 처리 완료</div></div>
      <div class="stat-card gray"><div class="stat-card-label">취소</div><div class="stat-card-value">${cnt('Cancelled')}</div><div class="stat-card-sub">KAYAK Cancelled</div></div>
    </div>

    <div class="filter-bar" style="flex-wrap:wrap;gap:8px 12px">
      <span class="filter-label">기간 기준</span>
      <label class="radio-opt"><input type="radio" name="bk-dt" value="booking" ${s.dateType==='booking'?'checked':''} onclick="bookDateType('booking')"> 예약일</label>
      <label class="radio-opt"><input type="radio" name="bk-dt" value="checkin" ${s.dateType==='checkin'?'checked':''} onclick="bookDateType('checkin')"> 체크인일</label>
      <span class="filter-sep"></span>
      ${quickBtns('book', s.mode, false)}
      ${dateFields('book', s.mode, bfrom, bto)}
      <span class="filter-sep"></span>
      <span class="filter-label">회원/비회원</span>
      <select class="wf-select" id="bk-member">
        <option value="all" ${s.memberType==='all'?'selected':''}>전체</option>
        <option value="member" ${s.memberType==='member'?'selected':''}>회원</option>
        <option value="guest" ${s.memberType==='guest'?'selected':''}>비회원</option>
      </select>
      <span class="filter-label">포인트 상태</span>
      <select class="wf-select" id="bk-status">
        <option value="all" ${s.status==='all'?'selected':''}>전체</option>
        <option value="Active" ${s.status==='Active'?'selected':''}>적립예정</option>
        <option value="Approved" ${s.status==='Approved'?'selected':''}>적립완료</option>
        <option value="Cancelled" ${s.status==='Cancelled'?'selected':''}>취소</option>
      </select>
      <span class="filter-label">공급사(OTA)</span>
      <select class="wf-select" id="bk-ota">
        <option value="all">전체</option>
        ${otas.map(o=>`<option value="${esc(o)}" ${s.ota===o?'selected':''}>${esc(o)}</option>`).join('')}
      </select>
      <span class="filter-sep"></span>
      <span class="filter-label">검색</span>
      <input class="wf-input" id="bk-q" style="width:180px" placeholder="이메일 · 예약번호" value="${esc(s.q)}">
      <div class="filter-actions">
        <button class="wf-btn wf-btn-primary wf-btn-sm" onclick="bookSearch()">검색</button>
        <button class="wf-btn wf-btn-ghost wf-btn-sm" onclick="bookReset()">초기화</button>
      </div>
    </div>

    <div class="adm-table-wrap" style="overflow-x:auto"><table class="adm-table">
      <thead><tr>
        <th>회원ID</th><th>예약번호</th><th>예약일</th><th>호텔명</th><th>투숙기간</th><th>공급사(OTA)</th><th>포인트(P)</th><th>타입</th><th>포인트 상태</th><th>적립완료일</th>
      </tr></thead>
      <tbody>${rows.length? rows.map(r=>{ const st=statusOf(r); return `<tr class="row-click" onclick="openBook('${r.resId}')">
        <td style="font-size:12px">${r.memberEmail?esc(r.memberEmail):DASH}</td>
        <td style="font-family:monospace;font-size:11px">${r.resId}</td>
        <td style="font-size:12px">${r.bookingDate}</td>
        <td>${esc(r.hotel)}</td>
        <td style="white-space:nowrap;font-size:12px">${mmdd(r.checkIn)} ~ ${mmdd(r.checkOut)}</td>
        <td style="font-size:12px">${esc(r.ota)}</td>
        <td>${pointCell(r)}</td><td>${typeCell(r)}</td><td>${statusBadge(st)}</td>
        <td style="font-size:12px">${st==='Cancelled'?DASH:completeDate(r)}</td>
      </tr>`; }).join('') : `<tr><td colspan="10" class="adm-table-empty">조건에 맞는 예약이 없습니다.</td></tr>`}</tbody>
    </table>
      <div class="adm-pagination"><div class="adm-pagination-info">총 ${rows.length}건 · 전체 표시</div></div>
    </div>`;
  $('bk-q').addEventListener('keydown',e=>{ if(e.key==='Enter') bookSearch(); });
}
function bookDateType(t){ state.book.dateType=t; }
function bookReadOthers(){ const s=state.book;
  s.dateType=document.querySelector('input[name=bk-dt]:checked').value;
  s.memberType=$('bk-member').value; s.status=$('bk-status').value; s.ota=$('bk-ota').value; s.q=$('bk-q').value.trim(); }
function bookQuick(m){ bookReadOthers(); state.book.mode=m; renderBook01(); }
function bookCustom(){ bookReadOthers(); state.book.mode='custom'; state.book.from=''; state.book.to=''; renderBook01(); }
function bookSearch(){ bookReadOthers(); const s=state.book;
  if(s.mode==='custom'){ s.from=$('book-start').value; s.to=$('book-end').value; }
  renderBook01(); }
function bookReset(){ state.book={dateType:'booking',mode:'week',from:'',to:'',memberType:'all',status:'all',ota:'all',q:''}; renderBook01(); }
function openBook(resId){ state.bookSelId=resId; go('book02'); }

/* ════════ 예약 상세 (ADM-BOOK02) ════════ */
function renderBook02(){
  const r=RESERVATIONS.find(x=>x.resId===state.bookSelId); if(!r) return go('book01');
  const st=statusOf(r), cd=completeDate(r);
  const isNone = r.cashbackType==='NONE', isCancel = r.cancelled;
  // 포인트지급액 — NONE(미제공)은 취소 여부 무관 "—" / 취소+타입있음은 0P / 그 외 값
  const point = isNone ? DASH
    : (isCancel
        ? '<span style="color:#9ca3af;font-weight:700;font-size:16px">0P</span> <span style="font-size:11px;color:#6b7280;font-weight:400">(취소 · 미지급)</span>'
        : `<span style="color:#f59e0b;font-weight:700;font-size:16px">${fmtP(r.pointKRW)}</span> <span style="font-size:11px;color:#6b7280;font-weight:400">(소수점 버림)</span>`);
  // 캐시백 타입/율 — 취소여도 타입은 살아있음(흐림 표시)
  const dimTxt = isCancel?';color:#9ca3af':'';
  const typeRow = isNone ? DASH
    : (r.cashbackType==='PERCENTAGE'
        ? `${typeBadge('PERCENTAGE',isCancel)} <span style="margin-left:4px;font-size:12px${dimTxt}">· ${r.cashbackValue}%</span>`
        : `${typeBadge('FLAT',isCancel)} <span style="margin-left:4px;font-size:12px${dimTxt}">· ${fmtUSD(r.cashbackValue)}</span>`);
  const expire = st==='Cancelled' ? DASH
    : (st==='Approved' ? addDays(cd,365) : `${addDays(cd,365)} <span style="color:#9ca3af;font-size:11px">(예상)</span>`);
  const cdCell = st==='Cancelled' ? DASH : (st==='Approved' ? cd : `${cd} <span style="color:#9ca3af;font-size:11px">(예정)</span>`);

  $('view').innerHTML=`
    <div class="adm-page-hdr" style="display:flex;align-items:center;gap:12px">
      <span class="wf-btn wf-btn-ghost wf-btn-sm" onclick="go('book01')">← 목록으로</span>
      <div>
        <div class="adm-page-title">예약 상세 — ${r.resId}</div>
        <div class="adm-page-sub">조회전용 · ${r.bookingDate} 예약완료 · ${r.memberEmail?esc(r.memberEmail):'비회원'}</div>
      </div>
    </div>

    <div style="max-width:720px">
      <div class="detail-block">
        <div class="detail-block-hdr">📋 블록1 — 예약 기본 정보</div>
        <div class="detail-grid">
          <div class="detail-label">예약번호</div><div class="detail-value mono">${r.resId}</div>
          <div class="detail-label">예약일</div><div class="detail-value">${r.bookingDate}</div>
          <div class="detail-label">호텔명</div><div class="detail-value">${esc(r.hotel)}</div>
          <div class="detail-label">도시</div><div class="detail-value">${esc(r.city)}</div>
          <div class="detail-label">국가</div><div class="detail-value">${esc(r.country)} (${r.countryCode})</div>
          <div class="detail-label">투숙기간</div><div class="detail-value">${r.checkIn} ~ ${r.checkOut}
            <span style="background:#eff6ff;color:#2563eb;font-size:11px;padding:2px 7px;border-radius:99px;font-weight:600">${nights(r.checkIn,r.checkOut)}박</span></div>
          <div class="detail-label">공급사(OTA)</div><div class="detail-value">${esc(r.ota)}</div>
        </div>
      </div>

      <div class="detail-block">
        <div class="detail-block-hdr">👤 블록2 — 회원 정보</div>
        <div class="detail-grid">
          <div class="detail-label">회원ID</div><div class="detail-value" style="font-size:12px">${r.memberEmail?esc(r.memberEmail):'비회원 <span style="color:#9ca3af">(labels 없음 · 귀속 불가)</span>'}</div>
          <div class="detail-label">접속기기</div><div class="detail-value">${r.device}</div>
          <div class="detail-label">언어</div><div class="detail-value">${esc(r.langName)} (${r.lang})</div>
        </div>
      </div>

      <div class="detail-block">
        <div class="detail-block-hdr">💰 블록3 — 적립기준금액 &amp; 포인트 정보</div>
        <div class="detail-grid">
          <div class="detail-label">적립기준금액(USD)</div><div class="detail-value mono">${fmtUSD(r.usd)} <span style="font-size:11px;color:#9ca3af;font-family:sans-serif">API 원시값</span></div>
          <div class="detail-label">적립기준금액(KRW)</div><div class="detail-value" style="font-weight:700;font-size:15px">${fmtKRW(r.krw)}</div>
          <div class="detail-label">캐시백 타입 / 율(금액)</div><div class="detail-value">${typeRow}</div>
          <div class="detail-label">캐시백(USD)</div><div class="detail-value mono">${isNone?DASH:(isCancel?fmtUSD(0)+' <span style="font-size:11px;color:#9ca3af;font-family:sans-serif">취소 · 0</span>':fmtUSD(r.cashbackUSD)+' <span style="font-size:11px;color:#9ca3af;font-family:sans-serif">API 원시값</span>')}</div>
          <div class="detail-label">포인트지급액</div><div class="detail-value">${point}</div>
          <div class="detail-label">포인트 상태</div><div class="detail-value">${statusBadge(st)}</div>
          <div class="detail-label">적립완료일</div><div class="detail-value">${cdCell} <span style="font-size:11px;color:#6b7280">(체크아웃+7일)</span></div>
          <div class="detail-label">포인트 예상만료날짜</div><div class="detail-value">${expire} <span style="font-size:11px;color:#6b7280">(적립완료일+365일)</span></div>
        </div>
      </div>

      <div class="detail-block">
        <div class="detail-block-hdr">📅 블록4 — 포인트 상태 타임라인</div>
        ${bookTimeline(r,st)}
      </div>
    </div>`;
}
function tlDot(kind,mark){ return `<div class="tl-dot ${kind}">${mark}</div>`; }
function bookTimeline(r,st){
  if(st==='Cancelled'){
    return `<div style="font-size:11px;font-weight:700;color:#9ca3af;margin-bottom:10px;background:#f3f4f6;padding:4px 10px;border-radius:4px;display:inline-block">케이스2 — 취소</div>
      <div class="timeline">
        <div class="tl-item">${tlDot('done','✓')}<div class="tl-body"><div class="tl-title">투숙예정 · 적립예정</div></div></div>
        <div class="tl-item">${tlDot('cancelled','✕')}<div class="tl-body"><div class="tl-title" style="color:#ef4444">취소</div><div class="tl-sub">KAYAK Cancelled 감지 · 포인트 미지급</div></div></div>
      </div>`;
  }
  const checkedIn = TODAY >= r.checkIn, checkedOut = TODAY >= r.checkOut, approved = st==='Approved';
  const step=(done,cur,title,sub)=>`<div class="tl-item">${tlDot(done?'done':'pending',done?'✓':'○')}
    <div class="tl-body"><div class="tl-title ${done||cur?'':'dim'}">${title}</div><div class="tl-sub ${done||cur?'':'dim'}">${sub}</div></div></div>`;
  return `<div style="font-size:11px;font-weight:700;color:#2563eb;margin-bottom:10px;background:#eff6ff;padding:4px 10px;border-radius:4px;display:inline-block">케이스1 — 정상 적립 흐름</div>
    <div class="timeline">
      ${step(checkedIn, !checkedIn, '투숙예정 · 적립예정', '체크인 전 · 포인트 적립 대기')}
      ${step(checkedOut, checkedIn&&!checkedOut, '투숙완료 · 적립예정', '체크아웃 후 · 자사 배치 대기')}
      ${step(approved, checkedOut&&!approved, '투숙완료 · 적립완료', '체크아웃+7일 이후 자사 배치 완료')}
    </div>`;
}

/* ════════ 공급사별 현황 (ADM-CB02) — 적립완료일 기준·퀵버튼·5컬럼 ════════ */
function renderCB02(){
  const s=state.cb02;
  const [from,to] = s.mode==='custom' ? [s.from,s.to] : rangeOf(s.mode);
  const custom = s.mode==='custom';
  const err = custom && s.from && s.to && !rangeValid(s.from,s.to);
  $('view').innerHTML=`
    <div class="adm-page-hdr">
      <div class="adm-page-title">공급사별 포인트 현황</div>
      <div class="adm-page-sub">OTA 공급사별 포인트 지급 현황 · 적립완료일 기준 · 적립완료 건만 집계</div>
    </div>
    <div class="filter-bar" style="margin-bottom:8px;flex-wrap:wrap;gap:8px 12px">
      <span class="filter-label">적립완료일</span>
      ${quickBtns('cb02', s.mode, false)}
      <span class="filter-sep"></span>
      ${dateFields('cb02', s.mode, from, to)}
      <div class="filter-actions">
        <button class="wf-btn wf-btn-primary wf-btn-sm" onclick="cb02Apply()" ${custom?'':'disabled style="opacity:0.45"'}>조회</button>
      </div>
    </div>
    ${err?'<div style="color:#e53e3e;font-size:12px;margin:0 0 10px">조회 기간은 최대 365일까지 가능합니다.</div>':''}
    <div class="wf-hint" style="margin:0 0 16px">적립완료일(체크아웃+7일 자사 배치 시점) 기준 · <strong>최근 1주일</strong>(기본)/<strong>최근 1달</strong>/<strong>직접 입력</strong> · 직접 입력 후 [조회] · 최대 365일</div>

    <div class="sec-title">공급사별 상세</div>
    <div class="adm-table-wrap"><table class="adm-table">
      <thead><tr><th>공급사 (OTA)</th><th style="text-align:right">적립완료 건수</th><th style="text-align:right">포인트 합계(P)</th><th style="text-align:right">포인트율/금액</th><th>타입</th></tr></thead>
      <tbody>${provRows(from,to)}</tbody>
    </table></div>`;
}
function cb02Quick(m){ state.cb02.mode=m; renderCB02(); }
function cb02Custom(){ state.cb02.mode='custom'; state.cb02.from=''; state.cb02.to=''; renderCB02(); }
function cb02Apply(){ state.cb02.from=$('cb02-start').value; state.cb02.to=$('cb02-end').value;
  if(!rangeValid(state.cb02.from,state.cb02.to)){ renderCB02(); return; } renderCB02(); }

/* ════════ 관리자 설정 목록 (ADM-SET01) ════════ */
function renderSet(){
  const list=state.adminList;
  $('view').innerHTML=`
    <div class="adm-page-hdr">
      <div class="adm-page-title">관리자 계정 목록</div>
      <div class="adm-page-sub">어드민 접근 계정 관리</div>
      <div class="adm-page-actions"><button class="wf-btn wf-btn-primary wf-btn-sm" onclick="go('setNew')">+ 관리자 추가</button></div>
    </div>
    <div class="adm-table-wrap"><table class="adm-table">
      <thead><tr><th>계정 ID</th><th>이름</th><th>이메일</th><th>권한</th><th>마지막 로그인</th><th>상태</th><th>관리</th></tr></thead>
      <tbody>${list.map(a=>`<tr class="row-click" onclick="openAdmin('${a.accountId}')">
        <td style="font-family:monospace;font-size:11px">${a.accountId}</td>
        <td>${a.name?esc(a.name):DASH}</td><td>${esc(a.email)}</td>
        <td><span class="wf-badge badge-active">마스터</span></td>
        <td>${a.lastLogin||'—'}</td>
        <td>${a.status==='active'?'<span class="wf-badge badge-approved">활성</span>':'<span class="wf-badge badge-cancelled">비활성</span>'}</td>
        <td><span class="wf-btn wf-btn-outline wf-btn-sm" onclick="event.stopPropagation();openAdmin('${a.accountId}')">상세</span></td>
      </tr>`).join('')}</tbody>
    </table>
      <div class="adm-pagination"><div class="adm-pagination-info">총 ${list.length}개 계정</div></div>
    </div>`;
}
function openAdmin(id){ state.setSelId=id; go('setDetail'); }

/* ════════ 관리자 계정 상세·수정 (ADM-SET02 케이스 A) ════════ */
function renderSetDetail(){
  const a=state.adminList.find(x=>x.accountId===state.setSelId)||state.adminList[0];
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
          <div class="adm-form-readonly" style="display:flex;align-items:center;gap:8px">${a.loginId}<span class="wf-badge badge-active">마스터</span></div></div>
        <div class="adm-form-row"><div class="adm-form-label">이메일</div><div class="adm-form-readonly">${esc(a.email)}</div></div>
        <div class="adm-form-row"><div class="adm-form-label">계정 생성일</div><div class="adm-form-readonly">${a.createdAt}</div></div>
        <div class="adm-form-row"><div class="adm-form-label">권한</div>
          <div class="adm-form-readonly" style="width:120px">마스터</div></div>
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
    </div>`;
}
function saveSetStatus(){ const a=state.adminList.find(x=>x.accountId===state.setSelId)||state.adminList[0];
  a.status=$('set-status').value; toast(a.status==='inactive'?'비활성으로 저장되었습니다 (로그인 차단)':'저장되었습니다','ok'); }
function openPwModal(){
  openModal(`<div class="modal-box" style="max-width:440px">
    <div class="modal-hdr">비밀번호 변경<span class="modal-close" onclick="closeModal()">✕</span></div>
    <div style="padding:20px">
      <div style="margin-bottom:12px"><div class="adm-form-label required" style="margin-bottom:5px">현재 비밀번호</div>
        <input class="wf-input" type="password" id="pw-cur" placeholder="현재 비밀번호 입력">
        <div class="field-err" id="err-cur">현재 비밀번호가 올바르지 않습니다.</div></div>
      <div style="margin-bottom:12px"><div class="adm-form-label required" style="margin-bottom:5px">새 비밀번호</div>
        <input class="wf-input" type="password" id="pw-new" placeholder="새 비밀번호 입력">
        <div class="wf-hint">영문+숫자+특수문자 조합, 8자 이상</div>
        <div class="field-err" id="err-new">영문·숫자·특수문자를 모두 포함해야 합니다 (8자 이상)</div></div>
      <div style="margin-bottom:12px"><div class="adm-form-label required" style="margin-bottom:5px">새 비밀번호 확인</div>
        <input class="wf-input" type="password" id="pw-conf" placeholder="새 비밀번호 다시 입력">
        <div class="field-err" id="err-conf">비밀번호가 일치하지 않습니다.</div></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
        <button class="wf-btn wf-btn-ghost" onclick="closeModal()">취소</button>
        <button class="wf-btn wf-btn-primary" onclick="changePw()">변경</button>
      </div>
    </div>
  </div>`);
}
function changePw(){
  const a=state.adminList.find(x=>x.accountId===state.setSelId)||state.adminList[0];
  const cur=$('pw-cur').value,nw=$('pw-new').value,cf=$('pw-conf').value;
  const rule=/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
  let ok=true;
  toggleErr('pw-cur','err-cur',cur===a.password); if(cur!==a.password)ok=false;
  const ruleOk=rule.test(nw),diffOk=nw!==cur;
  if(!ruleOk)$('err-new').textContent='영문·숫자·특수문자를 모두 포함해야 합니다 (8자 이상)';
  else if(!diffOk)$('err-new').textContent='현재 비밀번호와 다른 비밀번호를 입력해 주세요';
  toggleErr('pw-new','err-new',ruleOk&&diffOk); if(!(ruleOk&&diffOk))ok=false;
  toggleErr('pw-conf','err-conf',nw!==''&&nw===cf); if(!(nw!==''&&nw===cf))ok=false;
  if(!ok) return;
  a.password=nw; if(a.accountId===ADMIN_ACCOUNT.accountId) ADMIN_ACCOUNT.password=nw;
  closeModal(); toast('비밀번호가 변경되었습니다','ok');
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
        <div style="margin-bottom:14px"><div class="adm-form-label required" style="margin-bottom:5px">아이디</div>
          <input class="wf-input" id="na-id" placeholder="영문·숫자 4자 이상" style="max-width:280px">
          <div class="wf-hint">영문·숫자 조합 4자 이상. 등록 후 변경 불가</div>
          <div class="field-err" id="err-na-id">아이디는 영문·숫자 4자 이상이어야 합니다.</div></div>
        <div style="margin-bottom:14px"><div class="adm-form-label required" style="margin-bottom:5px">이메일</div>
          <input class="wf-input" id="na-email" placeholder="admin@example.com" style="max-width:280px">
          <div class="field-err" id="err-na-email">올바른 이메일 형식이 아닙니다.</div></div>
        <div style="margin-bottom:14px"><div class="adm-form-label" style="margin-bottom:5px">이름</div>
          <input class="wf-input" id="na-name" placeholder="선택 입력" style="max-width:240px"></div>
        <div style="margin-bottom:14px"><div class="adm-form-label required" style="margin-bottom:5px">초기 비밀번호</div>
          <input class="wf-input" type="password" id="na-pw" placeholder="영문+숫자+특수문자 8자 이상" style="max-width:280px">
          <div class="wf-hint">영문+숫자+특수문자 조합, 8자 이상</div>
          <div class="field-err" id="err-na-pw">비밀번호 규칙(영문+숫자+특수문자, 8자 이상)에 맞지 않습니다.</div></div>
        <div style="margin-bottom:14px"><div class="adm-form-label required" style="margin-bottom:5px">비밀번호 확인</div>
          <input class="wf-input" type="password" id="na-pw2" placeholder="비밀번호 다시 입력" style="max-width:280px">
          <div class="field-err" id="err-na-pw2">비밀번호가 일치하지 않습니다.</div></div>
        <div><div class="adm-form-label" style="margin-bottom:5px">권한</div>
          <select class="wf-select" style="width:180px" disabled><option>마스터 (고정)</option></select>
          <div class="wf-hint">권한은 마스터 고정</div></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="wf-btn wf-btn-ghost" onclick="go('set')">취소</button>
        <button class="wf-btn wf-btn-primary" onclick="registerAdmin()">등록</button>
      </div>
    </div>`;
}
function registerAdmin(){
  const id=$('na-id').value.trim(),email=$('na-email').value.trim(),name=$('na-name').value.trim(),pw=$('na-pw').value,pw2=$('na-pw2').value;
  const idOk=/^[A-Za-z0-9]{4,}$/.test(id), emailOk=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwOk=/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pw), pw2Ok=pw!==''&&pw===pw2;
  let ok=true;
  toggleErr('na-id','err-na-id',idOk); if(!idOk)ok=false;
  toggleErr('na-email','err-na-email',emailOk); if(!emailOk)ok=false;
  toggleErr('na-pw','err-na-pw',pwOk); if(!pwOk)ok=false;
  toggleErr('na-pw2','err-na-pw2',pw2Ok); if(!pw2Ok)ok=false;
  if(idOk && state.adminList.some(a=>a.loginId===id)){ toggleErr('na-id','err-na-id',false); $('err-na-id').textContent='이미 사용 중인 아이디입니다.'; ok=false; }
  if(!ok){ toast('입력값을 확인해 주세요','err'); return; }
  const num=state.adminList.length+1;
  state.adminList.push({ accountId:'ADM-'+String(num).padStart(3,'0'), loginId:id, name, email, role:'master', status:'active', password:pw, lastLogin:'—', createdAt:'2026-08-05' });
  toast('관리자 계정이 등록되었습니다.','ok'); go('set');
}

/* ════════ 초기화 · 이벤트 바인딩 ════════ */
state.adminList=[{ accountId:ADMIN_ACCOUNT.accountId, loginId:ADMIN_ACCOUNT.loginId, name:ADMIN_ACCOUNT.name,
  email:ADMIN_ACCOUNT.email, role:'master', status:'active', password:ADMIN_ACCOUNT.password,
  lastLogin:ADMIN_ACCOUNT.lastLogin, createdAt:ADMIN_ACCOUNT.createdAt }];
state.setSelId=ADMIN_ACCOUNT.accountId;

// 로그인 과정 제외 — 로드 즉시 대시보드 진입 (인증 없음)
document.querySelectorAll('.adm-nav-item').forEach(el=> el.addEventListener('click', ()=>go(el.dataset.route)));
$('proto-session').textContent='세션 활성 · '+ADMIN_ACCOUNT.email;
go('dashboard');
