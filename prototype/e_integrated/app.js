/* ═══════════ 상태 ═══════════ */
const state = {
  loggedIn: false,
  entryMode: null,       // 'ai' | 'form'  (결과페이지 AI추천영역 노출)
  destination: '',       // 검색 도시(또는 호텔명)
  destType: 'city',      // 목적지 타입 city|area|hotel (최근검색·핀 구분)
  randomCity: null,      // 지역 미입력 시 자동 지정된 도시(안내용)
  dateStr: '7월 9일 – 7월 10일',
  nights: 1,             // 박수 (금액 = 1박가 × 박수)
  guestStr: '성인 2명 · 객실 1개',
  cashbackItems: [],     // {hotel,dates,tripStatus,earnStatus,amount}
  dPanelOpen: false,     // 숙소상세 날짜바 재검색 패널 펼침 여부 (S02_D1-A)
  // ─ 로그인/회원가입/탈퇴 (AUTH) ─
  nextIsNew: false,      // 데모: 다음 로그인을 신규회원으로 판별 (AUTH-E 약관동의 노출)
  userEmail: '',         // 로그인한 이메일 (마이페이지 표시용)
  loginEmailVal: '',     // 입력 중인 이메일
  loginErr: '',          // 이메일 필드 인라인 에러(탈퇴 제한 등)
  agreeReq: false,       // [필수] 개인정보 동의
  agreeMkt: false,       // [선택] 마케팅 동의
  withdrawnEmail: null,  // 탈퇴한 이메일 (재가입 제한 대상)
  withdrawnUntil: null,  // 재가입 가능일(표시용 문자열, 탈퇴일+7일)
  myView: 'menu',        // 마이페이지 현재 뷰: menu | account | terms | withdraw
  myBackTo: 'main',      // 마이페이지 진입 직전 화면 (뒤로가기 목적지)
  langLabel: '한국어',    // 선택 언어 (MY01-C)
  currency: 'KRW',       // 선택 통화 코드 (MY01-D · Constants API)
  csMsgs: [],            // 고객지원 채팅 메시지 {who:'bot'|'me', text}
  csFaqOpen: true,       // 자주 묻는 질문 펼침 여부 (첫 질문 후 자동 접힘)
  earnSort: 'recent',    // 적립(MY02) 정렬: recent(최신 예약순) | checkin(체크인 임박순)
  // 자동완성 빈 입력 시 최근 검색 (최대 저장 10 · 화면 최대 3 · M01_D1-D)
  recentSearches: [
    {name:'후쿠오카', dates:'6.12 – 6.13', guest:'투숙객 2명 · 객실 1개'},
    {name:'오사카',   dates:'9.5 – 9.7',   guest:'투숙객 2명 · 객실 1개'},
    {name:'제주',     dates:'7.9 – 7.10',  guest:'투숙객 2명 · 객실 1개'},
  ],
  // ─ 결과페이지 정렬·필터 ─
  sort: 'popular',       // popular | price | rating
  aiFilterLabel: null,   // ✦ AI 필터 적용 여부(칩 활성용 · 버튼명은 유지)
  fStars: [],            // 선택 성급 배열 (빈=전체)
  fTypes: [],            // 선택 숙소유형 배열 (빈=전체)
  fChains: [],           // 선택 브랜드·체인 배열 (빈=전체)
  fPriceMin: null,       // 최저 1박 가격
  fPriceMax: null,       // 최고 1박 가격
  fReview7: false,       // 리뷰 7.0+ 이상만
  fFeature: null,        // AI필터 시설 키워드(수영장 등)
  fTypeExp: false,       // 숙소유형 5개+더보기 펼침
  fChainExp: false,      // 브랜드체인 5개+더보기 펼침
  fB: null,              // 바텀시트 조작 중 임시 필터(B) — [결과 N개 보기] 시 커밋
  pinnedHotel: null,     // 목적지로 호텔명 선택 시 결과 최상단 고정
  listShown: 10,         // 검색결과 노출 개수 (더보기 +10)
  otaShown: 5,           // 숙소상세 가격비교 노출 개수 (더보기 +5)
  acctMkt: false,        // 계정관리 마케팅 수신 토글
  // ─ 회원탈퇴 3단계 (MY05) ─
  wdStep: 'auth',        // auth(이메일인증) | reason(사유선택) | done(완료)
  wdCodeSent: false,     // 인증코드 발송 여부
  wdCode: '',            // 입력 중인 코드
  wdVerified: false,     // 인증코드 확인 완료(6자리 입력 → ✓)
  wdReasons: [],         // 선택한 탈퇴 사유 인덱스
};

/* 탭바를 노출할 화면 */
const TABBAR_SCREENS = ['main','earn'];

/* ═══════════ 합계 ═══════════ */
const approvedTotal = () => state.cashbackItems.filter(i=>i.earnStatus==='approved').reduce((s,i)=>s+i.amount,0);
const waitingTotal  = () => state.cashbackItems.filter(i=>i.earnStatus==='waiting').reduce((s,i)=>s+i.amount,0);
const won = n => n.toLocaleString('ko-KR');

/* ═══════════ 네비게이션 ═══════════ */
function go(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const el = document.getElementById('scr-'+id);
  if(el) el.classList.add('active');
  // 탭바 노출 여부
  const tabbar = document.getElementById('tabbar');
  tabbar.classList.toggle('hidden', !TABBAR_SCREENS.includes(id));
  // 탭 active
  document.querySelectorAll('.tab[data-tab]').forEach(t=>t.classList.toggle('active', t.dataset.tab===id));
  if(id==='main') renderMain();
  if(id==='mypage') renderMypage();
  if(id==='earn') renderEarn();
  renderDemoState();
}
function tabGo(id){ go(id); }

/* ═══════════ 메인 렌더 ═══════════ */
function renderMain(){
  const gnb = document.getElementById('gnb');
  const welcome = document.getElementById('welcome');
  if(state.loggedIn){
    const ap = approvedTotal();
    gnb.innerHTML = `
      <div class="gnb-avatar" onclick="openMyView('menu')">👤</div>
      <div class="gnb-hi">반가워요! 👋</div>
      <button class="gnb-cash" onclick="go('earn')">
        <span class="coin">🪙</span>
        ${ ap>0 ? `<span class="amt">${won(ap)}</span>` : `<span class="teaser">예약하고 최대 혜택받기</span>` }
      </button>`;
    welcome.style.display='none';
  } else {
    gnb.innerHTML = `
      <button class="gnb-login" onclick="openLogin()">👤 로그인</button>
      <button class="gnb-cash" onclick="go('earn')">
        <span class="coin">💰</span>
        <span class="teaser">로그인 후 최대 혜택 적립</span>
      </button>`;
    welcome.style.display='none';
  }
  // 검색폼 값
  const fDest = document.getElementById('fDest');
  if(state.destination){ fDest.textContent = state.destination; fDest.classList.remove('ph'); }
  else { fDest.textContent = '도시 또는 호텔명'; fDest.classList.add('ph'); }
  document.getElementById('fDate').textContent = state.dateStr;
  document.getElementById('fGuest').textContent = state.guestStr;

  // 최근 검색 제거 (메인 바디 비움)
  const body = document.getElementById('mainBody');
  if(body) body.innerHTML='';
}

/* ═══════════ 검색 진입 (2단계) ═══════════ */

// ── 메인 AI 검색바 (인라인 입력) ──
function submitAISearch(){
  const v = document.getElementById('mainQ').value.trim();
  runSearch('ai', v);
}
function renderMainChips(){
  // 20개 풀에서 새로고침(렌더)마다 랜덤 4개 (자연어검색 v0.4 4-2절)
  const pool = SUGGEST_QUESTIONS.slice().sort(()=>Math.random()-0.5).slice(0,4);
  document.getElementById('mainChips').innerHTML =
    pool.map(q=>`<span class="mchip" onclick="runSearch('ai','${q}')">✦ ${q}</span>`).join('');
}

// ── 폼 검색(ⓑ) ──
function submitFormSearch(){
  if(!state.destination){ toast('목적지를 먼저 선택해주세요'); openAC(); return; }
  runSearch('form', state.destination);
}

/* ═══ 목적지 자동완성 (m01_main M01-B) ═══ */
function openAC(){
  const inp=document.getElementById('acInput'); inp.value=''; renderAC('');
  openOvl('ovl-ac'); setTimeout(()=>inp.focus(),120);
}
function acClear(){ const inp=document.getElementById('acInput'); inp.value=''; renderAC(''); inp.focus(); }
function renderAC(q){
  q=(q||'').trim();
  const body=document.getElementById('acBody');
  if(!q){
    // M01_D1-D: 최근 검색(최대 3) + 인기도시(10 고정)
    const rec = state.recentSearches.slice(0,3);
    let html='';
    if(rec.length){
      html += `<div class="ac-sec ac-sec-row"><span>최근 검색</span><span class="ac-clear" onclick="clearRecents()">전체 삭제</span></div>`;
      html += rec.map((r,i)=>`
        <div class="ac-row ac-recent">
          <div class="ac-ibox ac-recent-ic" onclick="pickRecent('${r.name}','${r.type||'city'}')">${r.type==='hotel'?'🏨':'🕐'}</div>
          <div class="ac-info" onclick="pickRecent('${r.name}','${r.type||'city'}')"><div class="ac-name">${r.name}</div><div class="ac-sub">${r.dates} · ${r.guest}</div></div>
          <button class="ac-del" onclick="event.stopPropagation();removeRecent(${i})">✕</button>
        </div>`).join('');
    }
    html += `<div class="ac-sec">인기도시</div>` + POPULAR_DEST.map(p=>`
      <div class="ac-row" onclick="chooseDest('${p.name}','city')">
        <div class="ac-ibox ac-city">📍</div>
        <div class="ac-info"><div class="ac-name">${p.name}</div><div class="ac-sub">${p.sub}</div></div>
      </div>`).join('');
    body.innerHTML = html;
    return;
  }
  const res = AUTOCOMPLETE.filter(a=>a.name.includes(q)||a.sub.includes(q))
                          .sort((a,b)=>AC_TYPE_ORDER[a.type]-AC_TYPE_ORDER[b.type]);
  if(!res.length){ body.innerHTML=`<div class="ac-empty">'${q}' 검색 결과가 없어요</div>`; return; }
  body.innerHTML = `<div class="ac-sec">검색 결과</div>` + res.map(a=>acRow(a,q)).join('');
}
function acRow(a,q){
  const nm = q ? a.name.split(q).join(`<strong>${q}</strong>`) : a.name;
  return `<div class="ac-row" onclick="chooseDest('${a.name}','${a.type}')">
    <div class="ac-ibox ac-${a.type}">${AC_ICON[a.type]}</div>
    <div class="ac-info"><div class="ac-name">${nm}</div><div class="ac-sub">${a.sub}</div></div></div>`;
}
/* 최근 검색 (M01_D1-D · 저장 최대 10, 화면 최대 3) */
function addRecent(name, type){
  if(!name) return;
  const dates=state.dateStr.replace(/월 /g,'.').replace(/일/g,'').replace(/\s/g,'');
  state.recentSearches = state.recentSearches.filter(r=>r.name!==name);
  state.recentSearches.unshift({name, type:type||'city', dates, guest:state.guestStr});
  if(state.recentSearches.length>10) state.recentSearches.length=10;
}
function removeRecent(i){ state.recentSearches.splice(i,1); renderAC(''); }
function clearRecents(){ state.recentSearches=[]; renderAC(''); }
/* 최근검색 탭 = 완결된 검색 → 바로 재검색·S01 갱신 (메인/결과 공통) */
function pickRecent(name, type){
  state.destination=name; state.destType=type||'city';
  state.pinnedHotel = (type==='hotel') ? name : null;
  closeOvl();
  runSearch('form', name);
}
function chooseDest(name, type){
  state.destination=name;
  state.destType = type||'city';
  state.pinnedHotel = (type==='hotel') ? name : null;   // 호텔명 선택 시 결과 최상단 고정
  closeOvl(); renderMain(); toast(`목적지: ${name}`);
  if(onResults()){ state.searchExpanded=true; renderCond(); }
}
function onResults(){ return document.getElementById('scr-results').classList.contains('active'); }
function reRenderResults(){ showLoading(()=>{ renderResults(); }); }

