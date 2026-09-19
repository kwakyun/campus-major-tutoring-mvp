"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fetchWhoAmI, type WhoAmI } from "../lib/api-client";
import { StatusBadge } from "@campus-major-tutoring-mvp/ui";

export function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<WhoAmI | null>(null);

  useEffect(() => {
    void fetchWhoAmI().then((user) => setCurrentUser(user));
  }, [pathname]);

  const navLinks = [
    { href: "/courses", label: "수업 탐색" },
    { href: "/chat", label: "조율 채팅" },
    { href: "/my-classes", label: "내 수업" },
    { href: "/recommendations", label: "맞춤 추천" },
    { href: "/schedule", label: "시간표" },
    { href: "/learning-requests", label: "학습 요청" },
    { href: "/tutor/courses", label: "교육자 센터" },
  ];

  return (
    <header className="cmt-header">
      <div className="cmt-container cmt-header__inner">
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link href="/" className="cmt-brand">
            <div className="cmt-brand__icon">
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                school
              </span>
            </div>
            <span>전공한시간</span>
            <span className="cmt-brand__badge">1:1 캠퍼스</span>
          </Link>

          <nav className="cmt-nav" aria-label="메인 네비게이션">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`cmt-nav__link ${isActive ? "cmt-nav__link--active" : ""}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="cmt-header__actions">
          {currentUser ? (
            <div className="cmt-session-pill">
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--charcoal-deep)" }}>
                person
              </span>
              <span style={{ fontWeight: 700 }}>{currentUser.userId}</span>
              <span style={{ color: "var(--border-strong)" }}>|</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                {currentUser.roles.join(", ")}
              </span>
              <StatusBadge label={currentUser.identityVerificationStatus} size="sm" dot />
              <Link
                href="/login"
                style={{
                  fontSize: "0.78rem",
                  color: "var(--charcoal-deep)",
                  fontWeight: 700,
                  marginLeft: "4px",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--bg-ivory)",
                }}
              >
                전환
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              style={{
                fontSize: "0.85rem",
                color: "var(--charcoal-deep)",
                fontWeight: 700,
                padding: "8px 18px",
                background: "var(--electric-chartreuse)",
                borderRadius: "var(--radius-full)",
                boxShadow: "0 2px 8px rgba(210, 248, 36, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>login</span>
              로그인 / 세션
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
