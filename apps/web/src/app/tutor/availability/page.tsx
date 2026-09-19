"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getMyAvailability,
  setMyAvailability,
  fetchWhoAmI,
  type TimeWindow,
  ApiError,
} from "../../../lib/api-client";
import { Button, Card, CardBody } from "@campus-major-tutoring-mvp/ui";

const DAYS = [
  { val: 1, label: "월요일" },
  { val: 2, label: "화요일" },
  { val: 3, label: "수요일" },
  { val: 4, label: "목요일" },
  { val: 5, label: "금요일" },
  { val: 6, label: "토요일" },
  { val: 0, label: "일요일" },
];

export default function TutorAvailabilityPage() {
  const [windows, setWindows] = useState<TimeWindow[]>([
    { start: "14:00", end: "16:00", dayOfWeek: 1 },
    { start: "18:00", end: "21:00", dayOfWeek: 3 },
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setErrorText(null);
      try {
        const user = await fetchWhoAmI();
        if (!user || !user.roles.includes("tutor")) {
          // not tutor
        }
        const data = await getMyAvailability();
        if (data.windows && data.windows.length > 0) {
          setWindows(data.windows);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          setErrorText("교육자(tutor) 권한 세션이 필요합니다. 상단에서 세션을 tutor로 설정해주세요.");
        } else {
          setErrorText(err instanceof Error ? err.message : "가능 시간 조회에 실패했습니다.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  function handleAddSlot() {
    setWindows([...windows, { start: "14:00", end: "16:00", dayOfWeek: 1 }]);
  }

  function handleSlotChange(index: number, field: keyof TimeWindow, val: string | number) {
    const next = [...windows];
    next[index] = { ...next[index], [field]: val };
    setWindows(next);
  }

  function handleRemoveSlot(index: number) {
    setWindows(windows.filter((_, i) => i !== index));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setErrorText(null);
    setSuccessText(null);

    try {
      const res = await setMyAvailability(windows);
      setWindows(res.windows);
      setSuccessText("수업 가능 시간이 성공적으로 저장되었습니다.");
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "가능 시간 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="cmt-section-header">
        <div style={{ display: "flex", gap: "12px", marginBottom: "8px", fontSize: "0.85rem" }}>
          <Link href="/tutor/courses" style={{ color: "var(--text-muted)" }}>
            내 수업 관리
          </Link>
          <span>·</span>
          <Link href="/tutor/profile" style={{ color: "var(--text-muted)" }}>
            프로필 및 경력
          </Link>
          <span>·</span>
          <span style={{ color: "var(--primary)", fontWeight: 700 }}>가능 시간 설정</span>
        </div>
        <h1 className="cmt-section-title">수업 가능 시간 관리</h1>
        <p className="cmt-section-subtitle">
          주간 반복 가능한 수업 시간대를 등록해두면 추천 및 탐색 시 시간 일치 후보로 우선 매칭됩니다.
        </p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSave}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>가능 시간대 목록</h3>
            <Button size="sm" variant="outline" type="button" onClick={handleAddSlot}>
              + 시간대 추가
            </Button>
          </div>

          {isLoading ? (
            <p style={{ color: "var(--text-muted)", padding: "20px 0" }}>시간대 정보를 불러오는 중...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              {windows.map((w, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    background: "var(--bg-subtle)",
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: "110px" }}>
                    <select
                      value={w.dayOfWeek ?? 1}
                      onChange={(e) => handleSlotChange(idx, "dayOfWeek", Number(e.target.value))}
                      className="cmt-form-field__select"
                      style={{ fontSize: "0.88rem", padding: "8px 10px" }}
                    >
                      {DAYS.map((d) => (
                        <option key={d.val} value={d.val}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input
                      type="time"
                      value={w.start}
                      onChange={(e) => handleSlotChange(idx, "start", e.target.value)}
                      className="cmt-form-field__input"
                      style={{ width: "110px", padding: "8px" }}
                    />
                    <span>~</span>
                    <input
                      type="time"
                      value={w.end}
                      onChange={(e) => handleSlotChange(idx, "end", e.target.value)}
                      className="cmt-form-field__input"
                      style={{ width: "110px", padding: "8px" }}
                    />
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    style={{ marginLeft: "auto" }}
                    onClick={() => handleRemoveSlot(idx)}
                  >
                    삭제
                  </Button>
                </div>
              ))}
            </div>
          )}

          {errorText && (
            <div className="cmt-notice cmt-notice--critical" role="alert" style={{ marginBottom: "16px" }}>
              {errorText}
            </div>
          )}

          {successText && (
            <div className="cmt-notice cmt-notice--info" role="status" style={{ marginBottom: "16px" }}>
              {successText}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              가능 시간 저장 완료
            </Button>
          </div>
        </form>
      </Card>

      <div className="cmt-notice cmt-notice--info">
        <strong>💡 예약 겹침 방지 안내:</strong> 향후 S05에서 예약이 확정(confirmed)된 시간대는 다른 학습자가 중복 신청할 수 없도록 자동 차단됩니다.
      </div>
    </div>
  );
}
