import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  bordered?: boolean;
  interactive?: boolean;
  children: ReactNode;
}

/**
 * 버그 수정 (2026-09-19): packages/ui/src/index.ts가 "./card"를 re-export하고 있었지만
 * 이 파일 자체가 저장소에 존재하지 않아 Card/CardBody 등을 import하는 화면(apps/web/src/app/page.tsx)에서
 * 빌드가 즉시 실패했음(Module not found: Can't resolve './card'). globals.css의 기존 .cmt-card* 클래스
 * 규약을 그대로 따르는 최소 구현으로 복구.
 */
export function Card({
  padding = "md",
  bordered = false,
  interactive = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  const paddingClass = `cmt-card--p-${padding}`;
  const borderedClass = bordered ? "cmt-card--bordered" : "";
  const interactiveClass = interactive ? "cmt-card--interactive" : "";

  return (
    <div
      className={`cmt-card ${paddingClass} ${borderedClass} ${interactiveClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`cmt-card__header ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export function CardBody({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className = "", children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`cmt-card__footer ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
