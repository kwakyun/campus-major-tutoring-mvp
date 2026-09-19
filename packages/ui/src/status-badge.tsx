export type BadgeTone = "neutral" | "positive" | "warning" | "critical" | "info" | "purple" | "chartreuse" | "lime";

export interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const STATUS_TONE_MAP: Record<string, { label: string; tone: BadgeTone }> = {
  // Verification statuses
  verified: { label: "공식 인증됨", tone: "chartreuse" },
  pending: { label: "심사 진행중", tone: "warning" },
  self_reported: { label: "자기기재", tone: "neutral" },
  rejected: { label: "반려됨", tone: "critical" },
  
  // Course statuses
  draft: { label: "임시저장", tone: "neutral" },
  pending_review: { label: "심사 대기중", tone: "warning" },
  published: { label: "공개 모집중", tone: "lime" },
  unpublished: { label: "비공개", tone: "neutral" },
  
  // Learning request & Waitlist statuses
  open: { label: "매칭 대기중", tone: "info" },
  matched: { label: "매칭 완료", tone: "positive" },
  waitlisted: { label: "대기 등록됨", tone: "purple" },
  expired: { label: "만료됨", tone: "neutral" },
  withdrawn: { label: "철회됨", tone: "neutral" },
  notified: { label: "후보 알림발송", tone: "warning" },
};

export function StatusBadge({ label, tone, size = "md", dot = false, className = "" }: StatusBadgeProps) {
  const mapped = STATUS_TONE_MAP[label];
  const displayLabel = mapped ? mapped.label : label;
  const displayTone = tone ?? (mapped ? mapped.tone : "neutral");

  return (
    <span
      className={`cmt-status-badge cmt-status-badge--${displayTone} cmt-status-badge--${size} ${className}`.trim()}
    >
      {dot && <span className="cmt-status-badge__dot" />}
      {displayLabel}
    </span>
  );
}

