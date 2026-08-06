/* ══════════════════════════════════════════════════════════════
   어드민 프로토타입 — 더미 데이터
   기준: 어드민 화면기획서 v0.8 · Phase1 v0.45 · 포인트_정책서 v0.1
   ──────────────────────────────────────────────────────────────
   예약내역(BOOK01/BOOK02) 중심. reservations 원장 하나에서
   회원 목록 예약수·누적포인트, 공급사별 집계, 대시보드를 파생 계산.
   포인트 상태(자사 정의): 적립예정/적립완료/취소
   - 적립완료 = 체크아웃+7일 <= 오늘(자사 배치)  · 적립예정 = 아직 미도래
   - 취소 = KAYAK Cancelled 감지 (cancelled=true)
══════════════════════════════════════════════════════════════ */

const TODAY = '2026-08-05';   // 데모 기준일
const FX = 1350;              // USD→KRW 데모 환율 (표시용)

// 어드민 로그인 계정 (데모) — admin01 / admin1234!
const ADMIN_ACCOUNT = {
  accountId:'ADM-001', loginId:'admin01', password:'admin1234!',
  name:'마스터 관리자', email:'admin@allmytour.com', role:'master',
  status:'active', createdAt:'2026-01-01', lastLogin:'2026-06-22 09:15',
};

// OTA 공급사 메타 (포인트율/타입은 KAYAK 기준 그대로) — cb02 표시용
const PROVIDERS = {
  'Booking.com': { short:'Bk', color:'#003580', type:'PERCENTAGE', rate:3.2 },
  'Agoda':       { short:'Ag', color:'#e03c31', type:'PERCENTAGE', rate:4.8 },
  'Hotels.com':  { short:'Ht', color:'#0078d4', type:'FLAT',       flat:13200 },
  'Expedia':     { short:'Ex', color:'#f60',    type:'NONE' },
  'Trip.com':    { short:'Tr', color:'#2577e3', type:'PERCENTAGE', rate:2.6 },
  'Kayak.com':   { short:'Ky', color:'#ff690f', type:'PERCENTAGE', rate:3.0 },
  'Priceline':   { short:'Pr', color:'#00457c', type:'FLAT',       flat:8000 },
};

// 회원 (자사 DB) — 이메일이 곧 식별자. 탈퇴회원은 즉시 삭제(미포함)
const MEMBERS = [
  { id:'U-10042', email:'hong@example.com',   firstName:'Gildong', lastName:'Hong',  nationality:{code:'KR',flag:'🇰🇷',name:'대한민국'}, phoneCode:'+82', phone:'010-1234-5678', joinDate:'2026-06-22', lastLogin:'2026-07-28 21:10', status:'active', marketing:true },
  { id:'U-10041', email:'jkim@example.com',   firstName:'Jane',    lastName:'Kim',   nationality:{code:'KR',flag:'🇰🇷',name:'대한민국'}, phoneCode:'+82', phone:'010-2222-1111', joinDate:'2026-06-21', lastLogin:'2026-07-20 08:33', status:'active', marketing:false },
  { id:'U-10040', email:'mlee@example.com',   firstName:'Minji',   lastName:'Lee',   nationality:{code:'KR',flag:'🇰🇷',name:'대한민국'}, phoneCode:'+82', phone:'010-3333-4444', joinDate:'2026-06-20', lastLogin:'2026-07-29 12:05', status:'active', marketing:true },
  { id:'U-10039', email:'user49@example.com', firstName:'',        lastName:'',      nationality:{code:'US',flag:'🇺🇸',name:'미국'},     phoneCode:'+1',  phone:'',              joinDate:'2026-06-19', lastLogin:'2026-06-19 17:40', status:'active', marketing:false },
  { id:'U-10038', email:'tpark@example.com',  firstName:'Tom',     lastName:'Park',  nationality:{code:'KR',flag:'🇰🇷',name:'대한민국'}, phoneCode:'+82', phone:'010-5555-6666', joinDate:'2026-06-18', lastLogin:'2026-07-15 09:12', status:'active', marketing:true },
  { id:'U-10035', email:'sato@example.jp',    firstName:'Haruki',  lastName:'Sato',  nationality:{code:'JP',flag:'🇯🇵',name:'일본'},     phoneCode:'+81', phone:'090-1111-2222', joinDate:'2026-06-10', lastLogin:'2026-07-25 22:41', status:'active', marketing:false },
  { id:'U-10031', email:'chen@example.tw',    firstName:'Wei',     lastName:'Chen',  nationality:{code:'TW',flag:'🇹🇼',name:'대만'},     phoneCode:'+886',phone:'0912-345-678',  joinDate:'2026-05-30', lastLogin:'2026-07-10 14:20', status:'active', marketing:true },
  { id:'U-10028', email:'nguyen@example.vn',  firstName:'Anh',     lastName:'Nguyen',nationality:{code:'VN',flag:'🇻🇳',name:'베트남'},   phoneCode:'+84', phone:'091-234-5678',  joinDate:'2026-05-22', lastLogin:'2026-07-27 10:00', status:'active', marketing:false },
  { id:'U-10020', email:'garcia@example.mx',  firstName:'Sofia',   lastName:'Garcia',nationality:{code:'MX',flag:'🇲🇽',name:'멕시코'},   phoneCode:'+52', phone:'55-1234-5678',  joinDate:'2026-04-18', lastLogin:'2026-07-01 19:30', status:'active', marketing:true },
  { id:'U-10025', email:'choi@example.com',   firstName:'Minsu',   lastName:'Choi',  nationality:{code:'KR',flag:'🇰🇷',name:'대한민국'}, phoneCode:'+82', phone:'010-7777-8888', joinDate:'2026-05-15', lastLogin:'2026-07-12 20:03', status:'active', marketing:false },
  { id:'U-10015', email:'putri@example.id',   firstName:'Dewi',    lastName:'Putri', nationality:{code:'ID',flag:'🇮🇩',name:'인도네시아'},phoneCode:'+62', phone:'0812-3456-789', joinDate:'2026-03-25', lastLogin:'2026-06-28 08:15', status:'active', marketing:false },
  { id:'U-10009', email:'smith@example.com',  firstName:'John',    lastName:'Smith', nationality:{code:'US',flag:'🇺🇸',name:'미국'},     phoneCode:'+1',  phone:'',              joinDate:'2026-02-14', lastLogin:'2026-07-22 03:44', status:'active', marketing:true },
  { id:'U-10001', email:'alpha@allmytour.com',firstName:'Alpha',   lastName:'Tester',nationality:{code:'KR',flag:'🇰🇷',name:'대한민국'}, phoneCode:'+82', phone:'010-0000-0001', joinDate:'2026-01-01', lastLogin:'2026-07-30 11:59', status:'active', marketing:true },
];

