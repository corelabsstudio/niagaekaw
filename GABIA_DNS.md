# niagaekaw.site → GitHub Pages 연결 (가비아)

## 지금 상태
- 사이트 배포 완료 (GitHub Pages)
- **지금 바로 접속:** https://corelabsstudio.github.io/niagaekaw/
- 저장소: https://github.com/corelabsstudio/niagaekaw
- 커스텀 도메인 DNS는 **가비아에서 레코드 추가 후** 연결

## 가비아에서 할 일 (당신)

1. [가비아](https://www.gabia.com/) 로그인  
2. **My가비아 → 도메인 → niagaekaw.site → DNS 관리**  
3. 가비아 네임서버 사용 중인지 확인  
4. 아래 레코드 추가  

### 루트 `niagaekaw.site` (필수)

기존 주차용 A 레코드가 있으면 지우고:

| 타입 | 호스트 | 값 |
|------|--------|-----|
| **A** | `@` (또는 비움) | `185.199.108.153` |
| **A** | `@` | `185.199.109.153` |
| **A** | `@` | `185.199.110.153` |
| **A** | `@` | `185.199.111.153` |

### www (선택)

| 타입 | 호스트 | 값 |
|------|--------|-----|
| **CNAME** | `www` | `corelabsstudio.github.io.` |

## DNS 넣은 뒤 (나에게 말하거나 직접)

GitHub → https://github.com/corelabsstudio/niagaekaw/settings/pages  
- Custom domain: `niagaekaw.site`  
- DNS check 통과 후 **Enforce HTTPS** 체크  

또는 로컬에서:

```powershell
cd C:\Users\hysoo\projects\niagaekaw-site
Set-Content CNAME "niagaekaw.site" -Encoding ascii
git add CNAME
git commit -m "Enable custom domain niagaekaw.site"
git push
```

## 재배포 (코드 수정 시)

원본: `WakeAgain/experiments/cursed-haunt`  
배포본: `projects/niagaekaw-site` 에 복사 후 `git push`
