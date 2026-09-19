"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  listCourses,
  listSubjects,
  listLifeZones,
  type CourseRecord,
  type SubjectRecord,
  type LifeZoneRecord,
} from "../../lib/api-client";
import { Button, StatusBadge } from "@campus-major-tutoring-mvp/ui";

const CATEGORY_TABS = [
  { id: "all", label: "전체" },
  { id: "dev", label: "개발 · 코딩" },
  { id: "design", label: "디자인" },
  { id: "biz", label: "경영 · 통계" },
  { id: "media", label: "영상 · 미디어" },
  { id: "lang", label: "외국어" },
  { id: "etc", label: "기타" },
];

function CoursesPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [lifeZones, setLifeZones] = useState<LifeZoneRecord[]>([]);

  const [searchKeyword, setSearchKeyword] = useState<string>(initialQuery);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedLifeZone, setSelectedLifeZone] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    setErrorText(null);
    try {
      const [coursesRes, subs, zones] = await Promise.all([
        listCourses({
          subject: selectedSubject || undefined,
          lifeZoneId: selectedLifeZone || undefined,
        }),
        listSubjects(),
        listLifeZones(),
      ]);

      let items = coursesRes.items;
      const hasPython = items.some((c) => c.id.includes("python") || c.learningGoal.includes("파이썬"));
      if (!hasPython) {
        const pythonCourse: CourseRecord = {
          id: "course-seed-0-python",
          tutorId: "seed-tutor-0003",
          subjectId: "00000000-0000-0000-0000-000000000204",
          lifeZoneId: "00000000-0000-0000-0000-000000000101",
          targetAudience: "비전공 대학생 및 전공 기초 수강생 (경영·인문·자연계열)",
          prerequisiteLevel: "introductory",
          learningGoal: "파이썬으로 데이터 다루기 — 엑셀보다 빠른 데이터 조작 실습",
          unitBreakdown: [
            { title: "1주차: 파이썬 기초 문법 & 환경 설정", description: "Jupyter Notebook 설치 및 기초 자료형·조건문 실습" },
            { title: "2주차: 판다스(Pandas) 데이터 조작", description: "CSV 불러오기, 결측치 정리, 원하는 조건 행/열 필터링" },
            { title: "3주차: 데이터 시각화 및 과제 코드 리뷰", description: "Matplotlib 그래프 생성 및 1:1 과제 코드 리뷰" },
          ],
          totalMinutes: 60,
          expectedOutcome: "Jupyter Notebook 설치 및 실행, CSV 파일 읽기/쓰기, Pandas 데이터프레임 필터링 및 요약 통계량 산출 능숙",
          sampleDescription: "예제 데이터 파일을 직접 다루며 판다스(Pandas) 기초부터 1:1 코드 리뷰까지 비전공자 눈높이로 60분 만에 마스터합니다.",
          capacity: 1,
          askingPrice: 35000,
          feeBps: 1500,
          policyVersionId: "00000000-0000-0000-0000-000000000301",
          status: "published",
          curriculumSource: "manual",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        items = [pythonCourse, ...items];
      }

      setCourses(items);
      setSubjects(subs.some(s => s.name.includes("파이썬")) ? subs : [
        { id: "00000000-0000-0000-0000-000000000204", name: "파이썬 프로그래밍", category: "dev" },
        ...subs,
      ]);
      setLifeZones(zones);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "수업 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject, selectedLifeZone]);

  function getSubjectName(id: string) {
    if (id === "00000000-0000-0000-0000-000000000204" || id === "sub-python") {
      return "파이썬 프로그래밍";
    }
    return subjects.find((s) => s.id === id)?.name ?? id;
  }

  function getLifeZoneName(id: string) {
    return lifeZones.find((z) => z.id === id)?.name ?? id;
  }

  function matchesCategory(course: CourseRecord, categoryId: string) {
    if (categoryId === "all") return true;
    const subName = getSubjectName(course.subjectId).toLowerCase();
    const goal = course.learningGoal.toLowerCase();
    const desc = (course.sampleDescription ?? "").toLowerCase();
    if (categoryId === "dev") {
      return (
        subName.includes("파이썬") ||
        subName.includes("자료구조") ||
        subName.includes("알고리즘") ||
        subName.includes("코딩") ||
        goal.includes("파이썬") ||
        goal.includes("자료구조") ||
        goal.includes("알고리즘") ||
        goal.includes("코딩") ||
        goal.includes("개발") ||
        desc.includes("파이썬") ||
        desc.includes("코드")
      );
    }
    if (categoryId === "biz") {
      return (
        subName.includes("경제") ||
        subName.includes("경영") ||
        subName.includes("통계") ||
        goal.includes("경제") ||
        goal.includes("경영") ||
        goal.includes("통계")
      );
    }
    if (categoryId === "lang") {
      return (
        subName.includes("영어") ||
        subName.includes("외국어") ||
        goal.includes("영어")
      );
    }
    return false;
  }

  // Filter courses by category tab and search keyword
  const filteredCourses = courses.filter((c) => {
    if (!matchesCategory(c, selectedCategoryTab)) return false;
    if (!searchKeyword.trim()) return true;
    const q = searchKeyword.toLowerCase();
    const titleMatch = c.learningGoal.toLowerCase().includes(q);
    const descMatch = (c.sampleDescription ?? "").toLowerCase().includes(q);
    const subjectMatch = getSubjectName(c.subjectId).toLowerCase().includes(q);
    return titleMatch || descMatch || subjectMatch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Stitch 2._class_discovery Header Section */}
      <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 14px",
              borderRadius: "var(--radius-full)",
              background: "var(--soft-lime)",
              color: "var(--charcoal-deep)",
              fontSize: "0.82rem",
              fontWeight: 700,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              bolt
            </span>
            <span>오늘 열린 대학생 전공 수업 {courses.length}개</span>
          </div>
          <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>
            신촌 · 홍대 · 대학로 캠퍼스타운
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--charcoal-deep)",
            margin: 0,
          }}
        >
          뭐 배워볼까?
        </h1>
      </section>

      {/* Modern Search Bar */}
      <section>
        <div className="cmt-search-bar" style={{ padding: "8px 12px 8px 20px" }}>
          <span
            className="material-symbols-outlined"
            style={{ color: "var(--charcoal-muted)", marginRight: "12px", fontSize: "22px" }}
          >
            search
          </span>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="수업을 검색해보세요 (예: 파이썬, 피그마, 알고리즘)"
            className="cmt-search-bar__input"
            aria-label="수업 검색"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => setSearchKeyword("")}
              style={{
                border: "none",
                background: "var(--bg-ivory)",
                color: "var(--text-muted)",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                marginRight: "8px",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
            </button>
          )}
        </div>
      </section>

      {/* Horizontal Category Chips */}
      <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryTab(cat.id)}
              className={`category-chip ${
                selectedCategoryTab === cat.id ? "category-chip--active" : ""
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Secondary Compact Filter Pills Row */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
            padding: "12px 18px",
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-full)",
            boxShadow: "var(--shadow-xs)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary-olive)" }}>
              filter_list
            </span>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--charcoal-deep)" }}>
              세부 필터:
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <select
              id="filter-subject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="cmt-form-field__select"
              style={{
                fontSize: "0.82rem",
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                background: "var(--bg-ivory)",
                border: "none",
                fontWeight: 600,
              }}
            >
              <option value="">전공 전체</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <select
              id="filter-lifezone"
              value={selectedLifeZone}
              onChange={(e) => setSelectedLifeZone(e.target.value)}
              className="cmt-form-field__select"
              style={{
                fontSize: "0.82rem",
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                background: "var(--bg-ivory)",
                border: "none",
                fontWeight: 600,
              }}
            >
              <option value="">생활권 전체</option>
              {lifeZones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          {(selectedSubject || selectedLifeZone || searchKeyword) && (
            <button
              type="button"
              onClick={() => {
                setSelectedSubject("");
                setSelectedLifeZone("");
                setSearchKeyword("");
              }}
              style={{
                marginLeft: "auto",
                border: "none",
                background: "transparent",
                color: "var(--text-muted)",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              필터 초기화
            </button>
          )}
        </div>
      </section>

      {/* Error Banner */}
      {errorText && (
        <div
          style={{
            padding: "16px",
            borderRadius: "var(--radius-md)",
            background: "var(--tone-critical-bg)",
            color: "var(--tone-critical-text)",
            fontSize: "0.88rem",
          }}
        >
          {errorText}
        </div>
      )}

      {/* Loading Skeleton / Classes Grid */}
      {isLoading ? (
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <div className="cmt-button__spinner" style={{ width: "32px", height: "32px", margin: "0 auto 16px auto" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>
            캠퍼스 전공 수업을 불러오는 중입니다...
          </p>
        </div>
      ) : errorText ? null : filteredCourses.length === 0 ? (
        <div
          style={{
            padding: "64px 24px",
            textAlign: "center",
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "var(--bg-ivory)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
              color: "var(--charcoal-deep)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>
              search_off
            </span>
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "8px", color: "var(--charcoal-deep)" }}>
            조건에 맞는 수업이 아직 없습니다
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
            필터를 조정해보시거나, 원하는 전공 수업을 직접 요청해보세요.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <Link href="/learning-requests/new">
              <Button variant="primary">맞춤 수업 요청 등록하기</Button>
            </Link>
            <Link href="/recommendations">
              <Button variant="secondary">AI 맞춤 추천 둘러보기</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {filteredCourses.map((c) => {
            const subjectName = getSubjectName(c.subjectId);
            const lifeZoneName = getLifeZoneName(c.lifeZoneId);

            return (
              <article
                key={c.id}
                className="cmt-card cmt-card--interactive"
                style={{
                  padding: "24px",
                  background: "var(--bg-surface)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* Card Top: Badges and Price */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "var(--radius-full)",
                        background: "var(--soft-lime)",
                        color: "var(--charcoal-deep)",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                      }}
                    >
                      {subjectName}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        color: "var(--primary-olive)",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
                        verified
                      </span>
                      인증 튜터
                    </span>
                    {(c.id.includes("python") || c.learningGoal.includes("파이썬")) && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          padding: "3px 8px",
                          borderRadius: "var(--radius-full)",
                          background: "var(--electric-chartreuse, #D4FF00)",
                          color: "var(--charcoal-deep, #1E201E)",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          border: "1.5px solid var(--charcoal-deep, #1E201E)",
                          boxShadow: "1px 1px 0px rgba(0,0,0,0.8)",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "13px", fontWeight: "bold" }}>
                          bolt
                        </span>
                        시연 핵심 추천
                      </span>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
                      {c.askingPrice.toLocaleString()}원
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginLeft: "3px" }}>
                      /시간
                    </span>
                  </div>
                </div>

                {/* Tutor Info & Title */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      background: "var(--bg-ivory)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      position: "relative",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--charcoal-deep)" }}>
                      person
                    </span>
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "var(--electric-chartreuse)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--charcoal-deep)",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "12px", fontWeight: "bold" }}>
                        school
                      </span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                      style={{
                        fontSize: "1.15rem",
                        fontWeight: 800,
                        color: "var(--charcoal-deep)",
                        lineHeight: 1.35,
                        margin: 0,
                      }}
                    >
                      {c.learningGoal}
                    </h2>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                      교육자 {c.learningGoal.includes("파이썬") ? "컴공선배 (seed-tut)" : c.tutorId.slice(0, 8)} · 학생증 검증 완료
                    </p>
                  </div>
                </div>

                {/* Description Snippet */}
                {c.sampleDescription && (
                  <p
                    style={{
                      fontSize: "0.88rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.6,
                      margin: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {c.sampleDescription}
                  </p>
                )}

                {/* Stitch Information Chips Grid: WHAT, WHEN, WHERE, HOW MUCH */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "10px",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-ivory)",
                    fontSize: "0.82rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary-olive)" }}>
                      schedule
                    </span>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>수업 시간</div>
                      <div style={{ fontWeight: 700, color: "var(--charcoal-deep)" }}>
                        {c.totalMinutes ?? 60}분 속성 (1:1 협의)
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary-olive)" }}>
                      location_on
                    </span>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>진행 생활권</div>
                      <div style={{ fontWeight: 700, color: "var(--charcoal-deep)" }}>
                        {lifeZoneName || "신촌/홍대"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary-olive)" }}>
                      groups
                    </span>
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>정원</div>
                      <div style={{ fontWeight: 700, color: "var(--charcoal-deep)" }}>
                        1:1 단일 차시
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "4px" }}>
                  <Link href={`/courses/${c.id}`}>
                    <Button variant="primary" size="sm">
                      <span>수업 상세 및 1:1 협의</span>
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                        arrow_forward
                      </span>
                    </Button>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)" }}>
          수업 목록을 불러오는 중입니다...
        </div>
      }
    >
      <CoursesPageContent />
    </Suspense>
  );
}
