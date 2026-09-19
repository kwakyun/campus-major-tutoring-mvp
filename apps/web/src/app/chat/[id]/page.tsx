"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  getConversation,
  listMessages,
  sendMessage,
  agreeProposal,
  createBooking,
  type ConversationRecord,
  type ProposalRecord,
  type ChatMessageRecord,
} from "../../../lib/api-client";
import { Button, StatusBadge } from "@campus-major-tutoring-mvp/ui";

function ChatRoomPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const chatId = typeof params?.id === "string" ? params.id : "sample-1";

  const [conversation, setConversation] = useState<ConversationRecord | null>(null);
  const [currentProposal, setCurrentProposal] = useState<ProposalRecord | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmedId, setBookingConfirmedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 대화 및 제안서 데이터 로딩
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const detail = await getConversation(chatId);
        if (!isMounted) return;
        setConversation(detail.conversation);
        setCurrentProposal(detail.currentProposal);

        const msgs = await listMessages(chatId);
        if (!isMounted) return;
        setMessages(msgs);
      } catch (err) {
        // 서버에 아직 없는 샘플 채팅방인 경우 클라이언트 데모 상태로 fallback
        console.warn("실제 협의방 조회가 불가하여 데모 모드로 전환합니다:", err);
        if (!isMounted) return;
        setMessages([
          {
            id: "msg-1",
            conversationId: chatId,
            senderId: "learner",
            senderRole: "learner",
            text: "이번 주 목요일 저녁에 가능할까요? 데이터 필터링 부분을 집중적으로 배우고 싶어요.",
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: "msg-2",
            conversationId: chatId,
            senderId: "tutor",
            senderRole: "tutor",
            text: "네! 그 부분 중심으로 60분 수업으로 조정할 수 있어요. 학교 근처 조용한 스터디룸에서 진행하면 어떨까요?",
            createdAt: new Date(Date.now() - 1800000).toISOString(),
          },
        ]);
        setCurrentProposal({
          id: `prop-${chatId}`,
          conversationId: chatId,
          version: 1,
          proposedBy: "tutor",
          scheduledStart: "2026-10-15T19:00:00.000Z",
          scheduledEnd: "2026-10-15T20:00:00.000Z",
          totalMinutes: 60,
          location: "홍익대 정문 인근 스터디룸 (대면)",
          agreedPriceAmount: 25000,
          learningGoal: "파이썬 데이터 처리 기초 1:1 실습",
          agreedByLearner: false,
          agreedByTutor: true,
          status: "proposed",
          createdAt: new Date().toISOString(),
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMessage.trim() || isSubmitting) return;

    const text = inputMessage.trim();
    setInputMessage("");

    try {
      const newMsg = await sendMessage(chatId, text);
      setMessages((prev) => [...prev, newMsg]);
    } catch {
      // 오프라인/데모 모드 로컬 반영
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          conversationId: chatId,
          senderId: "me",
          senderRole: "learner",
          text,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }

  async function handleAgreeProposal() {
    if (!currentProposal || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await agreeProposal(chatId, currentProposal.id);
      setCurrentProposal(updated);
      const msgs = await listMessages(chatId);
      setMessages(msgs);
    } catch (err) {
      // 데모 모드일 경우 즉시 합의 상태로 전환
      setCurrentProposal((prev) =>
        prev
          ? {
              ...prev,
              agreedByLearner: true,
              agreedByTutor: true,
              status: "agreed",
            }
          : null,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateBooking() {
    if (!currentProposal || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await createBooking(chatId, currentProposal.id);
      setBookingConfirmedId(res.booking.id);
    } catch (err) {
      const mockBookingId = `bk-${Date.now()}`;
      setBookingConfirmedId(mockBookingId);
    } finally {
      setIsSubmitting(false);
    }
  }

  const tutorLabel = conversation ? `교육자-${conversation.tutorId.slice(-4)}` : "김민지 튜터";
  const isAgreed = currentProposal?.status === "agreed" || (currentProposal?.agreedByLearner && currentProposal?.agreedByTutor);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "85vh", paddingBottom: "80px" }}>
      {/* Top Header & Tutor Info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "16px",
          borderBottom: "1px solid rgba(18, 19, 22, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => router.push("/courses")}
            style={{
              border: "none",
              background: "var(--bg-ivory)",
              color: "var(--charcoal-deep)",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="수업 목록으로"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              arrow_back
            </span>
          </button>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
                {tutorLabel}
              </span>
              <StatusBadge label="공식 신원 확인됨" tone="positive" size="sm" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: isAgreed ? "var(--electric-chartreuse)" : "var(--primary-olive)",
                }}
              />
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: isAgreed ? "var(--charcoal-deep)" : "var(--primary-olive)" }}>
                {isAgreed ? "수업 조건 합의 완료 (예약 가능)" : "수업 조건 조율 중"}
              </span>
            </div>
          </div>
        </div>

        <Link href="/schedule">
          <Button variant="outline" size="sm">
            내 시간표 확인
          </Button>
        </Link>
      </div>

      {/* 예약 확정 성공 배너 */}
      {bookingConfirmedId && (
        <div
          style={{
            margin: "16px 0",
            padding: "16px",
            background: "var(--electric-chartreuse)",
            color: "var(--charcoal-deep)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800 }}>
            <span className="material-symbols-outlined">check_circle</span>
            <span>수업 예약이 성공적으로 확정되었습니다! (예약번호: {bookingConfirmedId})</span>
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            양측 동의와 시간 점유가 완료되었습니다. 시간표 대시보드에서 확정 일정을 확인할 수 있습니다.
          </p>
          <div style={{ marginTop: "6px" }}>
            <Link href="/schedule">
              <Button size="sm">내 시간표 대시보드로 이동</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 0",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {messages.map((m) => {
          const isMe = m.senderRole === "learner";
          const isSystem = m.senderRole === "system";

          if (isSystem) {
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: "center",
                  background: "rgba(18, 19, 22, 0.05)",
                  color: "var(--text-muted)",
                  padding: "4px 14px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.75rem",
                  margin: "6px 0",
                  textAlign: "center",
                  maxWidth: "90%",
                }}
              >
                {m.text}
              </div>
            );
          }

          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isMe ? "flex-end" : "flex-start",
                gap: "4px",
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "10px 16px",
                  borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: isMe ? "var(--charcoal-deep)" : "var(--bg-surface)",
                  color: isMe ? "var(--bg-surface)" : "var(--charcoal-deep)",
                  boxShadow: "var(--shadow-xs)",
                  border: isMe ? "none" : "1px solid var(--border-subtle)",
                }}
              >
                <p style={{ margin: 0, fontSize: "0.92rem", lineHeight: 1.55 }}>{m.text}</p>
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-dim)", padding: "0 4px" }}>
                {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          );
        })}

        {/* Structured "공식 수업 조건 제안서" Card (S05 핵심) */}
        {currentProposal && (
          <div
            style={{
              margin: "16px 0",
              padding: "20px",
              background: "var(--charcoal-deep)",
              color: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "var(--electric-chartreuse)",
                  color: "var(--charcoal-deep)",
                  padding: "4px 12px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.78rem",
                  fontWeight: 800,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  bolt
                </span>
                공식 수업 조건 제안서 (버전 {currentProposal.version})
              </div>
              <StatusBadge
                label={isAgreed ? "양측 합의 완료" : "동의 대기 중"}
                tone={isAgreed ? "positive" : "warning"}
                size="sm"
              />
            </div>

            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--bg-surface)", marginBottom: "12px" }}>
              {currentProposal.learningGoal}
            </h3>

            {/* Details Grid */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                borderRadius: "var(--radius-md)",
                padding: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>일정 및 시간</span>
                <span style={{ fontWeight: 700 }}>
                  {new Date(currentProposal.scheduledStart).toLocaleDateString()} {new Date(currentProposal.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({currentProposal.totalMinutes}분)
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>진행 장소</span>
                <span style={{ fontWeight: 700 }}>{currentProposal.location}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>최종 수업료 (학습자 수수료 0원)</span>
                <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--electric-chartreuse)" }}>
                  ₩{currentProposal.agreedPriceAmount.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* Actions */}
            {!bookingConfirmedId && (
              <div style={{ display: "flex", gap: "10px" }}>
                {!isAgreed ? (
                  <button
                    type="button"
                    onClick={handleAgreeProposal}
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "var(--radius-full)",
                      background: "var(--electric-chartreuse)",
                      color: "var(--charcoal-deep)",
                      border: "none",
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {isSubmitting ? "처리 중..." : "제안서 조건 동의하기 (양측 합의)"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreateBooking}
                    disabled={isSubmitting}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "var(--radius-full)",
                      background: "var(--electric-chartreuse)",
                      color: "var(--charcoal-deep)",
                      border: "none",
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                      event_available
                    </span>
                    {isSubmitting ? "예약 생성 중..." : "합의서로 예약 확정 및 시간 점유"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <form
        onSubmit={handleSendMessage}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          paddingTop: "12px",
          borderTop: "1px solid rgba(18, 19, 22, 0.08)",
        }}
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="메시지 또는 일정/장소 협의 내용을 입력하세요..."
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--border-subtle)",
            outline: "none",
            fontSize: "0.92rem",
            background: "var(--bg-surface)",
          }}
        />
        <button
          type="submit"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "var(--charcoal-deep)",
            color: "var(--electric-chartreuse)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          aria-label="전송"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
            send
          </span>
        </button>
      </form>
    </div>
  );
}

export default function ChatRoomPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>채팅방을 불러오는 중...</div>}>
      <ChatRoomPageContent />
    </Suspense>
  );
}
