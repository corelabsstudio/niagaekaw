/**
 * 잠든 프로젝트 공포 일기 — 스토리 데이터
 *
 * 기존 20편 전량 삭제 (2026-07-26). 말이 안 되는 초안이라 폐기.
 * 백업: diary-stories.LEGACY-backup.js (배포/런타임에 로드하지 않음)
 *
 * 새 스토리 스키마 (STORIES 배열에 객체 추가):
 * {
 *   id: "01",                 // 고유 문자열
 *   title: "짧은 제목",
 *   logName: "snake_case",    // 디버그/로그용
 *   past: {
 *     date: "— 약 3개월 전 —",
 *     paras: ["단락1", "단락2", ...],   // 여러 단락
 *     aside: "선택 · 작은 메모 한 줄",
 *   },
 *   mid: {
 *     date: "— 약 1개월 전 —",
 *     paras: ["단락1", ...],
 *     fear: "선택 · 페이지 말미 한 줄 공포",
 *   },
 *   today: {
 *     status: ["> 상태줄1_", "> 상태줄2_"],
 *     human: ["사람 글 단락..."],       // 타이핑 연출
 *     system: ["가로채는 글..."],       // 잠든 프로젝트 시점
 *     glitch: "바직— ████ ...",
 *   },
 * }
 *
 * 세션마다 1편 (sessionStorage). ?story=1 또는 ?story=01 강제 가능.
 */
