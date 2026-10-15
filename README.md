# HVF · 험프리 시야검사 연습 (최종본)

실제 험프리 시야검사 전에 환자가 방법을 익히는 **연습·이해용** 프로그램입니다. 실제 검사가 아닙니다.

| 폴더 | 내용 |
|---|---|
| `public/` | 휴대폰 웹앱 화면. `index.html` = 첫 화면이자 연습 화면(승인된 사람만), `login.html` = 설치 안내·로그인·가입·승인 관리 |
| `functions/`, `lib/` | 가입·로그인·승인 관리 서버 코드 (Cloudflare Pages Functions + D1) |
| `pc/` | 병원 PC용: `humphrey-vf-demo.html`(평균 비교·직원 설정), 인터넷 없는 PC 설치 파일(`install.bat`) |
| `vercel.json` | 예전 Vercel 주소(`hvf-mobile-ver.vercel.app`)도 `public/`의 연습 화면을 보여 주게 함. 이 주소에는 로그인이 없습니다 |

주소를 열면 `public/index.html`(연습 화면)이 첫 화면이고, 로그인하지 않았거나 승인 전이면 `/login`으로 넘어갑니다.

## 1. 휴대폰 웹앱 올리기 (Cloudflare Pages)

1. **GitHub** — 파일은 이 저장소(`ykjjjs/hvf-mobile-ver`)의 `main`에 모두 올라가 있습니다. 예전 맨 위 `index.html`은 `public/index.html`로 옮겼습니다.
2. **Pages 만들기** — Cloudflare *Workers & Pages → Create application* → 화면 아래쪽 *Continue to Pages* → *Connect to Git* → `hvf-mobile-ver` 선택 → *Begin setup*
   - Project name: 원하는 이름 (예: `hvf` → 주소 `https://hvf.pages.dev`)
   - Production branch: `main`
   - Framework preset: `None`, Build command: 비움, Build output directory: `public`
   - Root directory: **비워 둠** (이 폴더가 저장소 맨 위이므로)
   - *Save and Deploy*
3. **데이터베이스** — *Storage & Databases → D1 SQL Database → Create* 로 `hfa-db`를 만들고, Pages 프로젝트 *Settings → Bindings → Add → D1 database*: Variable name `DB`, 데이터베이스 `hfa-db`. 표는 앱이 처음 접속할 때 스스로 만듭니다.
4. **관리자 아이디** — *Settings → Variables and Secrets → Add*: Type `Secret`, Variable name `ADMIN_ID`, Value 관리자로 쓸 아이디(영문 소문자·숫자 4~20자, 남이 짐작하기 어렵게)
   - 3·4번은 *Production* 환경에 넣습니다(미리보기 브랜치도 쓰면 *Preview* 에도).
5. **다시 배포** — *Deployments* → 최근 배포 *⋯ → Retry deployment*
6. **확인** — `https://주소/api/health` 를 열어 `연결됨`, `설정됨` 두 줄이 나오면 준비 끝. 주소 자체를 열면 처음에는 로그인 화면(`/login`, 노란 설치 안내 포함)으로 넘어가고, 승인된 뒤에는 바로 연습 화면이 열립니다.
7. **관리자 가입** — 4번의 관리자 아이디로 가입하면 바로 승인 관리 화면이 나옵니다.

### 매일 쓰기
- 주소를 카카오톡으로 보내면, 카카오톡 안에서 누르면 자동으로 크롬(아이폰은 사파리)으로 넘어갑니다.
- 환자는 첫 화면 안내대로 홈 화면에 설치합니다(안드로이드: *홈 화면에 설치* 버튼, 아이폰: 사파리 *공유 → 홈 화면에 추가*).
- 가입은 아이디·이메일·비밀번호만 받습니다. 관리자가 *승인 관리*에서 승인하면 연습 화면이 열립니다(*승인 / 거절 / 승인 취소 / 삭제*).
- 비밀번호를 잊은 환자는 관리자가 계정을 *승인 취소 → 삭제*하고 다시 가입하게 합니다.

## 2. 병원 PC (인터넷 없이)

`pc/` 폴더를 USB로 옮겨 *모두 압축 풀기*처럼 그대로 복사한 뒤 `install.bat`을 두 번 누릅니다. 바탕화면에 '험프리 시야검사 연습' 아이콘이 생기고, 주소창 없는 크롬 창으로 열립니다. 자세한 내용은 `pc/install-README.txt`.
`pc/humphrey-vf-demo.html`은 크롬으로 바로 열어도 됩니다.

## 고칠 때 (개발자용)

```bash
npx wrangler pages dev public --d1 DB=hfa-db --binding ADMIN_ID=내관리자아이디   # http://localhost:8788
```
