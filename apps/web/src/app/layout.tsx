import type { ReactNode } from "react";
import "./globals.css";
import { Navbar } from "../components/navbar";
import { BottomNav } from "../components/bottom-nav";
import { PageTransition } from "../components/page-transition";
import { ThemeToggle } from "../components/theme-toggle";

export const metadata = {
  title: "전공한시간 — 캠퍼스 1:1 전공 튜터링",
  description: "같은 전공·같은 생활권 선배에게 직접 배우는 1:1 전공 맞춤 튜터링",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navbar />
        <main className="cmt-main-content">
          <div className="cmt-container">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
        <BottomNav />
        <ThemeToggle />
        <footer className="cmt-footer">
          <div className="cmt-container">
            <div className="cmt-footer__grid">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "var(--electric-chartreuse)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--charcoal-deep)",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                      school
                    </span>
                  </div>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: "var(--charcoal-deep)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    전공한시간
                  </h3>
                </div>
                <p style={{ lineHeight: 1.6, fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "420px" }}>
                  대학생 및 편입준비생을 위한 1:1 전공 학습 매칭 서비스. 검증된 전공 교육자와의 투명한 협의와 1시간 압축 수업을 지원합니다.
                </p>
                <div style={{ marginTop: "16px", display: "flex", gap: "16px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <span>교육자 수수료: <strong>15%</strong></span>
                  <span>학습자 수수료: <strong>0원</strong></span>
                  <span>최종 확정: <strong>상호 합의</strong></span>
                </div>
              </div>

              <div>
                <h4
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: "var(--charcoal-deep)",
                    marginBottom: "12px",
                  }}
                >
                  학습자 탐색
                </h4>
                <ul
                  style={{
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    fontSize: "0.84rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <li><a href="/courses" style={{ transition: "color 0.2s" }}>전체 개설 수업</a></li>
                  <li><a href="/recommendations" style={{ transition: "color 0.2s" }}>조건·태그 추천</a></li>
                  <li><a href="/learning-requests/new" style={{ transition: "color 0.2s" }}>맞춤 학습 요청 등록</a></li>
                  <li><a href="/learning-requests" style={{ transition: "color 0.2s" }}>내 요청 및 대기 신청</a></li>
                </ul>
              </div>

              <div>
                <h4
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: "var(--charcoal-deep)",
                    marginBottom: "12px",
                  }}
                >
                  교육자 센터
                </h4>
                <ul
                  style={{
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    fontSize: "0.84rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <li><a href="/tutor/courses" style={{ transition: "color 0.2s" }}>내 수업 관리 및 복제</a></li>
                  <li><a href="/tutor/courses/new" style={{ transition: "color 0.2s" }}>신규 수업 등록</a></li>
                  <li><a href="/tutor/profile" style={{ transition: "color 0.2s" }}>프로필 및 공식 검증</a></li>
                  <li><a href="/tutor/availability" style={{ transition: "color 0.2s" }}>수업 가능 시간 관리</a></li>
                </ul>
              </div>
            </div>

            <div className="cmt-footer__disclaimer">
              <strong>투명성 및 신뢰성 고지 (SRC-02, SRC-03):</strong> 본 플랫폼의 &apos;학교·신원 인증됨&apos; 표시는 학생증/재학 서류의 진위 확인 상태를 의미하며, 교육자의 강의 능력·편입 합격·학점 취득을 단정하거나 보증하지 않습니다. 등록된 경력 중 &apos;자기기재&apos; 항목은 교육자 본인이 작성한 내용입니다. 모든 수업료는 상호 협의를 거쳐 최종 합의서로 확정됩니다.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
