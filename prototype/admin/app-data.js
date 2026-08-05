/* ══════════════════════════════════════════════════════════════
   어드민 프로토타입 — 더미 데이터
   기준: 어드민 화면기획서 v0.5 · Phase1 v0.44 · 포인트_정책서 v0.1
   ──────────────────────────────────────────────────────────────
   실제 서비스는 자사 DB(회원) + KAYAK Reporting API(예약·포인트)를
   합쳐서 계산한다. 여기서는 reservations(예약·포인트 원장) 하나에서
   회원 목록의 예약수·누적포인트, 공급사별 집계를 전부 "파생 계산"한다.
   (정책 로직을 눈으로 검증하는 시뮬레이터 성격)
══════════════════════════════════════════════════════════════ */

// 어드민 로그인 계정 (데모) — 아이디 admin01 / 비밀번호 admin1234!
const ADMIN_ACCOUNT = {
  accountId: 'ADM-001',
  loginId:   'admin01',
  password:  'admin1234!',   // 데모 전용 — 실제 서비스는 서버 검증
  name:      '마스터 관리자',
  email:     'admin@allmytour.com',
  role:      'master',
  status:    'active',
  createdAt: '2026-01-01',
  lastLogin: '2026-06-22 09:15',
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

// 회원 (자사 DB) — 탈퇴회원은 즉시 삭제(B안)이므로 목록에 없음 = 데이터에 미포함
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
  { id:'U-10015', email:'putri@example.id',   firstName:'Dewi',    lastName:'Putri', nationality:{code:'ID',flag:'🇮🇩',name:'인도네시아'},phoneCode:'+62', phone:'0812-3456-789', joinDate:'2026-03-25', lastLogin:'2026-06-28 08:15', status:'active', marketing:false },
  { id:'U-10009', email:'smith@example.com',  firstName:'John',    lastName:'Smith', nationality:{code:'US',flag:'🇺🇸',name:'미국'},     phoneCode:'+1',  phone:'',              joinDate:'2026-02-14', lastLogin:'2026-07-22 03:44', status:'active', marketing:true },
  { id:'U-10001', email:'alpha@allmytour.com',firstName:'Alpha',   lastName:'Tester',nationality:{code:'KR',flag:'🇰🇷',name:'대한민국'}, phoneCode:'+82', phone:'010-0000-0001', joinDate:'2026-01-01', lastLogin:'2026-07-30 11:59', status:'active', marketing:true },
];

/* 예약·포인트 원장 (KAYAK Reporting API TypeCode=10 상당)
   status: Active(적립예정) / Approved(지급완료) / Cancelled(취소·만료)
   pointType: PERCENTAGE / FLAT / NONE
   pointAmount: KAYAK 원값(소수점 존재 가능) — 표시·합산 시 floor
   memberEmail: null = 비로그인 이용(회원 미귀속) */
