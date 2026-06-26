/* wf-scripts.js — 화면기획서 공통 스크립트 */
(function () {
  'use strict';

  /* TOC 자동 하이라이트 — 스크롤 위치 기반 */
  function initTocHighlight() {
    var sections = document.querySelectorAll('.sec-title[id]');
    var tocLinks = document.querySelectorAll('.toc-link');
    if (!sections.length || !tocLinks.length) return;

    function update() {
      var current = sections[0].id;

      /* 페이지 하단 도달 시 마지막 섹션 강제 하이라이트 (콘텐츠가 짧아 임계값 미달 문제 해결) */
      var atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 16;
      if (atBottom) {
        current = sections[sections.length - 1].id;
      } else {
        sections.forEach(function (sec) {
          /* 섹션 상단이 fixed nav(76px) + 여유(24px) 이내에 들어오면 current로 갱신 */
          if (sec.getBoundingClientRect().top <= 100) current = sec.id;
        });
      }

      tocLinks.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
      });
    }

    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', initTocHighlight);
})();
