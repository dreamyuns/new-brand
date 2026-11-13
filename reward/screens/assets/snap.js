/* 개발 화면 모음 — 떠낸 화면에서 스크롤 위치를 되살리고, 표시한 버튼만 눌리게 한다 */
(function(){
  function restore(){
    document.querySelectorAll('[data-snap-scroll]').forEach(function(e){var p=e.getAttribute('data-snap-scroll').split(',');e.scrollLeft=+p[0];e.scrollTop=+p[1];});
    var w=(document.documentElement.getAttribute('data-snap-win')||'0,0').split(','); window.scrollTo(+w[0],+w[1]);
  }
  if(document.readyState==='complete') restore(); else window.addEventListener('load', restore);
  // 스크롤하면 다른 상태로(예: 아래로 내리면 위쪽 제목이 포인트 칩으로) — data-snap-scrollgo="60:다음id" (음수 = 그 값보다 위로 올리면)
  var sg=document.documentElement.getAttribute('data-snap-scrollgo');
  if(sg){ var t=+sg.split(':')[0], to=sg.split(':')[1]; setTimeout(function(){
    window.addEventListener('scroll', function(){ var y=window.scrollY;
      if((t>0&&y>t)||(t<0&&y<-t)){ location.href=to+'.html'; } }, {passive:true}); }, 400); }
  document.addEventListener('click', function(ev){
    var g=ev.target.closest('[data-goto]');
    ev.preventDefault(); ev.stopPropagation();
    if(g){ location.href=g.getAttribute('data-goto')+'.html'; }
  }, true);
  document.addEventListener('submit', function(ev){ ev.preventDefault(); }, true);
  var st=document.createElement('style');
  st.textContent='[data-goto]{cursor:pointer;animation:snapHint 1.6s ease-in-out 1}'+
    '@keyframes snapHint{0%,100%{box-shadow:none}50%{box-shadow:0 0 0 3px rgba(53,107,235,.45)}}';
  document.head.appendChild(st);
  document.querySelectorAll('video').forEach(function(v){v.muted=true; var p=v.play(); if(p&&p.catch)p.catch(function(){});});
})();