const RESERVATIONS = [
  { resId:'RES-20001', memberEmail:'hong@example.com',   hotel:'Grand Hyatt Seoul',        city:'서울',   checkIn:'2026-07-01', checkOut:'2026-07-03', ota:'Booking.com', amount:320000,  pointAmount:9600,     pointType:'PERCENTAGE', rate:3,   status:'Approved',  payMonth:'2026-08' },
  { resId:'RES-19997', memberEmail:'hong@example.com',   hotel:'Westin Tokyo',             city:'도쿄',   checkIn:'2026-09-10', checkOut:'2026-09-12', ota:'Agoda',       amount:3800000, pointAmount:190000,   pointType:'PERCENTAGE', rate:5,   status:'Active',    payMonth:null },
  { resId:'RES-19750', memberEmail:'hong@example.com',   hotel:'Marina Bay Sands',         city:'싱가포르',checkIn:'2026-04-05', checkOut:'2026-04-07', ota:'Hotels.com',  amount:1200000, pointAmount:0,        pointType:'NONE',       rate:null,status:'Cancelled', payMonth:null },
  { resId:'RES-19980', memberEmail:'hong@example.com',   hotel:'Lotte Hotel Busan',        city:'부산',   checkIn:'2026-05-20', checkOut:'2026-05-21', ota:'Booking.com', amount:180000,  pointAmount:5760,     pointType:'PERCENTAGE', rate:3.2, status:'Approved',  payMonth:'2026-06' },

  { resId:'RES-19995', memberEmail:'mlee@example.com',   hotel:'Shinjuku Prince Hotel',    city:'도쿄',   checkIn:'2026-08-10', checkOut:'2026-08-14', ota:'Agoda',       amount:560000,  pointAmount:28000,    pointType:'PERCENTAGE', rate:5,   status:'Active',    payMonth:null },
  { resId:'RES-19700', memberEmail:'mlee@example.com',   hotel:'Park Hyatt Bangkok',       city:'방콕',   checkIn:'2026-03-01', checkOut:'2026-03-04', ota:'Booking.com', amount:840000,  pointAmount:26880,    pointType:'PERCENTAGE', rate:3.2, status:'Approved',  payMonth:'2026-04' },
  { resId:'RES-19620', memberEmail:'mlee@example.com',   hotel:'Hotel Naru Seoul',         city:'서울',   checkIn:'2026-02-11', checkOut:'2026-02-12', ota:'Hotels.com',  amount:150000,  pointAmount:13200,    pointType:'FLAT',       rate:null,status:'Approved',  payMonth:'2026-03' },
  { resId:'RES-19540', memberEmail:'mlee@example.com',   hotel:'Conrad Osaka',             city:'오사카', checkIn:'2026-01-18', checkOut:'2026-01-20', ota:'Trip.com',    amount:690000,  pointAmount:17940.62, pointType:'PERCENTAGE', rate:2.6, status:'Approved',  payMonth:'2026-02' },

  { resId:'RES-20000', memberEmail:'jkim@example.com',   hotel:'Four Seasons Seoul',       city:'서울',   checkIn:'2026-08-25', checkOut:'2026-08-27', ota:'Agoda',       amount:450000,  pointAmount:21600,    pointType:'PERCENTAGE', rate:4.8, status:'Active',    payMonth:null },
  { resId:'RES-19870', memberEmail:'jkim@example.com',   hotel:'The Shilla Seoul',         city:'서울',   checkIn:'2026-03-22', checkOut:'2026-03-23', ota:'Booking.com', amount:380000,  pointAmount:12160,    pointType:'PERCENTAGE', rate:3.2, status:'Approved',  payMonth:'2026-04' },

  // 비회원(labels 없는 건) — KAYAK 정산 대사 목적으로 포인트 내역에 포함 (포인트_정책서 v0.1)
  { resId:'RES-19998', memberEmail:null,                 hotel:'Novotel Ambassador',       city:'서울',   checkIn:'2026-06-30', checkOut:'2026-07-01', ota:'Agoda',       amount:210000,  pointAmount:10080,    pointType:'PERCENTAGE', rate:4.8, status:'Approved',  payMonth:'2026-07' },
  { resId:'RES-19999', memberEmail:null,                 hotel:'Ibis Ambassador Seoul',    city:'서울',   checkIn:'2026-08-22', checkOut:'2026-08-24', ota:'Booking.com', amount:160000,  pointAmount:5120,     pointType:'PERCENTAGE', rate:3.2, status:'Active',    payMonth:null },

  { resId:'RES-19960', memberEmail:'tpark@example.com',  hotel:'Hilton Nagoya',            city:'나고야', checkIn:'2026-06-12', checkOut:'2026-06-14', ota:'Trip.com',    amount:520000,  pointAmount:13520,    pointType:'PERCENTAGE', rate:2.6, status:'Approved',  payMonth:'2026-07' },
  { resId:'RES-19930', memberEmail:'tpark@example.com',  hotel:'Kayak Test Resort',        city:'세부',   checkIn:'2026-05-05', checkOut:'2026-05-09', ota:'Kayak.com',   amount:980000,  pointAmount:29400,    pointType:'PERCENTAGE', rate:3.0, status:'Approved',  payMonth:'2026-06' },
  { resId:'RES-19910', memberEmail:'tpark@example.com',  hotel:'Priceline Stay LA',        city:'로스앤젤레스',checkIn:'2026-04-28', checkOut:'2026-04-30', ota:'Priceline', amount:640000, pointAmount:8000,     pointType:'FLAT',       rate:null,status:'Cancelled', payMonth:null },

  { resId:'RES-19890', memberEmail:'sato@example.jp',    hotel:'Mandarin Oriental Tokyo',  city:'도쿄',   checkIn:'2026-06-18', checkOut:'2026-06-20', ota:'Booking.com', amount:720000,  pointAmount:23040,    pointType:'PERCENTAGE', rate:3.2, status:'Approved',  payMonth:'2026-07' },
  { resId:'RES-19855', memberEmail:'sato@example.jp',    hotel:'Expedia Partner Inn',      city:'삿포로', checkIn:'2026-05-11', checkOut:'2026-05-12', ota:'Expedia',     amount:130000,  pointAmount:0,        pointType:'NONE',       rate:null,status:'Approved',  payMonth:'2026-06' },

  { resId:'RES-19820', memberEmail:'chen@example.tw',    hotel:'W Taipei',                 city:'타이베이',checkIn:'2026-06-01', checkOut:'2026-06-03', ota:'Agoda',       amount:410000,  pointAmount:19680,    pointType:'PERCENTAGE', rate:4.8, status:'Approved',  payMonth:'2026-07' },
  { resId:'RES-19790', memberEmail:'nguyen@example.vn',  hotel:'InterContinental Danang',  city:'다낭',   checkIn:'2026-05-25', checkOut:'2026-05-28', ota:'Trip.com',    amount:560000,  pointAmount:14560,    pointType:'PERCENTAGE', rate:2.6, status:'Approved',  payMonth:'2026-06' },
  { resId:'RES-19770', memberEmail:'garcia@example.mx',  hotel:'Hotels Stay Cancun',       city:'칸쿤',   checkIn:'2026-04-20', checkOut:'2026-04-24', ota:'Hotels.com',  amount:990000,  pointAmount:13200,    pointType:'FLAT',       rate:null,status:'Approved',  payMonth:'2026-05' },
  { resId:'RES-19730', memberEmail:'putri@example.id',   hotel:'The Mulia Bali',           city:'발리',   checkIn:'2026-03-15', checkOut:'2026-03-18', ota:'Agoda',       amount:770000,  pointAmount:36960,    pointType:'PERCENTAGE', rate:4.8, status:'Approved',  payMonth:'2026-04' },
  { resId:'RES-19680', memberEmail:'smith@example.com',  hotel:'Kayak Grand NYC',          city:'뉴욕',   checkIn:'2026-02-20', checkOut:'2026-02-22', ota:'Kayak.com',   amount:1450000, pointAmount:43500,    pointType:'PERCENTAGE', rate:3.0, status:'Approved',  payMonth:'2026-03' },

  { resId:'RES-19600', memberEmail:'alpha@allmytour.com',hotel:'Marina Bay Sands',         city:'싱가포르',checkIn:'2026-05-10', checkOut:'2026-05-13', ota:'Hotels.com',  amount:1320000, pointAmount:13200,    pointType:'FLAT',       rate:null,status:'Cancelled', payMonth:null },
  { resId:'RES-19560', memberEmail:'alpha@allmytour.com',hotel:'Grand Hyatt Seoul',        city:'서울',   checkIn:'2026-04-01', checkOut:'2026-04-02', ota:'Booking.com', amount:290000,  pointAmount:9280,     pointType:'PERCENTAGE', rate:3.2, status:'Approved',  payMonth:'2026-05' },
  { resId:'RES-19520', memberEmail:'alpha@allmytour.com',hotel:'Conrad Seoul',             city:'서울',   checkIn:'2026-03-08', checkOut:'2026-03-10', ota:'Agoda',       amount:640000,  pointAmount:30720,    pointType:'PERCENTAGE', rate:4.8, status:'Approved',  payMonth:'2026-04' },
  { resId:'RES-19480', memberEmail:'alpha@allmytour.com',hotel:'Trip Test Hotel',          city:'홍콩',   checkIn:'2026-02-02', checkOut:'2026-02-04', ota:'Trip.com',    amount:510000,  pointAmount:13260.87, pointType:'PERCENTAGE', rate:2.6, status:'Approved',  payMonth:'2026-03' },
];
