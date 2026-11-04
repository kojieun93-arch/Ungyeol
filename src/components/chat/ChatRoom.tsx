"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { READING_KINDS, type ReadingKind } from "@/components/reading/cards";
import { resultFor } from "@/features/chat/consultation";
import { useLive } from "@/features/saju/live";
import { ReadingViewer } from "@/components/reading/ReadingViewer";
import { ReadingActionsContext, useReadingViewer, type ReadingActions } from "@/components/reading/useReadingViewer";
import { TOPICS, type TopicId } from "@/features/saju/topics";
import { isFortuneId } from "@/content/fortunes";
import { isChapterId, isReportId } from "@/features/report/types";
import { ConsultProgress } from "./ConsultProgress";
import { formatBirth, formatBirthTime, formatDay } from "@/features/chat/format";
import { useAutoScroll, useChatSequencer, useReducedMotion, useVisualViewportVars } from "@/features/chat/hooks";
import type { ChatAction } from "@/features/chat/reducer";
import type { ChoiceOption, ConsultTopic, NodeId, Profile, Prompt } from "@/features/chat/types";
import { NICKNAME_MAX, validateNickname } from "@/features/chat/validation";
import { ChatHeader } from "./ChatHeader";
import { AdvisorRow, ChatMessage } from "./ChatMessage";
import { Composer, InfoChips, type InfoKey } from "./ChatComposer";
import { ChoiceButtons } from "./ChoiceButtons";
import { TypingIndicator } from "./TypingIndicator";
import { BirthDateForm } from "./forms/BirthDateForm";
import { BirthTimeForm } from "./forms/BirthTimeForm";
import { MbtiForm } from "./forms/MbtiForm";
import { BreakupForm } from "./forms/BreakupForm";
import { isProductId } from "@/features/products/types";
import { chatRootVars, READ, SPEC, u } from "./spec";

/* ──────────────────────────────────────────────────────────
   운결 채팅방 — 디자인 원본 design/source/03-chat.png 구성
   ┌ 헤더 188 (로고 이미지 · ‹ · ⋯) ─────────┐
   │ 날짜 알약 · 대화 목록 (스크롤, role=log)  │
   │ [선택지 / 입력 폼 패널]  ← 원본에 없는 단계용 │
   │ ⊞ 생년월일 · 태어난 시간 · 성별 · MBTI     │
   └ + [ 여기에 답변을 입력해주세요... ➤ ] ────┘
   배경: 원본에서 UI만 지운 그림을 위/아래 두 조각으로 깔고,
   화면이 원본보다 길면 그 사이를 원본의 민무늬 띠로 채움 (그림을 늘리지 않음)
   ────────────────────────────────────────────────────────── */

type AnswerFn = (a: Omit<Extract<ChatAction, { type: "answer" }>, "type" | "at">) => void;

const INFO_BY_NODE: Partial<Record<NodeId, InfoKey>> = {
  askCalendar: "birth",
  askLeap: "birth",
  askDate: "birth",
  askTime: "time",
  askGender: "gender",
  askMbti: "mbti",
};

function answeredOf(p: Profile) {
  const s = new Set<InfoKey>();
  if (p.birth) s.add("birth");
  if (p.time !== undefined) s.add("time");
  if (p.gender) s.add("gender");
  if (p.mbti !== undefined) s.add("mbti");
  return s;
}

function ChatBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundColor: "#36222b",
        backgroundImage: "url(/images/chat/chat-bg-top.webp), url(/images/chat/chat-bg-bottom.webp), url(/images/chat/chat-bg-mid.webp)",
        backgroundSize: "100% auto, 100% auto, 100% auto",
        backgroundPosition: "top center, bottom center, top center",
        backgroundRepeat: "no-repeat, no-repeat, repeat-y",
      }}
    />
  );
}

/**
 * 주소의 ?topic= → 상담 주제
 * 없으면 null(인트로에서 들어온 기본 상담), 알 수 없는 값이면 종합운.
 * 주소에는 주제 id 만 담고 개인정보는 넣지 않음.
 */
export function parseTopic(v: string | null | undefined): ConsultTopic | null {
  if (v === null || v === undefined || v === "") return null;
  return isFortuneId(v) ? v : "overall";
}