/* ═══ 날짜 캘린더 (M01-C) ═══ */
const CAL_MONTHS=[{y:2026,mo:7},{y:2026,mo:8}];
let calSel={in:null,out:null};
function openCal(){ renderCal(); openOvl('ovl-cal'); }
function renderCal(){
  document.getElementById('calBody').innerHTML = CAL_MONTHS.map(m=>monthHTML(m.y,m.mo)).join('');
  updateCalSum();
}
function monthHTML(y,mo){
  const first=new Date(y,mo-1,1).getDay(), days=new Date(y,mo,0).getDate();
  let cells='';
  for(let i=0;i<first;i++) cells+=`<div class="cal-cell empty"></div>`;
  for(let d=1;d<=days;d++){
    const iso=`${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    let cls='cal-cell';
    if(iso===calSel.in) cls+=' sel';
    if(iso===calSel.out) cls+=' sel';
    if(calSel.in&&calSel.out&&iso>calSel.in&&iso<calSel.out) cls+=' inrange';
    cells+=`<div class="${cls}" onclick="calPick('${iso}')">${d}</div>`;
  }
  return `<div class="cal-month"><div class="cal-mtit">${y}년 ${mo}월</div>
    <div class="cal-wk"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>
    <div class="cal-grid">${cells}</div></div>`;
}
function calPick(iso){
  if(!calSel.in || (calSel.in&&calSel.out) || iso<=calSel.in) calSel={in:iso,out:null};
  else calSel.out=iso;
  renderCal();
}
const dLabel=iso=>{const p=iso.split('-');return `${+p[1]}월 ${+p[2]}일`;};
function updateCalSum(){
  const s=document.getElementById('calSum');
  if(calSel.in&&calSel.out){ const n=Math.round((new Date(calSel.out)-new Date(calSel.in))/86400000); s.textContent=`${dLabel(calSel.in)} – ${dLabel(calSel.out)} · ${n}박`; }
  else if(calSel.in){ s.textContent=`${dLabel(calSel.in)} – 체크아웃 날짜를 선택하세요`; }
  else s.textContent='체크인 – 체크아웃 날짜를 선택하세요';
}
function applyDates(){
  if(!calSel.in||!calSel.out){ toast('체크인·체크아웃 날짜를 모두 선택해주세요'); return; }
  state.nights = Math.max(1, Math.round((new Date(calSel.out)-new Date(calSel.in))/86400000));
  state.dateStr=`${dLabel(calSel.in)} – ${dLabel(calSel.out)}`;
  document.getElementById('fDate').textContent=state.dateStr;
  closeOvl(); toast('날짜가 적용됐어요'); if(onResults()){ state.searchExpanded=true; renderCond(); } else if(onDetail()){ state.dPanelOpen=true; renderDPanel(); }
}

/* ═══ 인원·객실 (M01-D · 객실별 독립 설정) ═══ */
// rooms: [{adults, children:[age,...]}]  · 제약: 객실당 성인≥1 / 아동≤4 / 총≤8명 / 최대 8객실
let guest = { rooms:[{adults:2, children:[]}] };
function openGuest(){ renderGuest(); openOvl('ovl-guest'); }
function renderGuest(){
  const body=document.getElementById('guestBody');
  body.innerHTML =
    guest.rooms.map((r,ri)=>roomCard(r,ri)).join('') +
    (guest.rooms.length<8 ? `<button class="g-addroom" onclick="addRoom()">＋ 객실 추가</button>` : '') +
    `<button class="g-reset" onclick="resetGuest()">↺ 초기화</button>`;
}
function roomCard(r,ri){
  const total = r.adults + r.children.length;
  const ages = r.children.map((age,ci)=>`
    <select class="g-age" onchange="setChildAge(${ri},${ci},this.value)">
      ${Array.from({length:18},(_,a)=>`<option value="${a}" ${+age===a?'selected':''}>만 ${a}세</option>`).join('')}
    </select>`).join('');
  return `<div class="g-room">
    <div class="g-rtit">객실 ${ri+1}${guest.rooms.length>1?`<span class="g-rdel" onclick="delRoom(${ri})">삭제</span>`:''}</div>
    <div class="g-row">
      <div class="g-lb">성인<small>만 18세 이상</small></div>
      <div class="g-ctrl">
        <button ${r.adults<=1?'disabled':''} onclick="stepAdult(${ri},-1)">−</button>
        <span>${r.adults}</span>
        <button ${total>=8?'disabled':''} onclick="stepAdult(${ri},1)">＋</button>
      </div>
    </div>
    <div class="g-row">
      <div class="g-lb">아동<small>만 0~17세</small></div>
      <div class="g-ctrl">
        <button ${r.children.length<=0?'disabled':''} onclick="stepChild(${ri},-1)">−</button>
        <span>${r.children.length}</span>
        <button ${(r.children.length>=4||total>=8)?'disabled':''} onclick="stepChild(${ri},1)">＋</button>
      </div>
    </div>
    ${r.children.length?`<div class="g-ages">${ages}</div>`:''}
  </div>`;
}
function stepAdult(ri,d){ const r=guest.rooms[ri]; const t=r.adults+r.children.length;
  if(d>0&&t>=8)return; if(d<0&&r.adults<=1)return; r.adults+=d; renderGuest(); }
function stepChild(ri,d){ const r=guest.rooms[ri]; const t=r.adults+r.children.length;
  if(d>0){ if(r.children.length>=4||t>=8)return; r.children.push(0); }
  else { if(!r.children.length)return; r.children.pop(); } renderGuest(); }
function setChildAge(ri,ci,v){ guest.rooms[ri].children[ci]=+v; }
function addRoom(){ if(guest.rooms.length<8){ guest.rooms.push({adults:2,children:[]}); renderGuest(); } }
function delRoom(ri){ guest.rooms.splice(ri,1); renderGuest(); }
function resetGuest(){ guest={rooms:[{adults:2,children:[]}]}; renderGuest(); }
function applyGuest(){
  const adults=guest.rooms.reduce((s,r)=>s+r.adults,0);
  const kids=guest.rooms.reduce((s,r)=>s+r.children.length,0);
  const rooms=guest.rooms.length;
  state.guestStr=`성인 ${adults}명${kids?` · 아동 ${kids}명`:''} · 객실 ${rooms}개`;
  document.getElementById('fGuest').textContent=state.guestStr;
  closeOvl(); toast('인원이 적용됐어요'); if(onResults()){ state.searchExpanded=true; renderCond(); } else if(onDetail()){ state.dPanelOpen=true; renderDPanel(); }
}

/* ═══ 오버레이 공통 ═══ */
function openOvl(id){ document.getElementById(id).classList.add('show'); }
function closeOvl(){ document.querySelectorAll('.ovl').forEach(o=>o.classList.remove('show')); }
function focusReInput(){ const el=document.getElementById('reInput'); if(el){el.focus();} }

// 공통 검색 실행
function runSearch(mode, query){
  if(mode==='ai' && query && /맛집|항공|비행기|렌터카|관광|명소|버스|기차|지하철|날씨/.test(query)){
    toast('저는 호텔 검색만 도와드릴 수 있어요'); return;
  }
  state.entryMode = mode;
  let city, recName, recType;
  if(mode==='form'){
    city = state.destination; recName = city; recType = state.destType;
  } else { // ai
    const q = (query||'').trim();
    // 호텔명 인식: 자동완성 호텔 + 전체 HOTELS 이름 중 입력에 포함된 것
    const hotelNames = AUTOCOMPLETE.filter(a=>a.type==='hotel').map(a=>a.name).concat(HOTELS.map(h=>h.name));
    const hm = hotelNames.find(nm => q.includes(nm));
    city = detectCity(q);
    const isCond = /조식|성급|원|이하|풀|수영|스파|주말|박|가격|평점/.test(q);  // 조건 변경형 후속 입력
    if(hm){                                   // ① 우리 DB 숙소명 → 해당 호텔 고정 + 최근검색 호텔명
      state.pinnedHotel=hm; state.randomCity=null;
      if(!city){ const a=AUTOCOMPLETE.find(x=>x.name===hm); city = a ? (a.sub.split('·')[0]||'').trim() : (state.destination||'서울'); }
      recName = hm; recType = 'hotel';
    } else if(city){                          // ② 도시 인식
      state.pinnedHotel=null; state.randomCity=null;
      recName = city; recType = 'city';
    } else if(q && !isCond){                  // ③ 미인식 장소/숙소명 → 입력값 그대로 최근검색
      state.pinnedHotel=null;
      city = state.destination || POPULAR_CITIES[Math.floor(Math.random()*POPULAR_CITIES.length)];
      if(!state.destination) state.randomCity = city;
      recName = q; recType = 'hotel';
    } else {                                  // ④ 조건 후속/빈 입력 → 도시 유지 또는 랜덤
      state.pinnedHotel=null;
      if(state.destination){ city = state.destination; state.randomCity=null; }
      else { city = POPULAR_CITIES[Math.floor(Math.random()*POPULAR_CITIES.length)]; state.randomCity = city; }
      recName = city; recType = 'city';
    }
  }
  state.destination = city;
  state.lastQuery = query || '';
  addRecent(recName, recType);   // 최근 검색 등록 (도시·숙소명 · M01_D1-D)
  showLoading(()=>{ go('results'); renderResults(); });
}

/* ── 로딩 2단계 ── */
function showLoading(done){
  const ld=document.getElementById('loading'), tx=document.getElementById('loadTxt');
  tx.textContent='찾는 중…'; ld.classList.add('show');
  setTimeout(()=>{ tx.textContent='검색 결과를 정리하고 있어요…'; }, 850);
  setTimeout(()=>{ ld.classList.remove('show'); done(); }, 1700);
}

/* ── 결과페이지 렌더 ── */
function renderResults(){
  document.getElementById('reInput').value='';
  state.searchExpanded = false;   // 새 검색 → 조건 영역은 축약 상태
  renderCond();

  const aiRec = document.getElementById('aiRec');
  const aiBanner = document.getElementById('aiBanner');

  if(state.entryMode==='ai'){
    aiBanner.innerHTML='';
    state.recFolded=false; state.recListExpanded=false;   // 새 검색 → 기본(2개 노출)
    aiRec.innerHTML = buildAIRec();
  } else {
    aiRec.innerHTML='';
    aiBanner.innerHTML = `
      <div class="aibanner" onclick="focusReInput()">
        <span class="bi">✦</span>
        <div class="bt"><b>AI로 검색해보세요</b><span>취향을 말하면 딱 맞는 호텔을 추천해드려요</span></div>
      </div>`;
  }

  // 새 검색 → 정렬·필터 초기화
  clearFilters();
  renderFilterChips();
  renderList();
  document.querySelector('.res-scroll').scrollTop=0;
}
/* 정렬·필터 */
const SORT_LABEL = { popular:'인기순', price:'가격 낮은순', rating:'평점 높은순' };
const PRICE_LO = Math.floor(Math.min(...HOTELS.map(h=>h.price))/5000)*5000;
const PRICE_HI = Math.ceil(Math.max(...HOTELS.map(h=>h.price))/5000)*5000;
function clearFilters(){
  state.sort='popular'; state.aiFilterLabel=null;
  state.fStars=[]; state.fTypes=[]; state.fChains=[]; state.fPriceMin=null; state.fPriceMax=null; state.fReview7=false; state.fFeature=null;
  state.fTypeExp=false; state.fChainExp=false; state.listShown=10;
}
function anyFilterActive(){
  return !!(state.fStars.length||state.fTypes.length||state.fChains.length||state.fPriceMin!=null||state.fPriceMax!=null||state.fReview7||state.aiFilterLabel);
}
const nightsTotal = p => p * state.nights;   // 박수 총액
// 캐시백 예상금액 (원화) — PERCENTAGE: 총액×value/100(10원 버림) / FLAT: value / NONE: 0
function cbWon(price, cb){
  if(!cb || cb.type==='NONE') return 0;
  return cb.type==='PERCENTAGE' ? Math.floor(price*state.nights*cb.value/100/10)*10 : cb.value;
}
// S02 공급사 행 배지 — PERCENTAGE: 💸 적립 예상 최대 N% / FLAT: 💸 적립 예상 최대 ₩N (정책 6-3절)
function cbS02Label(cb){
  if(!cb || cb.type==='NONE') return '';
  return cb.type==='PERCENTAGE' ? `💸 적립 예상 최대 ${cb.value}%` : `💸 적립 예상 최대 ${won(cb.value)}원`;
}
function typeList(){
  const m={}; HOTELS.forEach(h=>{ m[h.type]=(m[h.type]||0)+1; });
  return Object.entries(m).map(([name,cnt])=>({name,cnt})).sort((a,b)=>b.cnt-a.cnt);
}
function chainList(){
  const m={}; HOTELS.forEach(h=>{ m[h.chain]=(m[h.chain]||0)+1; });
  return Object.entries(m).map(([name,cnt])=>({name,cnt})).sort((a,b)=>b.cnt-a.cnt);
}
/* 필터 매칭 — committed(state) 또는 임시 fB 공용 */
function matchFilters(h, f){
  return (!f.fStars.length || f.fStars.includes(h.star)) &&
    (!f.fTypes.length || f.fTypes.includes(h.type)) &&
    (!f.fChains.length || f.fChains.includes(h.chain)) &&
    (f.fPriceMin==null || h.price>=f.fPriceMin) &&
    (f.fPriceMax==null || h.price<=f.fPriceMax) &&
    (!f.fReview7 || h.rating>=7.0) &&
    (!f.fFeature || new RegExp(f.fFeature).test(h.feat+h.tags.join()));
}
function committed(){ return {fStars:state.fStars,fTypes:state.fTypes,fChains:state.fChains,fPriceMin:state.fPriceMin,fPriceMax:state.fPriceMax,fReview7:state.fReview7,fFeature:state.fFeature}; }
function countWith(f){ return HOTELS.filter(h=>matchFilters(h,f)).length; }
function visibleHotels(){
  let arr = HOTELS.filter(h=>matchFilters(h, committed())).slice();
  if(state.sort==='price')       arr.sort((a,b)=>a.price-b.price);
  else if(state.sort==='rating') arr.sort((a,b)=>b.rating-a.rating);
  // 목적지로 호텔명 선택 시 결과 최상단 고정
  if(state.pinnedHotel){ const pi=arr.findIndex(h=>h.name===state.pinnedHotel); if(pi>0) arr.unshift(arr.splice(pi,1)[0]); }
  return arr;
}
/* 필터 칩 바 (AI필터 고정 · 정렬부터 가로 스크롤 · 각 칩=개별 시트) */
function renderFilterChips(){
  const el=document.getElementById('resFilters'); if(!el) return;
  state.listShown=10;   // 필터·정렬 변경 시 목록 처음부터
  const priceOn = state.fPriceMin!=null||state.fPriceMax!=null;
  // 정렬 칩 제거 → 전체필터(⚙) 시트에 편입 (v0.4). ⚙ 전체필터를 필터바 맨 앞(AI필터 우측)에 배치
  el.innerHTML =
    `<span class="chip chip-all ${anyFilterActive()?'on':''}" onclick="openFilterSheet()">⚙ 전체필터</span>`+
    `<span class="chip ${priceOn?'active':''}" onclick="openPriceSheet()">가격 ▾</span>`+
    `<span class="chip ${state.fStars.length?'active':''}" onclick="openStarSheet()">성급${state.fStars.length?' '+state.fStars.length:''} ▾</span>`+
    `<span class="chip ${state.fTypes.length?'active':''}" onclick="openTypeSheet()">숙소유형${state.fTypes.length?' '+state.fTypes.length:''} ▾</span>`+
    `<span class="chip ${state.fChains.length?'active':''}" onclick="openChainSheet()">브랜드·체인${state.fChains.length?' '+state.fChains.length:''} ▾</span>`+
    `<span class="chip ${state.fReview7?'active':''}" onclick="toggleReview7Chip()">리뷰 7.0+${state.fReview7?' ✓':''}</span>`;
  const ai=document.getElementById('resAiChip'); if(ai) ai.classList.toggle('on', !!state.aiFilterLabel);
}
/* 목록 렌더 (10개 + 더보기 +10 · 금액=1박가×박수 · 빈화면) */
function renderList(){
  const city = state.destination;
  const arr = visibleHotels();
  const el = document.getElementById('resList'); if(!el) return;
  if(!arr.length){
    el.innerHTML = `
      <div class="res-empty2">
        <div class="re2-ic">🔍</div>
        <div class="re2-t">조건에 맞는 호텔이 없어요</div>
        <div class="re2-d">필터를 조정하거나 초기화하면<br>더 많은 호텔을 볼 수 있어요.</div>
        <button class="re2-btn" onclick="resetFilters()">필터 초기화</button>
      </div>`;
    return;
  }
  const shown = arr.slice(0, state.listShown);
  const rest = arr.length - shown.length;
  el.innerHTML = `
    <div class="list-hd">조건에 맞는 호텔 ${arr.length}곳 <span class="lh-tax">· 세금·수수료 포함</span></div>
    ${shown.map(h=>`
      <div class="hcard" onclick="openDetail('${h.id}')">
        <div class="hc-img">🏨 ${h.rooms<=5?`<span class="hc-rooms">남은 객실 ${h.rooms}개</span>`:''}</div>
        <div class="hc-body">
          ${h.name===state.pinnedHotel?`<div class="hc-pin">🔎 검색하신 숙소</div>`:''}
          <div class="hc-top"><div class="hc-name">${h.name}</div><div class="hc-rate">★ ${h.rating}</div></div>
          <div class="hc-meta">${h.star}성급 · ${h.type} · ${h.chain}</div>
          <div class="hc-addr">${city} ${h.addr}</div>
          <div class="hc-price">${won(nightsTotal(h.price))}원 <small>/ ${state.nights}박</small></div>
        </div>
      </div>`).join('')}
    ${rest>0 ? `<button class="list-more" onclick="moreList()">목록 더보기 (${Math.min(10,rest)}개) ▽</button>` : ''}`;
}
function moreList(){ state.listShown += 10; renderList(); }
/* 정렬 바텀시트 (단일 선택) */
function openSortSheet(){
  document.getElementById('listTit').textContent='정렬';
  document.getElementById('listBody').innerHTML = Object.keys(SORT_LABEL).map(k=>{
    const on=state.sort===k;
    return `<div class="ls-item ${on?'on':''}" onclick="setSort('${k}')"><div class="ls-main"><div class="ls-name">${SORT_LABEL[k]}</div></div>${on?'<span class="ls-chk">✓</span>':''}</div>`;
  }).join('');
  document.getElementById('sheet-list').classList.add('show');
}
function setSort(k){ state.sort=k; closeListSheet(); renderFilterChips(); renderList(); toast(`${SORT_LABEL[k]} 정렬`); }
/* ═══ 필터 바텀시트 (B/A 커밋 · [결과 N개 보기] 탭 시에만 적용 · 개별/전체 공용) ═══ */
function snapshotFB(){
  state.fB = { fStars:[...state.fStars], fTypes:[...state.fTypes], fChains:[...state.fChains],
    fPriceMin:state.fPriceMin, fPriceMax:state.fPriceMax, fReview7:state.fReview7, fFeature:state.fFeature };
}
function fbCount(){ return countWith(state.fB || committed()); }
function applyFB(){ if(state.fB){ Object.assign(state, state.fB); state.fB=null; } closeListSheet(); renderFilterChips(); renderList(); }
function resetFB(scope){
  const f=state.fB; if(!f) return;
  if(scope==='all'||scope==='price'){ f.fPriceMin=null; f.fPriceMax=null; }
  if(scope==='all'||scope==='star')  f.fStars=[];
  if(scope==='all'||scope==='type')  f.fTypes=[];
  if(scope==='all'||scope==='chain') f.fChains=[];
  if(scope==='all'){ f.fReview7=false; f.fFeature=null; }
  reRenderSheet();
}
function fltFoot(scope){
  return `<div class="flt-foot"><button class="flt-reset" onclick="resetFB('${scope}')">초기화</button>`+
    `<button class="flt-apply" onclick="applyFB()">결과 ${fbCount()}개 보기</button></div>`;
}
/* 섹션 HTML (임시 fB 기준) */
function priceSecHTML(){
  const mn=state.fB.fPriceMin ?? PRICE_LO, mx=state.fB.fPriceMax ?? PRICE_HI;
  return `<div class="flt-sec" style="border-bottom:none;">
    <div class="flt-t">1박 가격</div>
    <div class="pr-wrap">
      <div class="pr-track"><div class="pr-fill" id="prFill"></div></div>
      <input type="range" id="prMin" class="pr-input" min="${PRICE_LO}" max="${PRICE_HI}" step="5000" value="${mn}" oninput="priceInput()">
      <input type="range" id="prMax" class="pr-input" min="${PRICE_LO}" max="${PRICE_HI}" step="5000" value="${mx}" oninput="priceInput()">
      <div class="pr-labels"><span id="prMinL">${won(mn)}원</span><span id="prMaxL">${won(mx)}${mx>=PRICE_HI?'+':''}원</span></div>
    </div></div>`;
}
function starSecHTML(){
  const stars=[5,4,3,2,1,0];
  return `<div class="flt-sec" style="border-bottom:none;">
    <div class="flt-t">성급 <small>(복수 선택)</small></div>
    <div class="flt-chips">${stars.map(s=>`<span class="flt-chip ${state.fB.fStars.includes(s)?'on':''}" onclick="toggleStar(${s})">${s===0?'성급없음':'★'.repeat(s)}</span>`).join('')}</div></div>`;
}
function typeSecHTML(){
  return `<div class="flt-sec" style="border-bottom:none;">
    <div class="flt-t">숙소유형 <small>(복수 선택)</small></div>
    <div class="flt-chips">${fltChipsHTML(typeList(), state.fB.fTypes, 'toggleType', state.fTypeExp, 'expandType')}</div></div>`;
}
function chainSecHTML(){
  return `<div class="flt-sec" style="border-bottom:none;">
    <div class="flt-t">브랜드·체인 <small>(복수 선택)</small></div>
    <div class="flt-chips">${fltChipsHTML(chainList(), state.fB.fChains, 'toggleChain', state.fChainExp, 'expandChain')}</div></div>`;
}
function reviewSecHTML(){
  return `<div class="flt-sec" style="border-bottom:none;">
    <div class="flt-toggle-row"><span class="flt-t" style="margin:0;">리뷰 7.0점 이상만 보기</span>
    <div class="flt-toggle ${state.fB.fReview7?'on':''}" onclick="toggleReview7()"><span class="ft-knob"></span></div></div></div>`;
}
/* 전체필터 시트 상단 정렬 섹션 (v0.4 — 정렬 칩 폐지·전체필터로 편입) */
function sortSecHTML(){
  return `<div class="flt-sec">
    <div class="flt-t">정렬</div>
    <div class="flt-chips">${Object.keys(SORT_LABEL).map(k=>`<span class="flt-chip ${state.sort===k?'on':''}" onclick="setSortInSheet('${k}')">${SORT_LABEL[k]}</span>`).join('')}</div>
  </div>`;
}
function setSortInSheet(k){ state.sort=k; renderFilterChips(); renderList(); reRenderSheet(); }
function allSecHTML(){ return sortSecHTML()+priceSecHTML()+starSecHTML()+typeSecHTML()+chainSecHTML()+reviewSecHTML(); }
const SHEET_MAP = { price:priceSecHTML, star:starSecHTML, type:typeSecHTML, chain:chainSecHTML, all:allSecHTML };
/* 개별/전체 시트 오픈 (스냅샷 → 조작은 임시 fB, [결과 N개 보기] 시 커밋) */
function openSheetWith(scope, title){
  snapshotFB(); state.curSheet=scope;
  document.getElementById('listTit').textContent=title;
  document.getElementById('listBody').innerHTML = SHEET_MAP[scope]() + fltFoot(scope);
  document.getElementById('sheet-list').classList.add('show');
  updatePriceFill();
}
function openPriceSheet(){ openSheetWith('price','1박 가격 범위'); }
function openStarSheet(){  openSheetWith('star','성급'); }
function openTypeSheet(){  openSheetWith('type','숙소유형'); }
function openChainSheet(){ openSheetWith('chain','브랜드·체인'); }
function openFilterSheet(){ openSheetWith('all','필터'); }
function reRenderSheet(){
  const fn=SHEET_MAP[state.curSheet]||allSecHTML;
  document.getElementById('listBody').innerHTML = fn() + fltFoot(state.curSheet);
  updatePriceFill();
}
function updatePriceFill(){
  const f=document.getElementById('prFill'); if(!f||!state.fB) return;
  const mn=state.fB.fPriceMin ?? PRICE_LO, mx=state.fB.fPriceMax ?? PRICE_HI;
  const l=(mn-PRICE_LO)/(PRICE_HI-PRICE_LO)*100, r=(mx-PRICE_LO)/(PRICE_HI-PRICE_LO)*100;
  f.style.left=l+'%'; f.style.width=(r-l)+'%';
}
function priceInput(){
  if(!state.fB) return;
  let mn=+document.getElementById('prMin').value, mx=+document.getElementById('prMax').value;
  if(mn>mx){ const t=mn; mn=mx; mx=t; }
  state.fB.fPriceMin = mn<=PRICE_LO ? null : mn;
  state.fB.fPriceMax = mx>=PRICE_HI ? null : mx;
  document.getElementById('prMinL').textContent=won(mn)+'원';
  document.getElementById('prMaxL').textContent=won(mx)+(mx>=PRICE_HI?'+':'')+'원';
  updatePriceFill();
  const ap=document.querySelector('.flt-apply'); if(ap) ap.textContent=`결과 ${fbCount()}개 보기`;
}
/* 5개 노출 + N개 더보기/접기 (숙소유형·브랜드체인 공용) */
function fltChipsHTML(list, sel, fn, expanded, expFn){
  const shown = expanded ? list : list.slice(0,5);
  let html = shown.map(t=>`<span class="flt-chip ${sel.includes(t.name)?'on':''}" onclick="${fn}('${t.name}')">${t.name} <em>${t.cnt}</em></span>`).join('');
  if(list.length>5) html += `<span class="flt-more" onclick="${expFn}()">${expanded?'접기 ▲':`+${list.length-5}개 더보기 ▾`}</span>`;
  return html;
}
function toggleStar(s){ const a=state.fB.fStars,i=a.indexOf(s); i>=0?a.splice(i,1):a.push(s); reRenderSheet(); }
function toggleType(t){ const a=state.fB.fTypes,i=a.indexOf(t); i>=0?a.splice(i,1):a.push(t); reRenderSheet(); }
function toggleChain(c){ const a=state.fB.fChains,i=a.indexOf(c); i>=0?a.splice(i,1):a.push(c); reRenderSheet(); }
function expandType(){ state.fTypeExp=!state.fTypeExp; reRenderSheet(); }
function expandChain(){ state.fChainExp=!state.fChainExp; reRenderSheet(); }
function toggleReview7(){ state.fB.fReview7=!state.fB.fReview7; reRenderSheet(); }
function toggleReview7Chip(){ state.fReview7=!state.fReview7; renderFilterChips(); renderList(); toast(state.fReview7?'리뷰 7.0+ 이상만':'리뷰 필터 해제'); }
function resetFilters(){ clearFilters(); renderFilterChips(); renderList(); toast('필터 초기화'); }
/* ✦ AI 필터 바텀시트 — 결과 좁힘 / 지역명은 재검색 인계 (버튼명은 항상 유지) */
function openAiFilterSheet(){
  document.getElementById('listTit').textContent='✦ AI 필터';
  document.getElementById('listBody').innerHTML = `
    <div class="aif-guide">찾으시는 조건을 자연어로 입력하세요.<br>· 성급·가격·시설 → <b>결과 좁힘</b> · 지역 변경 → <b>새로 검색</b></div>
    <div class="aif-inp"><span>✦</span><input id="aifInput" placeholder="예: 수영장 있는 5성급 / 20만원 이하" onkeydown="if(event.key==='Enter')submitAiFilter(this.value)"></div>
    <div class="aif-chips">
      <span class="aif-chip" onclick="submitAiFilter('5성급')">5성급만</span>
      <span class="aif-chip" onclick="submitAiFilter('수영장')">수영장·스파</span>
      <span class="aif-chip" onclick="submitAiFilter('조식')">조식 포함</span>
      <span class="aif-chip" onclick="submitAiFilter('20만원 이하')">20만원 이하</span>
      <span class="aif-chip" onclick="submitAiFilter('오사카로')">오사카로 (지역변경)</span>
    </div>
    ${state.aiFilterLabel?`<button class="aif-clear" onclick="clearAiFilter()">현재 AI 필터 해제 — "${state.aiFilterLabel}"</button>`:''}`;
  document.getElementById('sheet-list').classList.add('show');
  setTimeout(()=>{const el=document.getElementById('aifInput'); if(el)el.focus();},150);
}
function submitAiFilter(v){
  v=(v||'').trim(); if(!v) return;
  closeListSheet();
  const city = detectCity(v) || AUTOCOMPLETE.find(a=>a.type==='city'&&v.includes(a.name))?.name;
  if(city){ toast(`"${v}" → ${city} 새로 검색`); state.entryMode='ai'; runSearch('ai', v); return; }
  state.fStars=[]; state.fTypes=[]; state.fChains=[]; state.fPriceMin=null; state.fPriceMax=null; state.fFeature=null; state.fReview7=false;
  if(/5성/.test(v)) state.fStars=[5];
  else if(/4성/.test(v)) state.fStars=[4];
  if(/수영|풀|스파/.test(v)) state.fFeature='수영|풀|스파|인피니티';
  if(/조식/.test(v)) state.fFeature='조식';
  if(/20만|이하/.test(v)) state.fPriceMax=200000;
  if(/30만/.test(v)) state.fPriceMax=300000;
  state.aiFilterLabel=v;
  renderFilterChips(); renderList(); toast(`AI 필터 적용: "${v}"`);
}
function clearAiFilter(){ closeListSheet(); clearFilters(); renderFilterChips(); renderList(); toast('AI 필터 해제'); }

/* AI 추천영역 빌드 (기본 2개 노출 + 더보기, 섹션 접기) */
function buildAIRec(){
  const city = state.destination;
  // AI 추천 = 평점(guestRating) 높은 순 재정렬 상위 5 (전체 목록 인기순과 다른 순서) · 리뷰수 로직은 백엔드 (v0.4 #21)
  const top5 = HOTELS.slice().sort((a,b)=>b.rating-a.rating).slice(0,5);
  // 지명 미입력(랜덤 도시) vs 지명 검색 → 요약 문구 분기 (자연어검색 v0.3 7-2절)
  const sumHTML = state.randomCity
    ? `<div class="airec-sum">지역을 안 정하셔서 인기 도시 <b>${city}</b>로 먼저 보여드려요. 후기·평점 좋은 순으로 <b>5곳</b>을 추려봤어요.</div>
       <div class="airec-note">📍 위 검색창에서 원하는 지역으로 바꿀 수 있어요.</div>`
    : `<div class="airec-sum"><b>${city}</b> 조건에 맞춰 후기·평점 좋은 순으로 <b>5곳</b>을 추려봤어요.</div>`;
  const showN = state.recListExpanded ? 5 : 2;
  const items = top5.slice(0,showN).map((h)=>`
    <div class="airec-item" onclick="openDetail('${h.id}')">
      <div class="airec-thumb">🏨</div>
      <div class="airec-tx">
        <div class="airec-name">${h.name}</div>
        <div class="airec-meta"><span class="rate">${h.rating}</span> · <span class="stars">${'★'.repeat(h.star)}</span> · ${h.addr}</div>
        <div class="airec-feat">✦ ${h.feat}</div>
      </div>
    </div>`).join('');
  const moreBtn = top5.length>2
    ? `<div class="airec-more" onclick="toggleRecList()">${state.recListExpanded?'접기 ▲':`추천 ${top5.length-2}곳 더 보기 ▼`}</div>` : '';
  return `
    <div class="airec">
      <div class="airec-hd">
        <div class="tt">✦ AI 추천</div>
        <button class="airec-fold" onclick="toggleAIRec()">${state.recFolded?'펼치기 ▼':'접기 ▲'}</button>
      </div>
      ${sumHTML}
      <div class="airec-body" ${state.recFolded?'style="display:none"':''}>
        <div class="airec-list">${items}</div>
        ${moreBtn}
        <div class="airec-disc">AI 추천은 실제와 다를 수 있어요. 예약 전 상세 정보를 확인해 주세요.</div>
      </div>
    </div>`;
}
/* 재검색 축약 요약 — 날짜·총인원·객실 (검색결과·숙소상세 공통) */
function condSummary(){
  const persons=guest.rooms.reduce((s,r)=>s+r.adults+r.children.length,0);
  const rooms=guest.rooms.length;
  const dateShort=state.dateStr.replace(/월 /g,'.').replace(/일/g,'').replace(/\s/g,'');
  return `📅 ${dateShort} · 👤 ${persons} · 🛏 ${rooms}`;
}
/* 결과 조건 영역: 축약 바(2줄) ↔ 검색폼(메인과 동일 구조) */
function renderCond(){
  const el=document.getElementById('resCond'); if(!el) return;
  if(!state.searchExpanded){
    el.innerHTML=`
      <div class="r-cond" onclick="expandCond()">
        <div class="rc-query">📍 ${state.destination}</div>
        <div class="rc-line2">
          <span class="rc-sum">${condSummary()}</span>
          <button class="rc-btn" onclick="event.stopPropagation();expandCond()">∨</button>
        </div>
      </div>`;
  } else {
    el.innerHTML=`
      <div class="cond-lead">검색 조건을 바꾼 뒤 [적용]을 눌러주세요</div>
      <div class="search-card cond-card">
        <div class="f-row" onclick="openAC()"><span class="f-ic">📍</span><div class="f-info"><div class="f-label lbl-dest">목적지</div><div class="f-val">${state.destination}</div></div></div>
        <div class="f-row" onclick="openCal()"><span class="f-ic">📅</span><div class="f-info"><div class="f-label lbl-date">날짜</div><div class="f-val">${state.dateStr}</div></div></div>
        <div class="f-row" onclick="openGuest()"><span class="f-ic">👤</span><div class="f-info"><div class="f-label lbl-guest">인원</div><div class="f-val">${state.guestStr}</div></div></div>
      </div>
      <button class="cond-apply" onclick="applyCondSearch()">조건 적용</button>
      <div class="cond-fold" onclick="collapseCond()">▲ 접기</div>`;
  }
}
function expandCond(){ state.searchExpanded=true; renderCond(); }
function collapseCond(){ state.searchExpanded=false; renderCond(); }
function applyCondSearch(){ state.searchExpanded=false; addRecent(state.destination, state.destType); reRenderResults(); }

function toggleAIRec(){ state.recFolded=!state.recFolded; document.getElementById('aiRec').innerHTML=buildAIRec(); }
function toggleRecList(){ state.recListExpanded=!state.recListExpanded; document.getElementById('aiRec').innerHTML=buildAIRec(); }
function doReSearch(){
  const q=document.getElementById('reInput').value.trim();
  if(!q){ toast('변경할 조건을 입력해주세요'); return; }
  runSearch('ai', q);
  toast('조건을 반영해 다시 찾았어요');
}
function doRecKeyword(k){ runSearch('ai', k); toast('조건 변경 재검색'); }

/* ═══ 숙소상세 (가격비교 · 타 OTA) ═══ */
function openDetail(id){
  const h = HOTELS.find(x=>x.id===id); if(!h) return;
  state.selectedHotel = h;
  // 이미지 스와이프 갤러리
  document.getElementById('dGallery').innerHTML = GALLERY_IMGS.map(s=>`<div class="d-slide" style="background:${s.g}" onclick="openGallery()">${s.e}</div>`).join('');
  document.getElementById('dCount').textContent = `1 / ${GALLERY_IMGS.length}`;
  document.getElementById('dGallery').scrollLeft = 0;
  document.getElementById('dName').textContent = h.name;
  document.getElementById('dLoc').textContent = `${state.destination} · ${h.addr}`;
  document.getElementById('dRate').textContent = `★ ${h.rating}`;
  state.dPanelOpen = false;
  renderDDate();
  const dd=document.getElementById('dDesc');
  dd.textContent = `${h.star}성급 호텔. ${h.feat}. 도심과 주요 관광지에 인접해 이동이 편리하며, 넓은 객실과 다양한 부대시설을 갖추고 있습니다. 비즈니스와 가족 여행 모두에 적합합니다.`;
  dd.classList.add('clamp');
  const dmore=dd.parentElement.querySelector('.d-textmore'); if(dmore){ dmore.style.display=''; dmore.textContent='더보기 ＋'; }
  document.getElementById('dAddr').textContent = `${state.destination} ${h.addr}`;
  state.otaShown=5; renderOtaRows();
  state.barsExpanded=false; renderBars();
  document.querySelector('.d-scroll').scrollTop=0;
  go('detail');
}
/* 가격비교 행 렌더 (5개 + 더보기 +5 · 금액 = 1박가 × 박수) */
function renderOtaRows(){
  const h=state.selectedHotel; if(!h) return;
  const rows=otaRowsFor(h);
  const shown=rows.slice(0, state.otaShown);
  const rest=rows.length-shown.length;
  document.getElementById('dOta').innerHTML =
    shown.map(r=>`
    <div class="ota-row" onclick="tryOutlink('${r.ota}','${h.id}')">
      <div class="ota-l">
        <div class="ota-name" style="color:${r.color}">${r.ota}${r.lowest?'<span class="ota-best">최저가</span>':''}</div>
        <div class="ota-room">${r.room}</div>
        <div class="ota-tags">${r.tags.map(t=>`<span>${t}</span>`).join('')}</div>
      </div>
      <div class="ota-r">
        <div class="ota-price">${won(r.price*state.nights)}원</div>
        ${r.cb&&r.cb.type!=='NONE'?`<div class="ota-cash">최대 ${won(cbWon(r.price,r.cb))} 적립</div>`:''}
      </div>
      <span class="ota-go">→</span>
    </div>`).join('')
    + (rest>0 ? `<button class="ota-more" onclick="moreOta()">다른 가격 더보기 (${Math.min(5,rest)}곳) ▽</button>` : '');
}
function moreOta(){ state.otaShown+=5; renderOtaRows(); }
/* 날짜바 요약 — 검색결과 조건바와 동일 컴포넌트(1줄: 날짜·인원·객실 + 강조 버튼) */
function renderDDate(){
  const bar=document.getElementById('dDate'); if(!bar) return;
  bar.innerHTML = `<span class="rc-sum">${condSummary()}</span><button class="rc-btn" onclick="event.stopPropagation();toggleDPanel()">${state.dPanelOpen?'∧':'∨'}</button>`;
}
/* 날짜바 탭 → 슬라이드다운 패널 열고닫기 (S02_D1-A) */
function toggleDPanel(){ state.dPanelOpen=!state.dPanelOpen; renderDPanel(); }
function renderDPanel(){
  const p=document.getElementById('dPanel'); if(!p) return;
  document.getElementById('dpDate').textContent = state.dateStr;
  document.getElementById('dpGuest').textContent = state.guestStr;
  p.classList.toggle('open', !!state.dPanelOpen);
  renderDDate();
}
/* [이 조건으로 다시 검색] → 패널 닫고 상세 재호출(더미) */
function applyDPanel(){
  state.dPanelOpen=false;
  const id = state.selectedHotel && state.selectedHotel.id; if(!id) return;
  renderDPanel();  // 패널 닫힘 반영
  loadingTransition('조건을 반영해 다시 불러오는 중…', ()=>{ openDetail(id); toast('조건을 반영해 다시 불러왔어요'); });
}
function onDetail(){ return document.getElementById('scr-detail').classList.contains('active'); }
function renderBars(){
  const el=document.getElementById('dBars'); if(!el) return;
  const show = state.barsExpanded ? REVIEW_CATS.length : 4;
  el.innerHTML = REVIEW_CATS.slice(0,show).map(c=>`
    <div class="d-bar"><span class="db-l">${c.name}</span><span class="db-t"><i style="width:${c.score*10}%"></i></span><span class="db-n">${c.score}</span></div>`).join('');
  const btn=document.getElementById('dBarsMore');
  if(btn) btn.textContent = state.barsExpanded ? '접기 ▲' : '전체 보기 ▽';
}
function toggleBars(){ state.barsExpanded=!state.barsExpanded; renderBars(); }
function openAmenitySheet(){
  document.getElementById('amenityBody').innerHTML = AMENITIES.map(g=>`
    <div class="am-cat">${g.cat}</div>
    <div class="am-items">${g.items.map(i=>`<div class="am-item">✓ ${i}</div>`).join('')}</div>`).join('');
  document.getElementById('sheet-amenity').classList.add('show');
}
function closeAmenitySheet(){ document.getElementById('sheet-amenity').classList.remove('show'); }

function toggleDesc(btn){ const p=document.getElementById('dDesc'); const clamped=p.classList.toggle('clamp'); btn.textContent=clamped?'더보기 ＋':'접기 －'; }

/* 이미지 스와이프 카운터 / 전체 갤러리 */
function onGalleryScroll(){
  const g=document.getElementById('dGallery'); if(!g||!g.clientWidth) return;
  const i=Math.round(g.scrollLeft/g.clientWidth)+1;
  document.getElementById('dCount').textContent=`${i} / ${GALLERY_IMGS.length}`;
}
function openGallery(){
  document.getElementById('galleryBody').innerHTML =
    `<div class="gal-grid">${GALLERY_IMGS.map(s=>`<div class="gal-cell" style="background:${s.g}">${s.e}</div>`).join('')}</div>`;
  openOvl('ovl-gallery');
}

/* ═══ 아웃링크 진입 — 비로그인이면 로그인 유도 모달 먼저 (login_modal) ═══ */
function tryOutlink(ota, hotelId){
  state.outOta = ota;
  state.outHotel = HOTELS.find(x=>x.id===hotelId);
  const o = OTA_LIST.find(x=>x.name===ota);
  state.outCb = o ? o.cashback : {type:'NONE',value:0};
  if(state.loggedIn){ openOutlink(); }     // 로그인 상태 → 바로 아웃링크(OUT01-A)
  else { openOutModal(); }                  // 비로그인 → 로그인 유도 모달 먼저
}
/* 로그인 유도 모달 — MODAL-A(캐시백 有) / MODAL-B(NONE) */
function openOutModal(){
  const h=state.outHotel, cb=state.outCb, total=h.price*state.nights;
  const hotelRow = `
    <div class="lm-hotel">
      <div class="lm-h-thumb">🏨</div>
      <div class="lm-h-info"><div class="lm-h-name">${h.name}</div><div class="lm-h-meta">${state.outOta} · ${state.dateStr} · ${state.nights}박 · ${state.guestStr}</div></div>
      <div class="lm-h-price">${won(total)}원</div>
    </div>`;
  const btns = `
    <button class="lm-login" onclick="loginFromModal()">회원가입 / 로그인</button>
    <button class="lm-skip" onclick="skipLogin()">이 혜택 없이 계속하기 →</button>`;
  let top;
  if(cb && cb.type!=='NONE'){   // MODAL-A
    const amt=cbWon(h.price, cb);
    const sub = cb.type==='PERCENTAGE' ? `판매가의 ${cb.value}% · 투숙완료 후 지급` : `투숙완료 후 지급`;
    top = `
      <div class="lm-cash">
        <div class="lm-cb-ic">💸</div>
        <div class="lm-cb-t">로그인하고 캐시백 받으세요!</div>
        <div class="lm-cb-a">최대 ${won(amt)}원 캐시백</div>
        <div class="lm-cb-s">${sub}</div>
      </div>`;
  } else {                       // MODAL-B (NONE)
    top = `
      <div class="lm-nocash">
        <div class="lm-nc-ic">🔐</div>
        <div class="lm-nc-t">로그인 후 예약하세요</div>
        <div class="lm-nc-s">로그인하면 예약 내역을 저장하고<br>향후 캐시백 혜택을 받을 수 있어요.</div>
      </div>`;
  }
  document.getElementById('outModalBody').innerHTML =
    `<div class="sheet-handle"></div>${top}${hotelRow}${btns}`;
  document.getElementById('modal-outlogin').classList.add('show');
}
function closeOutModal(){ document.getElementById('modal-outlogin').classList.remove('show'); }
function loginFromModal(){ closeOutModal(); state.pendingOutlink=true; openLogin(); }   // 로그인 후 아웃링크 진행
function skipLogin(){ closeOutModal(); openOutlink(); toast('비로그인으로 계속 — 캐시백 미적립'); }

/* 아웃링크 로딩 화면 */
function openOutlink(){ renderOutlink(); go('outlink'); }
function onOutlink(){ return document.getElementById('scr-outlink').classList.contains('active'); }
function renderOutlink(){
  const h=state.outHotel, ota=state.outOta, cb=state.outCb;
  const total=h.price*state.nights, guest=!state.loggedIn, secs=guest?6:3;
  const otaColor=(OTA_LIST.find(o=>o.name===ota)||{}).color||'#333';
  const card = `
    <div class="ol-card">
      <div class="ol-card-hotel">${h.name}</div>
      <div class="ol-card-row">
        <div class="ol-card-meta">${state.dateStr} (${state.nights}박) · ${state.guestStr}</div>
        <div class="ol-card-pw"><div class="ol-card-price">${won(total)}원</div><div class="ol-card-note">세금 포함</div></div>
      </div>
      <div class="ol-card-ota"><span class="ol-card-logo" style="background:${otaColor}">${ota}</span><span class="ol-card-room">${(otaRowsFor(h)[0]||{}).room||'스탠다드 더블룸'}</span></div>
    </div>`;
  // 로그인 회원 + 캐시백 有 → 예상 배너 / 비로그인 → FOMO + [로그인]
  const banner = (!guest && cb && cb.type!=='NONE')
    ? `<div class="ol-cb-banner"><span class="ol-cb-ic">💸</span><div><div class="ol-cb-amt">투숙완료 확인 시 최대 ${won(cbWon(h.price,cb))}원 캐시백 적립 예상</div><div class="ol-cb-desc">예약 금액 기준 예상값이며, 실제 금액은 체크아웃 후 확정됩니다.</div></div></div>`
    : '';
  const fomo = guest
    ? `<div class="ol-fomo"><span>⚠️</span><div class="ol-fomo-t">로그인 없이 이동하면 캐시백을 받을 수 없어요.</div></div>
       <button class="ol-login-cta" onclick="loginFromOutlink()">로그인하고 캐시백 받기</button>`
    : '';
  document.getElementById('olBody').innerHTML = `
    <div class="ol-gnb"><button class="ol-gnb-back" onclick="go('detail')">←</button><span class="ol-gnb-tit">가격 확인 중</span></div>
    <div class="ol-scroll">
      <div class="ol-brand">${ota.slice(0,1)}</div>
      <div class="ol-tit">${ota}(으)로 이동 중이에요</div>
      <div class="ol-sub">${secs}초 후 자동으로 이동합니다.${guest?'':'<br><b>예약만 완료하면 캐시백이 적립됩니다!</b>'}</div>
      <div class="ol-progress"><div class="ol-progress-track"><div class="ol-progress-fill ${guest?'g6':'g3'}"></div></div><div class="ol-progress-lb">예약 완료까지 창을 닫지 마세요</div></div>
      ${fomo}
      ${card}
      ${banner}
      <div class="ol-legal">allmy는 통신판매 중개업자로서 거래 당사자가 아닙니다.</div>
      <button class="ol-complete" onclick="bookComplete()">✅ (가상) 예약 완료 <span class="ol-demo-tag">데모</span></button>
    </div>`;
}
/* 비로그인 OUT01 → [로그인] 탭: 프로그레스 바 일시정지 + 로그인 바텀시트 (방안 A) */
function loginFromOutlink(){
  const f=document.querySelector('#olBody .ol-progress-fill'); if(f) f.classList.add('paused');
  state.outPaused=true; state.pendingOutlink=true;
  openLogin();
}
function bookComplete(){
  const h=state.outHotel, cb=state.outCb;
  if(!state.loggedIn){ toast('비로그인 예약은 캐시백이 적립되지 않아요'); go('main'); return; }
  if(!cb || cb.type==='NONE'){ toast('이 공급사는 캐시백을 제공하지 않아요'); go('main'); return; }
  addCashback(h, state.outOta, cbWon(h.price, cb));   // 캐시백 예상금액 반영
  toast('캐시백이 적립 예정으로 등록됐어요');
  go('earn');
}
/* 캐시백 1건 등록 (예약완료·데모 공용) */
function addCashback(h, ota, amt){
  state.cashbackItems.unshift({
    hotel:h.name, city:(state.destination||h.addr.split(' ')[0]||''), ota:ota||'Booking.com',
    dates:state.dateStr.replace(/월 /g,'.').replace(/일/g,'').replace(/\s/g,'').replace('–','~'),
    price:h.price, amount:amt,
    tripStatus:'upcoming', earnStatus:'waiting',
    bookingId:'AMT'+(240700+state.cashbackItems.length*137),
    bookingDate:'오늘', paymentMonth:'익월',
    g:'linear-gradient(135deg,#a1c4fd,#c2e9fb)', e:'🏨',
  });
}

/* ═══ 로그인·회원가입 바텀시트 (AUTH — 이메일→코드→[신규:약관동의]) ═══ */
function openLogin(){
  state.loginEmailVal='user@allmytour.com'; state.loginErr='';
  state.agreeReq=false; state.agreeMkt=false;
  renderLoginStep('email');
  document.getElementById('sheet-login').classList.add('show');
}
function closeLoginSheet(){
  document.getElementById('sheet-login').classList.remove('show');
  // OUT01에서 [로그인] 탭으로 일시정지된 경우: 취소 시 프로그레스 재개 (방안 A Resume)
  if(state.outPaused){
    state.outPaused=false; state.pendingOutlink=false;
    const f=document.querySelector('#olBody .ol-progress-fill'); if(f) f.classList.remove('paused');
  }
}
function renderLoginStep(step){
  const el=document.getElementById('loginStep');
  const tit=document.getElementById('loginSheetTit');
  if(tit) tit.textContent = step==='agree' ? '회원가입' : '로그인 / 회원가입';
  if(step==='email'){
    el.innerHTML = `
      <input id="loginEmail" class="login-inp ${state.loginErr?'err':''}" placeholder="이메일 주소" value="${state.loginEmailVal}"
             oninput="state.loginEmailVal=this.value; if(state.loginErr){state.loginErr='';renderLoginStep('email');}">
      ${state.loginErr?`<div class="login-err">⚠ ${state.loginErr}</div>`:''}
      <button class="sheet-cta ${state.loginErr?'dis':''}" onclick="requestCode()">인증코드 받기</button>
      <div class="login-sns">애플 · 구글 로그인 (Phase 2)</div>`;
  } else if(step==='code'){
    el.innerHTML = `
      <div class="login-guide"><b>${state.loginEmailVal}</b>(으)로<br>인증코드를 보냈어요 <span class="login-demo">데모: 아무 숫자 6자리</span></div>
      <input id="loginCode" class="login-inp" placeholder="● ● ● ● ● ●" maxlength="6" inputmode="numeric"
             oninput="if(this.value.length>=6)submitCode()">
      <button class="sheet-cta" onclick="submitCode()">확인</button>
      <div class="login-back" onclick="renderLoginStep('email')">← 이메일 변경</div>`;
    setTimeout(()=>{const c=document.getElementById('loginCode'); if(c)c.focus();},120);
  } else if(step==='agree'){
    const allOn = state.agreeReq && state.agreeMkt;
    el.innerHTML = `
      <div class="login-guide">거의 다 됐어요! 약관에 동의하고 가입을 완료해 주세요.</div>
      <div class="agree-box">
        <div class="agree-all" onclick="toggleAgreeAll()">
          <span class="chk ${allOn?'on':''}">✓</span><b>전체 동의</b>
        </div>
        <div class="agree-row" onclick="toggleAgree('req')">
          <span class="chk ${state.agreeReq?'on':''}">✓</span>
          <span class="agree-txt"><span class="agree-req">[필수]</span> 개인정보 수집·이용 동의</span>
          <span class="agree-view" onclick="event.stopPropagation();toast('약관 전문 (준비 중)')">보기</span>
        </div>
        <div class="agree-row" onclick="toggleAgree('mkt')">
          <span class="chk ${state.agreeMkt?'on':''}">✓</span>
          <span class="agree-txt"><span class="agree-opt">[선택]</span> 마케팅 수신 동의 (이메일·SMS)</span>
          <span class="agree-view" onclick="event.stopPropagation();toast('약관 전문 (준비 중)')">보기</span>
        </div>
      </div>
      <button class="sheet-cta ${state.agreeReq?'':'dis'}" onclick="${state.agreeReq?'signupComplete()':''}">가입완료</button>`;
  }
}
/* [인증코드 받기] — 탈퇴 재가입 제한(AUTH-B-WD) 체크 후 코드 단계로 */
function requestCode(){
  const email=(state.loginEmailVal||'').trim();
  if(!email.includes('@')){ state.loginErr='올바른 이메일 형식을 입력해주세요.'; renderLoginStep('email'); return; }
  if(state.withdrawnEmail && email===state.withdrawnEmail){
    state.loginErr=`회원탈퇴 후 7일간 재가입이 제한됩니다. ${state.withdrawnUntil} 이후 다시 시도해주세요.`;
    renderLoginStep('email'); return;
  }
  renderLoginStep('code');
}
/* 코드 6자리 완성 → 신규/기존 분기 (데모 토글로 판별) */
function submitCode(){
  if(state.nextIsNew){ renderLoginStep('agree'); }   // 신규 → AUTH-E 약관동의
  else { loginDone('로그인 완료 🎉'); }                // 기존 → 바로 완료
}
function toggleAgree(k){ if(k==='req')state.agreeReq=!state.agreeReq; else state.agreeMkt=!state.agreeMkt; renderLoginStep('agree'); }
function toggleAgreeAll(){ const all=state.agreeReq&&state.agreeMkt; state.agreeReq=!all; state.agreeMkt=!all; renderLoginStep('agree'); }
function signupComplete(){ if(!state.agreeReq)return; state.nextIsNew=false; loginDone('가입완료 🎉 환영합니다!'); }
function onEarn(){ return document.getElementById('scr-earn').classList.contains('active'); }
/* 로딩 오버레이 → 콜백 (페이지 전환용) */
function loadingTransition(text, done){
  const ld=document.getElementById('loading'), tx=document.getElementById('loadTxt');
  tx.textContent=text||'불러오는 중…'; ld.classList.add('show');
  setTimeout(()=>{ ld.classList.remove('show'); done(); }, 900);
}
function loginDone(msg){
  state.loggedIn=true;
  state.userEmail=(state.loginEmailVal||'user@allmytour.com').trim();
  const wasPending = state.pendingOutlink;   // closeLoginSheet가 초기화하기 전에 보존
  closeLoginSheet(); renderMain(); renderDemoState();
  if(wasPending){ state.pendingOutlink=false; toast(msg||'로그인 완료 🎉'); openOutlink(); return; }  // 유도 모달/OUT01 → 로그인 → 아웃링크(로그인 케이스) 재진입
  if(onOutlink()){ toast(msg||'로그인 완료 🎉'); renderOutlink(); return; }
  // 적립 탭에서 로그인 → 로딩 후 로그인 화면으로 전환
  if(onEarn()){ loadingTransition('내 캐시백을 불러오는 중…', ()=>{ renderEarn(); toast(msg||'로그인 완료 🎉'); }); return; }
  toast(msg||'로그인 완료 🎉');
}

/* ═══════════ 회원탈퇴 (마이페이지·데모 공용) — 7일 재가입 제한 설정 ═══════════ */
function withdrawAccount(){
  const email=(state.userEmail||state.loginEmailVal||'user@allmytour.com').trim();
  const d=new Date(); d.setDate(d.getDate()+7);
  state.withdrawnEmail=email;
  state.withdrawnUntil=`${d.getMonth()+1}월 ${d.getDate()}일`;
  state.loggedIn=false; state.userEmail=''; state.cashbackItems=[];
  renderMain(); renderDemoState();
}

/* ═══════════ 데모 컨트롤 ═══════════ */
function demoToggleLogin(){
  state.loggedIn = !state.loggedIn;
  if(state.loggedIn && !state.userEmail) state.userEmail='user@allmytour.com';
  renderMain(); renderEarn(); renderDemoState();
  toast(state.loggedIn ? '로그인 상태로 전환' : '비로그인 상태로 전환');
}
function demoToggleNew(){
  state.nextIsNew=!state.nextIsNew; renderDemoState();
  toast(state.nextIsNew ? '다음 로그인 = 신규회원 (약관동의 노출)' : '다음 로그인 = 기존회원');
}
function demoWithdraw(){ withdrawAccount(); go('main'); toast('회원탈퇴 처리 — 7일 재가입 제한 설정됨'); }
function demoSeedCashback(){
  const h=HOTELS[state.cashbackItems.length % HOTELS.length];
  const ota=OTA_LIST[state.cashbackItems.length % OTA_LIST.length].name;
  addCashback(h, ota, Math.round(h.price*0.02/10)*10);
  renderDemoState(); go('earn'); toast('데모 캐시백 1건 생성됨');
}
function clearWithdrawal(){ state.withdrawnEmail=null; state.withdrawnUntil=null; renderDemoState(); toast('탈퇴 재가입 제한 해제됨'); }

/* ═══════════ 적립 탭 (MY02-D1 · 나의 여행) ═══════════ */
// 여행 상태(자사 계산) / 적립 상태(KAYAK) 배지
const TRIP_BADGE = {
  staying:   {t:'투숙중',   c:'stay'},
  upcoming:  {t:'투숙예정', c:'up'},
  completed: {t:'투숙완료', c:'done'},
  cancelled: {t:'예약취소', c:'cxl'},
};
const EARN_BADGE = {
  waiting:  {t:'적립예정', c:'wait'},
  approved: {t:'적립완료', c:'ok'},
  refund:   {t:'회수',    c:'refund'},
};
const TRIP_CYCLE = ['staying','upcoming','completed','cancelled'];
// 여행상태 → 적립상태 매핑 (예약취소=회수 / 투숙완료=적립완료 / 투숙중·예정=적립예정)
function mapEarn(trip){ return trip==='cancelled' ? 'refund' : trip==='completed' ? 'approved' : 'waiting'; }

function renderEarn(){
  const el=document.getElementById('scr-earn');
  // ── 비로그인: 로그인 유도 (확정디자인) ──
  if(!state.loggedIn){ el.innerHTML = earnLoginGate(); renderSimPanel(); return; }
  const items=state.cashbackItems;
  const ap=approvedTotal(), wa=waitingTotal();
  // ── 로그인 + 빈 상태 ──
  if(!items.length){
    el.innerHTML = `${earnHero(ap,wa)}
      <div class="earn-body">
        <div class="earn-shdr"><span class="earn-stit">나의 여행</span><span class="earn-cnt">전체 0건</span></div>
        <div class="earn-empty">
          <div class="earn-empty-ic">🧳</div>
          <div class="earn-empty-t">아직 여행 내역이 없어요</div>
          <div class="earn-empty-d">예약 한 번이면 캐시백이 자동으로 쌓여요.<br>첫 여행을 떠나고 혜택을 받아보세요!</div>
          <button class="earn-empty-btn" onclick="go('main')">호텔 검색하기</button>
        </div>
      </div>`;
    renderSimPanel(); return;
  }
  // ── 로그인 + 내역 있음 ── (상태 그룹 고정 정렬)
  const cards=sortedTrips().map(({it,idx})=>tripCard(it,idx)).join('');
  el.innerHTML = `${earnHero(ap,wa)}
    <div class="earn-body">
      <div class="earn-shdr">
        <span class="earn-stit">나의 여행</span>
        <div class="earn-shdr-r">
          <button class="earn-sort" onclick="openEarnSort()">${EARN_SORT_LABEL[state.earnSort]} ▾</button>
          <span class="earn-cnt">전체 ${items.length}건</span>
        </div>
      </div>
      <div class="earn-scroll">${cards}</div>
    </div>`;
  renderSimPanel();
}
/* 상태 그룹 고정(투숙중→예정→완료→취소) + 그룹 내 정렬 (MY02-D1-B CN7) */
const EARN_SORT_LABEL = { recent:'최신 예약순', checkin:'체크인 임박순' };
const TRIP_ORDER = { staying:0, upcoming:1, completed:2, cancelled:3 };
function mmdd(s){ const x=(s||'').trim().split('.'); if(x.length<2) return 9999; return (+x[0])*100+(+x[1]); }
function bdateVal(it){ return it.bookingDate==='오늘' ? 99999 : mmdd(it.bookingDate); }
function checkinVal(it){ return mmdd((it.dates||'').split('~')[0]); }
function sortedTrips(){
  const arr = state.cashbackItems.map((it,idx)=>({it,idx}));
  arr.sort((a,b)=>{
    const g = (TRIP_ORDER[a.it.tripStatus]??9) - (TRIP_ORDER[b.it.tripStatus]??9);
    if(g) return g;
    if(state.earnSort==='checkin'){
      const grp = TRIP_ORDER[a.it.tripStatus]??9;
      return grp<=1 ? checkinVal(a.it)-checkinVal(b.it)   // 투숙중·투숙예정 → 체크인 빠른 순
                    : checkinVal(b.it)-checkinVal(a.it);  // 투숙완료·예약취소 → 최신순
    }
    return bdateVal(b.it)-bdateVal(a.it);                 // 최신 예약순
  });
  return arr;
}
function openEarnSort(){
  document.getElementById('listTit').textContent='정렬';
  document.getElementById('listBody').innerHTML = Object.keys(EARN_SORT_LABEL).map(k=>{
    const on=state.earnSort===k;
    return `<div class="ls-item ${on?'on':''}" onclick="setEarnSort('${k}')"><div class="ls-main"><div class="ls-name">${EARN_SORT_LABEL[k]}</div></div>${on?'<span class="ls-chk">✓</span>':''}</div>`;
  }).join('');
  document.getElementById('sheet-list').classList.add('show');
}
function setEarnSort(k){ state.earnSort=k; closeListSheet(); renderEarn(); toast(`${EARN_SORT_LABEL[k]} 정렬`); }
/* 초록 헤더 — 총액 = 적립완료(Approved) 누적 (정책서 10-2절) */
function earnHero(ap, wa){
  return `
    <div class="earn-hero">
      <div class="earn-hero-top"><button class="earn-hero-prof" onclick="openMyView('menu')">👤</button></div>
      <div class="earn-cherry" style="margin-top:2px;">🍒</div>
      <div class="earn-hero-lbl">지금까지 아낀 금액</div>
      <div class="earn-hero-num"><span class="coin">🪙</span> ${won(ap)}<span class="u">원</span></div>
      <div class="earn-hero-sum">
        <div class="ehs"><span>✅ 적립 완료</span><b>${won(ap)}원</b></div>
        <div class="ehs-div"></div>
        <div class="ehs"><span>🕐 적립 예정</span><b>${won(wa)}원</b></div>
      </div>
    </div>`;
}
/* 여행 카드 — 좌 썸네일 + 여행배지(좌상) + 호텔명·날짜 + 적립배지·금액(우하). 상태 변경은 좌측 시뮬레이터 */
function tripCard(it,i){
  const tb=TRIP_BADGE[it.tripStatus]||TRIP_BADGE.upcoming;
  const es=mapEarn(it.tripStatus), eb=EARN_BADGE[es];
  const cancelled = it.tripStatus==='cancelled';
  const amtHtml = cancelled
    ? `<span class="tc-amt refund">${won(it.amount)}원</span>`
    : `<span class="tc-amt ${es}">${won(it.amount)}원</span>`;
  return `
    <div class="trip-card ${cancelled?'cxl':''}" onclick="openTripDetail(${i})">
      <div class="tc-thumb" style="background:${it.g||'#c8d8e4'}">${it.e||'🏨'}</div>
      <div class="tc-body">
        <div class="tc-top">
          <span class="tc-badge tb-${tb.c}">${tb.t}</span>
          <span class="tc-name">${it.hotel}</span>
        </div>
        <div class="tc-date">${it.dates}</div>
        <div class="tc-bottom">
          <span class="tc-ebadge eb-${eb.c}">${eb.t}</span>
          ${amtHtml}
        </div>
      </div>
    </div>`;
}
/* 비로그인 로그인 유도 화면 (확정디자인 · 적립 로그인 전) */
function earnLoginGate(){
  return `
    <div class="earn-hero gate">
      <div class="earn-hero-top"><button class="earn-login" onclick="openLogin()">👤 로그인</button><button class="earn-set" onclick="openMyView('menu')">⚙️</button></div>
      <div class="earn-cherry lock">🍒<span class="lock-b">🔒</span></div>
      <div class="gate-head">로그인하고 내 캐시백을<br>확인해 보세요</div>
      <div class="gate-sub">예약만 해도 쌓이는 캐시백과 나의 여행 내역을<br>로그인 후 한눈에 볼 수 있어요.</div>
    </div>
    <div class="earn-body gate-body">
      <div class="gate-list">
        <div class="gate-item"><div class="gate-ic" style="background:#f0fdf4">🏷️</div><div class="gate-tx">예약만 해도 캐시백 자동 적립</div></div>
        <div class="gate-item"><div class="gate-ic" style="background:#fff1f1">🔥</div><div class="gate-tx">호텔별 <em>최대 7%</em> 캐시백 혜택</div></div>
        <div class="gate-item"><div class="gate-ic" style="background:#eff6ff">📍</div><div class="gate-tx">나의 여행·적립 내역 통합 관리</div></div>
      </div>
      <button class="gate-cta" onclick="openLogin()">바로 시작하기</button>
    </div>`;
}
/* 좌측 데모 패널 — 카드 상태 시뮬레이터 (여행상태 순환 → 적립상태 자동매핑) */
function cycleTrip(i){
  const it=state.cashbackItems[i]; if(!it) return;
  const idx=TRIP_CYCLE.indexOf(it.tripStatus);
  it.tripStatus=TRIP_CYCLE[(idx+1)%TRIP_CYCLE.length];
  it.earnStatus=mapEarn(it.tripStatus);
  renderEarn(); renderDemoState();
}
function renderSimPanel(){
  const el=document.getElementById('simPanel'); if(!el) return;
  if(!state.loggedIn){ el.innerHTML=`<div class="sim-empty">로그인 후 여행 카드 상태를 조정할 수 있어요</div>`; return; }
  if(!state.cashbackItems.length){ el.innerHTML=`<div class="sim-empty">여행 내역 없음 — [🧳 샘플 5건] 또는 [🪙 1건 생성]</div>`; return; }
  el.innerHTML = state.cashbackItems.map((it,i)=>{
    const tb=TRIP_BADGE[it.tripStatus], eb=EARN_BADGE[mapEarn(it.tripStatus)];
    return `<div class="sim-row">
      <div class="sim-name">${i+1}. ${it.hotel}</div>
      <button class="sim-cyc" onclick="cycleTrip(${i})">${tb.t} ▸</button>
      <span class="sim-earn se-${eb.c}">${eb.t}</span>
    </div>`;
  }).join('');
}
/* 샘플 5건 로드 (데모) */
function loadSampleTrips(){ state.cashbackItems = SAMPLE_TRIPS.map(t=>({...t, earnStatus:mapEarn(t.tripStatus)})); }
function demoLoadSamples(){
  if(!state.loggedIn){ state.loggedIn=true; if(!state.userEmail)state.userEmail='user@allmytour.com'; }
  loadSampleTrips(); renderDemoState(); go('earn'); toast('나의 여행 샘플 5건 로드');
}
/* 예약상세 모달 (B1) — 여행 카드 탭 → 중앙 모달 (10-2) */
function nightsFromDates(d){
  const m=(d||'').split('~'); if(m.length<2) return 1;
  const p=s=>{ const x=s.trim().split('.'); return new Date(2026,(+x[0])-1,+x[1]); };
  return Math.max(1, Math.round((p(m[1])-p(m[0]))/86400000));
}
function openTripDetail(i){
  const it=state.cashbackItems[i]; if(!it) return;
  const tb=TRIP_BADGE[it.tripStatus]||TRIP_BADGE.upcoming;
  const eb=EARN_BADGE[mapEarn(it.tripStatus)];
  const cancelled=it.tripStatus==='cancelled';
  const amtHtml = cancelled ? `<s>${won(it.amount)}원</s>` : `<b class="td-amt">${won(it.amount)}원</b>`;
  const rows=[
    ['위치', it.city||'—'],
    ['체크인 ~ 체크아웃', `${it.dates} (${nightsFromDates(it.dates)}박)`],
    ['예약 OTA', it.ota],
    ['예약 ID', it.bookingId],
    ['예약일', it.bookingDate||'—'],
    ['상품가', `${won(it.price)}원`],
    ['적립금액', amtHtml],
    ['정산 예정월', it.paymentMonth||'—'],
  ];
  document.getElementById('tripBody').innerHTML = `
    <div class="td-badges"><span class="tc-badge tb-${tb.c}">${tb.t}</span><span class="tc-ebadge eb-${eb.c}">${eb.t}</span></div>
    <div class="td-hotel">${it.hotel}</div>
    <div class="td-rows">${rows.map(([k,v])=>`<div class="td-row"><span>${k}</span><span>${v}</span></div>`).join('')}</div>`;
  document.getElementById('modal-trip').classList.add('show');
}
function closeTripDetail(){ document.getElementById('modal-trip').classList.remove('show'); }

/* ═══════════ 마이페이지 (MY01 허브 + 계정관리·약관·회원탈퇴 뷰 전환) ═══════════ */
function currentScreen(){ const s=document.querySelector('.screen.active'); return s?s.id.replace('scr-',''):'main'; }
function openMyView(v){
  // 마이페이지 진입(허브) 시점의 직전 화면 기록 → 뒤로가기 목적지
  if(v==='menu' && currentScreen()!=='mypage') state.myBackTo = currentScreen();
  state.myView=v;
  if(v==='account') state.acctMkt=state.agreeMkt;
  if(v==='withdraw'){ state.wdStep='auth'; state.wdCodeSent=false; state.wdCode=''; state.wdVerified=false; state.wdReasons=[]; }
  go('mypage');
}
function renderMypage(){
  const el=document.getElementById('scr-mypage');
  if(state.myView==='account'){ el.innerHTML=myAccountHTML(); return; }
  if(state.myView==='terms'){ el.innerHTML=myTermsHTML(); return; }
  if(state.myView==='withdraw'){ el.innerHTML=myWithdrawHTML(); return; }
  el.innerHTML = myMenuHTML();  // 기본 = MY01 허브
}
function initialOf(){ const e=(state.userEmail||'user'); return (e.trim()[0]||'U').toUpperCase(); }
function myTop(title, backTo){
  const back = backTo ? `<button class="my-back" onclick="${backTo}">←</button>` : `<span style="width:32px"></span>`;
  return `<div class="my-top">${back}<span class="my-top-tit">${title}</span></div>`;
}
/* MY01 허브 */
function myMenuHTML(){
  if(state.loggedIn){
    return `
      ${myTop('마이페이지', "go('"+state.myBackTo+"')")}
      <div class="my-scroll">
        <div class="my-prof">
          <div class="my-prof-av">👤</div>
          <div><div class="my-prof-name">${state.userEmail?state.userEmail.split('@')[0]:'회원'} 님</div>
          <div class="my-prof-mail">${state.userEmail||'user@allmytour.com'}</div></div>
        </div>
        <div class="my-menu">
          <div class="my-item" onclick="openMyView('account')"><span>⚙ 계정관리</span><span class="my-arw">›</span></div>
          <div class="my-item" onclick="openLangSheet()"><span>🌐 국가·언어</span><span class="my-sub2">${state.langLabel} ›</span></div>
          <div class="my-item" onclick="openCurrencySheet()"><span>💱 통화</span><span class="my-sub2">${state.currency} ›</span></div>
          <div class="my-item" onclick="openMyView('terms')"><span>📄 약관·정책</span><span class="my-arw">›</span></div>
        </div>
        <button class="my-logout" onclick="doLogout()">로그아웃</button>
      </div>`;
  }
  // 비로그인 — 유도 영역 없이 공통 메뉴만 (v0.39 10-1)
  return `
    ${myTop('마이페이지', "go('"+state.myBackTo+"')")}
    <div class="my-scroll">
      <div class="my-menu">
        <div class="my-item" onclick="openLangSheet()"><span>🌐 국가·언어</span><span class="my-sub2">${state.langLabel} ›</span></div>
        <div class="my-item" onclick="openCurrencySheet()"><span>💱 통화</span><span class="my-sub2">${state.currency} ›</span></div>
        <div class="my-item" onclick="openMyView('terms')"><span>📄 약관·정책</span><span class="my-arw">›</span></div>
      </div>
    </div>`;
}
/* MY03 계정관리 (진입+뒤로 · 저장 토스트 · 하단 회원탈퇴) */
function myAccountHTML(){
  return `
    ${myTop('계정관리', "openMyView('menu')")}
    <div class="my-scroll">
      <div class="my-form">
        <div class="ac-avatar">
          <div class="ac-av-circle">👤</div>
        </div>
        <label class="my-lbl">이름 (영문)</label>
        <input class="my-inp" placeholder="Gildong" value="">
        <label class="my-lbl">성 (영문)</label>
        <input class="my-inp" placeholder="Hong" value="">
        <label class="my-lbl">이메일</label>
        <div class="my-inp ro">${state.userEmail||'user@allmytour.com'} <span class="my-verified">✓ 인증완료</span></div>
        <label class="my-lbl">국적</label>
        <div class="my-inp sel" onclick="toast('국적 선택 (준비 중)')">대한민국 <span class="my-arw">›</span></div>
        <label class="my-lbl">전화번호</label>
        <div class="my-phone"><div class="my-inp code">+82</div><input class="my-inp" style="flex:1" placeholder="1012345678"></div>
        <div class="my-mkt">
          <div><div class="my-mkt-t">마케팅 수신 동의</div><div class="my-mkt-s">이메일·SMS 혜택 알림</div></div>
          <div class="my-toggle ${state.acctMkt?'on':''}" onclick="toggleAcctMkt()"><span class="my-knob"></span></div>
        </div>
        <button class="sheet-cta" onclick="toast('저장되었어요')">저장</button>
        <div class="my-withdraw" onclick="openMyView('withdraw')">회원탈퇴</div>
      </div>
    </div>`;
}
function toggleAcctMkt(){ state.acctMkt=!state.acctMkt; renderMypage(); }
/* 약관·정책 (진입+뒤로) */
function myTermsHTML(){
  const list=['이용약관','개인정보 처리방침','마케팅 정보 수신 동의','위치기반 서비스 이용약관','전자금융거래 이용약관'];
  return `
    ${myTop('약관·정책', "openMyView('menu')")}
    <div class="my-scroll">
      <div class="my-menu">
        ${list.map(t=>`<div class="my-item" onclick="toast('${t} 전문 (준비 중)')"><span>${t}</span><span class="my-arw">›</span></div>`).join('')}
      </div>
      <div class="my-ver">allmy meta · v0.1 (프로토타입)</div>
    </div>`;
}
/* 회원탈퇴 (MY05 · 3단계: 이메일인증 → 사유선택 → 완료) */
const WD_REASONS = [
  '자주 이용하지 않아요',
  '원하는 숙소나 가격을 찾기 어려워요',
  '다른 서비스가 더 저렴하거나 편리해요',
  '개인정보 보호가 걱정돼요',
  '앱/서비스 사용이 불편해요',
  '기타 (직접 입력)',
];
function wdStepBar(cur){
  const idx = cur==='auth'?0:cur==='reason'?1:2;
  const labels=['본인 확인','사유 선택','완료'];
  return `<div class="wd-steps">`+[0,1,2].map(i=>{
    const cls = i<idx?'done':(i===idx?'active':'inactive');
    const dot = i<idx?'✓':(i+1);
    return `${i>0?`<div class="wd-sline ${i<=idx?'done':''}"></div>`:''}`+
      `<div class="wd-step"><div class="wd-dot ${cls}">${dot}</div><span class="wd-slabel ${i===idx?'on':''}">${labels[i]}</span></div>`;
  }).join('')+`</div>`;
}
function myWithdrawHTML(){
  // ── MY05-C 완료 ──
  if(state.wdStep==='done'){
    return `
      ${myTop('회원탈퇴','')}
      ${wdStepBar('done')}
      <div class="wd-done">
        <div class="wd-done-ic">👋</div>
        <div class="wd-done-t">탈퇴가 완료되었습니다</div>
        <div class="wd-done-d">그동안 이용해 주셔서 감사합니다.<br><br>탈퇴 후 7일 동안은 같은 이메일로<br>다시 가입하실 수 없습니다.<br><br>
          <span class="wd-done-date">재가입 가능일: <b>${state.withdrawnUntil} 이후</b></span></div>
        <button class="sheet-cta wd-done-btn" onclick="go('main')">메인으로 이동</button>
      </div>`;
  }
  // ── MY05-B 사유 선택 ──
  if(state.wdStep==='reason'){
    const can = state.wdReasons.length>0;
    const items = WD_REASONS.map((r,i)=>{
      const on=state.wdReasons.includes(i);
      const etc=(i===WD_REASONS.length-1);
      return `<div class="wd-reason ${on?'on':''}" onclick="toggleWdReason(${i})">
        <div class="wd-rchk">${on?'✓':''}</div>
        <div style="flex:1">
          <div class="wd-rtxt">${r}</div>
          ${etc&&on?`<textarea class="wd-etc" placeholder="탈퇴 사유를 직접 입력해 주세요 (최대 200자)" maxlength="200" onclick="event.stopPropagation()"></textarea>`:''}
        </div>
      </div>`;
    }).join('');
    return `
      ${myTop('회원탈퇴', "wdBack('auth')")}
      ${wdStepBar('reason')}
      <div class="my-scroll">
        <div class="wd-section">
          <div class="wd-h-tit">탈퇴 사유를 알려주세요</div>
          <div class="wd-h-desc">1개 이상 선택해 주세요. 서비스 개선에 소중하게 사용됩니다.</div>
          ${items}
        </div>
      </div>
      <div class="wd-btn-bar">
        <button class="wd-cta ${can?'':'dis'}" onclick="${can?'confirmWithdraw()':''}">탈퇴하기</button>
      </div>`;
  }
  // ── MY05-A 이메일 인증 ──
  return `
    ${myTop('회원탈퇴', "openMyView('account')")}
    ${wdStepBar('auth')}
    <div class="my-scroll">
      <div class="wd-section">
        <div class="wd-h-tit">먼저 본인 확인을 해주세요</div>
        <div class="wd-h-desc">회원 탈퇴를 위해 가입하신 이메일로 인증 코드를 보내드립니다.</div>
        <div class="wd-warn">
          <div class="wd-warn-t">⚠ 탈퇴 전 꼭 확인하세요</div>
          <div class="wd-warn-i">적립된 캐시백은 탈퇴 즉시 전액 사라집니다. 되돌릴 수 없습니다.</div>
          <div class="wd-warn-i">탈퇴 후 7일 동안은 같은 이메일로 다시 가입할 수 없습니다.</div>
          <div class="wd-warn-i ${state.wdVerified?'ok':''}">${state.wdVerified?'✓ 이메일 인증이 완료되었습니다.':'본인 확인을 위해 이메일 인증이 필요합니다.'}</div>
        </div>
        <div class="wd-flabel">가입 이메일</div>
        <div class="wd-email-row">
          <div class="wd-email-ro">${state.userEmail||'user@allmytour.com'}</div>
          <button class="wd-send ${state.wdCodeSent?'sent':''}" onclick="wdSendCode()">인증코드<br>${state.wdCodeSent?'재전송':'받기'}</button>
        </div>
        ${state.wdCodeSent?`
          <div class="wd-flabel">인증 코드 6자리 입력 <span class="login-demo">데모: 아무 숫자 6자리</span></div>
          <input id="wdCodeInp" class="login-inp ${state.wdVerified?'done':''}" placeholder="● ● ● ● ● ●" maxlength="6" inputmode="numeric"
                 ${state.wdVerified?'readonly':''} value="${state.wdCode}"
                 oninput="state.wdCode=this.value; if(this.value.length>=6)wdVerifyCode();">
          ${state.wdVerified
            ? `<div class="wd-verified">✓ 인증이 완료되었어요</div>`
            : `<div class="wd-timer">남은 시간: 4:21 · <span class="wd-resend" onclick="wdSendCode()">인증코드 다시 받기</span></div>`}
        `:''}
      </div>
    </div>
    <div class="wd-btn-bar">
      <button class="wd-next ${state.wdVerified?'':'dis'}" onclick="${state.wdVerified?'wdCodeComplete()':''}">다음 단계로</button>
    </div>`;
}
function wdSendCode(){ state.wdCodeSent=true; state.wdCode=''; state.wdVerified=false; renderMypage(); toast('인증코드를 보냈어요 (데모: 아무 숫자 6자리)'); setTimeout(()=>{const c=document.getElementById('wdCodeInp'); if(c)c.focus();},120); }
function wdVerifyCode(){ if(state.wdCode.length<6)return; state.wdVerified=true; renderMypage(); toast('인증되었어요 ✓'); }
function wdCodeComplete(){ if(!state.wdVerified)return; state.wdStep='reason'; renderMypage(); }
function toggleWdReason(i){ const a=state.wdReasons; const p=a.indexOf(i); if(p>=0)a.splice(p,1); else a.push(i); renderMypage(); }
function wdBack(step){ state.wdStep=step; renderMypage(); }
function confirmWithdraw(){ withdrawAccount(); state.wdStep='done'; renderMypage(); renderDemoState(); }
function doLogout(){ state.loggedIn=false; state.userEmail=''; go('main'); toast('로그아웃되었어요'); }

/* 국가·언어 / 통화 선택 바텀시트 (MY01-C · MY01-D) */
function openLangSheet(){
  document.getElementById('listTit').textContent='국가·언어 선택';
  document.getElementById('listBody').innerHTML =
    `<div class="ls-note">도메인(언어·시장) 변경 · 통화는 별도 설정 유지</div>` +
    LANGS.map((l,i)=>{
      const on=l.short===state.langLabel;
      return `<div class="ls-item ${on?'on':''}" onclick="pickLang(${i})">
        <span class="ls-flag">${l.flag}</span>
        <div class="ls-main"><div class="ls-name">${l.name}</div><div class="ls-sub">${l.sub}</div></div>
        ${on?'<span class="ls-chk">✓</span>':''}</div>`;
    }).join('');
  document.getElementById('sheet-list').classList.add('show');
}
function pickLang(i){ const l=LANGS[i]; state.langLabel=l.short; closeListSheet(); renderMypage(); toast(`${l.name} · ${l.sub}`); }
function openCurrencySheet(){
  document.getElementById('listTit').textContent='통화 선택';
  document.getElementById('listBody').innerHTML =
    `<div class="ls-note">KAYAK Constants API 동적 로딩 — 대표 통화 표시 (실제는 전체 코드)</div>` +
    CURRENCIES.map(c=>{
      const on=c.code===state.currency;
      return `<div class="ls-item ${on?'on':''}" onclick="pickCurrency('${c.code}')">
        <span class="ls-flag">${c.flag}</span>
        <div class="ls-main"><div class="ls-name">${c.name}</div><div class="ls-sub">${c.code} · ${c.sym}</div></div>
        ${on?'<span class="ls-chk">✓</span>':''}</div>`;
    }).join('');
  document.getElementById('sheet-list').classList.add('show');
}
function pickCurrency(code){ state.currency=code; closeListSheet(); renderMypage(); toast(`통화 ${code} 적용`); }
function closeListSheet(){ document.getElementById('sheet-list').classList.remove('show'); }

/* ═══════════ 고객지원 (🦚 FAQ 채팅 바텀시트) ═══════════ */
function openCS(){
  state.csMsgs=[{who:'bot', text:'안녕하세요! 무엇을 도와드릴까요? 아래 자주 묻는 질문에서 골라보세요 🦚'}];
  state.csFaqOpen=true;   // 처음엔 펼침
  renderCS();
  document.getElementById('sheet-cs').classList.add('show');
}
function closeCS(){ document.getElementById('sheet-cs').classList.remove('show'); }
function renderCS(){
  const body=document.getElementById('csBody'); if(!body) return;
  const msgs = state.csMsgs.map(m=>`<div class="cs-msg ${m.who}">${m.who==='bot'?'<span class="cs-av">🦚</span>':''}<div class="cs-bubble">${m.text}</div></div>`).join('');
  let faq;
  if(state.csFaqOpen){
    faq = `<div class="cs-faq-wrap">
      <div class="cs-faq-hd" onclick="csFaqToggle()"><span>자주 묻는 질문</span><span class="cs-faq-fold">접기 ▲</span></div>
      ${CS_FAQ.map((f,i)=>`<button class="cs-faq" onclick="csAsk(${i})">${f.q}</button>`).join('')}
    </div>`;
  } else {
    faq = `<button class="cs-faq-open" onclick="csFaqToggle()">💬 자주 묻는 질문 다시 보기 ▾</button>`;
  }
  body.innerHTML = msgs + faq;
  body.scrollTop = body.scrollHeight;
}
function csFaqToggle(){ state.csFaqOpen=!state.csFaqOpen; renderCS(); }
function csAsk(i){
  const f=CS_FAQ[i]; if(!f) return;
  state.csMsgs.push({who:'me', text:f.q});
  state.csFaqOpen=false;   // 첫 질문(이후 질문 포함) 시 자동 접힘
  renderCS();
  setTimeout(()=>{
    state.csMsgs.push({who:'bot', text:f.a});
    state.csMsgs.push({who:'bot', text:'다른 궁금한 점이 있으면 아래 <b>자주 묻는 질문</b>을 다시 열어보세요 🙂'});
    renderCS();
  }, 450);
}
function csSend(){
  const el=document.getElementById('csInput');
  const v=(el.value||'').trim(); if(!v) return;
  el.value='';
  state.csMsgs.push({who:'me', text:v});
  state.csFaqOpen=false;
  renderCS();
  // 간단 키워드 매칭 → FAQ 답변 (없으면 안내)
  const PAT=[
    /캐시백.*(언제|지급)|언제.*지급|적립.*언제/,
    /안\s*보|누락|없[어네]|안\s*떠/,
    /탈퇴/,
    /변경|취소|환불|바꾸/,
    /로그인|인증|코드/,
  ];
  const idx=PAT.findIndex(p=>p.test(v));
  const ans = idx>=0 ? CS_FAQ[idx].a
    : '문의 주셔서 감사해요! 자세한 상담은 준비 중이에요. 아래 <b>자주 묻는 질문</b>도 참고해 주세요 🙂';
  setTimeout(()=>{ state.csMsgs.push({who:'bot', text:ans}); renderCS(); }, 500);
}

/* ═══════════ 초기화 ═══════════ */
function resetAll(){
  state.loggedIn=false; state.entryMode=null; state.destination='';
  state.randomCity=null; state.cashbackItems=[];
  state.nextIsNew=false; state.userEmail=''; state.loginErr='';
  state.agreeReq=false; state.agreeMkt=false;
  state.withdrawnEmail=null; state.withdrawnUntil=null;
  state.myView='menu'; state.wdStep='auth'; state.wdCodeSent=false; state.wdCode=''; state.wdVerified=false; state.wdReasons=[];
  state.langLabel='한국어'; state.currency='KRW'; state.csMsgs=[];
  state.nights=1; state.dateStr='7월 9일 – 7월 10일';
  state.pinnedHotel=null; state.fB=null;
  clearFilters();
  loadSampleTrips();   // 샘플 5건 재로드 (초기 상태와 동일하게)
  go('main'); toast('처음 상태로 초기화됐어요');
}

/* ═══════════ 데모 상태 표시 ═══════════ */
function renderDemoState(){
  const cur = document.querySelector('.screen.active');
  const scr = cur ? cur.id.replace('scr-','') : '-';
  document.getElementById('demoState').innerHTML =
    `화면: <b>${scr}</b><br>`+
    `로그인: <b>${state.loggedIn?'O':'X'}</b>`+(state.userEmail?` <span style="color:#6b7280">(${state.userEmail})</span>`:'')+`<br>`+
    `다음로그인: <b>${state.nextIsNew?'신규(약관동의)':'기존'}</b><br>`+
    `탈퇴제한: <b>${state.withdrawnEmail?`${state.withdrawnUntil}까지`:'없음'}</b><br>`+
    `적립완료: <b>${won(approvedTotal())}원</b> · 적립예정: <b>${won(waitingTotal())}원</b>`;
  renderSimPanel();
}

/* ═══════════ 토스트 ═══════════ */
let toastT;
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2200);
}

/* ═══════════ 참고 문서 (좌측 데모 패널 → 팝업) ═══════════ */
const REF_DOCS = [
  {n:'Phase1 정책서',        v:'v0.39',    p:'phase1정책/신규_mvp_메타서치_v0.39.md'},
  {n:'자연어검색 정책서',     v:'v0.4',     p:'신규정책/자연어검색/자연어검색_정책서_v0.4.md'},
  {n:'E안 프로토타입(원본)',  v:'v0.4 기준', p:'prototype/chat_prototype_e.html'},
  {n:'화면기획서',           v:'—',        p:'new_wireframe/ m01·s01·s02_d1·login_modal·auth_login·my01~my05·out01'},
  {n:'KAYAK API 통합분석',   v:'—',        p:'api/KAYAK_API_통합분석.md (+ test_response)'},
  {n:'제작 스펙',            v:'—',        p:'통합프로토타입_제작요청서_E안 · E안_프로토타입_스펙정의'},
];
function openRefDocs(){
  document.getElementById('refBody').innerHTML = REF_DOCS.map(d=>`
    <div class="ref-row"><div class="ref-n">${d.n}</div><div class="ref-v">${d.v}</div><div class="ref-p">${d.p}</div></div>`).join('');
  document.getElementById('modal-ref').classList.add('show');
}
function closeRefDocs(){ document.getElementById('modal-ref').classList.remove('show'); }

/* 필터 칩 바 — 마우스 드래그 가로 스크롤 (터치·트랙패드 외 지원) */
(function(){
  const el=document.getElementById('resFilters'); if(!el) return;
  let down=false, sx=0, sl=0, moved=false;
  el.addEventListener('mousedown', e=>{ down=true; moved=false; sx=e.pageX; sl=el.scrollLeft; });
  window.addEventListener('mouseup', ()=>{ down=false; });
  el.addEventListener('mousemove', e=>{ if(!down)return; const d=e.pageX-sx; if(Math.abs(d)>4)moved=true; el.scrollLeft=sl-d; });
  el.addEventListener('click', e=>{ if(moved){ e.preventDefault(); e.stopPropagation(); } }, true);
  el.addEventListener('wheel', e=>{ if(e.deltaY&&!e.shiftKey){ el.scrollLeft+=e.deltaY; e.preventDefault(); } }, {passive:false});
})();

/* ═══════════ 초기 진입 ═══════════ */
renderMainChips();
loadSampleTrips();   // 적립 탭 "나의 여행" 샘플 5건 미리 로드
go('main');
