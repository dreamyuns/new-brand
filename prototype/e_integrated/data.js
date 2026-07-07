/* ═══════════ 더미 데이터 (실 KAYAK 응답 필드명 구조 반영) ═══════════ */

// 인기 도시 풀 (지역 미입력 시 랜덤 1곳) — 자연어검색 정책서 v0.3 7-2절
const POPULAR_CITIES = ['부산','제주','오사카','도쿄','방콕','싱가포르','다낭','파리','뉴욕','서울'];
// 자동완성 빈 입력 시 인기도시 10개 고정 노출 (M01_D1-D · 정책 4-11절, 고정 순서)
const POPULAR_DEST = [
  {name:'제주', sub:'제주특별자치도, 대한민국'},
  {name:'부산', sub:'부산광역시, 대한민국'},
  {name:'서울', sub:'서울특별시, 대한민국'},
  {name:'오사카', sub:'일본'},
  {name:'도쿄', sub:'일본'},
  {name:'방콕', sub:'태국'},
  {name:'싱가포르', sub:'싱가포르'},
  {name:'다낭', sub:'베트남'},
  {name:'파리', sub:'프랑스'},
  {name:'뉴욕', sub:'미국'},
];

// 추천질문 (진입/AI검색 예시)
// 추천질문 20개 풀 — 로드/새로고침마다 랜덤 4개 노출 (자연어검색 v0.4 7-1절)
const SUGGEST_QUESTIONS = [
  '서울 강남 2인 1박 20만원대', '제주 주말 풀빌라 2박', '부산 해운대 4성급 오션뷰', '강릉 커플 펜션 1박',
  '서울 시청 근처 비즈니스 호텔', '조식 포함 서울 주말 1박', '도쿄 신주쿠 4성급 3박', '오사카 도톤보리 근처 가성비 호텔',
  '방콕 수영장 있는 호텔', '싱가포르 마리나베이 뷰', '다낭 리조트 조식포함 3박', '후쿠오카 온천 호텔',
  '파리 에펠탑 근처 4성급', '뉴욕 맨해튼 3박', '홍대 근처 10만원 이하 호텔', '제주 중문 5성급 스파',
  '부산 서면 지하철 근처 호텔', '가족 여행 넓은 객실 서울', '속초 오션뷰 조용한 호텔', '강원 애견동반 가능 호텔',
];

// 결과 후 추천검색어 (호텔 조건 변형만 — 항공·관광 제외)
const REC_KEYWORDS = [
  '조식 포함으로 다시 찾아줘',
  '5성급만 보여줘',
  '1박 20만원 이하로',
  '날짜를 다음 주로 바꿔서',
];

// 타 OTA 목록 (아웃링크 대상 · 자사 올마이투어 제외)
// cashback: KAYAK providers[].cashback 구조 반영 — type PERCENTAGE(value=%) / FLAT(value=₩) / NONE
// 캐시백 요율 = 공급사별 2~3% (상품가 기준 금액 계산). Expedia·여기어때는 캐시백 없음(MODAL-B 데모)
const OTA_LIST = [
  { name:'Booking.com', color:'#003580', cashback:{type:'PERCENTAGE', value:3.0} },
  { name:'Agoda',       color:'#5c2d91', cashback:{type:'PERCENTAGE', value:3.0} },
  { name:'Expedia',     color:'#00355f', cashback:{type:'NONE',       value:0} },
  { name:'Trip.com',    color:'#2577e3', cashback:{type:'PERCENTAGE', value:2.0} },
  { name:'Hotels.com',  color:'#d32f2f', cashback:{type:'PERCENTAGE', value:3.0} },
  { name:'Priceline',   color:'#0068ef', cashback:{type:'PERCENTAGE', value:2.0} },
  { name:'Traveloka',   color:'#1b9df0', cashback:{type:'PERCENTAGE', value:2.0} },
  { name:'호텔스닷컴',    color:'#c2185b', cashback:{type:'PERCENTAGE', value:3.0} },
  { name:'Klook',       color:'#ff5b00', cashback:{type:'PERCENTAGE', value:2.0} },
  { name:'여기어때',      color:'#00c2b3', cashback:{type:'NONE',       value:0} },
  { name:'야놀자',        color:'#ff3d6a', cashback:{type:'PERCENTAGE', value:2.0} },
  { name:'Ostrovok',    color:'#1f7a3d', cashback:{type:'PERCENTAGE', value:3.0} },
];

