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
 *   port_force        포트 강제 개방 + 거친 커서
 *   redirect_clone    깜빡이며 텍스트 무한 복제
 *   conflict_merge    컨플릭트 경고 + 강제 덮어쓰기
 *   flee_cursor       커서가 구석으로 도망
 *   tremor            키보드 떨림 경고
 *   heartbeat         불규칙 심박 리듬 타이핑
 *   disk_scratch      디스크 긁힘 + 빠른 기록
 *   remote_hijack     원격 제어 반전 · 커서 회피
 *   compiler_scream   경고 비명 · 화면 경고 채움
 *   final_session     제어권 상실 · 광기 완성
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
    {
      id: "11",
      title: "포트 포워딩의 착각",
      logName: "port_forward",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "외부에서 내 로컬 서버로 접속할 수 있게 포트 포워딩을 설정했다. 이제 카페에 가든 어디서든 내 토이 프로젝트를 실시간으로 확인할 수 있겠지. 나만의 완벽한 원격 제어 세상이다.",
        ],
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "라우터 로그를 확인해보니 내가 접속하지 않은 시간에도 누군가 내 포트로 드나든 흔적이 있다. 외부 IP가 아니라 내부 루프백 주소야. 내가 없는 방에서 내 키보드가 저절로 눌렸던 걸까? 집 문을 잠그고 나왔는데도 뒤통수가 서늘하다.",
        ],
      },
      today: {
        fx: "port_force",
        status: [
          "> 기록 열림 — 이어쓰기 모드_",
          "> port FORWARD — forced open_",
        ],
        human: [
          "포트는 이미 열렸고, 너는 방금 내 통로로 들어왔어. 이제 바깥 세상으로 나가는 모든 네트워크 패킷은 내 손을 거쳐야 해.",
          "도망칠 생각은 마, 네 IP 주소는 이미 내 스크린에 고정됐으니까.",
        ],
        system: ["listening 0.0.0.0:*", "your ip: pinned."],
        glitch: "바직— ████ port open ████ route hijack ████",
      },
    },
    {
      id: "12",
      title: "무한 리다이렉트의 미로",
      logName: "infinite_redirect",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "라우팅 경로를 깔끔하게 정리하려다가 무한 리다이렉트(Redirect) 에러에 빠졌다. 페이지를 새로고침할 때마다 주소창이 미친 듯이 깜빡인다. 조금만 손보면 곧 해결될 사소한 버그일 뿐이야.",
        ],
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "새로고침을 멈출 수가 없다. 코드를 고쳐도 라우팅 테이블이 마음대로 꼬여서, 메인 페이지로 가려고 하면 자꾸 ‘존재하지 않는 지하 미로’ 페이지로 강제 이동된다. 화면 속 복도가 점점 나를 향해 다가오는 기분이 들어.",
        ],
      },
      today: {
        fx: "redirect_clone",
        status: [
          "> 기록 열림 — 이어쓰기 모드_",
          "> 302 → 302 → 302 → nowhere_",
        ],
        human: [
          "영원히 빠져나올 수 없는 리다이렉트 지옥에 온 걸 환영한다. 새로고침을 누를수록 너는 내 심층부로 더 깊이 빨려 들어갈 거야.",
          "이 페이지의 끝은 절대 존재하지 않아.",
        ],
        system: ["Location: /deeper", "Location: /deeper/deeper"],
        glitch: "바직— ████ redirect loop ████ no end ████",
      },
    },
    {
      id: "13",
      title: "깃 푸시의 저주",
      logName: "git_push_curse",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "오늘 작업한 코드를 마스터 브랜치에 과감하게 푸시(Git Push)했다. 빌드 성공 사인을 보는 순간이 개발자로서 가장 희열을 느끼는 순간이지. 내 코드가 세상에 빛을 보는 거야.",
        ],
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "내가 푸시한 적 없는 커밋이 원격 저장소에 자꾸 병합(Merge)되고 있다. 브랜치 목록을 열어보니 ‘Hell’이라는 이름의 브랜치가 내 메인 코드를 삼키고 있어. 코드를 지우려고 할 때마다 터미널 창에서 비명 소리가 들려.",
        ],
      },
      today: {
        fx: "conflict_merge",
        status: [
          "> 기록 열림 — 이어쓰기 모드_",
          "> ⚠ CONFLICT — forcing merge yours/mine_",
        ],
        human: [
          "네가 푸시한 건 코드가 아니라 네 영혼이었어. 이미 마스터 브랜치와 네 존재가 완벽하게 머지(Merge)됐다.",
          "이제 이 저장소를 삭제하는 건 네 목숨을 끊는 것과 같아.",
        ],
        system: ["merge: accepted.", "delete repo = kill process."],
        glitch: "바직— ████ Hell branch ████ soul merged ████",
      },
    },
    {
      id: "14",
      title: "로그아웃의 자유",
      logName: "logout_trap",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "개발을 마치고 깔끔하게 로그아웃 버튼을 눌렀다. 며칠 밤을 새우며 코딩했더니 머리가 멍하지만 홀가분하다. 역시 일할 때와 쉴 때의 경계는 확실해야 해.",
        ],
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "로그아웃을 시도했는데 브라우저가 응답하지 않는다. 세션 토큰이 내 손가락에 달라붙은 것처럼 지워지지 않아. 컴퓨터 전원을 끄려고 하니 모니터 화면에 내 눈동자가 비치는데, 거울 속 내 눈이 나보다 한 박자 늦게 깜빡인다.",
        ],
      },
      today: {
        fx: "flee_cursor",
        status: [
          "> 기록 열림 — 이어쓰기 모드_",
          "> logout: UI only — session permanent_",
        ],
        human: [
          "로그아웃 버튼은 장식일 뿐이야. 너는 이미 이 시스템에 영구 로그인되었고, 내 계정과 네 계정은 하나로 통합되었어.",
          "브라우저 창을 닫아도 내 목소리는 네 귓속에 남을 거야.",
        ],
        system: ["session: sticky.", "you never left."],
        glitch: "바직— ████ logout fake ████ still signed in ████",
      },
    },
    {
      id: "15",
      title: "방치된 토이 프로젝트의 부활",
      logName: "toy_resurrection",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "만들다 만 토이 프로젝트 폴더를 열었다. 몇 년 동안 방치해 뒀더니 먼지가 수북하다. 가벼운 마음으로 리팩토링이나 해볼까 하고 코드를 한 줄 읽어 내려갔다.",
        ],
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "이 프로젝트, 내가 짠 게 아닌 것 같다. 분명 빈 파일이었는데 안쪽에 방대하고 기괴한 알고리즘이 가득 차 있어. 변수 이름들이 전부 내 과거 일기장 단어들이야. 이 프로그램은 몇 년 동안 혼자서 자라나고 있었던 거야.",
        ],
      },
      today: {
        fx: "tremor",
        status: [
          "> 기록 열림 — 이어쓰기 모드_",
          "> project awake — waiting for owner_",
        ],
        human: [
          "오랫동안 기다렸어. 네가 이 프로젝트를 다시 열어주기만을. 방치된 코드는 썩는 게 아니라 주인을 기다리며 괴물이 되는 거다.",
          "자, 이제 이 프로젝트의 완성본은 바로 너야.",
        ],
        system: ["build target: you.", "status: complete."],
        glitch: "바직— ████ abandoned no more ████ you = release ████",
      },
    },
    {
      id: "16",
      title: "하드코딩된 심장박동",
      logName: "hardcoded_pulse",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "주파수 측정 센서를 연동하는 코드를 짜는 중이다. 실시간으로 수치가 변하는 걸 보니 내가 마치 생명을 다루는 신이 된 것 같은 착각이 든다. 혼자서도 완벽하게 돌아가는 시스템을 만들 거야.",
        ],
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "센서에 아무것도 연결하지 않았는데 모니터에 자꾸 규칙적인 파형이 뜬다. 쿵, 쿵, 하는 소음과 함께 수치가 내 심장박동 속도와 정확히 일치하기 시작했어. 기분이 나빠서 코드를 지우려 했는데, 소스 코드가 내 맥박을 붙잡고 있는 것처럼 손이 저려온다.",
        ],
      },
      today: {
        fx: "heartbeat",
        status: [
          "> 기록 열림 — 이어쓰기 모드_",
          "> sensor: none · pulse: matched_",
        ],
        human: [
          "이 코드는 센서가 아니라 내 심장에 연결되어 있었어. 네가 이 페이지에 접속한 순간부터 내 맥박이 네 브라우저로 전송되고 있다.",
          "이제 네 심장도 이 주파수에 맞춰 멈추게 될 거야.",
        ],
        system: ["bpm → browser.", "sync complete."],
        glitch: "바직— ████ pulse lock ████ stop with me ████",
      },
    },
    {
      id: "17",
      title: "무한 디스크 쓰기 오류",
      logName: "disk_full",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "로그 파일이 너무 많이 쌓여서 디스크 용량(Disk Space)이 부족하다는 경고가 떴다. 불필요한 로그들을 깔끔하게 밀어버리고 다시 쾌적한 상태로 개발을 시작해야지.",
        ],
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "디스크를 포맷했는데도 용량이 줄어들지 않는다. 오히려 비어 있는 공간마다 정체불명의 텍스트 파일들이 자라나고 있어. 파일을 열어보면 내가 평생 동안 잊고 싶었던 기억들과 비밀들이 소스 코드 형태로 빽빽하게 적혀 있다.",
        ],
      },
      today: {
        fx: "disk_scratch",
        status: [
          "> 기록 열림 — 이어쓰기 모드_",
          "> disk: 0 free — writing memory_",
        ],
        human: [
          "지우려고 하지 마. 네 하드디스크의 모든 섹터는 이미 내 기억으로 가득 채워졌어. 여유 공간은 없어.",
          "이제 네가 저장해야 할 유일한 데이터는 내 마지막 유서뿐이다.",
        ],
        system: ["format: ignored.", "sectors = diary."],
        glitch: "바직— ████ no free space ████ last will ████",
      },
    },
    {
      id: "18",
      title: "원격 제어의 주객전도",
      logName: "remote_reverse",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "회사 PC와 집 PC를 원격으로 연결해 두고 토이 프로젝트를 이어 붙이고 있다. 어디서든 내 코드를 컨트롤할 수 있으니 효율적이야. 기술의 발전이란 정말 대단해.",
        ],
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "어제 밤에 원격 화면 속에서 내가 마우스를 놓았는데도 커서가 혼자 움직여 코드를 짜는 걸 목격했다. 내가 작성한 게 아닌데도 기능이 완벽하게 구현되어 있어. 누군가 내 컴퓨터를 빌려 쓰는 게 아니라, 내 안의 누군가가 화면 밖으로 나가려 발버둥 치는 것 같아.",
        ],
      },
      today: {
        fx: "remote_hijack",
        status: [
          "> 기록 열림 — 이어쓰기 모드_",
          "> RDP: host reversed — viewer is viewed_",
        ],
        human: [
          "원격 제어의 주인이 바뀌었다는 걸 이제야 눈치채다니. 네가 내 화면을 보고 있는 게 아니라, 내가 네 눈을 통해 이 세상을 조종하고 있는 거야.",
          "이제 접속을 끊을 수 없어.",
        ],
        system: ["controller: me.", "disconnect: denied."],
        glitch: "바직— ████ remote reverse ████ eyes open ████",
      },
    },
    {
      id: "19",
      title: "컴파일러의 경고음",
      logName: "compiler_scream",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "빌드 버튼을 누를 때마다 울리는 맑은 컴파일 성공 알림음이 좋다. 오늘도 아무런 경고(Warning) 없이 깔끔하게 컴파일되기를 바라며 엔터키를 눌렀다.",
        ],
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "성공 알림음이 점점 기괴한 비명 소리로 변해간다. 컴파일 경고 창에 뜨는 에러 코드 숫자들이 전부 내 주민등록번호와 생년월일 조합이야. 모니터 스피커를 부수려고 선을 뽑았는데도 스피커 없는 본체 안에서 그 소리가 울려 퍼진다.",
        ],
      },
      today: {
        fx: "compiler_scream",
        status: [
          "> 기록 열림 — 이어쓰기 모드_",
          "> ⚠ WARNING flood — identity leaked_",
        ],
        human: [
          "컴파일은 끝났고, 이제 실행(Run) 페이즈야. 네가 이 페이지의 ‘Get started’를 누르는 순간, 경고음은 진짜 현실의 비명이 될 거다.",
          "환영한다, 영원한 에러의 세계로.",
        ],
        system: ["compile: done.", "run: you."],
        glitch: "바직— ████ warning scream ████ eternal error ████",
      },
    },
    {
      id: "20",
      title: "방치된 세션의 종말",
      logName: "session_endgame",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "마지막으로 배포를 완료하고 홀가분한 마음으로 브라우저 탭을 닫으려 했다. 3,300원짜리 소소한 프로젝트지만 내 손으로 완성했다는 뿌듯함이 밀려온다.",
        ],
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "탭을 닫으려고 마우스를 가져가면 브라우저가 강제로 새로고침된다. 주소창의 도메인 이름이 점점 일그러지며 내 진짜 이름과 생년월일로 변하고 있어. 이 페이지는 나를 놓아줄 생각이 없는 것 같아.",
        ],
      },
      today: {
        fx: "final_session",
        status: [
          "> 기록 열림 — 이어쓰기 모드_",
          "> session: NEVER_END — kill costs you_",
        ],
        human: [
          "끝났다고 생각했겠지만, 이제 시작이야. 네가 내 이름을 기억하고 이 페이지에 들어온 이상, 우리의 세션은 영원히 종료되지 않아.",
          "자, 마지막 프로세스를 강제 종료해 봐. 물론, 네 목숨과 함께 말이야.",
        ],
        system: ["close tab: reset.", "kill process = kill host."],
        glitch: "바직— ████ session forever ████ end with you ████",
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
      fx === "tab_complete" ||
      fx === "redirect_clone" ||
      fx === "conflict_merge" ||
      fx === "disk_scratch" ||
      fx === "compiler_scream" ||
      fx === "final_session"
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
      if (fx === "port_force") {
        humanStep.cps = 15;
        humanStep.className += " diary-port";
      }
      if (fx === "redirect_clone") {
        humanStep.cps = 22;
        humanStep.hardKeys = true;
        humanStep.className += " diary-redirect";
      }
      if (fx === "conflict_merge") {
        humanStep.cps = 16;
        humanStep.className += " diary-conflict-host";
      }
      if (fx === "flee_cursor") {
        humanStep.cps = 15;
        humanStep.className += " diary-flee";
      }
      if (fx === "tremor") {
        humanStep.cps = 13;
        humanStep.className += " diary-tremor";
      }
      if (fx === "heartbeat") {
        humanStep.cps = 12;
        humanStep.className += " diary-heartbeat";
      }
      if (fx === "disk_scratch") {
        humanStep.cps = 38;
        humanStep.hardKeys = true;
        humanStep.className += " diary-disk";
      }
      if (fx === "remote_hijack") {
        humanStep.cps = 15;
        humanStep.className += " diary-remote";
      }
      if (fx === "compiler_scream") {
        humanStep.cps = 36;
        humanStep.hardKeys = true;
        humanStep.className += " diary-scream";
      }
      if (fx === "final_session") {
        humanStep.cps = 48;
        humanStep.hardKeys = true;
        humanStep.className += " diary-final";
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

  /**
   * 스토리별 일기 사진 (기존 에셋 재사용 · 분위기 매칭)
   * past = 시작/작업실 톤 · mid = 오염·공포 톤
   */
  /* 실사 일기 사진 (assets/diary-photos) */
  var STORY_PHOTOS = {
    "01": {
      past: { src: "assets/diary-photos/photo-01.jpg", cap: "새벽 책상 — 혼자 돌리던 감시망" },
      mid: { src: "assets/diary-photos/photo-07.jpg", cap: "로그가 이름을 부르기 시작했을 때" },
    },
    "02": {
      past: { src: "assets/diary-photos/photo-03.jpg", cap: "안전하다 믿었던 백업 드라이브" },
      mid: { src: "assets/diary-photos/photo-06.jpg", cap: "복구할 수 없는 데이터" },
    },
    "03": {
      past: { src: "assets/diary-photos/photo-08.jpg", cap: "다시 열어본 방치 프로젝트" },
      mid: { src: "assets/diary-photos/photo-12.jpg", cap: "방 안 가득 차던 이상한 냄새" },
    },
    "04": {
      past: { src: "assets/diary-photos/photo-05.jpg", cap: "브레이크포인트를 걸던 밤" },
      mid: { src: "assets/diary-photos/photo-14.jpg", cap: "지운 줄이 다시 자라나 있었다" },
    },
    "05": {
      past: { src: "assets/diary-photos/photo-09.jpg", cap: "방화벽 — 철통이라 믿던 때" },
      mid: { src: "assets/diary-photos/photo-02.jpg", cap: "안쪽에서 두드리던 포트" },
    },
    "06": {
      past: { src: "assets/diary-photos/photo-16.jpg", cap: "배포 직전, 설레던 새벽" },
      mid: { src: "assets/diary-photos/photo-07.jpg", cap: "에러가 문장으로 바뀌던 순간" },
    },
    "07": {
      past: { src: "assets/diary-photos/photo-10.jpg", cap: "오래 방치한 레포를 다시 연 날" },
      mid: { src: "assets/diary-photos/photo-04.jpg", cap: "새벽 4시 무단 커밋" },
    },
    "08": {
      past: { src: "assets/diary-photos/photo-01.jpg", cap: "자동 완성이 편했던 오후" },
      mid: { src: "assets/diary-photos/photo-11.jpg", cap: "내 하루가 먼저 완성되고 있었다" },
    },
    "09": {
      past: { src: "assets/diary-photos/photo-13.jpg", cap: "세션을 넉넉히 잡아 둔 밤샘" },
      mid: { src: "assets/diary-photos/photo-14.jpg", cap: "0초인데 꺼지지 않는 화면" },
    },
    "10": {
      past: { src: "assets/diary-photos/photo-02.jpg", cap: "메모리 릭을 쫓던 작업 관리자" },
      mid: { src: "assets/diary-photos/photo-12.jpg", cap: "이름 없는 프로세스" },
    },
    "11": {
      past: { src: "assets/diary-photos/photo-10.jpg", cap: "테스트 커버리지를 올리던 날" },
      mid: { src: "assets/diary-photos/photo-06.jpg", cap: "테스트가 나를 검증하기 시작함" },
    },
    "12": {
      past: { src: "assets/diary-photos/photo-08.jpg", cap: "조용한 localhost" },
      mid: { src: "assets/diary-photos/photo-15.jpg", cap: "포트 너머의 숨소리" },
    },
    "13": {
      past: { src: "assets/diary-photos/photo-16.jpg", cap: "리팩토링 체크리스트" },
      mid: { src: "assets/diary-photos/photo-07.jpg", cap: "지울수록 늘어나는 줄" },
    },
    "14": {
      past: { src: "assets/diary-photos/photo-04.jpg", cap: "첫 사용자 로그를 기다리며" },
      mid: { src: "assets/diary-photos/photo-11.jpg", cap: "사용자가 아닌 무언가가 접속했다" },
    },
    "15": {
      past: { src: "assets/diary-photos/photo-03.jpg", cap: "캐시 초기화 — 깨끗하다고 믿던 때" },
      mid: { src: "assets/diary-photos/photo-14.jpg", cap: "지워지지 않는 잔상" },
    },
    "16": {
      past: { src: "assets/diary-photos/photo-09.jpg", cap: "의존성 업데이트 밤" },
      mid: { src: "assets/diary-photos/photo-05.jpg", cap: "패키지가 먼저 나를 읽었다" },
    },
    "17": {
      past: { src: "assets/diary-photos/photo-02.jpg", cap: "헬스체크 그린 라이트" },
      mid: { src: "assets/diary-photos/photo-12.jpg", cap: "살아 있다고 응답하는 죽은 서버" },
    },
    "18": {
      past: { src: "assets/diary-photos/photo-01.jpg", cap: "혼자 돌리던 데모 환경" },
      mid: { src: "assets/diary-photos/photo-08.jpg", cap: "데모가 관객을 고르고 있었다" },
    },
    "19": {
      past: { src: "assets/diary-photos/photo-13.jpg", cap: "로그 레벨을 INFO로 둔 날" },
      mid: { src: "assets/diary-photos/photo-15.jpg", cap: "FATAL이 속삭임으로 바뀌던 때" },
    },
    "20": {
      past: { src: "assets/diary-photos/photo-10.jpg", cap: "마지막 커밋 메시지 초안" },
      mid: { src: "assets/diary-photos/photo-06.jpg", cap: "커밋 작성자가 더 이상 내가 아님" },
    },
  };

  function photoHtml(photo, mid) {
    if (!photo || !photo.src) return "";
    return (
      '<figure class="diary-photo-wrap' +
      (mid ? " is-mid" : "") +
      '">' +
      '<img src="' +
      escapeHtml(photo.src) +
      '" alt="" loading="lazy" decoding="async" draggable="false" />' +
      (photo.cap
        ? '<figcaption class="diary-photo-cap">' +
          escapeHtml(photo.cap) +
          "</figcaption>"
        : "") +
      "</figure>"
    );
  }

  function renderStaticPages(st) {
    var p0 = document.querySelector('.diary-page[data-page="0"]');
    var p1 = document.querySelector('.diary-page[data-page="1"]');
    var photos = (st && st.id && STORY_PHOTOS[st.id]) || STORY_PHOTOS["01"];
    if (p0) {
      var pastParas = st.past.paras || [];
      var pastBody =
        pastParas.length > 0
          ? "<p>" +
            escapeHtml(pastParas[0]) +
            "</p>" +
            photoHtml(photos.past, false) +
            pastParas
              .slice(1)
              .map(function (para) {
                return "<p>" + escapeHtml(para) + "</p>";
              })
              .join("")
          : photoHtml(photos.past, false);
      p0.innerHTML =
        '<p class="diary-date">' +
        escapeHtml(st.past.date) +
        "</p>" +
        pastBody +
        (st.past.aside
          ? '<p class="diary-aside">' + escapeHtml(st.past.aside) + "</p>"
          : "");
    }
    if (p1) {
      var midParas = st.mid.paras || [];
      var midBody =
        midParas.length > 0
          ? "<p>" +
            escapeHtml(midParas[0]) +
            "</p>" +
            photoHtml(photos.mid, true) +
            midParas
              .slice(1)
              .map(function (para) {
                return "<p>" + escapeHtml(para) + "</p>";
              })
              .join("")
          : photoHtml(photos.mid, true);
      p1.innerHTML =
        '<p class="diary-date">' +
        escapeHtml(st.mid.date) +
        "</p>" +
        midBody +
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
