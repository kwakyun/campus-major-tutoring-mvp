"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const CHAT_ROOMS = [
  {
    id: "sample-1",
    tutorName: "김민지 튜터",
    tutorSchool: "홍익대 컴퓨터공학과",
    courseTitle: "파이썬 데이터 처리 기초",
    lastMessage: "공식 수업 조건 제안서가 도착했습니다. 확인 후 수락 또는 조율해주세요.",
    timestamp: "방금 전",
    unreadCount: 1,
    status: "조율 중",
    avatar: "https://lh3.googleusercontent.com/aida/AEtjO1U3mLRypOOKx4id9M6iuUQhphqR9HXhAOCUG_mgTHO63WufFMNEOdGLW-XVqFNzUPBth48EeT97F1au47qj3CaWzWwvjarWrHgjOd5o4PHF3ri9b4oC4VXL59cMUmJ7dMrP-FUXuy7EvZgCHrGDCkxYy8i7mY5-sfAecHClhoz0ea8eiecf0MzEFdYTQSPmCC0g5XjvTxVbvvh4ZjbjiXNW6IyI-DLvYj1smOy81OfUmcS42oVqgm6hxeI",
  },
  {
    id: "sample-2",
    tutorName: "박서준 튜터",
    tutorSchool: "연세대 시각디자인학과",
    courseTitle: "피그마 실무 UI/UX 입문 1:1",
    lastMessage: "오늘 수업 고생하셨습니다! 학습 피드백 후기 부탁드립니다 🙌",
    timestamp: "어제",
    unreadCount: 0,
    status: "수업 완료",
    avatar: "https://lh3.googleusercontent.com/aida/AEtjO1U_lWlBv6Pzv_b-4MFxvpipMD7Jmj6YRRnVL_enG1k9IzV5ZpOfXFsa55Jlftx3WKO6lmo7W_L0Ea02NWlBT47KaHSLHO89msbKfDToC4ax45Vva0fFD_OYc7dKHfzDXzmJeAJ0yQQFK2NmWYZaZ-6GBmE9O45qyrbcreQztEGd8rhz16xEsrqCZn8__RRce-3NRJGpN5Efn5Rwt9xSfBe56rX1BLHpn3lZc5JFoH4nEA_xFXA8h45PCHd8",
  },
];

export default function ChatListPage() {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--electric-chartreuse)",
              }}
            />
            <span style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-muted)" }}>
              1:1 DIRECT CHAT
            </span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--charcoal-deep)", letterSpacing: "-0.02em" }}>
            과외 조율 채팅
          </h1>
        </div>
        <div
          style={{
            background: "var(--bg-ivory)",
            borderRadius: "var(--radius-full)",
            padding: "4px 12px",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "var(--charcoal-deep)",
          }}
        >
          진행 중 2건
        </div>
      </div>

      {/* Notice Banner */}
      <div
        style={{
          background: "var(--bg-ivory)",
          borderRadius: "var(--radius-lg)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <span className="material-symbols-outlined" style={{ color: "var(--primary-olive)", fontSize: "22px" }}>
          lock
        </span>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
          채팅창에서 교육자와 수업 일시, 장소, 커리큘럼을 협의하고 공식 조건 제안서를 수락하면 안전결제가 진행됩니다.
        </p>
      </div>

      {/* Chat Rooms List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {CHAT_ROOMS.map((room) => (
          <Link key={room.id} href={`/chat/${room.id}`} style={{ display: "block" }}>
            <div
              className="cmt-card cmt-card--interactive"
              style={{
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                display: "flex",
                gap: "16px",
                boxShadow: "var(--shadow-sm)",
                position: "relative",
              }}
            >
              <div style={{ position: "relative", width: "52px", height: "52px", flexShrink: 0 }}>
                <img
                  src={room.avatar}
                  alt={room.tutorName}
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
                <span
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "var(--electric-chartreuse)",
                    border: "2px solid var(--bg-surface)",
                  }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
                      {room.tutorName}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      · {room.tutorSchool}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-dim)" }}>
                    {room.timestamp}
                  </span>
                </div>

                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--primary-olive)", marginBottom: "4px" }}>
                  {room.courseTitle}
                </div>

                <p
                  style={{
                    fontSize: "0.84rem",
                    color: "var(--text-muted)",
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {room.lastMessage}
                </p>
              </div>

              {room.unreadCount > 0 && (
                <div
                  style={{
                    alignSelf: "center",
                    minWidth: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "var(--electric-chartreuse)",
                    color: "var(--charcoal-deep)",
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 6px",
                  }}
                >
                  {room.unreadCount}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
