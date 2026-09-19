"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProposalEditPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = typeof params?.id === "string" ? params.id : "sample-1";

  const [duration, setDuration] = useState<number>(90);
  const [price, setPrice] = useState<number>(27000);
  const [curriculumScope, setCurriculumScope] = useState<string>(
    "데이터 불러오기 + 판다스 필터링 + 간단한 시각화 실습 (1:1 코드 리뷰 포함)",
  );
  const [venue, setVenue] = useState<string>("hongik-studyroom");
  const [preferredDate, setPreferredDate] = useState<string>("2025-05-18T19:00");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  function handleSelectDuration(dur: number, basePrice: number) {
    setDuration(dur);
    setPrice(basePrice);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      router.push(`/chat/${chatId}?price=${price}`);
    }, 600);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "80px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={() => router.back()}
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
          aria-label="뒤로 가기"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
            arrow_back
          </span>
        </button>
        <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--charcoal-deep)" }}>
          새로운 제안 작성
        </span>
        <div style={{ width: "36px" }} />
      </div>

      {/* Previous Proposal Collapsible Drawer (Stitch 6._revised_proposal) */}
      <details
        style={{
          background: "var(--bg-ivory)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          border: "1px solid rgba(18,19,22,0.06)",
        }}
      >
        <summary
          style={{
            padding: "16px 20px",
            fontWeight: 700,
            fontSize: "0.88rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "var(--charcoal-deep)",
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--text-dim)",
              }}
            />
            <span>이전 제안 (참고용)</span>
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>기존 합의안 열기 ▼</span>
        </summary>
        <div
          style={{
            padding: "0 20px 16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            fontSize: "0.82rem",
            color: "var(--text-muted)",
          }}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--charcoal-deep)", marginBottom: "4px" }}>
              파이썬 데이터 처리 기초
            </div>
            <div>60분 · 22,000원 · 목 19:00 · 비대면 화상 회의실</div>
          </div>
        </div>
      </details>

      {/* Negotiation Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* 1. Lesson Duration Selection */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
              1. 수업 시간 선택
            </label>
            <span style={{ fontSize: "0.78rem", color: "var(--primary-olive)", fontWeight: 700 }}>
              +30분 연장 권장 ★
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            {[
              { mins: 60, cost: 22000 },
              { mins: 90, cost: 27000 },
              { mins: 120, cost: 34000 },
            ].map((opt) => {
              const isSelected = duration === opt.mins;
              return (
                <button
                  key={opt.mins}
                  type="button"
                  onClick={() => handleSelectDuration(opt.mins, opt.cost)}
                  style={{
                    padding: "14px 8px",
                    borderRadius: "var(--radius-full)",
                    border: "none",
                    background: isSelected ? "var(--charcoal-deep)" : "var(--bg-ivory)",
                    color: isSelected ? "var(--bg-surface)" : "var(--charcoal-deep)",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    boxShadow: isSelected ? "var(--shadow-sm)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {opt.mins}분
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Curriculum Scope */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
            2. 수업 범위 조율
          </label>
          <div
            style={{
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              padding: "16px",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <textarea
              rows={3}
              value={curriculumScope}
              onChange={(e) => setCurriculumScope(e.target.value)}
              placeholder="세부 학습 목표 및 커리큘럼을 입력하세요"
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "0.88rem",
                color: "var(--charcoal-deep)",
                resize: "none",
                lineHeight: 1.6,
              }}
            />
            <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-dim)", paddingTop: "6px" }}>
              맞춤 실습형 피드백 포함
            </div>
          </div>
        </div>

        {/* 3. Proposed Fee */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
            3. 희망 수업료 설정
          </label>
          <div
            style={{
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>수업료 (KRW)</span>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <input
                  type="number"
                  step="1000"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    color: "var(--charcoal-deep)",
                    textAlign: "right",
                    width: "110px",
                    border: "none",
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>원</span>
              </div>
            </div>

            <input
              type="range"
              min={15000}
              max={50000}
              step={1000}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--charcoal-deep)" }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "8px",
                borderTop: "1px solid rgba(18,19,22,0.06)",
                fontSize: "0.78rem",
                color: "var(--text-muted)",
              }}
            >
              <span>학습자 수수료: 0원</span>
              <span>교육자 정산액: {Math.round(price * 0.85).toLocaleString()}원 (15% 공제)</span>
            </div>
          </div>
        </div>

        {/* 4. Preferred Venue */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
            4. 진행 장소
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { id: "hongik-studyroom", label: "홍익대 정문 인근 스터디룸 (대면)" },
              { id: "sinchon-cafe", label: "신촌 조용한 스터디카페 (대면)" },
              { id: "online-meet", label: "온라인 비대면 (Google Meet)" },
            ].map((v) => {
              const isSelected = venue === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVenue(v.id)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "var(--radius-full)",
                    border: "none",
                    background: isSelected ? "var(--charcoal-deep)" : "var(--bg-ivory)",
                    color: isSelected ? "var(--bg-surface)" : "var(--charcoal-deep)",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                  }}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "var(--radius-full)",
            background: isSubmitting ? "var(--electric-chartreuse)" : "var(--charcoal-deep)",
            color: isSubmitting ? "var(--charcoal-deep)" : "var(--bg-surface)",
            border: "none",
            fontWeight: 800,
            fontSize: "1rem",
            cursor: "pointer",
            marginTop: "12px",
            boxShadow: "var(--shadow-md)",
            transition: "all 0.2s",
          }}
        >
          {isSubmitting ? "수정된 제안 전송 중..." : "수정된 제안 전송하기"}
        </button>
      </form>
    </div>
  );
}