// 호텔 더미 (translatedName·guestRating·address·starRating·lowestRate·aiFeature)
// aiFeature = KAYAK description LLM 요약 자리(더미, ≤50자·3줄)
const HOTELS = [
  { id:'h1', name:'제주 신라 호텔',        rating:9.1, star:5, type:'리조트',     chain:'독립',   addr:'서귀포시 색달동',   price:402000, rooms:3, tags:['무료취소','조식포함'], feat:'오션뷰·인피니티풀. 가족 여행에 좋아요' },
  { id:'h2', name:'시그니엘 부산',         rating:9.3, star:5, type:'호텔',       chain:'독립',   addr:'해운대구 우동',     price:389000, rooms:2, tags:['무료취소'],           feat:'초고층 전망·수영장. 커플에게 인기' },
  { id:'h3', name:'파라다이스 호텔 부산',  rating:9.0, star:5, type:'리조트',     chain:'독립',   addr:'해운대구 중동',     price:356000, rooms:4, tags:['무료취소','조식포함'], feat:'해변 바로 앞·스파 시설이 훌륭해요' },
  { id:'h4', name:'나인트리 프리미어',     rating:8.9, star:4, type:'호텔',       chain:'독립',   addr:'중구 을지로',       price:198000, rooms:8, tags:['무료취소','조식포함'], feat:'교통 편리·깔끔한 객실. 가성비 좋아요' },
  { id:'h5', name:'JW 메리어트 서울',      rating:8.6, star:5, type:'호텔',       chain:'메리어트', addr:'서초구 신반포로',   price:332000, rooms:5, tags:['조식포함'],           feat:'고속터미널 직결·넓은 스파와 피트니스' },
  { id:'h6', name:'그랜드 하얏트 서울',    rating:8.8, star:5, type:'호텔',       chain:'하얏트', addr:'용산구 소월로',     price:421000, rooms:6, tags:['무료취소'],           feat:'도심 전망·넓은 객실. 라운지 인기' },
  { id:'h7', name:'포시즌스 호텔',         rating:9.2, star:5, type:'호텔',       chain:'독립',   addr:'종로구 새문안로',   price:455000, rooms:2, tags:['무료취소','조식포함'], feat:'럭셔리 스파·미식 레스토랑 완비' },
  { id:'h8', name:'베이튼 호텔',           rating:6.9, star:3, type:'모텔',       chain:'독립',   addr:'중구 동호로',       price:141000, rooms:12,tags:['무료취소'],           feat:'합리적 가격·기본에 충실한 숙소' },
  { id:'h9', name:'홀리데이 인 익스프레스', rating:8.4, star:4, type:'호텔',       chain:'IHG',    addr:'중구 세종대로',     price:216000, rooms:7, tags:['조식포함'],           feat:'시청 인근·간편 조식 제공' },
  { id:'h10',name:'노보텔 앰배서더',       rating:8.1, star:4, type:'호텔',       chain:'아코르', addr:'마포구 양화로',     price:227000, rooms:9, tags:['무료취소','조식포함'], feat:'홍대 근처·젊은 여행객에 인기' },
  { id:'h11',name:'스탠포드 호텔',         rating:8.0, star:4, type:'게스트하우스', chain:'독립',  addr:'마포구 월드컵북로', price:158000, rooms:10,tags:['무료취소'],           feat:'공항철도 근처·조용한 휴식' },
  { id:'h12',name:'힐튼 가든 인 서울',     rating:8.3, star:4, type:'아파트호텔',  chain:'힐튼',   addr:'중구 통일로',       price:245000, rooms:6, tags:['조식포함'],           feat:'서울역 도보권·이동 편리' },
];
// 페이지네이션·필터 시연용 추가 더미 (총 30개로 확장)
(function(){
  const CHAINS=['메리어트','힐튼','IHG','하얏트','아코르','독립'];
  const TYPES=['호텔','리조트','아파트','게스트하우스','호스텔','모텔','펜션','아파트호텔'];
  const NAMES=['코트야드','알로프트','머큐어','인터컨티넨탈','앰배서더','베스트웨스턴','라마다','호텔 스카이','더 플라자','시티 스테이','스카이파크','에어스','라까사','오크우드','휘슬락','스테이인','더링크','아르떼'];
  const ADDR=['중구 명동','종로구 인사동','강남구 역삼','서초구 방배','마포구 서교','용산구 이태원','성동구 성수','영등포구 여의도'];
  const FEATS=['깔끔한 객실과 편리한 교통','합리적 가격의 실속 숙소','조용한 휴식과 친절한 서비스','비즈니스 여행에 최적','도심 접근성이 좋은 위치','가성비 좋은 인기 숙소'];
  for(let i=0;i<18;i++){
    const star=3+(i%3); const price=110000+((i*23)%30)*7000;
    HOTELS.push({
      id:'g'+(i+1), name:`${NAMES[i]} 호텔`, rating:+(7.4+((i*13)%22)/10).toFixed(1),
      star, type:TYPES[i%TYPES.length], chain:CHAINS[i%CHAINS.length],
      addr:ADDR[i%ADDR.length], price, rooms:4+(i%9),
      tags: i%2 ? ['무료취소','조식포함'] : ['조식포함'], feat:FEATS[i%FEATS.length],
    });
  }
})();

