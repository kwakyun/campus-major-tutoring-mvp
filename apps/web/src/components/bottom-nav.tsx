"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "홈", icon: "home" },
    { href: "/courses", label: "수업찾기", icon: "search" },
    { href: "/chat", label: "채팅", icon: "chat_bubble", badge: "1" },
    { href: "/my-classes", label: "내수업", icon: "local_library" },
    { href: "/tutor/profile", label: "프로필", icon: "account_circle" },
  ];

  return (
    <div className="cmt-floating-nav-wrapper">
      <nav className="cmt-floating-nav" aria-label="하단 모바일 네비게이션">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`cmt-floating-nav__item ${
                isActive ? "cmt-floating-nav__item--active" : ""
              }`}
            >
              <div style={{ position: "relative", display: "inline-flex" }}>
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.badge && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-6px",
                      width: "14px",
                      height: "14px",
                      borderRadius: "50%",
                      background: "var(--electric-chartreuse)",
                      color: "var(--charcoal-deep)",
                      fontSize: "10px",
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
