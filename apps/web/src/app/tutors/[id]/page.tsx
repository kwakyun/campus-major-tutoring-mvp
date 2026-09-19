"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  getTutorPublicProfile,
  type TutorPublicProfile,
} from "../../../lib/api-client";
import { Button, StatusBadge } from "@campus-major-tutoring-mvp/ui";

interface TutorCoursePreview {
  id: string;
  title: string;
  category: string;
  price: number;
  duration: number;
  description: string;
}

const MOCK_TUTOR_COURSES: TutorCoursePreview[] = [
  {
    id: "sample-1",
    title: "파이썬으로 데이터 다루기",
    category: "개발 · 코딩",
    price: 25000,
    duration: 60,
    description: "어려운 이론 대신, 판다스와 넘파이로 직접 실습하는 1:1 데이터 입문",
  },
  {
    id: "sample-dev-2",
    title: "비전공자 전공과제 C언어/자료구조 1:1 과외",
    category: "컴퓨터공학",
    price: 27000,
    duration: 60,
    description: "포인터부터 연결 리스트까지 백지상태에서 이해시키는 1시간 압축 완성",
  },
];

const MOCK_REVIEWS = [
  {
    id: "rev-1",
    author: "경영학과 2학년",
    rating: 5.0,
    date: "2025. 05. 10",
    tags: ["설명이 친절해요", "실습 위주로 유익해요"],
    comment: "파이썬 과제 때문에 정말 막막했는데, 스터디룸에서 1:1로 코드 한 줄씩 봐주셔서 1시간 만에 과제 완성했습니다! 완전 추천해요.",
  },
  {
    id: "rev-2",
    author: "미디어커뮤니케이션 3학년",
    rating: 4.8,
    date: "2025. 04. 28",
    tags: ["시간을 잘 지켜요", "질문에 꼼꼼히 답해줘요"],
    comment: "데이터 크롤링 기초 배웠는데 비전공자 눈높이에 맞춰 예시를 들어주셔서 이해가 쏙쏙 됐어요.",
  },
];

