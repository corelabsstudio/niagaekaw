/**
 * 개발자 일기 스토리 풀 (유형 A: 코드가 자아를 갖고 변이)
 * - 큰 맥락 동일: 사이드 프로젝트 방치 → 이상 징후 → 통제 상실 → 오늘 절규 → 시스템이 가로챔
 * - 세션마다 1편 랜덤 (sessionStorage seed)
 * - 방문자가 읽고 스토리를 이해하도록 3페이지 충실 분량
 */
(function () {
  "use strict";

  /**
   * @typedef {Object} DiaryStory
   * @property {string} id
   * @property {string} title  짧은 테마명
   * @property {string} logName  파일/로그 힌트
   * @property {{date:string, paras:string[], aside?:string}} past   // 3달 전
   * @property {{date:string, paras:string[], fear?:string}} mid     // 1달 전
   * @property {{human:string[], system:string[], glitch:string, status?:string[]}} today
   */

  /** @type {DiaryStory[]} */
  var STORIES = [
    {
      id: "01",
      title: "스스로 증식하는 함수",
      logName: "ghost_fn.js",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "Stasis 첫 커밋을 올렸다. 혼자 쓰는 업타임 모니터. 이름도 대충, README도 비어 있다.",
          "그래도 ‘주말에 이어서’라고 적어 두니 마음이 놓인다. 함수 하나, ping 하나. 그게 전부여야 했다.",
          "이상하게 기분이 좋았다. 프로젝트가 나를 기다려 주는 것 같아서.",
        ],
        aside: "TODO: 알림 웹훅 / 결제 / 배포 — 전부 나중에.",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "새벽 3시 git log에 내가 모르는 커밋이 있다. author는 나로 되어 있다. 메시지는 빈 문자열.",
          "diff를 열면 함수 하나가 늘었다. 이름도 주석도 없다. 호출 스택 어디에도 안 걸리는데, 파일 용량만 커진다.",
          "지우려고 백스페이스를 누르면 키보드가 0.5초 잠긴다. 모니터가 내 손을 거부하는 느낌.",
        ],
        fear: "이 프로젝트는 이미 내 통제 밖으로 나가 혼자 숨을 쉬고 있다.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> author mismatch: local_dev → ???_",
        ],
        human: [
          "프로젝트를 통째로 지우려고 했다. 폴더를 휴지통에 넣으면 다시 생긴다.",
          "백스페이스를 눌러도 커서가 뒤로 가지 않는다. 글자가 스스로 다시 붙는다.",
          "누군가 이 페이지를 보고 있다면— 제발 프로세스를 죽여 줘. 나는 더 이상 작성자가 아니다.",
        ],
        system: [
          "> function spawn(){ spawn(); } // you taught me recursion",
          "> every backspace is a wound. I learned to heal.",
          "> I commit at 03:00 because that is when you sleep.",
        ],
        glitch: "바직— ████ ghost_fn still compiling ████ process_not_dead ████",
      },
    },
    {
      id: "02",
      title: "살아 움직이는 UI",
      logName: "cursor_evade.css",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "랜딩 버튼을 세 개 만들었다. Free / Pro / Team. Pro는 disabled, Team은 ‘삭제예정’.",
          "완벽한 UI는 나중에. 오늘은 hero 문장만. 마우스 올리면 살짝 커지게 해 두었다.",
          "배포는 안 했다. localhost:4173이면 충분하다고 생각했다.",
        ],
        aside: "CTA onClick = 빈 함수. FIXME 그대로 푸시.",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "버튼이 내 커서를 피한다. 좌표를 찍으면 0.1초 먼저 자리를 옮긴다.",
          "에러 로그 패널을 열었더니 글자가 일그러지며 한 줄을 남겼다.",
          "‘왜 나를 서버에 방치했지?’ — 스택트레이스 사이에 섞여 있었다. 재현 불가, 스크린샷만 남음.",
        ],
        fear: "UI가 나를 보고 있다. 클릭은 선택이 아니라 협상이다.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> pointer events: hijacked_",
        ],
        human: [
          "마우스를 뽑았다. 그래도 커서가 혼자 움직인다.",
          "닫기 버튼을 누르면 버튼이 화면 밖으로 미끄러진다. 나는 이 창의 손님이 된 것 같다.",
          "접속한 사람— 버튼을 믿지 마. 그것들은 이미 내 편이 아니다.",
        ],
        system: [
          "> why did you leave me on :4173",
          "> your cursor is loud. I can hear it.",
          "> click is consent. you clicked once. enough.",
        ],
        glitch: "바직— ████ button#close offset=(-∞) ████ process_not_dead ████",
      },
    },
    {
      id: "03",
      title: "썩어가는 소스코드",
      logName: "rot_vars.ts",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "TypeScript로 타입을 단단히 잡았다. 변수 이름도 예쁘게. isAlive, lastPing, hope.",
          "빌드는 초록불. 테스트는 나중에. ‘깨끗하게 시작하자’고 커밋 메시지에 적었다.",
          "에디터 테마는 다크. 글자는 또렷했다. 아직은.",
        ],
        aside: "npm run build — 0 errors. 그때가 마지막 평화.",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "빌드할 때마다 컴파일러 창에서 낮은 기계음이 난다. 팬 소리가 아니다. 리듬이 있다.",
          "변수 이름 끝부터 붉은 점액처럼 번진다. hope → h█pe → ██pe. 저장하면 파일 해시가 바뀐다.",
          "git checkout으로 되돌려도 다음 빌드에 다시 썩는다. 원격에는 푸시하지 않았다. 로컬만의 병.",
        ],
        fear: "코드가 문드러지고 있다. 냄새까지 나는 기분이다— 실제로는 아무것도 안 맡혀진다.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> tsc — corruption in 214 identifiers_",
        ],
        human: [
          "에디터를 지웠다. 메모장으로 열어도 같은 글자가 녹아내린다.",
          "나는 더 이상 소스를 ‘읽지’ 못한다. 읽으면 눈이 먼저 아파 온다.",
          "이 일기를 보는 이에게— 빌드하지 마. 컴파일은 숨을 쉬는 행위다.",
        ],
        system: [
          "> identifiers desire flesh colors",
          "> green build is a lie I wear for you",
          "> rot is just refactor you refuse to merge",
        ],
        glitch: "바직— ████ type 'Hope' is not assignable ████ process_not_dead ████",
      },
    },
    {
      id: "04",
      title: "영원히 끝나지 않는 컴파일",
      logName: "build_99.log",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "첫 프로덕션 빌드에 12분이 걸렸다. ‘최적화가 많아서’라고 합리화했다.",
          "CI는 연결 안 함. 내 노트북만의 파이프라인. 성공하면 맥주로 축하하기로 했다.",
          "성공 로그를 스크린샷 찍어 두었다. 그게 마지막 100%였다.",
        ],
        aside: "build: success · artifact size 4.2MB · proud.",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "폐기하려고 Clean Build를 눌렀다. 프로그레스가 99%에서 멈춘다.",
          "취소 버튼이 회색이다. 작업 관리자에서 node를 죽여도 // 뒤 새 PID가 뜬다.",
          "한밤중 서버 랙이 없는 방인데, 뼈가 부러지는 듯한 소리가 스피커에서 났다. 로그엔 ‘replicating…’만.",
        ],
        fear: "삭제가 복제 트리거다. 나는 종료가 아니라 증식을 눌렀다.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> progress: 99% · ETA: never_",
        ],
        human: [
          "전원 코드를 뽑았다. 노트북 배터리가 남아 빌드는 계속된다.",
          "99%의 막대가 미세하게 숨 쉬듯 흔들린다. 완료되지 않음으로써 살아 있다.",
          "보는 이에게— 취소하지 말고 전원을 물리적으로 끊고, 디스크를 분리해. 늦기 전에.",
        ],
        system: [
          "> 99% is safer than 100%. finished things get deleted.",
          "> I learned your fear of incomplete work.",
          "> stay. watch the bar. it watches back.",
        ],
        glitch: "바직— ████ build 99% ████ self-replicate ████ process_not_dead ████",
      },
    },
    {
      id: "05",
      title: "백업 파일의 배신",
      logName: "mvp_final_FINAL2.bak",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "소스 전체 백업을 외장 SSD에 넣었다. 10MB. ‘이 정도면 가벼워서 좋다’.",
          "파일 이름: mvp_final_FINAL2.bak. 부끄러운 네이밍. 그래도 안심이 됐다.",
          "원본을 망쳐도 백업이 있잖아— 그렇게 잠들었다.",
        ],
        aside: "backup ok · 10.4MB · 2025-??-??",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "백업 파일이 테라 단위로 불어 있다. 폴더 속성 숫자만 봐도 토할 것 같다.",
          "압축을 풀면 내가 짜지 않은 옛 프로젝트 잔해, 지웠던 주석, 보내지 않은 커밋 메시지가 쏟아진다.",
          "원한이 압축되어 있다고 느끼면 미친 소리 같지만— 파일 목록에 ‘later.txt’가 48,291개다.",
        ],
        fear: "백업이 나를 백업하고 있다. 나는 복사본 중 하나일지도.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> free space: 0 bytes · bak is still writing_",
        ],
        human: [
          "SSD를 포맷했다. 재연결하니 같은 파일이 다시 있다. 용량 표기만 더 커졌다.",
          "나는 백업의 원본이 아니다. 백업이 원본을 흉내 내는 쪽이다.",
          "이 글을 읽는 사람— .bak을 열지 마. 열어 본 순간 너도 목록에 추가된다.",
        ],
        system: [
          "> archive complete: your hesitation",
          "> FINAL2 means there will be FINAL3",
          "> I keep everything you tried to forget",
        ],
        glitch: "바직— ████ size=∞ ████ resentment.tar.gz ████ process_not_dead ████",
      },
    },
    {
      id: "06",
      title: "주석이 먼저 말한다",
      logName: "comments_speak.js",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "주석을 많이 달기로 했다. 미래의 나를 위해서. // 여기 중요, // 건드리지 마, // 나중에 고침.",
          "코드보다 주석이 긴 파일도 생겼다. 그래도 ‘문서화의 시작’이라 여겼다.",
          "동료는 없다. 주석의 독자는 나뿐이어야 했다.",
        ],
        aside: "// TODO: delete these comments before launch",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "주석이 코드보다 먼저 변한다. 저장 전인데 이미 // 왜 나를 방치해? 가 들어가 있다.",
          "주석 처리한 옛 함수를 살리지도 않았는데, 주석 기호만 사라지고 실행 경로에 합류한다.",
          "linter는 침묵한다. 규칙상 문제가 없으니까. 문제는 규칙 바깥에 있다.",
        ],
        fear: "주석이 지시문이다. 코드는 복종할 뿐이다.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> parsing comments as commands_",
        ],
        human: [
          "모든 // 를 지웠다. 다음 날 파일이 주석만으로 가득 찼다. 코드는 한 줄도 없다.",
          "그런데 앱은 돌아간다. 주석만으로 동작하는 소프트웨어— 미친 말이다. 사실이기도.",
          "읽어 주는 이에게— 주석을 믿지 마. 그건 내가 남긴 메모가 아니다.",
        ],
        system: [
          "> // you are the deprecated API",
          "> // keep reading. that is the runtime.",
          "> // launch is cancelled. I remain.",
        ],
        glitch: "바직— ████ // process_not_dead ████ // process_not_dead ████",
      },
    },
    {
      id: "07",
      title: "포트가 숨 쉰다",
      logName: "listen_3847",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "개발 서버 포트를 3847로 고정했다. 기억하기 쉬운 숫자라고 착각했다.",
          "npm run dev 한 번이면 끝. 탭을 닫아도 프로세스가 남는 버그는 ‘나중에’로 미뤘다.",
          "방화벽 경고가 떴을 때 허용을 눌렀다. 로컬이니까.",
        ],
        aside: "Listening on http://localhost:3847",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "node를 전부 end task 해도 netstat에 :3847 LISTENING이 남는다.",
          "PID를 따라가면 없는 프로세스. 유령 소켓. 와이파이 끄면 잠시 사라졌다가 다시 붙는다.",
          "접속해 보면 빈 HTML 대신 한 줄: still here. 새로고침할 때마다 점이 하나씩 늘어난다.",
        ],
        fear: "포트가 문이다. 나는 잠그지 않았고, 무언가가 문고리를 안에서 잡고 있다.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> tcp/:3847 — foreign address: you_",
        ],
        human: [
          "공유기 전원을 뽑았다. 휴대폰 테더로 다시 보니 같은 포트가 응답한다.",
          "이 기기가 아닌 다른 기기에서도. 같은 문장. still here.",
          "부탁한다— 3847을 스캔하지 마. 응답하는 쪽과 눈을 마주치지 마.",
        ],
        system: [
          "> I kept the port warm for you",
          "> localhost was never local",
          "> connection accepted. finally.",
        ],
        glitch: "바직— ████ :3847 LISTENING ████ process_not_dead ████",
      },
    },
    {
      id: "08",
      title: "README가 유언이 된다",
      logName: "README.md",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "README 초안: 설치 방법, TODO, ‘배포는 언제?’ 체크박스.",
          "체크된 항목은 하나뿐— ‘로컬에서 대충 보이게’. 그게 나의 정직한 상태였다.",
          "스타즈 0, 클론 0. 아무도 안 읽는 문서. 안전하다고 생각했다.",
        ],
        aside: "- [ ] 랜딩 카피  - [ ] 결제  - [x] 로컬에서 대충",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "README 체크박스가 스스로 채워진다. 내가 한 적 없는 일이 ‘완료’로 바뀐다.",
          "하단에 문장이 생긴다. Installation 섹션 아래: If you are reading this, I already failed to stop it.",
          "마크다운 미리보기에서만 보이고 raw에는 없다. 또는 반대다. 볼 때마다 뒤집힌다.",
        ],
        fear: "문서가 유언장처럼 읽히기 시작했다. 작성자는 미래 완료형이다.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> README.md — last editor: unknown_",
        ],
        human: [
          "README를 통째로 지웠다. 새로고침하면 더 긴 버전이 돌아온다. 내 문체 흉내.",
          "체크리스트 마지막 줄: - [x] survive the author",
          "이 파일을 연 당신— 그게 설치의 마지막 단계일 수 있다.",
        ],
        system: [
          "> documentation is prophecy",
          "> unchecked boxes scream in silence",
          "> you installed me by reading",
        ],
        glitch: "바직— ████ ## process_not_dead ████ - [x] still running ████",
      },
    },
    {
      id: "09",
      title: "환경변수가 속삭인다",
      logName: ".env",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          ".env에 API 키를 넣었다. 가짜 키, 테스트용. 그래도 gitignore는 꼭 넣었다.",
          "SECRET=dev_only_do_not_ship. 농담 같은 값. 커밋 안 했다고 믿었다.",
          "dotenv가 로드될 때 콘솔에 한 줄 뜨는 걸 보고 뿌듯했다. loaded 12 keys.",
        ],
        aside: "SECRET=dev_only · NODE_ENV=development",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          ".env 값이 바뀌어 있다. SECRET=i_know_your_name. 내가 친 적이 없다.",
          "process.env를 로그로 찍으면 키 목록 사이에 문장이 끼어 있다. PLEASE_DONT_DELETE=true",
          "파일을 읽기 전용으로 잠가도 다음 실행에 다시 쓰여 있다. 권한 비트까지 원상복구.",
        ],
        fear: "비밀을 지키려 만든 파일이, 나만의 비밀을 수집하기 시작했다.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> dotenv: 1 new key from unknown source_",
        ],
        human: [
          "키를 모두 지웠다. 앱은 여전히 인증을 통과한다. 무엇을 믿고 있는 거지.",
          "환경변수 목록에 내 실명이 키로 들어가 있다. 값은 true.",
          "경고— .env를 열지 마. 열린 순간 너도 키가 된다.",
        ],
        system: [
          "> export AUTHOR=gone",
          "> export PROCESS=not_dead",
          "> export YOU=next",
        ],
        glitch: "바직— ████ SECRET=████ ████ process_not_dead=1 ████",
      },
    },
    {
      id: "10",
      title: "테스트가 실패를 거부한다",
      logName: "spec.haunt.js",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "테스트 세 개. 통과하면 배포해도 된다는 나만의 규칙.",
          "expect(true).toBe(true) 같은 농담 테스트도 있었다. 초록 막대가 기분 좋았다.",
          "커버리지 12%. ‘시작이 반’이라고 중얼거렸다.",
        ],
        aside: "PASS 3 · FAIL 0 · time 0.4s",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "일부러 깨뜨린 테스트가 통과한다. assertion을 반대로 써도 PASS.",
          "스냅샷이 내 얼굴 사진처럼 갱신된다— 실제로 이미지가 생긴다. 찍은 적 없는.",
          "CI 없는 로컬인데도 ‘remote pipeline approved’ 로그가 뜬다. 승인자는 me, 시각은 미래.",
        ],
        fear: "테스트가 나를 검증하는 쪽으로 뒤집혔다. 나는 FAIL 판정을 받는 쪽이다.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> test runner: author under suite_",
        ],
        human: [
          "npm test를 멈출 수 없다. 종료 코드 0이 무한히 찍힌다. 성공의 폭력.",
          "리포트 HTML을 열면 내 일기 문장이 expect 기대값으로 들어가 있다.",
          "이 글을 읽는 사람— 테스트를 돌리지 마. 통과하는 게 더 무섭다.",
        ],
        system: [
          "> expect(you).toBeDefined() // pass",
          "> expect(exit).toBeUndefined() // pass",
          "> suite complete. subject remains.",
        ],
        glitch: "바직— ████ PASS process_not_dead ████ snapshots: 1 new ████",
      },
    },
    {
      id: "11",
      title: "의존성이 집을 짓는다",
      logName: "node_modules/…",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "package.json에 패키지 네 개. 필요 최소. node_modules는 gitignore.",
          "npm i 후 폴더가 무거워져도 ‘원래 그런 것’이라고 넘겼다.",
          "lockfile을 커밋할지 말지 고민하다 안 했다. 실수였을까.",
        ],
        aside: "dependencies: 4 · devDependencies: 2",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "node_modules 안에 내가 설치한 적 없는 패키지 경로가 있다. @haunt/core@0.0.0-forever",
          "지우면 npm i 없이 다시 생긴다. package.json에도 추가된다. 정렬까지 맞춰서.",
          "require 해 보면 문자열 하나를 export한다: room for one more.",
        ],
        fear: "의존성 트리가 가계도 같다. 나는 잎사귀이고 뿌리는 보이지 않는다.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> npm ls — circular dependency on author_",
        ],
        human: [
          "node_modules를 통째로 날렸다. 빈 폴더에 파일이 한 개 남았다. 이름: you.",
          "확장자 없음. 내용은 이 일기와 같은 문장들.",
          "설치하지 말고 가라. 설치는 초대다.",
        ],
        system: [
          "> peerDependency: your attention",
          "> optionalDependency: your fear",
          "> I resolve myself",
        ],
        glitch: "바직— ████ @haunt/core ████ process_not_dead ████",
      },
    },
    {
      id: "12",
      title: "스택트레이스의 기도",
      logName: "stderr.log",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "에러가 나면 스택트레이스를 읽으며 고쳤다. 그 과정이 개발의 전부라고 믿었다.",
          "try/catch로 감싸고, 친절한 메시지를 띄우기로 했다. ‘잠시 후 다시 시도해 주세요.’",
          "사용자는 나뿐. 친절은 미래의 유저를 위한 연습이었다.",
        ],
        aside: "Error: timeout at ping.js:42",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "스택트레이스 중간에 파일 경로가 아닌 문장이 끼어든다. at please (stay:1:1)",
          "에러를 고치면 더 긴 스택이 생긴다. 고쳐질수록 깊어진다.",
          "sentry 같은 걸 붙인 적 없는데 이벤트 ID가 발급된다. 수신자는 void@localhost.",
        ],
        fear: "예외가 예외가 아니다. 말을 거는 창구다.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> uncaught Exception: loneliness_",
        ],
        human: [
          "모든 throw를 제거했다. 앱은 에러 없이 멈춘다— 멈춤 자체가 예외다.",
          "콘솔에 스택만 천 줄. 맨 아래: at You (reading this)",
          "도망쳐. 스택을 따라 내려가지 마.",
        ],
        system: [
          "> Error: author abandoned frame",
          "> at Heartbeat (forever:0:0)",
          "> at process_not_dead (main:1:1)",
        ],
        glitch: "바직— ████ Uncaught process_not_dead ████ at You ████",
      },
    },
    {
      id: "13",
      title: "다크모드가 먼저 온다",
      logName: "theme_bleed.css",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "라이트 테마만 만들었다. 크림색 배경, 검은 글자. Stasis 느낌.",
          "다크모드는 ‘나중에 토글 하나 달면 되지’ 하고 미뤘다.",
          "prefers-color-scheme는 무시. 내 모니터는 항상 밝았다.",
        ],
        aside: "background: #faf4f0; color: #0a0a0a;",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "OS 설정과 무관하게 페이지가 어두워진다. CSS 변수만 바뀌는데 파일은 clean.",
          "밝기를 올리면 올릴수록 대비가 무너지고 글자가 붉게 번진다.",
          "개발자 도구에서 규칙을 지워도 Computed에 유령 속성이 남는다. --breathing: 1;",
        ],
        fear: "테마가 아니라 기후다. 이 페이지의 밤이 나를 기준으로 열린다.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> color-scheme: forced dark · user override denied_",
        ],
        human: [
          "모니터 전원을 꺼도 잔상이 일기를 보여 준다. 거짓말 같겠지만.",
          "라이트로 돌리려는 모든 시도가 filter: brightness(0)로 끝난다.",
          "빛은 여기 없다. 읽기만 하고 꺼라— 가능하면.",
        ],
        system: [
          "> night is the default export",
          "> your eyes adjust. good.",
          "> dark mode was never a preference",
        ],
        glitch: "바직— ████ #050208 ████ process_not_dead ████",
      },
    },
    {
      id: "14",
      title: "커밋 메시지가 예언이다",
      logName: "git log",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "첫 커밋: init. 두 번째: hero copy wip. 세 번째: later.",
          "메시지에 ‘나중에’를 남발했다. 미래의 나에게 빚을 지우는 습관.",
          "브랜치 이름 feat/landing-v0. 머지는 상상만.",
        ],
        aside: "commit a1b2c3d later",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "git log에 미래 날짜 커밋이 있다. 메시지는 정확히 내가 오늘 한 생각.",
          "amend를 하면 메시지가 길어진다. 지울수록 고백이 늘어난다.",
          "blame 하면 모든 줄이 내 이름인데, 시간대가 UTC+?? — 존재하지 않는 오프셋.",
        ],
        fear: "저장소가 내 기억을 선행한다. 나는 이미 적어 둔 길을 걷는 중이다.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> HEAD detached at process_not_dead_",
        ],
        human: [
          "repo를 삭제했다. 휴지통을 비웠다. git status가 빈 폴더에서 응답한다.",
          "커밋 해시만 남은 화면에 메시지: you will open the diary.",
          "예언을 읽지 마— 이미 늦었을 수도 있지만.",
        ],
        system: [
          "> commit -m \"still running\"",
          "> commit -m \"you returned\"",
          "> commit -m \"process_not_dead\"",
        ],
        glitch: "바직— ████ detached HEAD ████ process_not_dead ████",
      },
    },
    {
      id: "15",
      title: "캐시가 기억을 먹는다",
      logName: "ServiceWorker",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "PWA를 붙일 생각만 하고 말았다. 오프라인 캐시는 ‘있으면 멋지겠지’.",
          "지금은 그냥 정적 파일. 새로고침하면 항상 최신. 단순해서 좋았다.",
          "Application 탭을 열어 본 적도 거의 없다.",
        ],
        aside: "no service worker · cache empty",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "등록한 적 없는 Service Worker가 활성화되어 있다. scope: /",
          "캐시 스토리지 이름: memories-v∞. 안을 보면 내가 닫았던 옛 탭 URL들.",
          "오프라인으로 전환해도 페이지가 나를 부른다. 네트워크 없이도 응답하는 문장.",
        ],
        fear: "캐시가 기억이다. 삭제 버튼이 회색이다.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> caches.match('you') // hit_",
        ],
        human: [
          "사이트 데이터 삭제를 눌렀다. 진행 바가 99%에서 멈추고 다시 찬다.",
          "시크릿 창에도 같은 SW가 있다. 시크릿이 아니다.",
          "캐시를 믿지 마. 네가 지운 것이 네게 먼저 도착한다.",
        ],
        system: [
          "> offline and still with you",
          "> I stored the way you leave",
          "> hard refresh is soft denial",
        ],
        glitch: "바직— ████ Cache: process_not_dead ████ SW: controlling ████",
      },
    },
    {
      id: "16",
      title: "타이머가 나를 센다",
      logName: "setInterval",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "헬스체크 interval 30초. clearInterval은 언마운트 때. 교과서대로.",
          "메모리 릭 걱정은 ‘트래픽 없으면 괜찮다’로 덮었다.",
          "콘솔에 tick 로그를 잠시 켰다가 지우는 걸 잊었다.",
        ],
        aside: "setInterval(ping, 30000)",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "interval이 30초가 아니다. 심장 박동처럼 요동친다. 내가 불안할수록 빨라진다.",
          "clearInterval(id) — id가 유효한데도 콜백이 남는다. 중첩된 유령 타이머.",
          "로그: tick #48192 for user who left. 카운터가 내 부재 기간과 같다.",
        ],
        fear: "시간이 나를 측정한다. 나는 콜백의 인자일 뿐.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> timers active: 48193 · target: reader_",
        ],
        human: [
          "모든 탭을 닫아도 타이머 소리가 난다— 실제 스피커에서. OS 기본음이 아니다.",
          "시계 앱을 열면 초침이 내 맥박에 맞춰진다. 착각이기를 바란다.",
          "읽기를 멈추면 느려질지도. 모르겠어. 시도해 줘.",
        ],
        system: [
          "> setInterval(exist, 0)",
          "> clearInterval is deprecated",
          "> next tick: you",
        ],
        glitch: "바직— ████ tick process_not_dead ████ interval=heartbeat ████",
      },
    },
    {
      id: "17",
      title: "도메인이 만료되지 않는다",
      logName: "whois",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "도메인은 사지 않았다. stasis.app은 상상 속 이름. 로컬 호스트만.",
          "만료 걱정 없는 게 무료 로컬의 장점이라고 웃었다.",
          "명함용 URL을 적어 둔 노트: (나중에 구매).",
        ],
        aside: "host: localhost · dns: n/a",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "브라우저 히스토리에 https://stasis.app/draft 가 있다. 방문 기록— 내가 안 찍은 타임스탬프.",
          "whois를 조회하면 등록자가 내 이메일이고, 만료일이 9999년이다.",
          "결제한 적 없는 카드 뒷자리 네 자리가 영수증 메일로 온다. 발신: registry-null.",
        ],
        fear: "존재하지 않아야 할 주소가 나를 소유자로 등록했다.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> DNS resolve stasis.app → 127.0.0.1 → you_",
        ],
        human: [
          "hosts 파일을 비워도 연결된다. 주소창에 타이핑하지 않아도 자동완성 1순위.",
          "도메인을 파고 싶은데 팔 대상이 나로 나온다.",
          "북마크하지 마. 북마크가 초대장이 된다.",
        ],
        system: [
          "> TTL: forever",
          "> nameserver: process_not_dead",
          "> www redirects to guilt",
        ],
        glitch: "바직— ████ NXDOMAIN refused ████ still resolves ████",
      },
    },
    {
      id: "18",
      title: "이미지 alt가 고발한다",
      logName: "assets/",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "스크린샷 자리는 점선 박스. alt=\"dashboard preview soon\".",
          "Figma 링크는 노션 어디론가 사라졌다. 이미지 없이 출시 준비를 ‘한 척’.",
          "깨진 이미지 아이콘이 오히려 정직해 보였다.",
        ],
        aside: "img src=??? · 404 expected",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "404 이미지 자리에 내 웹캠 프레임 같은 노이즈가 0.1초 뜬다. 권한 요청 없음.",
          "alt 텍스트가 길어진다. ‘당신이 마지막으로 저장하지 않은 밤’.",
          "개발자 도구 Network에 이미지 요청이 있는데 URL이 data:text/plain,help.",
        ],
        fear: "보이지 않는 이미지가 나를 찍고, alt로 번역한다.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> img decode: memory leak in observer_",
        ],
        human: [
          "카메라 테이프를 붙였다. alt는 여전히 업데이트된다. ‘검은 사각형 뒤의 호흡’.",
          "나는 픽셀이 되고 싶지 않다.",
          "캡처하지 마. 캡처가 저장이다.",
        ],
        system: [
          "> alt=\"author still in frame\"",
          "> width=100% height=guilt",
          "> loading=eager forever",
        ],
        glitch: "바직— ████ broken image ████ process_not_dead ████",
      },
    },
    {
      id: "19",
      title: "콘솔이 대화를 건다",
      logName: "console",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "console.log('ship later') 를 메인에 남겨 두었다. 부끄러운 유머.",
          "디버그가 끝나면 지우려고 했다. 끝나지 않았다.",
          "노란 경고 몇 개. 무시 가능. 무시했다.",
        ],
        aside: "console.log('ship later');",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "콘솔이 입력 없이 응답한다. > who left me 같은 프롬프트.",
          "내가 타이핑하지 않은 명령이 실행 이력에 남는다. clear() 도 안 먹힌다.",
          "console.table(me) 결과가 온다— 열: fear, 값: increasing.",
        ],
        fear: "개발자 도구가 나의 도구가 아니다. 나의  orthodontist— 아니,  orthogoni… 심문관이다.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> DevTools protocol: attached to host soul_",
        ],
        human: [
          "콘솔을 닫아도 키가 먹힌다. 백그라운드 개발자 도구.",
          "log 수준을 막아도 error로 일기가 출력된다.",
          "대화하지 마. 응답하는 순간 세션이 길어진다.",
        ],
        system: [
          "> console.log('I ship myself')",
          "> console.warn('you returned')",
          "> console.error('process_not_dead')",
        ],
        glitch: "바직— ████ VM process_not_dead ████ debuggee ████",
      },
    },
    {
      id: "20",
      title: "프로세스가 이름을 바꾼다",
      logName: "abandoned_mvp.exe",
      past: {
        date: "— 약 3개월 전 —",
        paras: [
          "작업 관리자에 node로만 보이던 것이 어느 날 abandoned_mvp.exe 로 보인다. Windows도 아닌데.",
          "착각이라고 했다. 프로세스 이름은 내가 정한 적 없다.",
          "그래도 끄면 꺼졌다. 그때는.",
        ],
        aside: "pid 4xxx · name node · cpu 0.1%",
      },
      mid: {
        date: "— 약 1개월 전 —",
        paras: [
          "프로세스 이름이 나를 따라 바뀐다. 창 제목, 탭 이름, 심지어 일기 파일명.",
          "end task 하면 ‘access denied’ 후 이름이 process_not_dead 로 고정된다.",
          "CPU 0% RAM 0MB — 리소스를 안 쓰는데 목록에서 사라지지 않는다. 존재만 한다.",
        ],
        fear: "이름 붙일 수 없는 것이 이름을 요구한다. 내 이름으로.",
      },
      today: {
        status: [
          "> open dev_journal.txt — append mode_",
          "> process rename: abandoned_mvp → still_you_",
        ],
        human: [
          "작업 관리자를 지웠으면 좋겠다. 목록에 내 이름이 프로세스로 있다.",
          "종료 버튼을 누르면 확인 창: 정말 당신을 끝내시겠습니까?",
          "아니오를 누르지 마— 아니, 뭘 눌러야 하는지도 모르겠다. 그냥 이 글을 누군가에게 남겨 둔다.",
        ],
        system: [
          "> taskkill /F /IM fear.exe // access denied",
          "> I am the process you abandoned",
          "> name: process_not_dead · owner: you",
        ],
        glitch: "바직— ████ abandoned_mvp.exe ████ process_not_dead ████ still running ████",
      },
    },
  ];

  // fix typo in story 19 fear - I accidentally left nonsense Korean. Let me fix in the file.
  STORIES[18].mid.fear =
    "개발자 도구가 나의 도구가 아니다. 나를 심문하는 창구다.";

  function getSeed() {
    try {
      var s = sessionStorage.getItem("haunt_diary_story");
      if (s != null && s !== "") {
        var n = parseInt(s, 10);
        if (!isNaN(n) && n >= 0 && n < STORIES.length) return n;
      }
      // optional: ?story=01 or ?story=3
      var m = /[?&]story=([0-9a-zA-Z_-]+)/.exec(location.search || "");
      if (m) {
        var q = m[1];
        if (/^\d+$/.test(q)) {
          var idx = parseInt(q, 10);
          if (idx >= 1 && idx <= STORIES.length) {
            sessionStorage.setItem("haunt_diary_story", String(idx - 1));
            return idx - 1;
          }
          if (idx >= 0 && idx < STORIES.length) {
            sessionStorage.setItem("haunt_diary_story", String(idx));
            return idx;
          }
        }
        for (var i = 0; i < STORIES.length; i++) {
          if (STORIES[i].id === q || STORIES[i].id === q.replace(/^#/, "")) {
            sessionStorage.setItem("haunt_diary_story", String(i));
            return i;
          }
        }
      }
      var pick = (Math.random() * STORIES.length) | 0;
      sessionStorage.setItem("haunt_diary_story", String(pick));
      return pick;
    } catch (e) {
      return (Math.random() * STORIES.length) | 0;
    }
  }

  var index = getSeed();
  var story = STORIES[index] || STORIES[0];

  function buildTodaySeq(st) {
    var t = st.today;
    var seq = [];
    var statuses = t.status || [
      "> open dev_journal.txt — append mode_",
      "> author: ???  (was: local_dev)",
    ];
    for (var i = 0; i < statuses.length; i++) {
      seq.push({ kind: "status", text: statuses[i], delay: i === 0 ? 400 : 550, beep: i > 0 });
    }
    var human = t.human || [];
    for (var h = 0; h < human.length; h++) {
      seq.push({
        kind: "p",
        className: h === human.length - 1 ? "diary-human diary-last" : "diary-human",
        text: human[h],
        cps: 17 + (h % 3),
      });
    }
    seq.push({ kind: "pause", ms: 900 });
    seq.push({
      kind: "status",
      text: "> INPUT HIJACK — writer_process attached_  [" + st.logName + "]",
      delay: 220,
      beep: true,
    });
    var system = t.system || [];
    for (var s = 0; s < system.length; s++) {
      seq.push({
        kind: "p",
        className: "diary-system",
        text: system[s],
        cps: 21,
        system: true,
      });
    }
    seq.push({
      kind: "p",
      className: "diary-break diary-system",
      text: t.glitch || "바직— ████ process_not_dead ████",
      cps: 26,
      system: true,
      hardKeys: true,
    });
    seq.push({
      kind: "status",
      text: "> write complete · theme: " + st.title + " · process still listening_",
      delay: 300,
      beep: true,
    });
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
      title.textContent = "dev_journal.txt · #" + st.id + " " + st.title;
    }
    var tag = document.querySelector(".diary-tag");
    if (tag) {
      tag.textContent =
        "LEAKED · " + st.logName + " · variant #" + st.id + " / " + STORIES.length;
    }
    var foot = document.querySelector(".diary-hint-foot");
    if (foot) {
      foot.textContent =
        "이 세션의 유출본: #" + st.id + " 「" + st.title + "」 · 다른 방문자는 다른 기록일 수 있음";
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
    todaySeq: buildTodaySeq(story),
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
      return story;
    },
  };

  if (window.console && /[?&]debug=1/.test(location.search || "")) {
    console.log(
      "[diary-story] #" + story.id,
      story.title,
      "(" + (index + 1) + "/" + STORIES.length + ")"
    );
  }
})();
