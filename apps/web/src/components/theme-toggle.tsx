"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cmt-theme";

/**
 * 브루탈리즘 테마 ↔ 기본(가독성 개선) 테마를 실시간으로 전환하는 우하단 토글 버튼.
 * <html data-theme="brutal">를 켜고 끄며 globals.css의 [data-theme="brutal"] 규칙이
 * 적용되도록 한다. 선택은 localStorage에 저장되어 새로고침해도 유지된다(브라우저별).
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"default" | "brutal">("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "brutal") {
        setTheme("brutal");
        document.documentElement.setAttribute("data-theme", "brutal");
      }
    } catch {
      // localStorage 접근 불가 환경(프라이빗 모드 등) — 기본 테마로 진행
    }
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === "brutal" ? "default" : "brutal";
    setTheme(next);
    if (next === "brutal") {
      document.documentElement.setAttribute("data-theme", "brutal");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 저장 실패해도 이번 세션 내 토글 자체는 동작
    }
  };

  if (!mounted) return null;

  return (
    <button type="button" onClick={toggle} aria-pressed={theme === "brutal"} className="cmt-theme-toggle">
      <span className="material-symbols-outlined" style={{ fontSize: "16px" }} aria-hidden="true">
        {theme === "brutal" ? "toggle_on" : "toggle_off"}
      </span>
      {theme === "brutal" ? "브루탈리즘 ON" : "브루탈리즘 OFF"}
    </button>
  );
}
