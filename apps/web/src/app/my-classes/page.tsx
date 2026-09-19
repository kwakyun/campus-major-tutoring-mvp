"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyClassesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", paddingBottom: "80px" }}>
      {/* Header */}
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
            LEARNING JOURNEY
          </span>
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--charcoal-deep)", letterSpacing: "-0.02em", marginBottom: "4px" }}>
          내 수업
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: 0 }}>
          신청한 수업과 완료된 전공 과외 목록입니다.
        </p>
      </div>

      {/* Segmented Tab Control (Stitch 8._my_classes) */}
      <div
        style={{
          background: "var(--bg-ivory)",
          padding: "6px",
          borderRadius: "var(--radius-full)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.02)",
        }}
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "upcoming"}
          onClick={() => setActiveTab("upcoming")}
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-full)",
            border: "none",
            background: activeTab === "upcoming" ? "var(--charcoal-deep)" : "transparent",
            color: activeTab === "upcoming" ? "var(--bg-surface)" : "var(--charcoal-deep)",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "18px",
              color: activeTab === "upcoming" ? "var(--electric-chartreuse)" : "inherit",
            }}
          >
            stars
          </span>
          <span>예정된 수업</span>
          <span
            style={{
              fontSize: "0.74rem",
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: activeTab === "upcoming" ? "var(--electric-chartreuse)" : "var(--bg-surface)",
              color: "var(--charcoal-deep)",
            }}
          >
            1
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "completed"}
          onClick={() => setActiveTab("completed")}
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-full)",
            border: "none",
            background: activeTab === "completed" ? "var(--charcoal-deep)" : "transparent",
            color: activeTab === "completed" ? "var(--bg-surface)" : "var(--charcoal-deep)",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "all 0.2s",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            task_alt
          </span>
          <span>완료된 수업</span>
          <span
            style={{
              fontSize: "0.74rem",
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: activeTab === "completed" ? "var(--electric-chartreuse)" : "var(--bg-surface)",
              color: "var(--charcoal-deep)",
            }}
          >
            2
          </span>
        </button>
      </div>

      {/* Tab 1: Upcoming Classes */}
      {activeTab === "upcoming" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--charcoal-deep)", margin: 0 }}>
              다가오는 과외 <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-muted)" }}>시간을 확인해주세요</span>
            </h2>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--primary-olive)" }}>
              실시간 업데이트
            </span>
          </div>

          {/* Hero Spotlight Card (Stitch 8._my_classes) */}
          <div
            style={{
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-xl)",
              padding: "28px",
              boxShadow: "var(--shadow-md)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "120px",
                height: "120px",
                background: "radial-gradient(circle, rgba(210,248,36,0.3) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            {/* Badges */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--electric-chartreuse)",
                  color: "var(--charcoal-deep)",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  boxShadow: "var(--shadow-xs)",
                }}
              >
                D-5
              </span>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--bg-ivory)",
                  color: "var(--charcoal-deep)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--primary-olive)",
                  }}
                />
                예약 확정
              </span>
            </div>

            {/* Tutor & Lesson Details */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                <img
                  src="https://lh3.googleusercontent.com/aida/AEtjO1U3mLRypOOKx4id9M6iuUQhphqR9HXhAOCUG_mgTHO63WufFMNEOdGLW-XVqFNzUPBth48EeT97F1au47qj3CaWzWwvjarWrHgjOd5o4PHF3ri9b4oC4VXL59cMUmJ7dMrP-FUXuy7EvZgCHrGDCkxYy8i7mY5-sfAecHClhoz0ea8eiecf0MzEFdYTQSPmCC0g5XjvTxVbvvh4ZjbjiXNW6IyI-DLvYj1smOy81OfUmcS42oVqgm6hxeI"
                  alt="김민지 튜터"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                  <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
                    김민지 튜터
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>홍익대 컴공 3학년</span>
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--charcoal-deep)", margin: 0 }}>
                  파이썬 데이터 처리 기초
                </h3>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                  판다스와 넘파이로 끝내는 데이터 정제 1:1
                </p>
              </div>
            </div>

            {/* Schedule & Venue Block */}
            <div
              style={{
                background: "var(--bg-ivory)",
                borderRadius: "var(--radius-lg)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary-olive)" }}>
                  calendar_today
                </span>
                <span style={{ fontWeight: 700, color: "var(--charcoal-deep)" }}>
                  2025년 5월 18일 (일) 19:00 ~ 20:30 (90분)
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary-olive)" }}>
                  pin_drop
                </span>
                <span style={{ color: "var(--charcoal-deep)" }}>
                  홍익대 정문 앞 스터디룸 (대면)
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <Link href="/chat/sample-1">
                <button
                  type="button"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--bg-ivory)",
                    color: "var(--charcoal-deep)",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    chat_bubble
                  </span>
                  <span>튜터와 채팅</span>
                </button>
              </Link>

              <Link href="/chat/sample-1/agreement">
                <button
                  type="button"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--charcoal-deep)",
                    color: "var(--bg-surface)",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    confirmation_number
                  </span>
                  <span>수업 티켓 보기</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Completed Classes */}
      {activeTab === "completed" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Completed Class Card 1 */}
          <div
            style={{
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--bg-ivory)",
                    color: "var(--charcoal-deep)",
                  }}
                >
                  수업 완료
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>오늘 진행</span>
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>1:1 코칭</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
                <img
                  src="https://lh3.googleusercontent.com/aida/AEtjO1U_lWlBv6Pzv_b-4MFxvpipMD7Jmj6YRRnVL_enG1k9IzV5ZpOfXFsa55Jlftx3WKO6lmo7W_L0Ea02NWlBT47KaHSLHO89msbKfDToC4ax45Vva0fFD_OYc7dKHfzDXzmJeAJ0yQQFK2NmWYZaZ-6GBmE9O45qyrbcreQztEGd8rhz16xEsrqCZn8__RRce-3NRJGpN5Efn5Rwt9xSfBe56rX1BLHpn3lZc5JFoH4nEA_xFXA8h45PCHd8"
                  alt="박서준 튜터"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--charcoal-deep)", margin: "0 0 2px 0" }}>
                  피그마 실무 UI/UX 입문 1:1
                </h3>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                  박서준 튜터 · 연세대 시각디자인학과
                </p>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <Link href="/reviews/new?classId=sample-2">
                <button
                  type="button"
                  style={{
                    padding: "10px 18px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--electric-chartreuse)",
                    color: "var(--charcoal-deep)",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 8px rgba(210, 248, 36, 0.3)",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    rate_review
                  </span>
                  <span>후기 작성하기</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Completed Class Card 2 */}
          <div
            style={{
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--bg-ivory)",
                    color: "var(--charcoal-deep)",
                  }}
                >
                  수업 완료
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>2025. 04. 20</span>
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--primary-olive)", fontWeight: 700 }}>
                후기 작성 완료 ★ 5.0
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--charcoal-deep)", margin: "0 0 2px 0" }}>
                경영통계 및 R 데이터 분석 과제 뽀개기
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                박서연 튜터 · 연세대 경영학과 3학년
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Link href="/courses/sample-3">
                <button
                  type="button"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--bg-ivory)",
                    color: "var(--charcoal-deep)",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  다시 신청하기
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
