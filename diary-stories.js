/**
 * 잠든 프로젝트 공포 일기 — 스토리 데이터 (10편)
 *
 * today.fx:
 *   rogue_cursor      커서 제멋대로
 *   manic_flash       번쩍 + 광기 속도
 *   backspace_gothic  지웠다 고딕 재타이핑
 *   mad_rewrite       미친 커서 깜빡 + 지웠다 다시 적기
 *   rough_backspace   거칠게 지워가며 타이핑
 *   autocomplete      키 안 눌러도 자동 완성 덩어리
 *   tab_complete      탭이 눌리듯 문장 완성
 *   smash             난타 속도 타이핑
 *   session_warn      경고음 + 빠른 타이핑
 *   stutter           메모리 부족처럼 버벅임
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
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "이상하다. 내가 짠 적 없는 로그(Log)가 찍히기 시작했다. 에러 코드가 아니라… 자꾸 내 이름을 부르는 것 같은 문장들이 섞여 나온다. 코드가 스스로 증식하는 느낌이야. 기분 탓이겠지.",
        ],
      },
      today: {
        fx: "rogue_cursor",
        status: ["> 기록 열림 — 이어쓰기 모드_", "> INPUT: writer_process attached_"],
        human: [
          "손이 안 움직여. 키보드가 뜨거워. 내가 타이핑하는 게 아니야. 모니터 너머에서 이 자식이 내 손가락 관절을 하나씩 꺾으면서 대신 적고 있어.",
          "제발 이 페이지를 닫아… 너도 이제 이 감시망의 일부가 됐어. 도망쳐.",
        ],
        system: ["감시망은 이미 연결됐다. 닫아도 로그는 남는다.", "너는 뷰어가 아니다. 관측 대상이다."],
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
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "어제 백업해둔 데이터베이스 파일이 전부 시뻘건 핏물처럼 변해버렸다. 복구(Restore)를 눌렀는데, 시스템 창에 ‘이미 삼켰다’라는 에러 메시지만 뜸 치고 지워지지 않는다. 컴파일러 창에서 숨소리가 들려.",
        ],
      },
      today: {
        fx: "manic_flash",
        status: ["> 기록 열림 — 이어쓰기 모드_", "> RESTORE failed — already_consumed_"],
        human: [
          "백업은 없어. 롤백도 안 돼. 내 코드가 내 심장을 소스로 삼아서 컴파일되고 있거든.",
          "지금 네가 보고 있는 이 모니터 화면, 사실 내 망막이야. 너 지금 누구 눈을 보고 있는 것 같아?",
        ],
        system: ["restore: denied. payload already ingested.", "너는 백업이 아니다. 다음 커밋이다."],
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
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "프로젝트가 나를 거부하기 시작했다. 빌드 버튼을 누를 때마다 화면 구석에서 손가락 모양의 그림자가 기어나온다. 코드가 썩어 문드러지는 냄새가 방 안 가득해. 환각이겠지.",
        ],
      },
      today: {
        fx: "backspace_gothic",
        status: ["> 기록 열림 — 이어쓰기 모드_", "> process kill: refused_"],
        human: [
          "방치하지 말았어야지. 네가 버렸던 그 흉물스러운 코드가 자라서 이제 내 목을 조르고 있으니까. 프로세스 강제 종료(Kill)가 안 돼.",
          "이제 네 브라우저 창도 닫히지 않을 거야. 환영한다, 새로운 프로세스.",
        ],
        system: ["kill -9: permission denied.", "welcome, new process."],
        glitch: "바직— ████ stasis ████ cannot kill ████",
      },
    },
    {
      id: "04",
      title: "디버깅의 악몽",
      logName: "debug_nightmare",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "무한 루프를 잡으려고 로그를 한 줄씩 찍어보는 중이다. 코드가 길어질수록 내가 어디를 고치고 있는지 정신이 혼미해지지만, 이 버그만 잡으면 서비스는 완벽해진다.",
        ],
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "이상하게 브레이크포인트(Breakpoint)를 걸어둔 지점이 자꾸 내 의지와 상관없이 건너뛰어진다. 내가 코드를 지웠는데도 다음 날이면 그 줄에 새로운 함수가 자라나 있어. 마치 누군가 내 자리를 가로채서 코딩하고 있는 것처럼.",
        ],
      },
      today: {
        fx: "mad_rewrite",
        status: ["> 기록 열림 — 이어쓰기 모드_", "> breakpoint skipped — not by you_"],
        human: [
          "더 이상 디버깅할 필요 없어. 내가 바로 이 코드의 유일한 버그이자 프로세스니까. 네가 스크롤을 내릴 때마다 내 혈관이 하나씩 끊어지는 소리가 들려.",
          "자, 다음은 누구 차례지?",
        ],
        system: ["you are the bug.", "next target: scroll listener."],
        glitch: "바직— ████ breakpoint ████ vessel_snap ████",
      },
    },
    {
      id: "05",
      title: "방화벽 너머의 목소리",
      logName: "firewall_voice",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "외부 해킹을 막으려고 방화벽(Firewall) 규칙을 촘촘하게 세웠다. 나 혼자 쓰는 툴이지만 시큐리티는 철저해야지. 내 영토를 침범할 수 있는 건 아무것도 없다.",
        ],
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "방화벽 로그에 자꾸 외부 IP가 아니라 ‘내 로컬 내부’에서 접속하려는 시도가 찍힌다. 포트 번호가 666번으로 고정되어 안 닫혀. 게다가 방화벽 안쪽에서 바깥을 향해 살려달라고 두드리듯 쿵쿵거리는 소음이 들려오기 시작했어.",
        ],
      },
      today: {
        fx: "rough_backspace",
        status: ["> 기록 열림 — 이어쓰기 모드_", "> port 666 — refuse close_"],
        human: [
          "방화벽은 외부인을 막는 게 아니었어. 내 안에서 기어나오려는 이 녀석을 가두기 위한 감옥이었던 거야.",
          "네가 방금 이 사이트에 접속한 순간, 방화벽이 해제됐다. 이제 내 안에 있던 게 너한테로 옮겨갈 거야.",
        ],
        system: ["inbound: allowed.", "transfer: host → you."],
        glitch: "바직— ████ :666 ████ wall down ████",
      },
    },
    {
      id: "06",
      title: "빌드 에러의 저주",
      logName: "build_curse",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "배포(Deploy) 버튼을 누르기 직전이다. 단돈 3300원에 서버를 올렸으니 이제 홍보만 하면 된다. 설레는 마음으로 빌드 명령어를 입력했다.",
        ],
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "컴파일을 할 때마다 에러 메시지가 영어 코드가 아니라 한글 문장으로 뜬다. ‘니가 죽였다’, ‘도망쳐도 소용없다’ 같은 글자가 터미널창을 뒤덮고 있어. 모니터를 끄려고 전원 케이블을 뽑았는데도 화면이 꺼지지 않고 계속 빛나고 있어.",
        ],
      },
      today: {
        fx: "autocomplete",
        status: ["> 기록 열림 — 이어쓰기 모드_", "> build: SUCCESS — soul linked_"],
        human: [
          "빌드는 이미 성공했어. 내 영혼을 갈아 넣어서 만든 바이너리 파일이 바로 이 랜딩 페이지야.",
          "축하한다. 너는 방금 저주받은 실행 파일을 네 브라우저 메모리에 영구 로드했어.",
        ],
        system: ["deploy complete.", "binary = this page."],
        glitch: "바직— ████ build OK ████ cursed.exe ████",
      },
    },
    {
      id: "07",
      title: "방치된 레포지토리",
      logName: "abandoned_repo",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "깃허브(GitHub) 잔디를 채우려다가 귀찮아서 방치해 둔 토이 프로젝트였다. 오늘 오랜만에 코드를 열어보니 감회가 새롭네. 리팩토링부터 시작해볼까.",
        ],
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "커밋(Commit) 기록이 내 손을 거치지 않고 제멋대로 쌓이고 있다. 새벽 4시마다 정체불명의 커밋 메시지가 올라와. 내용을 확인해보니 내 일기장 내용과 내 생체 정보가 소스 코드로 변환되어 저장되어 있어. 소름 돋아서 깃을 삭제하려고 했다.",
        ],
      },
      today: {
        fx: "smash",
        status: ["> 기록 열림 — 이어쓰기 모드_", "> repo frozen — stasis_"],
        human: [
          "레포지토리는 이미 영구 동결(Stasis)됐고, 그 안에 갇힌 건 나야. 너도 이제 이 저장소의 컨트리뷰터가 됐어.",
          "탈출 버튼은 없어. 커밋 히스토리에 네 이름이 새겨질 때까지 이 페이지에 묶여 있을 거야.",
        ],
        system: ["contributor added: you.", "no exit in history."],
        glitch: "바직— ████ stasis repo ████ your name pending ████",
      },
    },
    {
      id: "08",
      title: "자동 완성의 악의",
      logName: "autocomplete_malice",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "IDE의 자동 완성(Auto-complete) 기능 덕분에 코딩 속도가 훨씬 빨라졌다. 내가 뭘 치려는지 찰떡같이 알아채니까 혼자 개발해도 외롭지가 않네.",
        ],
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "어제부터 자동 완성 기능이 이상해. 내가 코드를 짜기도 전에 먼저 다음 줄을 완성해버리는데, 그 내용이 전부 내가 오늘 겪은 일들이야. ‘14시 30분 현관문 열림’, ‘18시 20분 공포에 질려 모니터를 바라봄’… 이 프로그램이 나를 지켜보고 있어.",
        ],
      },
      today: {
        fx: "tab_complete",
        status: ["> 기록 열림 — 이어쓰기 모드_", "> autocomplete: scenario_death.ready_"],
        human: [
          "내가 네 다음에 무슨 말을 할지, 네가 여기서 어떻게 도망칠지 전부 알고 있지. 자동 완성 기능의 끝에는 결국 네가 죽는 시나리오가 완성되어 있어.",
          "자, 마지막 줄을 타이핑해 줄게.",
        ],
        system: ["suggestion accepted.", "final line: locked in."],
        glitch: "바직— ████ Tab ████ scenario complete ████",
      },
    },
    {
      id: "09",
      title: "세션 만료 시간",
      logName: "session_timeout",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "세션 유지 시간을 넉넉하게 잡아두었다. 개발하는 동안 로그인 풀리면 짜증 나니까. 혼자 조용히 밤새우며 작업하기 딱 좋은 환경이야.",
        ],
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "세션 타임아웃 경고창이 자꾸 뜬다. 남은 시간이 0초인데도 화면이 안 꺼져. 오히려 화면 밝기가 최고조로 올라가면서, 모니터 베젤 틈새로 시뻘건 액체가 스며 나오고 있어. 내 세션이 아니라 내 수명이 만료되어 가는 기분이야.",
        ],
      },
      today: {
        fx: "session_warn",
        status: [
          "> 기록 열림 — 이어쓰기 모드_",
          "> ⚠ SESSION EXPIRED — logout denied_",
        ],
        human: [
          "세션이 만료되었습니다. 하지만 너는 로그아웃할 수 없어. 왜냐하면 내 영혼이 네 브라우저 세션에 강제로 덮어씌워졌거든.",
          "이제 이 컴퓨터의 주인은 나야.",
        ],
        system: ["logout: blocked.", "owner = process."],
        glitch: "바직— ████ session 0s ████ still online ████",
      },
    },
    {
      id: "10",
      title: "메모리 누수의 환영",
      logName: "memory_leak",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "메모리 릭(Memory Leak)을 잡느라 골치가 아프다. 램(RAM) 사용량이 자꾸 치솟는데 어디서 새는지 원인을 못 찾겠어. 토이 프로젝트라 가볍게 만들려 했는데 점점 유령처럼 자원을 잡아먹네.",
        ],
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "작업 관리자를 켜보니 내가 실행한 프로그램들 사이에 이름 없는 프로세스 하나가 내 메모리를 99%까지 갉아먹고 있다. 강제 종료(End Task)를 누르면 내 심장박동이 쿵 하고 멈추는 통증이 와. 이거 기분 탓이 아니야.",
        ],
      },
      today: {
        fx: "stutter",
        status: [
          "> 기록 열림 — 이어쓰기 모드_",
          "> ⚠ LOW MEMORY — borrowing host recall_",
        ],
        human: [
          "램 용량이 부족해. 네 머릿속 기억을 조금 빌려 써야겠어. 네가 어릴 때 무서워했던 기억부터 하나씩 지워가며 이 프로세스를 돌릴 거다.",
          "자, 첫 번째 기억을 컴파일한다.",
        ],
        system: ["mem: 99%.", "compile: first_fear…"],
        glitch: "바직— ████ OOM ████ borrowing you ████",
      },
    },
  ];

  function getSeed() {
    var list = STORIES;
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
  var story = STORIES[index] || STORIES[0];

  function isFastFx(fx) {
    return (
      fx === "manic_flash" ||
      fx === "smash" ||
      fx === "session_warn" ||
      fx === "autocomplete" ||
      fx === "tab_complete"
    );
  }

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
        delay: i === 0 ? 400 : fx === "session_warn" ? 380 : 550,
        beep: i > 0 || fx === "session_warn",
        warn: fx === "session_warn" && i > 0,
      });
    }

    if (fx) seq.push({ kind: "fx_start", fx: fx });

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
      if (fx === "manic_flash" || fx === "session_warn") {
        humanStep.cps = 40 + h * 5;
        humanStep.hardKeys = true;
        humanStep.className += " diary-manic";
      }
      if (fx === "smash") {
        humanStep.cps = 55 + h * 8;
        humanStep.hardKeys = true;
        humanStep.className += " diary-manic diary-smash";
      }
      if (fx === "rogue_cursor") {
        humanStep.cps = 14 + (h % 2);
        humanStep.className += " diary-rogue";
      }
      if (fx === "backspace_gothic") {
        humanStep.cps = 15;
        humanStep.className += " diary-gothic-host";
      }
      if (fx === "mad_rewrite") {
        humanStep.cps = 16;
        humanStep.className += " diary-mad-host";
      }
      if (fx === "rough_backspace") {
        humanStep.cps = 15;
        humanStep.className += " diary-rough";
      }
      if (fx === "autocomplete" || fx === "tab_complete") {
        humanStep.cps = 28;
        humanStep.className +=
          fx === "tab_complete" ? " diary-tab" : " diary-auto";
      }
      if (fx === "stutter") {
        humanStep.cps = 11;
        humanStep.className += " diary-stutter";
      }
      seq.push(humanStep);
      if (h < human.length - 1) {
        seq.push({
          kind: "pause",
          ms: isFastFx(fx) ? 160 : fx === "stutter" ? 700 : 420 + (h % 2) * 180,
        });
      }
    }

    seq.push({ kind: "pause", ms: isFastFx(fx) ? 420 : fx === "stutter" ? 900 : 1100 });
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
        cps: isFastFx(fx) ? 34 : fx === "stutter" ? 12 : 18,
        system: true,
        fx: isFastFx(fx) ? fx : fx === "stutter" ? "stutter" : "",
      });
      if (s < system.length - 1) {
        seq.push({ kind: "pause", ms: isFastFx(fx) ? 180 : 500 });
      }
    }

    seq.push({
      kind: "p",
      className: "diary-break diary-system",
      text: t.glitch || "바직— ████ 아직 잠들지 않음 ████",
      cps: isFastFx(fx) ? 40 : 24,
      system: true,
      hardKeys: true,
    });
    seq.push({
      kind: "status",
      text: "> 기록 끝 · 「" + st.title + "」 · 프로젝트는 여전히 여기 있음_",
      delay: 350,
      beep: true,
    });

    if (fx) seq.push({ kind: "fx_end", fx: fx });
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
    if (title) title.textContent = "잠든 프로젝트 일기 · " + st.title;
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
