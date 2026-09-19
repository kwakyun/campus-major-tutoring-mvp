"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * 경로가 바뀔 때마다 자식을 다시 마운트시켜 globals.css의 .cmt-page-transition
 * 진입 애니메이션(페이드인 + 살짝 위로 슬라이드)이 매 네비게이션마다 재생되게 한다.
 *
 * Next.js App Router는 레이아웃(예: apps/web/src/app/layout.tsx)의 <main> 안쪽
 * 컨테이너 DOM 노드 자체는 라우트 전환 시 그대로 재사용하고 children만 바꾸기
 * 때문에, 컨테이너에 CSS animation을 걸어도 이동할 때마다 다시 재생되지 않는다.
 * key={pathname}으로 이 래퍼를 매번 새 DOM 노드로 만들어 그 문제를 해결한다.
 *
 * prefers-reduced-motion 사용자는 globals.css의 미디어 쿼리가 애니메이션
 * 지속시간을 0에 가깝게 만들어 사실상 전환이 없는 것처럼 동작한다.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="cmt-page-transition">
      {children}
    </div>
  );
}
