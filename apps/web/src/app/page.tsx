"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, StatusBadge } from "@campus-major-tutoring-mvp/ui";

const CATEGORIES = [
  { id: "all", label: "전체" },
  { id: "dev", label: "개발 · 코딩" },
  { id: "design", label: "디자인 · UI" },
  { id: "biz", label: "경영 · 통계" },
  { id: "media", label: "영상 · 미디어" },
  { id: "lang", label: "외국어 · 어학" },
];

const POPULAR_CLASSES = [
  {
    id: "sample-1",
    category: "dev",
    categoryLabel: "개발 · 코딩",
    title: "파이썬으로 데이터 다루기",
    tutorName: "김민지",
    tutorSchool: "홍익대 컴퓨터공학과 3학년",
    pricePerHour: 25000,
    durationMinutes: 60,
    schedule: "목 18:00~20:00 (협의 가능)",
    location: "신촌/홍대 인근 스터디룸",
    verified: true,
  },
  {
    id: "sample-2",
    category: "design",
    categoryLabel: "디자인 · UI",
    title: "비전공자를 위한 피그마 컴포넌트 기초",
    tutorName: "이준서",
    tutorSchool: "국민대 시각디자인학과 4학년",
    pricePerHour: 28000,
    durationMinutes: 60,
    schedule: "주말 오전/오후 조율",
    location: "신촌/강남 캠퍼스타운",
    verified: true,
  },
  {
    id: "sample-3",
    category: "biz",
    categoryLabel: "경영 · 통계",
    title: "경영통계 및 R 데이터 분석 과제 뽀개기",
    tutorName: "박서연",
    tutorSchool: "연세대 경영학과 3학년",
    pricePerHour: 26000,
    durationMinutes: 60,
    schedule: "화/금 저녁 시간대",
    location: "신촌 캠퍼스 대면 또는 온라인",
    verified: true,
  },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/courses");
    }
  }

  const filteredClasses =
    selectedCategory === "all"
      ? POPULAR_CLASSES
      : POPULAR_CLASSES.filter((c) => c.category === selectedCategory);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
      {/* Stitch Editorial Hero Section */}
      <section
        style={{
          position: "relative",
          background: "var(--bg-ivory)",
          borderRadius: "var(--radius-xl)",
          padding: "48px 32px",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        {/* Soft Lime Graphic Glow */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "260px",
            height: "260px",
            borderRadius: "50%",
            background: "rgba(216, 238, 111, 0.4)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "680px" }}>
          <div style={{ marginBottom: "16px" }}>
            <div className="cmt-hero-badge">
              <span className="cmt-hero-badge__dot" />
              캠퍼스 1:1 전공 과외
            </div>
          </div>

          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.22,
              color: "var(--charcoal-deep)",
              marginBottom: "16px",
            }}
          >
            내 전공 밖의 배움,
            <br />
            <span className="cmt-highlight">내 시간 안에서.</span>
          </h1>

          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.65,
              color: "var(--text-muted)",
              marginBottom: "28px",
              maxWidth: "540px",
            }}
          >
            혼자 해결하기 막막한 전공 과제, 프로젝트, 편입 기초 개념.
            <br />
            같은 생활권 검증된 선배와 1:1 단일 차시로 부담 없이 협의하고 배워보세요.
          </p>

          {/* Search Bar with Micro-Interaction */}
          <form onSubmit={handleSearchSubmit} style={{ maxWidth: "520px", marginBottom: "24px" }}>
            <div className="cmt-search-bar">
              <span
                className="material-symbols-outlined"
                style={{ color: "var(--charcoal-muted)", marginRight: "10px", fontSize: "22px" }}
              >
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="무엇을 배우고 싶나요? (예: 파이썬, 피그마, 경영통계)"
                className="cmt-search-bar__input"
                aria-label="수업 검색"
              />
              <button
                type="submit"
                style={{
                  border: "none",
                  background: "var(--charcoal-deep)",
                  color: "var(--bg-cream)",
                  borderRadius: "var(--radius-full)",
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.2s",
                }}
              >
                검색
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  arrow_forward
                </span>
              </button>
            </div>
          </form>

          {/* Action Button Links */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <Link href="/courses">
              <Button variant="primary" size="md">
                <span>수업 찾기</span>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  arrow_forward
                </span>
              </Button>
            </Link>
            <Link href="/recommendations">
              <Button variant="secondary" size="md">
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary-olive)" }}>
                  bolt
                </span>
                <span>AI·조건 맞춤 추천</span>
              </Button>
            </Link>
            <Link href="/tutor/courses/new">
              <Button variant="outline" size="md">
                <span>배워주기 (교육자 등록)</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Classes Section (Stitch Style) */}
      <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "var(--electric-chartreuse)",
                boxShadow: "0 0 10px rgba(210, 248, 36, 0.9)",
              }}
            />
            <h2 className="cmt-section-title" style={{ margin: 0 }}>
              지금 인기있는 전공 수업
            </h2>
          </div>
          <Link
            href="/courses"
            style={{
              fontSize: "0.86rem",
              fontWeight: 700,
              color: "var(--charcoal-deep)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            전체보기
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
              chevron_right
            </span>
          </Link>
        </div>

        {/* Category Chips Horizontal Scroll */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "6px",
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`category-chip ${
                selectedCategory === cat.id ? "category-chip--active" : ""
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Class Cards Grid */}
        <div className="cmt-grid-3">
          {filteredClasses.map((item) => (
            <Link key={item.id} href={`/courses/${item.id}`} style={{ display: "block" }}>
              <div
                className="cmt-card cmt-card--interactive"
                style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px", height: "100%" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: "var(--radius-full)",
                      background: "var(--soft-lime)",
                      color: "var(--charcoal-deep)",
                    }}
                  >
                    {item.categoryLabel}
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--charcoal-deep)" }}>
                      {item.pricePerHour.toLocaleString()}원
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "2px" }}>
                      /시간
                    </span>
                  </div>
                </div>

                <div>
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 800,
                      color: "var(--charcoal-deep)",
                      lineHeight: 1.35,
                      marginBottom: "6px",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {item.tutorName} · {item.tutorSchool}
                  </p>
                </div>

                {/* Micro Details Grid */}
                <div
                  style={{
                    background: "var(--bg-ivory)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "0.78rem",
                    color: "var(--charcoal-muted)",
                    marginTop: "auto",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "var(--primary-olive)" }}>
                      schedule
                    </span>
                    <span>{item.durationMinutes}분 속성 과외</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "var(--primary-olive)" }}>
                      location_on
                    </span>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.location}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Dual Entry Section: 재학생 vs 편입준비생 (SRC-01 규약 보존) */}
      <section>
        <div className="cmt-section-header" style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 className="cmt-section-title">학습 목적에 따른 맞춤 진입</h2>
          <p className="cmt-section-subtitle">
            재학 여부와 무관하게 모든 학습자에게 열려 있습니다 (대학 재학 강제 없음, SRC-01)
          </p>
        </div>

        <div className="cmt-grid-2">
          <div
            className="cmt-card"
            style={{
              padding: "28px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <StatusBadge label="재학생·복수전공생" tone="chartreuse" dot />
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>전공 심화 &amp; 과제</span>
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "10px", color: "var(--charcoal-deep)" }}>
                &ldquo;이번 학기 프로젝트와 전공 밖 지식이 필요할 때&rdquo;
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "24px" }}>
                같은 단과대나 인접 학과의 튜터에게 과제 방향성, 실습 환경 설정, 개념 막힘을 1:1로 빠르게 해결받으세요.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Link href="/courses">
                <Button variant="primary" size="sm">
                  전공 수업 찾기
                </Button>
              </Link>
              <Link href="/learning-requests/new?purpose=enrolled_prep">
                <Button variant="outline" size="sm">
                  맞춤 학습 요청
                </Button>
              </Link>
            </div>
          </div>

          <div
            className="cmt-card"
            style={{
              padding: "28px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <StatusBadge label="편입준비생·비전공자" tone="purple" dot />
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>기초 개념 &amp; 로드맵</span>
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "10px", color: "var(--charcoal-deep)" }}>
                &ldquo;지원 학과의 기초 전공 질문과 로드맵 정리&rdquo;
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "24px" }}>
                목표 학과의 선배 교육자에게 전공 선수과목, 학업계획서 조언, 핵심 개념 학습을 1:1 맞춤형으로 준비하세요.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <Link href="/courses">
                <Button variant="primary" size="sm">
                  편입 추천 수업
                </Button>
              </Link>
              <Link href="/learning-requests/new?purpose=transfer_prep">
                <Button variant="outline" size="sm">
                  편입 맞춤 요청
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Match Highlight Banner (Stitch) */}
      <section className="cmt-quick-match-banner">
        <div style={{ display: "flex", alignItems: "center", gap: "16px", zIndex: 1 }}>
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
              bolt
            </span>
          </div>
          <div>
            <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "var(--bg-cream)", marginBottom: "2px" }}>
              원하는 전공 매칭이 급한가요?
            </h3>
            <p style={{ fontSize: "0.84rem", color: "rgba(251, 249, 244, 0.75)" }}>
              내 공강 시간과 목표에 맞는 최적의 튜터를 바로 추천해드려요.
            </p>
          </div>
        </div>
        <Link href="/recommendations" style={{ zIndex: 1 }}>
          <Button variant="primary" size="sm" style={{ background: "var(--electric-chartreuse)", color: "var(--charcoal-deep)" }}>
            <span>추천받기</span>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              arrow_forward
            </span>
          </Button>
        </Link>
      </section>
    </div>
  );
}
