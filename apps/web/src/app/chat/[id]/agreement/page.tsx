"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function AgreementConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = typeof params?.id === "string" ? params.id : "sample-1";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", paddingBottom: "80px", alignItems: "center" }}>
      {/* Celebratory Header Badge & Title (Stitch 7._agreement_confirmation) */}
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginTop: "10px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            borderRadius: "var(--radius-full)",
            background: "var(--soft-lime)",
            color: "var(--charcoal-deep)",
            fontSize: "0.85rem",
            fontWeight: 800,
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <span style={{ fontSize: "1rem" }}>🎉</span>
          <span>우리 수업, 확정!</span>
        </div>

        <h1
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            fontWeight: 800,
            color: "var(--charcoal-deep)",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          수업 일정이 확정되었어요
        </h1>

        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", maxWidth: "340px", lineHeight: 1.6, margin: 0 }}>
          조건 조율이 완료되어 1:1 오프라인 과외가 안전하게 매칭되었습니다.
        </p>
      </div>

      {/* Complete Summary Ticket Card (Stitch 7._agreement_confirmation) */}
      <div
        className="cmt-ticket-card"
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "24px",
          boxShadow: "0 12px 32px rgba(18, 19, 22, 0.08)",
        }}
      >
        {/* Top Notch & Verified Seal */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
              background: "var(--bg-ivory)",
              fontSize: "0.76rem",
              fontWeight: 700,
              color: "var(--charcoal-deep)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "var(--primary-olive)" }}>
              verified
            </span>
            협의 완료 티켓
          </span>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-dim)" }}>
            TKT-8842-KR
          </span>
        </div>

        {/* Lesson Info */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
          <div>
            <span style={{ fontSize: "0.76rem", color: "var(--primary-olive)", fontWeight: 800 }}>
              1:1 오프라인 코칭
            </span>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--charcoal-deep)", marginTop: "2px" }}>
              파이썬 데이터 처리 기초
            </h2>
          </div>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
            <img
              src="https://lh3.googleusercontent.com/aida/AEtjO1U3mLRypOOKx4id9M6iuUQhphqR9HXhAOCUG_mgTHO63WufFMNEOdGLW-XVqFNzUPBth48EeT97F1au47qj3CaWzWwvjarWrHgjOd5o4PHF3ri9b4oC4VXL59cMUmJ7dMrP-FUXuy7EvZgCHrGDCkxYy8i7mY5-sfAecHClhoz0ea8eiecf0MzEFdYTQSPmCC0g5XjvTxVbvvh4ZjbjiXNW6IyI-DLvYj1smOy81OfUmcS42oVqgm6hxeI"
              alt="김민지"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>

        {/* Instructor Profile Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 12px",
            borderRadius: "var(--radius-full)",
            background: "var(--bg-ivory)",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "var(--charcoal-deep)",
              color: "var(--bg-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 800,
            }}
          >
            김
          </div>
          <div style={{ fontSize: "0.84rem" }}>
            <strong style={{ color: "var(--charcoal-deep)" }}>김민지 튜터</strong>
            <span style={{ color: "var(--text-muted)", marginLeft: "4px" }}>· 홍익대학교 컴퓨터공학과</span>
          </div>
        </div>

        {/* Perforated Divider Graphic */}
        <div className="cmt-ticket-notch-container">
          <div className="cmt-ticket-notch-left" />
          <div className="cmt-ticket-perforation" />
          <div className="cmt-ticket-notch-right" />
        </div>

        {/* Details Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>calendar_today</span>
              수업 일시
            </span>
            <span style={{ fontWeight: 700, color: "var(--charcoal-deep)" }}>
              2025년 5월 18일 (일) 19:00 (90분)
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>pin_drop</span>
              진행 장소
            </span>
            <span style={{ fontWeight: 700, color: "var(--charcoal-deep)" }}>
              홍익대 정문 인근 스터디룸 (대면)
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>payments</span>
              최종 결제 금액
            </span>
            <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--charcoal-deep)" }}>
              27,000원
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary-olive)" }}>
                security
              </span>
              결제 보호
            </span>
            <span style={{ fontWeight: 700, color: "var(--primary-olive)" }}>
              안전결제 완료 (에스크로 보호 중)
            </span>
          </div>
        </div>

        {/* Preparation Tips */}
        <div
          style={{
            background: "var(--bg-ivory)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}
        >
          💡 <strong>준비물:</strong> 개인 노트북 지참 권장, 주피터 노트북(Jupyter) 사전 설치 시 더 빠른 실습이 가능합니다.
        </div>
      </div>

      {/* Action Buttons Group */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "480px", width: "100%" }}>
        <Link href="/my-classes" style={{ display: "block" }}>
          <button
            type="button"
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "var(--radius-full)",
              background: "var(--charcoal-deep)",
              color: "var(--bg-surface)",
              fontWeight: 800,
              fontSize: "0.95rem",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <span>내 수업 목록 확인하기</span>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              arrow_forward
            </span>
          </button>
        </Link>

        <button
          type="button"
          onClick={() => alert("스마트폰 캘린더(.ics)에 일정이 등록되었습니다.")}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "var(--radius-full)",
            background: "var(--bg-ivory)",
            color: "var(--charcoal-deep)",
            fontWeight: 700,
            fontSize: "0.9rem",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            event
          </span>
          <span>캘린더에 일정 추가하기</span>
        </button>

        <Link href={`/chat/${chatId}`} style={{ display: "block", textAlign: "center" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textDecoration: "underline", cursor: "pointer" }}>
            채팅방으로 돌아가기
          </span>
        </Link>
      </div>
    </div>
  );
}