export function ChatRoom({
  topicParam = null,
  reportParam = null,
  chapterParam = null,
  productParam = null,
}: {
  topicParam?: string | null;
  reportParam?: string | null;
  chapterParam?: string | null;
  /** 주제별 리포트(PHASE 5)에서 왔으면 상품 id */
  productParam?: string | null;
}) {
  const topic = parseTopic(topicParam);
  const product = isProductId(productParam) ? productParam : null;
  const ask =
    reportParam && chapterParam && isReportId(reportParam) && (product ? /^\d{2}$/.test(chapterParam) : isChapterId(chapterParam))
      ? { reportId: reportParam, chapterId: chapterParam, productId: product }
      : null;
  const [state, dispatch, restored] = useChatSequencer(topic);
  const reduced = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [hint, setHint] = useState<string | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useVisualViewportVars();

  // 홈에서 다른 주제를 골라 돌아오면: 상담 중이면 확인 후 전환, 아니면 바로 새 주제 (같은 주제면 그대로 이어서)
  useEffect(() => {
    if (topic) dispatch({ type: "requestTopic", topic, at: Date.now() });
  }, [topic, dispatch]);

  // 리포트에서 들어온 질문: 챕터 맥락의 선택지 (미리 작성된 설명만)
  const askKey = ask ? `${ask.reportId}/${ask.chapterId}/${ask.productId ?? ""}` : null;
  useEffect(() => {
    if (!askKey) return;
    const [reportId, chapterId, productId] = askKey.split("/");
    dispatch({ type: "askChapter", reportId, chapterId, productId: productId || null, at: Date.now() });
  }, [askKey, dispatch]);

  const firstAt = state.messages[0]?.at;
  useEffect(() => setOpenedAt(firstAt ?? Date.now()), [state.session, firstAt]);

  // 새 질문이 오면 답변 패널을 다시 연다
  const promptKey = state.prompt ? `${state.session}-${state.messages.length}` : null;
  useEffect(() => {
    if (promptKey) setPanelOpen(true);
  }, [promptKey]);

  useEffect(
    () => () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    [],
  );
  const showHint = (text: string) => {
    setHint(text);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(null), 3200);
  };

  const head = state.queue[0];
  const typing = !!head && state.typingId === head.id;
  const { unread, scrollToBottom } = useAutoScroll(scroller, [state.messages.length, typing, state.prompt?.type ?? "none", panelOpen], reduced);

  const answer: AnswerFn = (a) => {
    dispatch({ type: "answer", at: Date.now(), ...a });
    setHint(null);
    scroller.current?.focus({ preventScroll: true });
  };

  const restart = () => {
    dispatch({ type: "restart" });
    scroller.current?.scrollTo({ top: 0 });
  };

  const prompt = state.prompt;
  const isNickname = prompt?.type === "input" && prompt.field === "nickname";
  const currentInfo = prompt ? (INFO_BY_NODE[state.node] ?? null) : null;
  const answered = useMemo(() => answeredOf(state.profile), [state.profile]);

  const blocked = () => {
    if (!prompt) return showHint("운결의 이야기가 끝나면 답할 수 있어요.");
    setPanelOpen(true);
    showHint("지금은 위에 나온 선택지로 답해주세요.");
  };

  const msgs = state.messages;
  const lastFrom = msgs.at(-1)?.from;
  const D = SPEC.date;

  /* ── 결과 카드 6종: 채팅에 도착한 카드만 전체 화면에서 넘겨 볼 수 있음 ── */
  const readingMsgs = msgs.filter(
    (m): m is Extract<typeof m, { kind: "card" }> =>
      m.kind === "card" && (READING_KINDS as readonly string[]).includes(m.card) && (m.epoch ?? 0) === state.resultEpoch,
  );
  const readingProfile = readingMsgs.at(-1)?.profile ?? null;
  const live = useLive(readingProfile); // 결과 화면 전에 /api/manse 상태를 미리 확인 (실제 계산 공개 여부)
  const reading = useMemo(() => (readingProfile ? resultFor(readingProfile, undefined, live.entry) : null), [readingProfile, live.entry]);
  const kinds = READING_KINDS.filter((k) => readingMsgs.some((m) => m.card === k));
  const viewer = useReadingViewer(reduced);
  const viewerIndex = viewer.kind ? kinds.indexOf(viewer.kind) : -1;

  const actions: ReadingActions = {
    open: viewer.open,
    chooseTopic: (id: TopicId) => {
      const atTopics = state.node === "analyze" || state.node === "topics" || state.node.startsWith("topic-");
      if (!readingMsgs.length) return showHint("결과가 바뀌어, 새 결과가 나온 뒤에 고를 수 있어요.");
      if (viewer.kind) viewer.close();
      if (prompt?.type === "choices" && state.queue.length === 0 && atTopics) {
        answer({ text: TOPICS[id].ask, next: `topic-${id}` });
      } else {
        showHint("운결의 이야기가 끝나면 주제를 고를 수 있어요.");
      }
    },
  };

  return (
    <div
      className="fixed inset-x-0 top-[var(--vv-top,0px)] flex h-[var(--vv-height,100dvh)] justify-center bg-[#2e1c24] text-chat-text"
      style={{ ...chatRootVars, fontFamily: "var(--font-sans)" }}
    >
      <ReadingActionsContext.Provider value={actions}>
      {/* 전체 화면 카드가 열려 있으면 뒤 채팅은 inert (보조기기·포커스 차단, 상태와 스크롤은 그대로) */}
      <div className="relative flex h-full w-full max-w-[480px] flex-col overflow-hidden" inert={viewer.kind !== null}>
        <div className="shrink-0 bg-[#2e1c24]" style={{ height: "env(safe-area-inset-top)" }} />

        <div className="relative flex min-h-0 flex-1 flex-col">
          <ChatBackground />
          <ChatHeader onRestart={restart} />
          <ConsultProgress node={state.node} consult={state.consult} />

          {/* ── 대화 목록 ── */}
          <div
            ref={scroller}
            tabIndex={-1}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="운결과의 대화"
            className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none"
            style={{ paddingLeft: u(SPEC.pad.left), paddingRight: u(SPEC.pad.right), paddingBottom: u(SPEC.bottom.listToChips) }}
          >
            {openedAt && (
              <div className="flex justify-center" style={{ paddingTop: u(D.mt) }}>
                <span
                  className="inline-flex items-center rounded-full bg-chat-raise font-normal text-white"
                  style={{ height: `max(${u(D.h)}, 24px)`, padding: `0 max(${u(D.px)}, 11px)`, fontSize: READ.date }}
                >
                  {formatDay(openedAt)}
                </span>
              </div>
            )}

            {msgs.map((m, i) => {
              const prev = msgs[i - 1];
              const next = msgs[i + 1];
              const first = prev?.from !== m.from;
              const continuesWithTyping = !next && typing && m.from === "advisor";
              const last = next ? next.from !== m.from : !continuesWithTyping;
              const resumed = restored.session === state.session && i < restored.count;
              return (
                <Fragment key={m.id}>
                  <ChatMessage message={m} first={first} last={last} animate={!resumed} stale={m.kind === "card" && m.epoch !== undefined && m.epoch !== state.resultEpoch} />
                  {resumed && i === restored.count - 1 && (
                    <p role="note" className="flex items-center gap-3 text-chat-muted" style={{ margin: `${u(36)} 0 0`, fontSize: READ.time }}>
                      <span aria-hidden className="h-px flex-1 bg-chat-line" />
                      이전 대화에 이어서
                      <span aria-hidden className="h-px flex-1 bg-chat-line" />
                    </p>
                  )}
                </Fragment>
              );
            })}

            {typing && (
              <AdvisorRow first={lastFrom !== "advisor"} last={false}>
                <TypingIndicator />
              </AdvisorRow>
            )}
          </div>

          {unread > 0 && (
            <button
              type="button"
              onClick={() => scrollToBottom(true)}
              className="absolute inset-x-0 z-20 mx-auto flex h-9 w-max animate-panel-in items-center gap-1.5 rounded-full bg-chat-raise px-4 text-[0.8125rem] text-white shadow-[inset_0_0_0_1px_var(--color-chat-chip-stroke)]"
              style={{ bottom: "calc(var(--footer-h, 140px) + 10px)" }}
            >
              새 메시지 {unread}개
              <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden>
                <path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* ── 하단 ── */}
          <Footer
            prompt={prompt}
            profile={state.profile}
            answer={answer}
            panelOpen={panelOpen}
            setPanelOpen={setPanelOpen}
            isNickname={isNickname}
            currentInfo={currentInfo}
            answered={answered}
            hint={hint}
            showHint={showHint}
            blocked={blocked}
            onInputFocus={() => setTimeout(() => scrollToBottom(false), 250)}
            canSkip={state.queue.length > 0 && state.messages.length > 0}
            onSkip={() => dispatch({ type: "flush", at: Date.now() })}
            formKey={`${state.session}-${state.messages.length}`}
          />
        </div>
      </div>

      {reading && viewer.kind && viewerIndex >= 0 && (
        <ReadingViewer
          r={reading}
          kinds={kinds}
          index={viewerIndex}
          closing={viewer.closing}
          onIndex={(i) => viewer.setKind(kinds[i] as ReadingKind)}
          onClose={viewer.close}
          onTopic={(id) => actions.chooseTopic(id)}
        />
      )}
      </ReadingActionsContext.Provider>
    </div>
  );
}