// ═══ 자동완성 키워드 데이터셋 (m01_main M01-B) ═══
// 노출 순서: city(도시) → area(지역/동) → hotel(호텔)  [자동완성 정책]
const AUTOCOMPLETE = [
  // 도시
  { type:'city', name:'서울',   sub:'서울특별시, 대한민국' },
  { type:'city', name:'부산',   sub:'부산광역시, 대한민국' },
  { type:'city', name:'제주',   sub:'제주특별자치도, 대한민국' },
  { type:'city', name:'강릉',   sub:'강원특별자치도, 대한민국' },
  { type:'city', name:'오사카', sub:'일본' },
  { type:'city', name:'도쿄',   sub:'일본' },
  { type:'city', name:'후쿠오카', sub:'일본' },
  { type:'city', name:'오키나와', sub:'일본' },
  { type:'city', name:'방콕',   sub:'태국' },
  { type:'city', name:'싱가포르', sub:'싱가포르' },
  { type:'city', name:'다낭',   sub:'베트남' },
  { type:'city', name:'파리',   sub:'프랑스' },
  { type:'city', name:'뉴욕',   sub:'미국' },
  // 지역/동
  { type:'area', name:'강남',   sub:'서울, 대한민국' },
  { type:'area', name:'명동',   sub:'서울, 대한민국' },
  { type:'area', name:'홍대',   sub:'서울, 대한민국' },
  { type:'area', name:'해운대', sub:'부산, 대한민국' },
  { type:'area', name:'서면',   sub:'부산, 대한민국' },
  { type:'area', name:'중문',   sub:'제주, 대한민국' },
  { type:'area', name:'도톤보리', sub:'오사카, 일본' },
  { type:'area', name:'신주쿠', sub:'도쿄, 일본' },
  // 호텔 (HOTELS와 이름 일치 → 선택 시 결과 최상단 고정)
  { type:'hotel', name:'제주 신라 호텔',    sub:'제주 · 서귀포시 색달동' },
  { type:'hotel', name:'시그니엘 부산',      sub:'부산 · 해운대구 우동' },
  { type:'hotel', name:'파라다이스 호텔 부산', sub:'부산 · 해운대구 중동' },
  { type:'hotel', name:'포시즌스 호텔',      sub:'서울 · 종로구 새문안로' },
  { type:'hotel', name:'그랜드 하얏트 서울',  sub:'서울 · 용산구 소월로' },
  { type:'hotel', name:'JW 메리어트 서울',   sub:'서울 · 서초구 신반포로' },
];
// 숙소상세 이미지 갤러리 (더미 — 좌우 스와이프 + 클릭 시 갤러리)
const GALLERY_IMGS = [
  {g:'linear-gradient(135deg,#f5a3b8,#f6c68a,#8fb8e0)', e:'🏨'},
  {g:'linear-gradient(135deg,#a1c4fd,#c2e9fb)',          e:'🛏️'},
  {g:'linear-gradient(135deg,#84fab0,#8fd3f4)',          e:'🏊'},
  {g:'linear-gradient(135deg,#fbc2eb,#a6c1ee)',          e:'🍽️'},
  {g:'linear-gradient(135deg,#fddb92,#d1fdff)',          e:'🌆'},
  {g:'linear-gradient(135deg,#c2e59c,#64b3f4)',          e:'🛁'},
];