(function () {
  "use strict";

  /**
   * past = 약 3개월 전
   * mid  = 약 1개월 전
   * today = 오늘 (사람 글 → 가로챔)
   *
   * ★ 여기에 새 스토리만 넣는다. 지금은 비어 있음.
   */
  var STORIES = [
    // 예)
    // {
    //   id: "01",
    //   title: "제목",
    //   logName: "example",
    //   past: { date: "— 약 3개월 전 —", paras: ["..."], aside: "" },
    //   mid:  { date: "— 약 1개월 전 —", paras: ["..."], fear: "" },
    //   today: {
    //     status: ["> 기록 열림 — 이어쓰기 모드_", "> 작성자: 나_"],
    //     human: ["..."],
    //     system: ["..."],
    //     glitch: "바직— ████",
    //   },
    // },
  ];

  /** 스토리 0편일 때만 쓰는 안전 스텁 — 본 콘텐츠 아님 */
  var EMPTY_STUB = {
    id: "00",
    title: "(스토리 교체 중)",
    logName: "empty_stub",
    past: {
      date: "— —",
      paras: [
        "일기 본문이 아직 없다. 새 스토리를 diary-stories.js 의 STORIES 배열에 추가하면 이 자리로 들어온다.",
      ],
      aside: "",
    },
    mid: {
      date: "— —",
      paras: ["교체 전까지 이 페이지는 플레이스홀더다."],
      fear: "",
    },
    today: {
      status: ["> 기록 없음 — 스토리 대기_", "> STORIES.length = 0_"],
      human: [
        "새 일기 원고를 넣으면 여기서 타이핑 연출로 재생된다.",
      ],
      system: ["…"],
      glitch: "— empty —",
    },
  };

  function storyList() {
    return STORIES.length ? STORIES : [EMPTY_STUB];
  }

  function getSeed() {
    var list = storyList();
    try {
      var s = sessionStorage.getItem("haunt_diary_story");
      if (s != null && s !== "") {
        var n = parseInt(s, 10);
        if (!isNaN(n) && n >= 0 && n < list.length) return n;
      }
      var m = /[?&]story=([0-9a-zA-Z_-]+)/.exec(location.search || "");
      if (m) {
        var q = m[1];
        if (/^\d+$/.test(q)) {
          var idx = parseInt(q, 10);
          if (idx >= 1 && idx <= list.length) {
            sessionStorage.setItem("haunt_diary_story", String(idx - 1));
            return idx - 1;
          }
          if (idx >= 0 && idx < list.length) {
            sessionStorage.setItem("haunt_diary_story", String(idx));
            return idx;
          }
        }
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === q || list[i].id === q.replace(/^#/, "")) {
            sessionStorage.setItem("haunt_diary_story", String(i));
            return i;
          }
        }
      }
      // 스텁만 있을 때는 인덱스 0 고정
      if (!STORIES.length) {
        sessionStorage.setItem("haunt_diary_story", "0");
        return 0;
      }
      var pick = (Math.random() * list.length) | 0;
      sessionStorage.setItem("haunt_diary_story", String(pick));
      return pick;
    } catch (e) {
      return 0;
    }
  }

  var index = getSeed();
  var listNow = storyList();
  var story = listNow[index] || listNow[0];

  function buildTodaySeq(st) {
    var t = st.today || {};
    var seq = [];
    var statuses = t.status || [
      "> 기록 열림 — 이어쓰기 모드_",
      "> 작성자: ???_",
    ];
    for (var i = 0; i < statuses.length; i++) {
      seq.push({
        kind: "status",
        text: statuses[i],
        delay: i === 0 ? 400 : 550,
        beep: i > 0,
      });
    }
    var human = t.human || [];
    for (var h = 0; h < human.length; h++) {
      seq.push({
        kind: "p",
        className: h === human.length - 1 ? "diary-human diary-last" : "diary-human",
        text: human[h],
        cps: 16 + (h % 3),
      });
      if (h < human.length - 1) {
        seq.push({ kind: "pause", ms: 420 + (h % 2) * 180 });
      }
    }
    seq.push({ kind: "pause", ms: 1100 });
    seq.push({
      kind: "status",
      text: "> — 잠든 프로젝트가 이어 씁니다 —",
      delay: 280,
      beep: true,
    });
    var system = t.system || [];
    for (var s = 0; s < system.length; s++) {
      seq.push({
        kind: "p",
        className: "diary-system",
        text: system[s],
        cps: 18,
        system: true,
      });
      if (s < system.length - 1) seq.push({ kind: "pause", ms: 500 });
    }
    seq.push({
      kind: "p",
      className: "diary-break diary-system",
      text: t.glitch || "바직— ████ 아직 잠들지 않음 ████",
      cps: 24,
      system: true,
      hardKeys: true,
    });
    seq.push({
      kind: "status",
      text: "> 기록 끝 · 「" + st.title + "」 · 프로젝트는 여전히 여기 있음_",
      delay: 350,
      beep: true,
    });
    return seq;
  }

  function renderStaticPages(st) {
    var list = storyList();
    var p0 = document.querySelector('.diary-page[data-page="0"]');
    var p1 = document.querySelector('.diary-page[data-page="1"]');
    if (p0) {
      p0.innerHTML =
        '<p class="diary-date">' +
        escapeHtml(st.past.date) +
        "</p>" +
        (st.past.paras || [])
          .map(function (para) {
            return "<p>" + escapeHtml(para) + "</p>";
          })
          .join("") +
        (st.past.aside
          ? '<p class="diary-aside">' + escapeHtml(st.past.aside) + "</p>"
          : "");
    }
    if (p1) {
      p1.innerHTML =
        '<p class="diary-date">' +
        escapeHtml(st.mid.date) +
        "</p>" +
        (st.mid.paras || [])
          .map(function (para) {
            return "<p>" + escapeHtml(para) + "</p>";
          })
          .join("") +
        (st.mid.fear
          ? '<p class="diary-fear">' + escapeHtml(st.mid.fear) + "</p>"
          : "");
    }
    var title = document.getElementById("diaryTitle");
    if (title) {
      title.textContent = "잠든 프로젝트 일기 · " + st.title;
    }
    var total = STORIES.length || 0;
    var tag = document.querySelector(".diary-tag");
    if (tag) {
      tag.textContent =
        total === 0
          ? "유출 · 스토리 교체 중 · #" + st.id
          : "유출 · 방치된 기록 " + (index + 1) + "/" + total + " · #" + st.id;
    }
    var foot = document.querySelector(".diary-hint-foot");
    if (foot) {
      foot.textContent =
        total === 0
          ? "일기 본문 교체 대기 중"
          : "이 방문의 기록: 「" + st.title + "」 · 다시 오면 다른 잠든 프로젝트 일기일 수 있음";
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  renderStaticPages(story);

  window.__hauntDiaryStories = {
    all: STORIES,
    current: story,
    index: index,
    empty: !STORIES.length,
    todaySeq: buildTodaySeq(story),
    pick: function (i) {
      var list = storyList();
      if (typeof i !== "number" || i < 0 || i >= list.length) return null;
      try {
        sessionStorage.setItem("haunt_diary_story", String(i));
      } catch (e) {}
      story = list[i];
      index = i;
      renderStaticPages(story);
      this.current = story;
      this.index = index;
      this.todaySeq = buildTodaySeq(story);
      this.empty = !STORIES.length;
      return story;
    },
  };

  if (window.console && /[?&]debug=1/.test(location.search || "")) {
    console.log(
      "[diary-story]",
      STORIES.length ? "#" + story.id + " " + story.title : "EMPTY (stub only)",
      "count=",
      STORIES.length
    );
  }
})();