export default function EducatorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const tutorId = typeof params?.id === "string" ? params.id : "tutor-1";

  const [profile, setProfile] = useState<TutorPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const p = await getTutorPublicProfile(tutorId).catch(() => null);
        setProfile(p);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [tutorId]);

  const displayName = profile?.displayName || "김민지";
  const school = profile?.school || "홍익대학교";
  const major = profile?.major || "컴퓨터공학과 3학년";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", paddingBottom: "80px" }}>
      {/* Top Breadcrumb & Actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            border: "none",
            background: "var(--bg-ivory)",
            color: "var(--charcoal-deep)",
            width: "40px",
            height: "40px",
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
          교육자 프로필
        </span>
        <button
          type="button"
          onClick={() => alert("프로필 링크가 복사되었습니다.")}
          style={{
            border: "none",
            background: "var(--bg-ivory)",
            color: "var(--charcoal-deep)",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          aria-label="공유하기"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
            share
          </span>
        </button>
      </div>

      {/* Header Profile Section */}
      <section
        style={{
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-xl)",
          padding: "36px 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: "var(--shadow-sm)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-40px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            background: "rgba(210, 248, 36, 0.25)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", marginBottom: "16px" }}>
          <div
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "50%",
              overflow: "hidden",
              background: "var(--bg-ivory)",
              boxShadow: "var(--shadow-md)",
              border: "3px solid var(--bg-surface)",
            }}
          >
            <img
              src="https://lh3.googleusercontent.com/aida/AEtjO1U3mLRypOOKx4id9M6iuUQhphqR9HXhAOCUG_mgTHO63WufFMNEOdGLW-XVqFNzUPBth48EeT97F1au47qj3CaWzWwvjarWrHgjOd5o4PHF3ri9b4oC4VXL59cMUmJ7dMrP-FUXuy7EvZgCHrGDCkxYy8i7mY5-sfAecHClhoz0ea8eiecf0MzEFdYTQSPmCC0g5XjvTxVbvvh4ZjbjiXNW6IyI-DLvYj1smOy81OfUmcS42oVqgm6hxeI"
              alt={displayName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "0",
              right: "0",
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "var(--electric-chartreuse)",
              color: "var(--charcoal-deep)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              verified
            </span>
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 14px",
            borderRadius: "var(--radius-full)",
            background: "var(--bg-ivory)",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "var(--charcoal-deep)",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--electric-chartreuse)",
            }}
          />
          {school} · 22학번 재학생
        </div>

        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "var(--charcoal-deep)",
            letterSpacing: "-0.02em",
            marginBottom: "4px",
          }}
        >
          {displayName}
        </h1>

        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "20px" }}>
          {major} · 튜터 6개월차
        </p>

        {/* Warm Speech Bubble Intro */}
        <div
          style={{
            background: "var(--bg-ivory)",
            borderRadius: "var(--radius-lg)",
            padding: "16px 20px",
            textAlign: "left",
            display: "flex",
            gap: "12px",
            maxWidth: "600px",
            width: "100%",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ color: "var(--primary-olive)", fontSize: "24px", flexShrink: 0 }}
          >
            format_quote
          </span>
          <p style={{ fontSize: "0.88rem", lineHeight: 1.6, color: "var(--charcoal-deep)", margin: 0 }}>
            “입문자가 직접 따라하면서 이해할 수 있도록 설명해요. 비전공자의 막막함을 누구보다 잘 알기에 코드 한 줄 한 줄 원리를 함께 짚어드립니다.”
          </p>
        </div>
      </section>

      {/* Trust & Experience Bento Grid */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        <div
          style={{
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            padding: "20px 16px",
            textAlign: "center",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "4px" }}>
            수업 완료
          </span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
            12<span style={{ fontSize: "0.9rem", fontWeight: 600 }}>회</span>
          </div>
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--primary-olive)",
              marginTop: "4px",
            }}
          >
            100% 진행완료
          </span>
        </div>

        <div
          style={{
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            padding: "20px 16px",
            textAlign: "center",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "4px" }}>
            누적 시간
          </span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
            18<span style={{ fontSize: "0.9rem", fontWeight: 600 }}>시간</span>
          </div>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
            정시 시작률 100%
          </span>
        </div>

        <div
          style={{
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            padding: "20px 16px",
            textAlign: "center",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "4px" }}>
            후기 8개
          </span>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--charcoal-deep)",
              display: "flex",
              alignItems: "center",
              gap: "2px",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary-olive)" }}>
              star
            </span>
            4.9
          </div>
          <span style={{ fontSize: "0.72rem", color: "var(--charcoal-deep)", fontWeight: 600, marginTop: "4px" }}>
            5.0 만점
          </span>
        </div>
      </section>

      {/* Verified Identity Banner */}
      <section
        style={{
          background: "var(--bg-ivory)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "var(--electric-chartreuse)",
            color: "var(--charcoal-deep)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "26px" }}>
            verified_user
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "var(--charcoal-deep)",
              marginBottom: "2px",
            }}
          >
            캠퍼스 학생증 100% 인증 완료
          </h4>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
            {school} {major} 재학 정보 관리자 승인 대조 완료
          </p>
        </div>
      </section>

      {/* Active Courses List */}
      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
            개설된 수업 ({MOCK_TUTOR_COURSES.length})
          </h2>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>1:1 단일 차시 협의</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {MOCK_TUTOR_COURSES.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`} style={{ display: "block" }}>
              <div
                className="cmt-card cmt-card--interactive"
                style={{
                  background: "var(--bg-surface)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "var(--radius-full)",
                        background: "var(--soft-lime)",
                        color: "var(--charcoal-deep)",
                      }}
                    >
                      {course.category}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {course.duration}분 수업
                    </span>
                  </div>
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 800,
                      color: "var(--charcoal-deep)",
                      marginBottom: "4px",
                    }}
                  >
                    {course.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-muted)",
                      margin: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {course.description}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
                    {course.price.toLocaleString()}원
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/시간</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Student Reviews Section */}
      <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
            수강생 후기 ({MOCK_REVIEWS.length})
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", fontWeight: 700 }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--electric-chartreuse)" }}>
              star
            </span>
            4.9 / 5.0
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {MOCK_REVIEWS.map((rev) => (
            <div
              key={rev.id}
              style={{
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--charcoal-deep)" }}>
                    {rev.author}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "2px", color: "var(--primary-olive)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>star</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>{rev.rating.toFixed(1)}</span>
                  </div>
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{rev.date}</span>
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                {rev.tags.map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "0.72rem",
                      background: "var(--bg-ivory)",
                      color: "var(--charcoal-deep)",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-full)",
                      fontWeight: 600,
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>

              <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "var(--charcoal-deep)", margin: 0 }}>
                {rev.comment}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Fixed Bottom Action Bar */}
      <div
        style={{
          position: "fixed",
          bottom: "72px",
          left: 0,
          right: 0,
          padding: "12px 20px",
          background: "rgba(251, 249, 244, 0.9)",
          backdropFilter: "blur(12px)",
          display: "flex",
          justifyContent: "center",
          zIndex: 40,
        }}
      >
        <div style={{ maxWidth: "600px", width: "100%" }}>
          <Link href={`/chat/sample-1`}>
            <button
              type="button"
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "var(--radius-full)",
                background: "var(--charcoal-deep)",
                color: "var(--bg-surface)",
                fontSize: "1rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 8px 24px rgba(18, 19, 22, 0.15)",
                transition: "all 0.2s",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                chat_bubble
              </span>
              <span>수업 신청 및 1:1 조율 시작하기</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