/* 예약·포인트 원장 (KAYAK Reporting API TransactionType=Booking 상당)
   memberEmail: null = 비회원(labels 없음) · cancelled: true = KAYAK Cancelled
   포인트 상태는 app.js에서 (cancelled / 체크아웃+7일 vs TODAY)로 파생
   cashbackType: PERCENTAGE(rate%) / FLAT(flatUSD) / NONE
   usd·krw = 적립기준금액(BookingValue / LocalisedBookingValue)
   cashbackUSD·pointKRW = 캐시백(USD 원시) / 포인트지급액(KRW, 소수점 포함 가능) */
const RESERVATIONS = [
  { resId:'RES-20042', bookingDate:'2026-06-28', memberEmail:'hong@example.com',  hotel:'Grand Hyatt Seoul',      city:'서울',   country:'대한민국', countryCode:'KR', checkIn:'2026-07-01', checkOut:'2026-07-03', ota:'Booking.com', device:'Mobile',  lang:'ko', langName:'한국어', usd:237.04, krw:320000, cashbackType:'PERCENTAGE', cashbackValue:3.2, cashbackUSD:7.58, pointKRW:10240, cancelled:false },
  { resId:'RES-19980', bookingDate:'2026-05-18', memberEmail:'hong@example.com',  hotel:'Lotte Hotel Busan',      city:'부산',   country:'대한민국', countryCode:'KR', checkIn:'2026-05-20', checkOut:'2026-05-21', ota:'Booking.com', device:'Mobile',  lang:'ko', langName:'한국어', usd:133.33, krw:180000, cashbackType:'PERCENTAGE', cashbackValue:3.2, cashbackUSD:4.27, pointKRW:5760,  cancelled:false },
  { resId:'RES-19750', bookingDate:'2026-04-01', memberEmail:'hong@example.com',  hotel:'Marina Bay Sands',       city:'싱가포르',country:'싱가포르', countryCode:'SG', checkIn:'2026-04-05', checkOut:'2026-04-07', ota:'Agoda',       device:'Desktop', lang:'ko', langName:'한국어', usd:888.89, krw:1200000, cashbackType:'PERCENTAGE', cashbackValue:4.8, cashbackUSD:0, pointKRW:0, cancelled:true },
  { resId:'RES-19997', bookingDate:'2026-08-01', memberEmail:'hong@example.com',  hotel:'Westin Tokyo',           city:'도쿄',   country:'일본',    countryCode:'JP', checkIn:'2026-09-10', checkOut:'2026-09-12', ota:'Agoda',       device:'Mobile',  lang:'ja', langName:'일본어', usd:2814.81, krw:3800000, cashbackType:'PERCENTAGE', cashbackValue:5.0, cashbackUSD:140.74, pointKRW:190000, cancelled:false },

  { resId:'RES-20000', bookingDate:'2026-07-30', memberEmail:'jkim@example.com',  hotel:'Four Seasons Seoul',     city:'서울',   country:'대한민국', countryCode:'KR', checkIn:'2026-08-25', checkOut:'2026-08-27', ota:'Agoda',       device:'Desktop', lang:'ko', langName:'한국어', usd:333.33, krw:450000, cashbackType:'PERCENTAGE', cashbackValue:4.8, cashbackUSD:16.0, pointKRW:21600, cancelled:false },
  { resId:'RES-19870', bookingDate:'2026-03-20', memberEmail:'jkim@example.com',  hotel:'The Shilla Seoul',       city:'서울',   country:'대한민국', countryCode:'KR', checkIn:'2026-03-22', checkOut:'2026-03-23', ota:'Booking.com', device:'Mobile',  lang:'ko', langName:'한국어', usd:281.48, krw:380000, cashbackType:'PERCENTAGE', cashbackValue:3.2, cashbackUSD:9.01, pointKRW:12160, cancelled:false },

  { resId:'RES-19700', bookingDate:'2026-02-27', memberEmail:'mlee@example.com',  hotel:'Park Hyatt Bangkok',     city:'방콕',   country:'태국',    countryCode:'TH', checkIn:'2026-03-01', checkOut:'2026-03-04', ota:'Booking.com', device:'Mobile',  lang:'ko', langName:'한국어', usd:622.22, krw:840000, cashbackType:'PERCENTAGE', cashbackValue:3.2, cashbackUSD:19.91, pointKRW:26880, cancelled:false },
  { resId:'RES-19620', bookingDate:'2026-02-09', memberEmail:'mlee@example.com',  hotel:'Hotel Naru Seoul',       city:'서울',   country:'대한민국', countryCode:'KR', checkIn:'2026-02-11', checkOut:'2026-02-12', ota:'Hotels.com',  device:'Desktop', lang:'ko', langName:'한국어', usd:111.11, krw:150000, cashbackType:'FLAT', cashbackValue:9.78, cashbackUSD:9.78, pointKRW:13200, cancelled:false },
  { resId:'RES-19540', bookingDate:'2026-01-16', memberEmail:'mlee@example.com',  hotel:'Conrad Osaka',           city:'오사카', country:'일본',    countryCode:'JP', checkIn:'2026-01-18', checkOut:'2026-01-20', ota:'Trip.com',    device:'Mobile',  lang:'ko', langName:'한국어', usd:511.11, krw:690000, cashbackType:'PERCENTAGE', cashbackValue:2.6, cashbackUSD:13.29, pointKRW:17940, cancelled:false },

  { resId:'RES-19998', bookingDate:'2026-06-30', memberEmail:null,                hotel:'Novotel Ambassador',     city:'서울',   country:'대한민국', countryCode:'KR', checkIn:'2026-06-30', checkOut:'2026-07-01', ota:'Agoda',       device:'Mobile',  lang:'en', langName:'영어',   usd:155.56, krw:210000, cashbackType:'PERCENTAGE', cashbackValue:4.8, cashbackUSD:7.47, pointKRW:10080, cancelled:false },
  { resId:'RES-19985', bookingDate:'2026-07-20', memberEmail:null,                hotel:'The Westin Bangkok',     city:'방콕',   country:'태국',    countryCode:'TH', checkIn:'2026-07-20', checkOut:'2026-07-23', ota:'Agoda',       device:'Desktop', lang:'en', langName:'영어',   usd:592.59, krw:800000, cashbackType:'PERCENTAGE', cashbackValue:4.8, cashbackUSD:28.44, pointKRW:38400, cancelled:false },

  // 더미6 (대화창2 크로스 플래그) — 포인트 미제공(NONE) 공급사 + 취소. 포인트 관련 필드 전부 null → 포인트·타입 "—"
  { resId:'RES-20133', bookingDate:'2026-07-10', memberEmail:'choi@example.com',  hotel:'Novotel Ambassador Seoul Yongsan', city:'서울', country:'대한민국', countryCode:'KR', checkIn:'2026-07-20', checkOut:'2026-07-22', ota:'Accor Hotels', device:'Mobile', lang:'ko', langName:'한국어', usd:355.56, krw:480000, cashbackType:'NONE', cashbackValue:null, cashbackUSD:0, pointKRW:0, cancelled:true },

  { resId:'RES-19890', bookingDate:'2026-06-16', memberEmail:'sato@example.jp',   hotel:'Mandarin Oriental Tokyo',city:'도쿄',   country:'일본',    countryCode:'JP', checkIn:'2026-06-18', checkOut:'2026-06-20', ota:'Booking.com', device:'Mobile',  lang:'ja', langName:'일본어', usd:533.33, krw:720000, cashbackType:'PERCENTAGE', cashbackValue:3.2, cashbackUSD:17.07, pointKRW:23040, cancelled:false },

  { resId:'RES-19820', bookingDate:'2026-05-30', memberEmail:'chen@example.tw',   hotel:'W Taipei',               city:'타이베이',country:'대만',    countryCode:'TW', checkIn:'2026-06-01', checkOut:'2026-06-03', ota:'Agoda',       device:'Mobile',  lang:'zh', langName:'중국어(번체)', usd:303.70, krw:410000, cashbackType:'PERCENTAGE', cashbackValue:4.8, cashbackUSD:14.58, pointKRW:19680, cancelled:false },
  { resId:'RES-19790', bookingDate:'2026-05-23', memberEmail:'nguyen@example.vn', hotel:'InterContinental Danang',city:'다낭',   country:'베트남',  countryCode:'VN', checkIn:'2026-05-25', checkOut:'2026-05-28', ota:'Trip.com',    device:'Mobile',  lang:'vi', langName:'베트남어', usd:414.81, krw:560000, cashbackType:'PERCENTAGE', cashbackValue:2.6, cashbackUSD:10.78, pointKRW:14560, cancelled:false },
  { resId:'RES-19770', bookingDate:'2026-04-18', memberEmail:'garcia@example.mx', hotel:'Hotels Stay Cancun',     city:'칸쿤',   country:'멕시코',  countryCode:'MX', checkIn:'2026-04-20', checkOut:'2026-04-24', ota:'Hotels.com',  device:'Desktop', lang:'es', langName:'스페인어', usd:733.33, krw:990000, cashbackType:'FLAT', cashbackValue:9.78, cashbackUSD:9.78, pointKRW:13200, cancelled:false },
  { resId:'RES-19730', bookingDate:'2026-03-13', memberEmail:'putri@example.id',  hotel:'The Mulia Bali',         city:'발리',   country:'인도네시아',countryCode:'ID', checkIn:'2026-03-15', checkOut:'2026-03-18', ota:'Agoda',       device:'Mobile',  lang:'id', langName:'인도네시아어', usd:570.37, krw:770000, cashbackType:'PERCENTAGE', cashbackValue:4.8, cashbackUSD:27.38, pointKRW:36960, cancelled:false },
  { resId:'RES-19680', bookingDate:'2026-02-18', memberEmail:'smith@example.com', hotel:'Kayak Grand NYC',        city:'뉴욕',   country:'미국',    countryCode:'US', checkIn:'2026-02-20', checkOut:'2026-02-22', ota:'Kayak.com',   device:'Desktop', lang:'en', langName:'영어',   usd:1074.07, krw:1450000, cashbackType:'PERCENTAGE', cashbackValue:3.0, cashbackUSD:32.22, pointKRW:43500, cancelled:false },

  { resId:'RES-19600', bookingDate:'2026-05-08', memberEmail:'alpha@allmytour.com', hotel:'Marina Bay Sands',     city:'싱가포르',country:'싱가포르', countryCode:'SG', checkIn:'2026-05-10', checkOut:'2026-05-13', ota:'Hotels.com',  device:'Desktop', lang:'ko', langName:'한국어', usd:977.78, krw:1320000, cashbackType:'FLAT', cashbackValue:9.78, cashbackUSD:0, pointKRW:0, cancelled:true },
  { resId:'RES-19560', bookingDate:'2026-03-30', memberEmail:'alpha@allmytour.com', hotel:'Grand Hyatt Seoul',    city:'서울',   country:'대한민국', countryCode:'KR', checkIn:'2026-04-01', checkOut:'2026-04-02', ota:'Booking.com', device:'Mobile',  lang:'ko', langName:'한국어', usd:214.81, krw:290000, cashbackType:'PERCENTAGE', cashbackValue:3.2, cashbackUSD:6.88, pointKRW:9280, cancelled:false },
  { resId:'RES-19520', bookingDate:'2026-03-06', memberEmail:'alpha@allmytour.com', hotel:'Conrad Seoul',         city:'서울',   country:'대한민국', countryCode:'KR', checkIn:'2026-03-08', checkOut:'2026-03-10', ota:'Agoda',       device:'Mobile',  lang:'ko', langName:'한국어', usd:474.07, krw:640000, cashbackType:'PERCENTAGE', cashbackValue:4.8, cashbackUSD:22.76, pointKRW:30720, cancelled:false },
];
