/* 시험용 가짜 Upstash Redis REST — 운결이 쓰는 명령(EVAL take/give · GET · SET NX PX · DEL)만 같은 의미로 흉내
   - 여러 '서버 인스턴스'가 같은 저장소를 보는 상황을 만들기 위해 상태는 이 객체 하나에만 있음
   - down=true 면 연결 실패(throw), bad=true 면 500 */
export const UP_URL = "https://ungyeol-test.upstash.io";
export const UP_TOKEN = "upstash-test-token-ABCDEFGHIJKLMNOP";

export function fakeUpstash() {
  const kv = new Map<string, { v: number; exp: number }>();
  const st = { down: false, bad: false, calls: 0, unauthorized: 0 };
  const now = () => Date.now();
  const get = (k: string) => {
    const e = kv.get(k);
    if (e && e.exp <= now()) kv.delete(k);
    return kv.get(k);
  };
  const fetchImpl = (async (url: any, init: any) => {
    st.calls++;
    if (st.down) throw new TypeError("fetch failed");
    if (String(url) !== UP_URL) return new Response(JSON.stringify({ error: "wrong url" }), { status: 404 });
    if (init?.headers?.Authorization !== `Bearer ${UP_TOKEN}`) return st.unauthorized++, new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    if (st.bad) return new Response(JSON.stringify({ error: "boom" }), { status: 500 });
    const a: string[] = JSON.parse(init.body);
    const out = (result: unknown) => new Response(JSON.stringify({ result }), { status: 200 });
    const c = a[0].toUpperCase();
    if (c === "EVAL" && a[1].includes("INCR")) {
      const [key, limit, ttl] = [a[3], Number(a[4]), Number(a[5])];
      const e = get(key);
      const v = (e?.v ?? 0) + 1;
      const exp = e ? e.exp : now() + ttl * 1000;
      if (v > limit) return out([0, v - 1, Math.max(1, Math.ceil((exp - now()) / 1000))]);
      kv.set(key, { v, exp });
      return out([1, v, 0]);
    }
    if (c === "EVAL") {
      const e = get(a[3]);
      if (e && e.v > 0) e.v--;
      return out(1);
    }
    if (c === "GET") return out(get(a[1]) ? String(get(a[1])!.v) : null);
    if (c === "SET") {
      if (get(a[1])) return out(null);
      kv.set(a[1], { v: 1, exp: now() + Number(a[5]) });
      return out("OK");
    }
    if (c === "DEL") return out(kv.delete(a[1]) ? 1 : 0);
    return new Response(JSON.stringify({ error: "unknown command" }), { status: 400 });
  }) as typeof fetch;
  return { fetch: fetchImpl, st, kv, peek: (k: string) => get(k)?.v ?? 0, reset: () => { kv.clear(); st.down = st.bad = false; st.calls = st.unauthorized = 0; } };
}