function Footer({
  prompt,
  profile,
  answer,
  panelOpen,
  setPanelOpen,
  isNickname,
  currentInfo,
  answered,
  hint,
  showHint,
  blocked,
  onInputFocus,
  canSkip,
  onSkip,
  formKey,
}: {
  prompt: Prompt | null;
  profile: Profile;
  answer: AnswerFn;
  panelOpen: boolean;
  setPanelOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  isNickname: boolean;
  currentInfo: InfoKey | null;
  answered: Set<InfoKey>;
  hint: string | null;
  showHint: (t: string) => void;
  blocked: () => void;
  onInputFocus: () => void;
  canSkip: boolean;
  onSkip: () => void;
  formKey: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty("--footer-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 현재 단계의 답변 UI (원본에 없는 요소)
  let panel: React.ReactNode = null;
  if (prompt?.type === "choices") {
    panel = (
      <ChoiceButtons
        options={prompt.options}
        onChoose={(o: ChoiceOption) =>
          o.restart
            ? answer({ text: o.reply ?? o.label, restart: true })
            : answer({ text: o.reply ?? o.label, next: o.next, patch: o.patch, reunion: o.reunion, record: o.record, edit: o.edit, switchTopic: o.switchTopic, askPick: o.askPick, resumeConsult: o.resumeConsult })
        }
      />
    );
  } else if (prompt?.type === "input") {
    const next = prompt.next;
    const sheet = (child: React.ReactNode) => (
      <div className="animate-panel-in rounded-[1.5rem] bg-chat-surface/95 p-4 shadow-[inset_0_0_0_1px_rgb(231_195_187/0.45)]">{child}</div>
    );
    switch (prompt.field) {
      case "nickname":
        panel = (
          <ChoiceButtons
            options={[{ label: "이름은 넘어갈게요" }]}
            onChoose={() => answer({ text: "이름은 넘어갈게요.", next, patch: { nickname: null } })}
          />
        );
        break;
      case "birthdate":
        panel = sheet(
          <BirthDateForm
            key={formKey}
            calendar={profile.calendar ?? "solar"}
            leap={profile.leap}
            onSubmit={(birth) => answer({ text: formatBirth({ ...profile, birth }), next, patch: { birth } })}
          />,
        );
        break;
      case "birthtime":
        panel = sheet(
          <BirthTimeForm
            key={formKey}
            onSubmit={(time) => answer({ text: time ? `${formatBirthTime(time)}에 태어났어요.` : "태어난 시간은 몰라요.", next, patch: { time } })}
          />,
        );
        break;
      case "mbti":
        panel = sheet(
          <MbtiForm key={formKey} onSubmit={(mbti) => answer({ text: mbti ? `${mbti}예요.` : "MBTI는 잘 몰라요.", next, patch: { mbti } })} />,
        );
        break;
      // 상대방 정보 (재회 · 궁합) — 기존 폼과 검증을 그대로 재사용
      case "partnerDate": {
        const cal = profile.partner?.calendar ?? "solar";
        panel = sheet(
          <BirthDateForm
            key={formKey}
            calendar={cal}
            leap={cal === "lunar" ? null : undefined}
            onSubmit={(birth) =>
              answer({
                text: `상대방은 ${cal === "lunar" ? "음력" : "양력"} ${birth.y}년 ${birth.m}월 ${birth.d}일생이에요.`,
                next,
                patch: { partner: { ...(profile.partner ?? {}), calendar: cal, birth } },
              })
            }
          />,
        );
        break;
      }
      // 재회 상담: 헤어진 연월 (날짜는 받지 않음 · 기억나지 않음 / 말하고 싶지 않음 선택 가능)
      case "breakup":
        panel = sheet(
          <BreakupForm
            key={formKey}
            birthYear={profile.birth?.y ?? null}
            onSubmit={(v) =>
              answer({
                text: v === "private" ? "헤어진 때는 말하고 싶지 않아요." : v === null ? "헤어진 때가 정확히 기억나지 않아요." : `${v.y}년 ${v.m}월쯤 헤어졌어요.`,
                next,
                reunion: { breakup: v },
              })
            }
          />,
        );
        break;
      case "partnerMbti":
        panel = sheet(
          <MbtiForm
            key={formKey}
            onSubmit={(mbti) =>
              answer({ text: mbti ? `상대방은 ${mbti}예요.` : "상대방 MBTI는 몰라요.", next, patch: { partner: { ...(profile.partner ?? {}), mbti } } })
            }
          />,
        );
        break;
    }
  }

  return (
    <div
      ref={ref}
      className="relative z-10 shrink-0 [html[data-keyboard=open]_&]:!pb-3"
      style={{ paddingBottom: `max(${u(SPEC.bottom.below)}, calc(env(safe-area-inset-bottom) + 12px))` }}
    >
      {panel && panelOpen && (
        <div className="max-h-[48vh] overflow-y-auto pb-3" style={{ paddingLeft: u(SPEC.pad.left), paddingRight: u(SPEC.pad.right + 10) }}>
          {panel}
        </div>
      )}

      <p role="status" aria-live="polite" className={cn("text-center text-[0.8125rem] leading-snug text-chat-muted", hint && "px-6 pb-2.5")}>
        {hint}
      </p>

      {/* 메시지가 이어지는 동안: 빠르게 보기 (남은 메시지를 한 번에) */}
      {canSkip && (
        <div className="flex justify-end" style={{ paddingRight: u(SPEC.pad.right + 10) }}>
          <button
            type="button"
            onClick={onSkip}
            className="group flex h-11 items-center px-1 focus-visible:outline-none"
            aria-label="남은 메시지 빠르게 보기"
          >
            <span className="flex h-8 items-center gap-1 rounded-full bg-chat-chip px-3 text-[12px] text-white shadow-[inset_0_0_0_1px_var(--color-chat-chip-stroke)] transition-[filter] group-active:brightness-125 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-chat-accent">
              빠르게 보기
              <svg viewBox="0 0 20 20" fill="none" className="size-3.5" aria-hidden>
                <path d="m4 5 5 5-5 5M10 5l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </div>
      )}

      <InfoChips current={currentInfo} answered={answered} panelOpen={panelOpen} onToggle={() => setPanelOpen((v) => !v)} onHint={showHint} />

      {/* 칩 버튼(44px) 안쪽 여백만큼 빼서, 보이는 칩과 입력창 사이 간격은 원본 그대로 */}
      <div style={{ height: `max(0px, calc(${u(SPEC.bottom.chipsToComposer)} - (44px - max(${u(SPEC.chips.h)}, 30px)) / 2))` }} />

      <Composer
        enabled={isNickname}
        maxLength={NICKNAME_MAX}
        validate={validateNickname}
        onSubmit={(v) => {
          if (prompt?.type === "input") answer({ text: v, next: prompt.next, patch: { nickname: v } });
        }}
        onBlockedFocus={blocked}
        canTogglePanel={!!panel}
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((v) => !v)}
        onInputFocus={onInputFocus}
      />
    </div>
  );
}
