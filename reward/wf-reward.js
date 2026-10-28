/* 캡처 위에 표시를 얹는다. 위치는 shots/markers.js (캡처 도구가 자동 생성)
   - 숫자 = 기능(빨간 원) / 알파벳 = 영역(파란 상자)
   - 번호는 요소 모서리에 걸치되 캡처 밖으로 나가지 않게 밀어 넣는다
   - 마우스 강조는 '.unit'(캡처 + 그 설명 묶음) 안에서만 연동한다. '.unit'이 없으면 '.sec' */
(function(){
  function place(fig){
    var id = fig.getAttribute('data-id'), M = (window.MARKERS || {})[id];
    if(!M){ fig.innerHTML = '<div style="padding:40px;color:#d9480f">캡처 없음: ' + id + '</div>'; return; }
    var base = fig.getAttribute('data-base') || '';
    fig.innerHTML = '<img alt="' + id + ' 화면 캡처" src="' + base + M.img + '">';
    var only = (fig.getAttribute('data-only') || '').split(',').filter(Boolean);
    M.m.forEach(function(m){
      if(only.length && only.indexOf(m.n) < 0) return;
      var zone = /^[A-Za-z]/.test(m.n);
      var d = document.createElement('div');
      d.className = 'mk' + (zone ? ' zone' : ''); d.setAttribute('data-n', m.n);
      var x = Math.max(0, m.x), y = Math.max(0, m.y);
      d.style.left = x + '%'; d.style.top = y + '%';
      d.style.width = Math.min(100 - x, m.w) + '%'; d.style.height = Math.min(100 - y, m.h) + '%';
      d.innerHTML = '<div class="box-o"></div><div class="no">' + m.n + '</div>';
      fig.appendChild(d);
    });
    /* 숫자는 요소 모서리에 걸쳐 두되(내용을 덜 가림), 캡처 가장자리에 닿으면 안쪽으로 밀어 넣는다 */
    var img = fig.querySelector('img');
    function clamp(){
      var fw = fig.clientWidth, fh = fig.clientHeight;
      /* 영역 꼬리표: 위쪽에 공간이 있으면 상자 바깥 위에 — 영역 안 첫 글자를 가리지 않게 */
      var zones = [].slice.call(fig.querySelectorAll('.mk.zone'));
      zones.forEach(function(mk){
        var no = mk.querySelector('.no'), h = no.offsetHeight, w = no.offsetWidth;
        var L = mk.offsetLeft, T = mk.offsetTop - h;          // 바깥 위에 놓을 자리
        var hit = T < 0 || zones.some(function(o){
          if(o === mk) return false;
          return L < o.offsetLeft + o.offsetWidth && L + w > o.offsetLeft &&
                 T < o.offsetTop + o.offsetHeight && T + h > o.offsetTop;
        });
        if(!hit){ no.style.top = -h + 'px'; no.style.borderRadius = '6px 6px 0 0'; }
        else { no.style.top = '0px'; no.style.borderRadius = ''; }
      });
      fig.querySelectorAll('.mk:not(.zone) .no').forEach(function(no){
        var mk = no.parentNode, x = mk.offsetLeft, y = mk.offsetTop, nw = no.offsetWidth, nh = no.offsetHeight;
        /* 1순위: 요소가 카드 왼쪽 가장자리에서 시작하면(왼쪽이 여백) 바깥 왼쪽 · 세로 가운데 — 내용을 가리지 않음
           (가운데 있는 요소에 쓰면 옆 요소 위로 넘어가므로 왼쪽 여백 폭 안에서만) */
        if(x >= nw + 3 && x <= fw * 0.12){
          no.style.left = -(nw + 2) + 'px';
          no.style.top  = Math.max(-y + 2, Math.min(mk.offsetHeight / 2 - nh / 2, 40)) + 'px';
        } else {
          /* 2순위: 모서리에 걸침 (캡처 밖으로는 나가지 않게) */
          no.style.left = Math.max(-9, -x + 2) + 'px';
          no.style.top  = Math.max(-9, -y + 2) + 'px';
          /* 큰 요소(이미지 등)는 위쪽 모서리가 다른 요소와 겹치기 쉬워 세로 가운데에 붙인다 */
          if(mk.offsetHeight >= 80) no.style.top = (mk.offsetHeight / 2 - 10) + 'px';
        }
        if(x + no.offsetWidth - 9 > fw) no.style.left = (fw - x - no.offsetWidth - 2) + 'px';
        if(y + no.offsetHeight - 9 > fh) no.style.top = (fh - y - no.offsetHeight - 2) + 'px';
      });
    }
    if(img.complete) clamp(); else img.addEventListener('load', clamp);
    window.addEventListener('resize', clamp);
  }
  function link(scope){
    function hl(n, on){
      scope.querySelectorAll('.mk[data-n="' + n + '"], .cn[data-n="' + n + '"], .zrow[data-n="' + n + '"]')
        .forEach(function(e){ e.classList.toggle('hl', on); });
    }
    scope.addEventListener('mouseover', function(e){ var t = e.target.closest('[data-n]'); if(t && scope.contains(t)) hl(t.getAttribute('data-n'), true); });
    scope.addEventListener('mouseout',  function(e){ var t = e.target.closest('[data-n]'); if(t && scope.contains(t)) hl(t.getAttribute('data-n'), false); });
  }
  /* 정책 절 팝업 — 「N-N절」 링크를 누르면 페이지 이동 없이 그 절만 보여준다 (PO 2026-10-26)
     데이터: policy/*_data.js (build_policy.py 가 생성). 데이터가 없으면 원래대로 이동한다 */
  function policyPopup(){
    var ov = document.createElement('div');
    ov.className = 'pp-ov'; ov.hidden = true;
    ov.innerHTML = '<div class="pp" role="dialog" aria-modal="true"><div class="pp-hd"><div><small class="pp-doc"></small><h3 class="pp-t"></h3></div>' +
      '<button class="pp-x" aria-label="닫기">✕</button></div><div class="pp-b pol"></div>' +
      '<div class="pp-ft"><a class="pp-full">정책서 전체에서 보기 ›</a></div></div>';
    document.body.appendChild(ov);
    function close(){ ov.hidden = true; document.body.style.overflow = ''; }
    ov.addEventListener('click', function(e){ if(e.target === ov || e.target.closest('.pp-x')) close(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !ov.hidden) close(); });
    document.addEventListener('click', function(e){
      var a = e.target.closest('a[href*="policy/"][href*=".html#s"]');
      if(!a || ov.contains(a)) return;
      var href = a.getAttribute('href'), m = href.match(/policy\/([^#]+)#(s[\d-]+)/);
      var doc = m && window.POLICY && window.POLICY[m[1]], sec = doc && doc.s[m[2]];
      if(!sec) return;
      e.preventDefault();
      ov.querySelector('.pp-doc').textContent = doc.title;
      ov.querySelector('.pp-t').textContent = sec.t;
      ov.querySelector('.pp-b').innerHTML = sec.h || '<p>(이 절의 본문은 하위 절에 있습니다)</p>';
      ov.querySelector('.pp-full').setAttribute('href', href);
      ov.hidden = false; document.body.style.overflow = 'hidden';
      ov.querySelector('.pp-b').scrollTop = 0;
    });
  }

  /* 목차 — 지금 보고 있는 절을 강조 */
  function tocSpy(){
    var links = [].slice.call(document.querySelectorAll('.toc a[href^="#"]'));
    if(!links.length) return;
    var targets = links.map(function(a){ return document.getElementById(a.getAttribute('href').slice(1)); });
    function onScroll(){
      var cur = 0;
      targets.forEach(function(t, i){ if(t && t.getBoundingClientRect().top < 140) cur = i; });
      links.forEach(function(a, i){ a.classList.toggle('on', i === cur); });
    }
    window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  }

  document.addEventListener('DOMContentLoaded', function(){
    policyPopup(); tocSpy();
    document.querySelectorAll('figure.shot[data-id]').forEach(place);
    var units = document.querySelectorAll('.unit');
    (units.length ? units : document.querySelectorAll('.sec')).forEach(link);
    if(units.length) document.querySelectorAll('.sec').forEach(function(s){ if(!s.querySelector('.unit')) link(s); });
  });
})();
