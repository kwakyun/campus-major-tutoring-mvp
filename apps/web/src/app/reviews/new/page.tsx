"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const QUICK_TAGS = [
  "설명이 친절해요",
  "시간을 잘 지켜요",
  "실습 위주로 유익해요",
  "질문에 꼼꼼히 답해줘요",
  "자료 준비가 철저해요",
  "과제 해결에 직접적 도움",
];

function ReviewNewPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams?.get("classId") || "sample-2";

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "설명이 친절해요",
    "실습 위주로 유익해요",
  ]);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsDone(true);
      setTimeout(() => {
        router.push("/my-classes");
      }, 1200);
    }, 600);
  }

  const currentDisplayScore = hoverRating ?? rating;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "80px", maxWidth: "600px", margin: "0 auto" }}>
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
          수업 후기 작성
        </span>
        <div style={{ width: "36px" }} />
      </div>

      {/* Friendly Header Callout (Stitch 9._review) */}
      <div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 12px",
            borderRadius: "var(--radius-full)",
            background: "var(--soft-lime)",
            color: "var(--charcoal-deep)",
            fontSize: "0.78rem",
            fontWeight: 800,
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--charcoal-deep)",
            }}
          />
          수업 완료 확인
        </span>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "var(--charcoal-deep)",
            letterSpacing: "-0.02em",
            marginBottom: "4px",
          }}
        >
          오늘 한 수 배웠어요! 🙌
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", margin: 0 }}>
          수업 내용을 복습하며 소중한 피드백을 들려주세요.
        </p>
      </div>

      {/* Target Class Card */}
      <div
        style={{
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          padding: "16px 20px",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div style={{ width: "52px", height: "52px", borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
          <img
            src="https://lh3.googleusercontent.com/aida/AEtjO1U_lWlBv6Pzv_b-4MFxvpipMD7Jmj6YRRnVL_enG1k9IzV5ZpOfXFsa55Jlftx3WKO6lmo7W_L0Ea02NWlBT47KaHSLHO89msbKfDToC4ax45Vva0fFD_OYc7dKHfzDXzmJeAJ0yQQFK2NmWYZaZ-6GBmE9O45qyrbcreQztEGd8rhz16xEsrqCZn8__RRce-3NRJGpN5Efn5Rwt9xSfBe56rX1BLHpn3lZc5JFoH4nEA_xFXA8h45PCHd8"
            alt="박서준 튜터"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
        <div>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: "var(--bg-ivory)",
              color: "var(--charcoal-deep)",
            }}
          >
            1:1 코칭 · 오늘 진행
          </span>
          <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--charcoal-deep)", margin: "4px 0 2px 0" }}>
            피그마 실무 UI/UX 입문 1:1
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
            박서준 튜터 · 연세대 시각디자인학과
          </p>
        </div>
      </div>

      {/* 5-Star Rating Section (Stitch 9._review) */}
      <div
        style={{
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-xl)",
          padding: "28px 20px",
          textAlign: "center",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--charcoal-deep)", margin: 0 }}>
          수업 만족도를 평가해주세요
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
          별점을 탭하여 만족도를 표시해 주세요
        </p>

        {/* Interactive 5 Star Row */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "8px 0" }}>
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= currentDisplayScore;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: isFilled ? "var(--electric-chartreuse)" : "rgba(18, 19, 22, 0.15)",
                  padding: "4px",
                  transition: "transform 0.15s",
                }}
                aria-label={`${star}점`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "36px",
                    fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  star
                </span>
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            background: "var(--bg-ivory)",
            padding: "4px 14px",
            borderRadius: "var(--radius-full)",
          }}
        >
          <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
            {currentDisplayScore.toFixed(1)}
          </span>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>/ 5.0 만점</span>
        </div>
      </div>

      {/* Quick Tags Section (Stitch 9._review) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
            어떤 점이 가장 좋았나요?
          </label>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>다중 선택 가능</span>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {QUICK_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  background: isSelected ? "var(--soft-lime)" : "var(--bg-surface)",
                  color: isSelected ? "var(--charcoal-deep)" : "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  boxShadow: "var(--shadow-xs)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s",
                }}
              >
                {isSelected && (
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    check
                  </span>
                )}
                <span>{tag}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Feedback Textarea */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
          상세 후기 작성
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
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="튜터님의 설명 방식, 수업 분위기, 과제 해결 경험을 남겨주시면 다음 수강생들에게 큰 도움이 됩니다."
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "0.88rem",
              lineHeight: 1.6,
              color: "var(--charcoal-deep)",
              resize: "none",
            }}
          />
        </div>
      </div>

      {/* Anonymous Toggle */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "0.85rem",
          color: "var(--charcoal-deep)",
          fontWeight: 600,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          style={{ width: "18px", height: "18px", accentColor: "var(--charcoal-deep)", cursor: "pointer" }}
        />
        <span>익명으로 등록하기 (내 학과/이름 숨김)</span>
      </label>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting || isDone}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: "var(--radius-full)",
          background: isDone ? "var(--electric-chartreuse)" : "var(--charcoal-deep)",
          color: isDone ? "var(--charcoal-deep)" : "var(--bg-surface)",
          border: "none",
          fontWeight: 800,
          fontSize: "1rem",
          cursor: "pointer",
          boxShadow: "var(--shadow-md)",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {isDone ? (
          <>
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>check_circle</span>
            <span>소중한 후기가 등록되었습니다!</span>
          </>
        ) : isSubmitting ? (
          "등록 중..."
        ) : (
          "후기 등록하기"
        )}
      </button>
    </div>
  );
}

export default function ReviewNewPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>후기 작성 화면을 불러오는 중...</div>}>
      <ReviewNewPageContent />
    </Suspense>
  );
}
