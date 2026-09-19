"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listMyBookings, type BookingRecord } from "../../lib/api-client";
import { Button, StatusBadge } from "@campus-major-tutoring-mvp/ui";

interface ScheduleSlot {
  id: string;
  day: string;
  time: string;
  title: string;
  type: "class" | "free" | "requested";
  tutor?: string;
  location?: string;
  bookingId?: string;
  status?: string;
}

const DEFAULT_FREE_SLOTS: ScheduleSlot[] = [
  {
    id: "slot-free-1",
    day: "월",
    time: "14:00 - 16:00",
    title: "공강 시간 (과외 조율 가능)",
    type: "free",
  },
  {
    id: "slot-free-2",
    day: "금",
    time: "11:00 - 13:00",
    title: "공강 시간 (과외 조율 가능)",
    type: "free",
  },
];

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];
const DAY_MAP: Record<number, string> = {
  0: "일",
  1: "월",
  2: "화",
  3: "수",
  4: "목",
  5: "금",
  6: "토",
};

export default function ScheduleDashboardPage() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<string>("목");
  const [slots, setSlots] = useState<ScheduleSlot[]>(DEFAULT_FREE_SLOTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      setIsLoading(true);
      try {
        const bookings = await listMyBookings();
        if (bookings && bookings.length > 0) {
          const mappedClassSlots: ScheduleSlot[] = bookings.map((b) => {
            const start = new Date(b.scheduledStart);
            const end = new Date(b.scheduledEnd);
            const dayStr = DAY_MAP[start.getDay()] ?? "목";
            const startStr = start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const endStr = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            return {
              id: b.id,
              bookingId: b.id,
              day: dayStr,
              time: `${startStr} - ${endStr}`,
              title: b.learningGoal || "전공 1:1 과외 수업",
              type: "class",
              tutor: `교육자-${b.tutorId.slice(-4)}`,
              location: b.location,
              status: b.status,
            };
          });

          setSlots([...mappedClassSlots, ...DEFAULT_FREE_SLOTS]);
        } else {
          // 데모 예시 슬롯 유지
          setSlots([
            {
              id: "slot-demo-1",
              day: "목",
              time: "19:00 - 20:00",
              title: "파이썬 데이터 처리 기초 (1:1)",
              type: "class",
              tutor: "김민지 튜터",
              location: "홍익대 정문 인근 스터디룸",
              status: "confirmed",
            },
            ...DEFAULT_FREE_SLOTS,
          ]);
        }
      } catch (err) {
        console.warn("예약 목록 조회 실패 (오프라인 모드 유지):", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadBookings();
  }, []);

  const daySlots = slots.filter((s) => s.day === selectedDay);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px", paddingBottom: "80px" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--electric-chartreuse)",
            }}
          />
          <span style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-muted)" }}>
            CAMPUS TIMETABLE (S05 실연동)
          </span>
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--charcoal-deep)", letterSpacing: "-0.02em", marginBottom: "4px" }}>
          공강 및 과외 일정
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", margin: 0 }}>
          실제 양측 합의 및 예약 확정된 전공 수업 일정을 실시간으로 확인하세요.
        </p>
      </div>

      {/* Days Selector Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          background: "var(--bg-ivory)",
          padding: "6px",
          borderRadius: "var(--radius-full)",
          overflowX: "auto",
        }}
      >
        {DAYS.map((d) => {
          const isSelected = selectedDay === d;
          const hasClass = slots.some((s) => s.day === d && s.type === "class");
          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDay(d)}
              style={{
                flex: 1,
                minWidth: "44px",
                padding: "10px 0",
                borderRadius: "var(--radius-full)",
                border: "none",
                background: isSelected ? "var(--charcoal-deep)" : "transparent",
                color: isSelected ? "var(--bg-surface)" : "var(--charcoal-deep)",
                fontWeight: isSelected ? 800 : 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <span>{d}</span>
              {hasClass && (
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: isSelected ? "var(--electric-chartreuse)" : "var(--primary-olive)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Slots List for Selected Day */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--charcoal-deep)", margin: 0 }}>
            {selectedDay}요일 일정 ({daySlots.length}개)
          </h2>
          <Link href="/courses">
            <Button variant="outline" size="sm">
              새 수업 탐색하기
            </Button>
          </Link>
        </div>

        {daySlots.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-lg)",
              textAlign: "center",
              border: "1px dashed var(--border-subtle)",
              color: "var(--text-muted)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "36px", marginBottom: "8px", opacity: 0.5 }}>
              event_busy
            </span>
            <p style={{ margin: "4px 0 12px 0", fontSize: "0.9rem" }}>이 날에는 등록된 일정이 없습니다.</p>
            <Link href="/courses">
              <Button size="sm">공강 시간에 과외 수업 매칭하기</Button>
            </Link>
          </div>
        ) : (
          daySlots.map((slot) => {
            if (slot.type === "class") {
              return (
                <div
                  key={slot.id}
                  style={{
                    background: "var(--charcoal-deep)",
                    color: "var(--bg-surface)",
                    padding: "20px",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-md)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{
                        background: "var(--electric-chartreuse)",
                        color: "var(--charcoal-deep)",
                        padding: "3px 10px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                      }}
                    >
                      확정된 1:1 과외
                    </span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--soft-lime)" }}>
                      {slot.time}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 4px 0" }}>
                      {slot.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
                      담당: {slot.tutor} · {slot.location}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                    <Link href={`/reviews/new?classId=${slot.bookingId || slot.id}`} style={{ flex: 1 }}>
                      <button
                        type="button"
                        style={{
                          width: "100%",
                          padding: "8px",
                          borderRadius: "var(--radius-full)",
                          background: "rgba(255, 255, 255, 0.15)",
                          color: "var(--bg-surface)",
                          border: "none",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        수업 완료 및 리뷰 작성
                      </button>
                    </Link>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={slot.id}
                style={{
                  background: "var(--bg-surface)",
                  padding: "16px 20px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--primary-olive)", marginBottom: "2px" }}>
                    {slot.time}
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--charcoal-deep)" }}>
                    {slot.title}
                  </div>
                </div>
                <Link href="/courses">
                  <Button variant="outline" size="sm">
                    수업 찾기
                  </Button>
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