// 리뷰 카테고리 점수 (reviews.guestRatings 7개 · 점수 높은 순 · 상위 4개 기본)
const REVIEW_CATS = [
  {name:'위치', score:9.1},{name:'직원', score:9.0},{name:'청결', score:8.9},{name:'서비스', score:8.8},
  {name:'편안함', score:8.7},{name:'가성비', score:8.3},{name:'편의시설', score:8.0}
];
// 전체 편의시설 (featureSummary 카테고리별 · 더보기 바텀시트)
const AMENITIES = [
  {cat:'인기 시설', items:['무료 Wi-Fi','야외 수영장','주차장','조식 뷔페','피트니스','스파']},
  {cat:'서비스', items:['24시간 프런트','컨시어지','룸서비스','세탁 서비스','수하물 보관']},
  {cat:'객실 편의', items:['에어컨','금연 객실','미니바','전기포트','객실 금고']},
  {cat:'식음료', items:['레스토랑','라운지 바','카페']},
  {cat:'접근성', items:['엘리베이터','장애인 편의시설','공항 셔틀']},
];

// 적립 탭 "나의 여행" 샘플 5건 (여행상태 4종 + 취소 포함)
// tripStatus: staying(투숙중) | upcoming(투숙예정) | completed(투숙완료) | cancelled(예약취소)
// earnStatus는 app.js mapEarn()으로 tripStatus에서 자동 산출
const SAMPLE_TRIPS = [
  { hotel:'제주 신라 호텔',    city:'제주', ota:'Booking.com', dates:'07.01 ~ 07.03', price:402000, amount:8040, tripStatus:'staying',   bookingId:'AMT240701', bookingDate:'06.25', paymentMonth:'8월', g:'linear-gradient(135deg,#fddb92,#d1fdff)', e:'🌅' },
  { hotel:'포시즌스 호텔 서울', city:'서울', ota:'Agoda',        dates:'07.15 ~ 07.17', price:455000, amount:9100, tripStatus:'upcoming',  bookingId:'AMT240715', bookingDate:'07.02', paymentMonth:'8월', g:'linear-gradient(135deg,#a1c4fd,#c2e9fb)', e:'🌆' },
  { hotel:'시그니엘 부산',      city:'부산', ota:'Expedia',       dates:'06.20 ~ 06.22', price:389000, amount:7780, tripStatus:'completed', bookingId:'AMT240620', bookingDate:'06.18', paymentMonth:'7월', g:'linear-gradient(135deg,#84fab0,#8fd3f4)', e:'🏙️' },
  { hotel:'나인트리 프리미어',  city:'서울', ota:'Booking.com', dates:'06.28 ~ 06.29', price:198000, amount:3960, tripStatus:'completed', bookingId:'AMT240628', bookingDate:'06.15', paymentMonth:'7월', g:'linear-gradient(135deg,#fbc2eb,#a6c1ee)', e:'🏨' },
  { hotel:'그랜드 하얏트 도쿄', city:'도쿄', ota:'Trip.com',     dates:'06.05 ~ 06.07', price:421000, amount:8420, tripStatus:'cancelled', bookingId:'AMT240605', bookingDate:'05.28', paymentMonth:'—', g:'linear-gradient(135deg,#d7d2cc,#a3a3a3)', e:'🚫' },
];

