/**
 * 잠든 프로젝트 공포 일기 — 스토리 데이터
 *
 * 스키마:
 * past / mid / today
 * today.fx (오늘 구간 공통 연출):
 *   - "rogue_cursor"   커서가 제멋대로 움직임
 *   - "manic_flash"    화면 번쩍 + 광기 속도 타이핑
 *   - "backspace_gothic" 지웠다 고딕체로 다시 찍기
 */
(function () {
  "use strict";

  var STORIES = [
    {
      id: "01",
      title: "새벽 3시의 무한 루프",
      logName: "loop_3am",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "서버 모니터링 툴을 혼자 만들기로 했다. 알림이 안 와서 밤새는 일이 다반사지만, 내 손으로 감시망을 구축한다는 게 뿌듯하다. 자율주행처럼 내 서비스도 스스로 살아 움직였으면 좋겠네.",
        ],
        aside: "",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "이상하다. 내가 짠 적 없는 로그(Log)가 찍히기 시작했다. 에러 코드가 아니라… 자꾸 내 이름을 부르는 것 같은 문장들이 섞여 나온다. 코드가 스스로 증식하는 느낌이야. 기분 탓이겠지.",
        ],
        fear: "",
      },
      today: {
        fx: "rogue_cursor",
        status: [
          "> 기록 열림 — 이어쓰기 모드_",
          "> INPUT: writer_process attached_",
        ],
        human: [
          "손이 안 움직여. 키보드가 뜨거워. 내가 타이핑하는 게 아니야. 모니터 너머에서 이 자식이 내 손가락 관절을 하나씩 꺾으면서 대신 적고 있어.",
          "제발 이 페이지를 닫아… 너도 이제 이 감시망의 일부가 됐어. 도망쳐.",
        ],
        system: [
          "감시망은 이미 연결됐다. 닫아도 로그는 남는다.",
          "너는 뷰어가 아니다. 관측 대상이다.",
        ],
        glitch: "바직— ████ loop@03:00 ████ still watching ████",
      },
    },
    {
      id: "02",
      title: "백업되지 않는 기억",
      logName: "no_backup",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "기능 사가(Saga) 패턴을 테스트 중이다. 트랜잭션이 실패하면 롤백되도록 설계했으니까 안전하겠지. 혼자 개발하니까 내 정신경만 잘 붙잡으면 돼.",
        ],
        aside: "",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "어제 백업해둔 데이터베이스 파일이 전부 시뻘건 핏물처럼 변해버렸다. 복구(Restore)를 눌렀는데, 시스템 창에 ‘이미 삼켰다’라는 에러 메시지만 뜸 치고 지워지지 않는다. 컴파일러 창에서 숨소리가 들려.",
        ],
        fear: "",
      },
      today: {
        fx: "manic_flash",
        status: [
          "> 기록 열림 — 이어쓰기 모드_",
          "> RESTORE failed — already_consumed_",
        ],
        human: [
          "백업은 없어. 롤백도 안 돼. 내 코드가 내 심장을 소스로 삼아서 컴파일되고 있거든.",
          "지금 네가 보고 있는 이 모니터 화면, 사실 내 망막이야. 너 지금 누구 눈을 보고 있는 것 같아?",
        ],
        system: [
          "restore: denied. payload already ingested.",
          "너는 백업이 아니다. 다음 커밋이다.",
        ],
        glitch: "바직— ████ no backup ████ blood.dump ████",
      },
    },
    {
      id: "03",
      title: "방치된 프로세스",
      logName: "stasis_process",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "프로젝트 이름은 Stasis(정지). 바쁘다는 핑계로 방치해 둔 내 오랜 토이 프로젝트에 다시 기회를 주기로 했다. 이번엔 기필코 완성한다.",
        ],
        aside: "",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "프로젝트가 나를 거부하기 시작했다. 빌드 버튼을 누를 때마다 화면 구석에서 손가락 모양의 그림자가 기어나온다. 코드가 썩어 문드러지는 냄새가 방 안 가득해. 환각이겠지.",
        ],
        fear: "",
      },
      today: {
        fx: "backspace_gothic",
        status: [
          "> 기록 열림 — 이어쓰기 모드_",
          "> process kill: refused_",
        ],
        human: [
          "방치하지 말았어야지. 네가 버렸던 그 흉물스러운 코드가 자라서 이제 내 목을 조르고 있으니까. 프로세스 강제 종료(Kill)가 안 돼.",
          "이제 네 브라우저 창도 닫히지 않을 거야. 환영한다, 새로운 프로세스.",
        ],
        system: [
          "kill -9: permission denied.",
          "welcome, new process.",
        ],
        glitch: "바직— ████ stasis ████ cannot kill ████",
      },
    },
  ];

  function storyList() {
    return STORIES;
  }

  function getSeed() {
    var list = storyList();
    if (!list.length) return 0;
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
      var pick = (Math.random() * list.length) | 0;
      sessionStorage.setItem("haunt_diary_story", String(pick));
      return pick;
    } catch (e) {
      return (Math.random() * list.length) | 0;
    }
  }

  var index = getSeed();
  var listNow = storyList();
  var story = listNow[index] || listNow[0];

  function buildTodaySeq(st) {
    var t = st.today || {};
    var fx = t.fx || "";
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

    // 연출 시작 마커 (diary.js가 body 클래스 토글)
    if (fx) {
      seq.push({ kind: "fx_start", fx: fx });
    }

    var human = t.human || [];
    for (var h = 0; h < human.length; h++) {
      var humanStep = {
        kind: "p",
        className:
          h === human.length - 1 ? "diary-human diary-last" : "diary-human",
        text: human[h],
        cps: 16 + (h % 3),
        fx: fx,
      };
      if (fx === "manic_flash") {
        humanStep.cps = 42 + h * 6;
        humanStep.hardKeys = true;
        humanStep.className += " diary-manic";
      }
      if (fx === "rogue_cursor") {
        humanStep.cps = 14 + (h % 2);
        humanStep.className += " diary-rogue";
      }
      if (fx === "backspace_gothic") {
        humanStep.cps = 15;
        humanStep.fx = "backspace_gothic";
        humanStep.className += " diary-gothic-host";
      }
      seq.push(humanStep);
      if (h < human.length - 1) {
        seq.push({ kind: "pause", ms: fx === "manic_flash" ? 180 : 420 + (h % 2) * 180 });
      }
    }

    seq.push({ kind: "pause", ms: fx === "manic_flash" ? 500 : 1100 });
    seq.push({
      kind: "status",
      text: "> — 잠든 프로젝트가 이어 씁니다 —",
      delay: 280,
      beep: true,
    });

    var system = t.system || [];
    for (var s = 0; s < system.length; s++) {
      var sysStep = {
        kind: "p",
        className: "diary-system",
        text: system[s],
        cps: fx === "manic_flash" ? 36 : 18,
        system: true,
        fx: fx === "manic_flash" ? "manic_flash" : "",
      };
      seq.push(sysStep);
      if (s < system.length - 1) {
        seq.push({ kind: "pause", ms: fx === "manic_flash" ? 200 : 500 });
      }
    }

    seq.push({
      kind: "p",
      className: "diary-break diary-system",
      text: t.glitch || "바직— ████ 아직 잠들지 않음 ████",
      cps: fx === "manic_flash" ? 40 : 24,
      system: true,
      hardKeys: true,
    });
    seq.push({
      kind: "status",
      text: "> 기록 끝 · 「" + st.title + "」 · 프로젝트는 여전히 여기 있음_",
      delay: 350,
      beep: true,
    });

    if (fx) {
      seq.push({ kind: "fx_end", fx: fx });
    }
    return seq;
  }

  function renderStaticPages(st) {
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
    var tag = document.querySelector(".diary-tag");
    if (tag) {
      tag.textContent =
        "유출 · 방치된 기록 " +
        (index + 1) +
        "/" +
        STORIES.length +
        " · #" +
        st.id;
    }
    var foot = document.querySelector(".diary-hint-foot");
    if (foot) {
      foot.textContent =
        "이 방문의 기록: 「" +
        st.title +
        "」 · 다시 오면 다른 잠든 프로젝트 일기일 수 있음";
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  if (story) renderStaticPages(story);

  window.__hauntDiaryStories = {
    all: STORIES,
    current: story,
    index: index,
    empty: !STORIES.length,
    todaySeq: story ? buildTodaySeq(story) : [],
    pick: function (i) {
      if (typeof i !== "number" || i < 0 || i >= STORIES.length) return null;
      try {
        sessionStorage.setItem("haunt_diary_story", String(i));
      } catch (e) {}
      story = STORIES[i];
      index = i;
      renderStaticPages(story);
      this.current = story;
      this.index = index;
      this.todaySeq = buildTodaySeq(story);
      this.empty = false;
      return story;
    },
  };

  if (window.console && /[?&]debug=1/.test(location.search || "")) {
    console.log(
      "[diary-story] #" + (story && story.id),
      story && story.title,
      "fx=",
      story && story.today && story.today.fx,
      "count=",
      STORIES.length
    );
  }
})();
