/* 좌측 메뉴 — 여기 한 곳에서만 관리한다 (파일마다 복사하면 링크가 깨진다)
   프런트용·어드민용 화면기획서를 분리 (PO 2026-10-26): 보고 있는 쪽 메뉴만 보이고, 맨 아래에 반대쪽으로 가는 링크
   쪽 판단 순서: body data-side → 주소 ?side= → 화면 키(a_ · pol_admin = 어드민)
   href 가 없는 항목은 '예정'으로 표시되고 누를 수 없다 */
(function(){
  var FRONT = [
    ['grp', '정책서 · 공통'],
    ['pol_earn', '참여형 적립', '기능정책서 v0.8', 'policy/pol_earn.html'],
    ['pol_member', '리워드 회원', '정책서 v0.2', 'policy/pol_member.html'],
    ['pol_point',  '리워드 포인트', '정책서 v0.2', 'policy/pol_point.html'],
    ['pol_my',     '리워드 마이페이지', '정책서 v0.1', 'policy/pol_my.html'],
    ['pol_noti',   '리워드 알림', '정책서 v0.1', 'policy/pol_noti.html'],
    ['pol_offer',  '리워드 혜택', '정책서 v0.1 · 현재 기능', 'policy/pol_offer.html'],
    ['pol_use',    '리워드 포인트 사용', '정책서 v0.1 · 현재 기능', 'policy/pol_use.html'],
    ['c_layer',  'C-LAYER', '팝업·알림 노출 규칙', 'common/c_layer.html'],
    ['grp', '회원'],
    ['f_auth',   'F-AUTH', '가입·로그인·본인인증', 'front/f_auth.html'],
    ['grp', '홈'],   /* 홈 화면에서 들어가는 참여형 적립(출석·퀴즈)도 홈 묶음에 (PO 2026-10-27) */
    ['f_home',   'F-HOME', '홈 (메인)',        'front/f_home.html'],
    ['f_attend', 'F-ATT',  '출석체크',          'front/f_attend.html'],
    ['f_quiz',   'F-QUIZ', '여행상식 퀴즈',     'front/f_quiz.html'],
    ['grp', '검색'],   /* 하단 탭 순서(홈 · 검색 · 혜택 · My)대로 — 검색 묶음은 없던 기능인 필독부터 (PO 2026-10-28) */
    ['f_guide',  'F-GUIDE','적립 필독',         'front/f_guide.html'],
    ['f_sres', 'F-SRES', '검색 결과 — 실개발 기준 작성 중', ''],
    ['f_sdet', 'F-SDET', '숙소 상세 — 실개발 기준 작성 중', ''],
    ['f_sout', 'F-SOUT', '아웃링크 · 예약 적립 — 실개발 기준 작성 중', ''],
    ['grp', '혜택'],
    ['f_offer',  'F-OFFER','혜택 (오퍼월)',     'front/f_offer.html'],
    ['grp', '마이페이지'],   /* My 화면의 메뉴 순서와 같게 (PO 2026-10-27) */
    ['f_my',     'F-MY',   'My (마이페이지)',   'front/f_my.html'],
    ['f_acc',    'F-ACC',  '계정관리·탈퇴 (프로필)', 'front/f_acc.html'],
    ['f_point',  'F-POINT','포인트 내역·예약 뽑기', 'front/f_point.html'],
    ['f_coupon', 'F-COUPON','내 쿠폰함 — 나중에',        'front/f_coupon.html'],
    ['f_noti',   'F-NOTI', '알림함·새 알림 토스트', 'front/f_noti.html'],
    ['f_jar',    'F-JAR',  '저금통 (현금 전환·픽샵) — 나중에', 'front/f_jar.html'],
    ['f_invite', 'F-INV',  '친구 추천',         'front/f_invite.html'],
    ['f_set',    'F-SET',  '설정·FAQ·약관',     'front/f_set.html'],
  ];
  var ADMIN = [
    ['grp', '정책서 · 공통'],
    ['pol_admin', '리워드 어드민', '정책서 v0.3', 'policy/pol_admin.html'],
    ['pol_member', '리워드 회원', '정책서 v0.2', 'policy/pol_member.html?side=admin'],
    ['pol_point',  '리워드 포인트', '정책서 v0.2', 'policy/pol_point.html?side=admin'],
    ['pol_noti',   '리워드 알림', '정책서 v0.1', 'policy/pol_noti.html?side=admin'],
    ['pol_offer',  '리워드 혜택', '정책서 v0.1 · 현재 기능', 'policy/pol_offer.html?side=admin'],
    ['pol_use',    '리워드 포인트 사용', '정책서 v0.1 · 현재 기능', 'policy/pol_use.html?side=admin'],
    ['c_layer',   'C-LAYER 8절', '어드민 모달·토스트 규칙', 'common/c_layer.html?side=admin#admin'],
    /* 실제 어드민 왼쪽 메뉴와 같은 묶음·순서 (PO 2026-10-27) — 묶음 이름도 어드민 그대로 */
    ['grp', 'OVERVIEW'],
    ['a_dash',   'A-DASH', '대시보드',          'admin/a_dash.html'],
    ['grp', '회원관리'],
    ['a_user',   'A-USER', '회원 목록',         'admin/a_user.html'],
    ['grp', '포인트관리'],
    ['a_point',  'A-POINT','전체 포인트 내역',  'admin/a_point.html'],
    ['a_wd',     'A-WD',   '출금 신청',         'admin/a_wd.html'],
    ['a_order',  'A-ORDER','픽샵 구매내역',     'admin/a_order.html'],
    ['a_book',   'A-BOOK', '예약 적립',         'admin/a_book.html'],
    ['grp', '적립 운영'],
    ['a_offer',  'A-OFFER','혜택(오퍼월)',      'admin/a_offer.html'],
    ['a_quiz',   'A-QUIZ', '퀴즈 관리',         'admin/a_quiz.html'],
    ['a_adv',    'A-ADV',  '광고주 관리',       'admin/a_offer.html#adv'],   /* 별도 페이지 없음 — A-OFFER ⑤ */
    ['grp', '운영'],
    ['a_noti',   'A-NOTI', '알림 발송',         'admin/a_noti.html'],
    ['a_set',    'A-SET',  '설정',              'admin/a_set.html'],
    ['a_log',    'A-LOG',  '관리자 로그',       'admin/a_log.html'],
  ];
  var b = document.body, key = b.getAttribute('data-key') || '', base = b.getAttribute('data-base') || '';
  var side = b.getAttribute('data-side');
  if(!side){ var m = location.search.match(/side=(front|admin)/); if(m) side = m[1]; }
  if(!side) side = (/^a_|^pol_admin/.test(key)) ? 'admin' : 'front';
  if(side === 'root'){
    b.insertAdjacentHTML('afterbegin', '<nav class="nav"><a class="nav-logo" href="' + base + 'index.html">픽콕 리워드<small>화면기획서</small></a>' +
      '<div class="nav-grp">기획서 고르기</div><a href="' + base + 'front/index.html">프런트<small>고객 앱</small></a>' +
      '<a href="' + base + 'admin/index.html">어드민<small>운영자</small></a></nav>');
    return;
  }
  var NAV = side === 'admin' ? ADMIN : FRONT;
  var title = side === 'admin' ? '어드민 화면기획서' : '프런트 화면기획서';
  var h = '<nav class="nav nav-' + side + '"><a class="nav-logo" href="' + base + side + '/index.html">픽콕 리워드<small>' + title + ' · 인덱스</small></a>';
  /* 묶음 접기/펼치기 (PO 2026-10-27) — 접은 묶음은 브라우저에 기억한다. 보고 있는 화면이 든 묶음은 늘 펼친다 */
  var SKEY = 'pickoq-wf-nav-closed-' + side, closed = {};
  try { closed = JSON.parse(localStorage.getItem(SKEY) || '{}') || {}; } catch(e){ closed = {}; }
  var groups = [], cur = null;
  NAV.forEach(function(n){
    if(n[0] === 'grp'){ cur = { name: n[1], items: [], on: false }; groups.push(cur); return; }
    if(!cur){ cur = { name: '', items: [], on: false }; groups.push(cur); }
    if(n[0] === key) cur.on = true;
    cur.items.push(n);
  });
  groups.forEach(function(g, gi){
    var shut = !!closed[g.name] && !g.on;
    if(g.name) h += '<button type="button" class="nav-grp" aria-expanded="' + !shut + '" data-g="' + gi + '">' + g.name + '</button>';
    h += '<div class="nav-items' + (shut ? ' shut' : '') + '" data-g="' + gi + '">';
    g.items.forEach(function(n){
      if(!n[3]){ h += '<span class="soon">' + n[1] + '<small>' + n[2] + '</small></span>'; return; }
      h += '<a href="' + base + n[3] + '"' + (n[0] === key ? ' class="on"' : '') + '>' + n[1] + '<small>' + n[2] + '</small></a>';
    });
    h += '</div>';
  });
  var other = side === 'admin' ? ['front', '프런트 화면기획서로'] : ['admin', '어드민 화면기획서로'];
  h += '<a class="nav-switch" href="' + base + other[0] + '/index.html">⇄ ' + other[1] + '</a>';
  h += '<a class="nav-switch sub" href="' + base + 'index.html">처음 화면</a>';
  b.insertAdjacentHTML('afterbegin', h + '</nav>');
  b.querySelector('.nav').addEventListener('click', function(e){
    var t = e.target.closest('button.nav-grp'); if(!t) return;
    var gi = t.getAttribute('data-g'), box = this.querySelector('.nav-items[data-g="' + gi + '"]');
    var open = t.getAttribute('aria-expanded') !== 'true';
    t.setAttribute('aria-expanded', open); box.classList.toggle('shut', !open);
    if(open) delete closed[groups[gi].name]; else closed[groups[gi].name] = 1;
    try { localStorage.setItem(SKEY, JSON.stringify(closed)); } catch(err){}
  });

  /* 메뉴 스크롤 위치 유지 (PO 2026-10-28) — 다른 화면을 눌러도 왼쪽 메뉴는 보던 자리 그대로, 본문만 맨 위에서 시작.
     누르기 직전 위치를 이 탭에만 기억했다가 새 페이지에서 되살린다. 기억이 없으면 지금 화면 항목이 보이게만 맞춘다 */
  var nav = b.querySelector('.nav'), PKEY = 'pickoq-wf-nav-scroll-' + side;
  function saveScroll(){ try { sessionStorage.setItem(PKEY, String(nav.scrollTop)); } catch(err){} }
  nav.addEventListener('click', function(e){ if(e.target.closest('a')) saveScroll(); });
  window.addEventListener('pagehide', saveScroll);
  var y = null;
  try { y = sessionStorage.getItem(PKEY); } catch(err){}
  if(y !== null){ nav.scrollTop = +y || 0; }
  else {
    var on = nav.querySelector('a.on');
    if(on && on.offsetTop + on.offsetHeight > nav.clientHeight) nav.scrollTop = on.offsetTop - nav.clientHeight / 3;
  }
})();