// 국가·언어 목록 (MY01-C · 도메인 변경 = 언어+시장) — 19개
const LANGS = [
  {flag:'🇰🇷', name:'대한민국', sub:'한국어', short:'한국어'},
  {flag:'🇯🇵', name:'日本', sub:'日本語', short:'日本語'},
  {flag:'🇺🇸', name:'United States', sub:'English', short:'English'},
  {flag:'🇬🇧', name:'United Kingdom', sub:'English', short:'English (UK)'},
  {flag:'🇦🇺', name:'Australia', sub:'English', short:'English (AU)'},
  {flag:'🇸🇬', name:'Singapore', sub:'English', short:'English (SG)'},
  {flag:'🇭🇰', name:'Hong Kong', sub:'English', short:'English (HK)'},
  {flag:'🇲🇾', name:'Malaysia', sub:'English', short:'English (MY)'},
  {flag:'🇪🇺', name:'Europe', sub:'English', short:'English (EU)'},
  {flag:'🇪🇸', name:'España', sub:'Español', short:'Español'},
  {flag:'🇲🇽', name:'México', sub:'Español', short:'Español (MX)'},
  {flag:'🇮🇩', name:'Indonesia', sub:'Bahasa', short:'Bahasa'},
  {flag:'🇻🇳', name:'Việt Nam', sub:'Tiếng Việt', short:'Tiếng Việt'},
  {flag:'🇹🇼', name:'台灣', sub:'繁體中文', short:'繁體中文'},
];
// 통화 목록 (MY01-D · KAYAK Constants API 동적 · currencyCode 기준) — 대표 표본
// 실제로는 Constants API가 ISO 코드(KRW·USD·JPY…) 전체를 내려줌 → 코드 + 심볼로 표현
const CURRENCIES = [
  {flag:'🇰🇷', code:'KRW', name:'원화', sym:'₩'},
  {flag:'🇺🇸', code:'USD', name:'U.S. Dollar', sym:'$'},
  {flag:'🇯🇵', code:'JPY', name:'日本円', sym:'¥'},
  {flag:'🇨🇳', code:'CNY', name:'人民币', sym:'¥'},
  {flag:'🇸🇬', code:'SGD', name:'Singapore Dollar', sym:'$'},
  {flag:'🇪🇺', code:'EUR', name:'Euro', sym:'€'},
  {flag:'🇲🇾', code:'MYR', name:'Malaysian Ringgit', sym:'RM'},
  {flag:'🇬🇧', code:'GBP', name:'British Pound', sym:'£'},
  {flag:'🇦🇺', code:'AUD', name:'Australian Dollar', sym:'$'},
];

// 고객지원 FAQ (🦚 채팅 바텀시트)
const CS_FAQ = [
  { q:'캐시백은 언제 지급되나요?',        a:'체크아웃 후 예약이 확정되면 ‘적립예정’이 ‘적립완료’로 바뀌고, 월 정산 후 지급돼요. 적립 탭에서 상태를 확인할 수 있어요.' },
  { q:'타 OTA로 예약했는데 캐시백이 안 보여요', a:'예약 확정 정보가 넘어오기까지 며칠 걸릴 수 있어요. 보통 예약 후 수일 내 ‘적립예정’으로 표시됩니다.' },
  { q:'회원 탈퇴하면 캐시백은 어떻게 되나요?', a:'탈퇴 시 적립예정·적립완료 캐시백이 모두 소멸되며, 탈퇴 후 7일간 같은 이메일로 재가입이 제한돼요.' },
  { q:'예약 변경·취소는 어디서 하나요?',   a:'예약·결제는 실제 예약하신 OTA(부킹닷컴·아고다 등)에서 이뤄져요. 변경·취소도 해당 OTA에서 관리해 주세요.' },
  { q:'로그인이 안 돼요',                a:'이메일로 받은 6자리 인증코드를 입력해 주세요. 코드가 오지 않으면 스팸함을 확인하거나 [인증코드 다시 받기]로 재전송할 수 있어요.' },
];

const AC_ICON = { city:'🗺️', area:'📌', hotel:'🏨' };
const AC_TYPE_ORDER = { city:0, area:1, hotel:2 };

// 도시명이 포함됐는지 감지 (자연어 → 도시 파싱 단순 버전)
function detectCity(text){
  if(!text) return null;
  for(const c of POPULAR_CITIES){ if(text.includes(c)) return c; }
  // 확장 별칭
  const alias = {'후쿠오카':'후쿠오카','오키나와':'오키나와','강릉':'강릉'};
  for(const k in alias){ if(text.includes(k)) return alias[k]; }
  return null;
}

// 호텔별 타 OTA 가격 행 생성 (아웃링크용 · 최저가 표시)
function otaRowsFor(hotel){
  const base = hotel.price;
  const rows = OTA_LIST.map((o,i)=>({
    ota:o.name, color:o.color, cb:o.cashback,   // 캐시백 {type,value}
    room: i%2===0 ? '슈페리어 더블룸' : '디럭스 트윈룸',
    price: base + (i-1)*8000,           // 1박 기준, 약간씩 차이
    tags: i%2===0 ? ['무료취소','조식포함'] : ['조식포함','나중에 결제'],
  }));
  rows.sort((a,b)=>a.price-b.price);
  rows[0].lowest = true;
  return rows;
}
