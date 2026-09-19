"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  getCourse,
  getTutorPublicProfile,
  getTutorPublicAvailability,
  listSubjects,
  listLifeZones,
  type CourseRecord,
  type TutorPublicProfile,
  type TimeWindow,
  type SubjectRecord,
  type LifeZoneRecord,
  ApiError,
} from "../../../lib/api-client";
import { eventTracker } from "../../../lib/event-tracker";
import { Button, StatusBadge } from "@campus-major-tutoring-mvp/ui";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// Fallback mock course data when viewing sample courses or backend is empty
const MOCK_COURSES: Record<string, Partial<CourseRecord>> = {
  "course-seed-0-python": {
    id: "course-seed-0-python",
    tutorId: "seed-tutor-0003",
    subjectId: "00000000-0000-0000-0000-000000000204",
    lifeZoneId: "00000000-0000-0000-0000-000000000101",
    learningGoal: "파이썬으로 데이터 다루기 — 엑셀보다 빠른 데이터 조작 실습",
    askingPrice: 35000,
    totalMinutes: 60,
    prerequisiteLevel: "introductory",
    sampleDescription: "예제 데이터 파일을 직접 다루며 판다스(Pandas) 기초부터 1:1 코드 리뷰까지 비전공자 눈높이로 60분 만에 마스터합니다.",
    expectedOutcome: "Jupyter Notebook 설치 및 실행, CSV 파일 읽기/쓰기, Pandas 데이터프레임 필터링 및 요약 통계량 산출 능숙",
  },
  "sample-1": {
    id: "sample-1",
    tutorId: "tutor-1",
    subjectId: "sub-python",
    lifeZoneId: "zone-sinchon",
    learningGoal: "파이썬으로 데이터 다루기 — 엑셀보다 빠른 데이터 조작 실습",
    askingPrice: 25000,
    totalMinutes: 60,
    prerequisiteLevel: "introductory",
    sampleDescription: "예제 파일을 직접 다루면서 데이터를 불러오고 조건에 맞는 데이터를 필터링합니다. 비전공자 눈높이에 맞춰 에러 해결부터 실무 판다스(Pandas) 기초까지 1시간 안에 압축 정복합니다.",
    expectedOutcome: "Jupyter Notebook 설치 및 실행, CSV 파일 읽기/쓰기, Pandas 데이터프레임 필터링 및 요약 통계량 산출 능숙",
  },
  "sample-2": {
    id: "sample-2",
    tutorId: "tutor-2",
    subjectId: "sub-figma",
    lifeZoneId: "zone-sinchon",
    learningGoal: "비전공자를 위한 피그마 컴포넌트 & 오토레이아웃 기초 1:1",
    askingPrice: 28000,
    totalMinutes: 60,
    prerequisiteLevel: "introductory",
    sampleDescription: "피그마의 꽃인 Auto-layout과 Variants를 실제 모바일 UI를 조립해보면서 마스터합니다.",
    expectedOutcome: "피그마 기본 단축키 완벽 습득 및 재사용 가능한 버튼/인풋 컴포넌트 세트 직접 제작",
  },
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = typeof params?.id === "string" ? params.id : "sample-1";

  const [course, setCourse] = useState<CourseRecord | null>(null);
  const [tutorProfile, setTutorProfile] = useState<TutorPublicProfile | null>(null);
  const [availability, setAvailability] = useState<TimeWindow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [lifeZones, setLifeZones] = useState<LifeZoneRecord[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Stitch Price Suggestion Modal
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState(23000);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  useEffect(() => {
    if (!courseId) return;

    async function fetchAll() {
      setIsLoading(true);
      setErrorText(null);
      try {
        const [c, subs, zones] = await Promise.all([
          getCourse(courseId).catch(() => {
            const fallback = MOCK_COURSES[courseId] || MOCK_COURSES["sample-1"];
            return fallback as CourseRecord;
          }),
          listSubjects().catch(() => [] as SubjectRecord[]),
          listLifeZones().catch(() => [] as LifeZoneRecord[]),
        ]);

        setCourse(c);
        setSubjects(subs);
        setLifeZones(zones);
        setSuggestedPrice(Math.round((c.askingPrice * 0.9) / 1000) * 1000);

        eventTracker.track("course_detail_view", {
          courseId: c.id,
          tutorId: c.tutorId,
        });

        // Load Tutor Public Profile & Availability
        const [profile, avail] = await Promise.all([
          getTutorPublicProfile(c.tutorId).catch(() => null),
          getTutorPublicAvailability(c.tutorId).catch(() => ({ tutorId: c.tutorId, windows: [] })),
        ]);

        setTutorProfile(profile);
        setAvailability(avail.windows ?? []);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setErrorText("수업을 찾을 수 없거나 현재 비공개 상태입니다.");
        } else {
          setErrorText(err instanceof Error ? err.message : "수업 정보를 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    void fetchAll();
  }, [courseId]);

  function handleStartInquiry() {
    if (!course) return;
    eventTracker.track("inquiry_started", {
      courseId: course.id,
      tutorId: course.tutorId,
    });
    router.push(`/chat/${course.id}`);
  }

  function handleSubmitProposal() {
    setIsSubmittingProposal(true);
    setTimeout(() => {
      setIsSubmittingProposal(false);
      setIsPriceModalOpen(false);
      router.push(`/chat/${course?.id || courseId}?price=${suggestedPrice}`);
    }, 600);
  }

  if (isLoading) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>수업 상세 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (errorText || !course) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>⚠️</div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "8px", color: "var(--charcoal-deep)" }}>
          수업 정보를 불러올 수 없습니다
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>{errorText}</p>
        <Link href="/courses">
          <Button variant="primary">수업 목록으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  const tutorName = tutorProfile?.displayName || "김민지";
  const tutorSchool = tutorProfile?.school || "홍익대 컴퓨터공학과 3학년";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", paddingBottom: "100px" }}>
      {/* Top Header Bar */}
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
          수업 상세
        </span>
        <button
          type="button"
          onClick={() => alert("수업 링크가 복사되었습니다.")}
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

      {/* Category & Modality Tags */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <span
          style={{
            fontSize: "0.78rem",
            fontWeight: 800,
            padding: "4px 12px",
            borderRadius: "var(--radius-full)",
            background: "var(--electric-chartreuse)",
            color: "var(--charcoal-deep)",
          }}
        >
          컴퓨터공학
        </span>
        <span
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            padding: "4px 12px",
            borderRadius: "var(--radius-full)",
            background: "var(--bg-ivory)",
            color: "var(--charcoal-deep)",
          }}
        >
          1:1 대면 실습
        </span>
        <span
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            padding: "4px 12px",
            borderRadius: "var(--radius-full)",
            background: "var(--charcoal-deep)",
            color: "var(--bg-surface)",
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
              background: "var(--electric-chartreuse)",
            }}
          />
          매칭 즉시 조율
        </span>
      </div>

      {/* Course Title & Learning Goal */}
      <div>
        <h1
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
            fontWeight: 800,
            color: "var(--charcoal-deep)",
            letterSpacing: "-0.02em",
            lineHeight: 1.3,
            marginBottom: "10px",
          }}
        >
          {course.learningGoal}
        </h1>
        <p style={{ fontSize: "1rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
          {course.sampleDescription || "어려운 이론 대신, 내 손으로 직접 엑셀보다 빠른 데이터 조작을 경험해보세요."}
        </p>
      </div>

      {/* Tutor Profile Summary Card (Stitch 3._class_detail) */}
      <Link href={`/tutors/${course.tutorId || "tutor-1"}`} style={{ display: "block" }}>
        <div
          className="cmt-card cmt-card--interactive"
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
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ position: "relative", width: "56px", height: "56px", flexShrink: 0 }}>
              <img
                src="https://lh3.googleusercontent.com/aida/AEtjO1U3mLRypOOKx4id9M6iuUQhphqR9HXhAOCUG_mgTHO63WufFMNEOdGLW-XVqFNzUPBth48EeT97F1au47qj3CaWzWwvjarWrHgjOd5o4PHF3ri9b4oC4VXL59cMUmJ7dMrP-FUXuy7EvZgCHrGDCkxYy8i7mY5-sfAecHClhoz0ea8eiecf0MzEFdYTQSPmCC0g5XjvTxVbvvh4ZjbjiXNW6IyI-DLvYj1smOy81OfUmcS42oVqgm6hxeI"
                alt={tutorName}
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "-2px",
                  right: "-2px",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "var(--charcoal-deep)",
                  color: "var(--electric-chartreuse)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                  verified
                </span>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
                  {tutorName}
                </span>
                <span
                  style={{
                    fontSize: "0.74rem",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--bg-ivory)",
                    color: "var(--charcoal-deep)",
                    fontWeight: 600,
                  }}
                >
                  {tutorSchool}
                </span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                학생증 인증 완료 · 전공 평점 4.2 · 프로필 보기 &gt;
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              background: "var(--bg-ivory)",
              borderRadius: "var(--radius-md)",
              padding: "10px",
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary-olive)" }}>
                star
              </span>
              <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--charcoal-deep)" }}>4.9</span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>(후기 8개)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--charcoal-deep)" }}>
                verified_user
              </span>
              <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--charcoal-deep)" }}>12회 진행</span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>누적</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Curriculum Section (Stitch 3._class_detail) */}
      <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-muted)" }}>
            CURRICULUM
          </span>
          <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--primary-olive)" }}>
            1시간 속성 완성
          </span>
        </div>

        <div
          style={{
            background: "var(--soft-lime)",
            color: "var(--charcoal-deep)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "var(--charcoal-deep)",
                color: "var(--electric-chartreuse)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                terminal
              </span>
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>이런 걸 배워요</h3>
          </div>

          <p style={{ fontSize: "0.92rem", lineHeight: 1.65, margin: 0 }}>
            {course.sampleDescription ||
              "예제 파일을 직접 다루면서 데이터를 불러오고, 조건에 맞는 데이터를 필터링할 수 있어요. 비전공자 눈높이에 맞춰 에러 해결부터 실무 판다스(Pandas) 기초까지 1시간 안에 압축 정복합니다."}
          </p>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", paddingTop: "4px" }}>
            <span
              style={{
                background: "var(--bg-surface)",
                color: "var(--charcoal-deep)",
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.76rem",
                fontWeight: 700,
              }}
            >
              #Jupyter Notebook
            </span>
            <span
              style={{
                background: "var(--bg-surface)",
                color: "var(--charcoal-deep)",
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.76rem",
                fontWeight: 700,
              }}
            >
              #Pandas 필터링
            </span>
            <span
              style={{
                background: "var(--bg-surface)",
                color: "var(--charcoal-deep)",
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.76rem",
                fontWeight: 700,
              }}
            >
              #CSV 입출력
            </span>
          </div>
        </div>
      </section>

      {/* Target Audience Recommendation */}
      <section
        style={{
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h3
          style={{
            fontSize: "1.05rem",
            fontWeight: 800,
            color: "var(--charcoal-deep)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: 0,
          }}
        >
          <span>이런 분께 추천해요</span>
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--electric-chartreuse)",
            }}
          />
        </h3>

        <ul
          style={{
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            fontSize: "0.88rem",
            color: "var(--text-muted)",
          }}
        >
          <li style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary-olive)" }}>
              check_circle
            </span>
            <span>데이터 분석 과제는 있는데 코딩이 처음이라 막막한 대학생</span>
          </li>
          <li style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary-olive)" }}>
              check_circle
            </span>
            <span>엑셀 노가다 대신 간단한 파이썬 스크립트로 작업 속도를 올리고 싶은 분</span>
          </li>
          <li style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary-olive)" }}>
              check_circle
            </span>
            <span>전공 교수님 질문 전, 같은 과목 들었던 선배와 1:1로 빠르게 점검하고 싶은 분</span>
          </li>
        </ul>
      </section>

      {/* Fixed Bottom Negotiation Bar (Stitch 3._class_detail) */}
      <div
        style={{
          position: "fixed",
          bottom: "72px",
          left: 0,
          right: 0,
          background: "rgba(251, 249, 244, 0.95)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(18, 19, 22, 0.08)",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "center",
          zIndex: 45,
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div>
            <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>수업료 (60분 기준)</span>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
              {course.askingPrice.toLocaleString()}원
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setIsPriceModalOpen(true)}
              style={{
                padding: "12px 16px",
                borderRadius: "var(--radius-full)",
                background: "var(--bg-ivory)",
                color: "var(--charcoal-deep)",
                border: "none",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              가격 제안하기
            </button>
            <button
              type="button"
              onClick={handleStartInquiry}
              style={{
                padding: "12px 20px",
                borderRadius: "var(--radius-full)",
                background: "var(--charcoal-deep)",
                color: "var(--bg-surface)",
                border: "none",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <span>1:1 문의 / 매칭</span>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                chat_bubble
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Stitch Price Suggestion Modal (3._class_detail modal) */}
      {isPriceModalOpen && (
        <div className="cmt-modal-overlay">
          <div className="cmt-modal-content" style={{ maxWidth: "420px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--electric-chartreuse)",
                    color: "var(--charcoal-deep)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                    tune
                  </span>
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "var(--charcoal-deep)" }}>
                  희망 수업료 제안
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPriceModalOpen(false)}
                style={{
                  border: "none",
                  background: "var(--bg-ivory)",
                  color: "var(--charcoal-deep)",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  close
                </span>
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "16px" }}>
              교육자의 기본 기준 요금은 {course.askingPrice.toLocaleString()}원입니다.
              조율 가능한 가격을 입력해 전달해보세요.
            </p>

            <div
              style={{
                background: "var(--bg-ivory)",
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>희망 제안 금액</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="number"
                  step="1000"
                  value={suggestedPrice}
                  onChange={(e) => setSuggestedPrice(Number(e.target.value))}
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 800,
                    color: "var(--charcoal-deep)",
                    textAlign: "center",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    width: "140px",
                  }}
                />
                <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--charcoal-deep)" }}>원</span>
              </div>

              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "10px",
                  borderTop: "1px solid rgba(18,19,22,0.06)",
                  fontSize: "0.8rem",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>예상 협의율</span>
                <span style={{ color: "var(--primary-olive)", fontWeight: 700 }}>
                  수락 확률 높음 (92%)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmitProposal}
              disabled={isSubmittingProposal}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "var(--radius-full)",
                background: isSubmittingProposal ? "var(--electric-chartreuse)" : "var(--charcoal-deep)",
                color: isSubmittingProposal ? "var(--charcoal-deep)" : "var(--bg-surface)",
                fontWeight: 700,
                fontSize: "0.95rem",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {isSubmittingProposal ? "제안 전달 완료! 채팅방으로 이동 중..." : "제안 전송하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
