// 설정 확인용: 주소 뒤에 /api/health 를 붙여 열면 데이터베이스와 관리자 아이디가 연결됐는지 보여 준다 (값은 보여 주지 않음).
export function onRequestGet({ env }) {
  const body = {
    '데이터베이스(DB)': env.DB ? '연결됨' : '연결 안 됨 — Settings → Bindings에서 D1을 변수 이름 DB로 연결하고 다시 배포하세요',
    '관리자 아이디(ADMIN_ID)': env.ADMIN_ID ? '설정됨' : '설정 안 됨 — Settings → Variables and Secrets에 ADMIN_ID를 넣고 다시 배포하세요',
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } });
}
