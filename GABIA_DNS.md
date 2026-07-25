# niagaekaw.site → GitHub Pages 연결 (가비아)

배포 저장소: https://github.com/corelabsstudio/niagaekaw  
임시 URL: https://corelabsstudio.github.io/niagaekaw/

## 가비아에서 할 일

1. [가비아](https://www.gabia.com/) 로그인  
2. **My가비아 → 도메인 → niagaekaw.site → DNS 관리** (또는 네임서버/DNS 설정)  
3. **가비아 네임서버** 쓰는 상태인지 확인  
4. 아래 레코드 추가/수정  

### 루트 도메인 `niagaekaw.site` (필수)

기존 `@` / 루트 A 레코드가 있으면 삭제 후 아래 4개 추가:

| 타입 | 호스트 | 값 / 위치 |
|------|--------|-----------|
| **A** | `@` | `185.199.108.153` |
| **A** | `@` | `185.199.109.153` |
| **A** | `@` | `185.199.110.153` |
| **A** | `@` | `185.199.111.153` |

(가비아 UI에서 호스트가 비움 또는 `@`)

### www (선택)

| 타입 | 호스트 | 값 |
|------|--------|-----|
| **CNAME** | `www` | `corelabsstudio.github.io` |

### 하면 안 되는 것
- 네임서버를 함부로 Cloudflare 등으로 바꾸지 말 것 (지금은 가비아 NS)  
- A 레코드에 가비아 주차 페이지 IP 남기지 말 것  

## 전파 확인

- 보통 **10분 ~ 수 시간** (최대 24시간)  
- https://niagaekaw.site 접속  
- GitHub → 저장소 **Settings → Pages** 에서  
  - Custom domain: `niagaekaw.site`  
  - **DNS check** 초록 되면  
  - **Enforce HTTPS** 체크  

## 코드 수정 후 재배포

```powershell
# 원본 수정은 experiments/cursed-haunt 에서 하고 복사 푸시
cd C:\Users\hysoo\projects\niagaekaw-site
# 파일 갱신 후
git add -A
git commit -m "Update landing"
git push origin main
```
