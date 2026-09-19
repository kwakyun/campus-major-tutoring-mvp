"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  createLearningRequest,
  listLifeZones,
  fetchWhoAmI,
  type LifeZoneRecord,
  ApiError,
} from "../../../lib/api-client";
import { Button, Card, FormField } from "@campus-major-tutoring-mvp/ui";

function NewLearningRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPurpose = searchParams?.get("purpose") === "transfer_prep" ? "transfer_prep" : "enrolled_prep";

  const [purpose, setPurpose] = useState<"enrolled_prep" | "transfer_prep">(initialPurpose);
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("수준 확인 필요");
  const [deadline, setDeadline] = useState("");
  const [budgetMin, setBudgetMin] = useState("15000");
  const [budgetMax, setBudgetMax] = useState("30000");
  const [lifeZoneId, setLifeZoneId] = useState("");
  const [lifeZones, setLifeZones] = useState<LifeZoneRecord[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const user = await fetchWhoAmI();
        if (!user || !user.roles.includes("learner")) {
          // learner 역할 안내
        }
        const zones = await listLifeZones();
        setLifeZones(zones);
        if (zones.length > 0) setLifeZoneId(zones[0].id);
      } catch {
        // fallback
      }
    }
    void init();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim()) {
      setErrorText("학습 목표를 입력해주세요.");
      return;
    }
    if (!lifeZoneId) {
      setErrorText("희망 생활권을 선택해주세요.");
      return;
    }

    setIsLoading(true);
    setErrorText(null);

    try {
      await createLearningRequest({
        goal: goal.trim(),
        level: level.trim() || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        budgetRange: {
          min: Number(budgetMin) || 0,
          max: Number(budgetMax) || undefined,
        },
        lifeZoneId,
        purposeType: purpose,
      });

      alert("학습 요청서가 성공적으로 등록되었습니다. 내 요청 목록으로 이동합니다.");
      router.push("/learning-requests");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setErrorText("학습자(learner) 역할 세션이 필요합니다. 상단에서 세션을 'learner'로 변경해주세요.");
        } else {
          setErrorText(`${err.code}: ${err.message}`);
        }
      } else {
        setErrorText(err instanceof Error ? err.message : "학습 요청 등록에 실패했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="cmt-section-header">
        <Link href="/learning-requests" style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600 }}>
          ← 내 학습 요청 목록
        </Link>
        <h1 className="cmt-section-title" style={{ marginTop: "8px" }}>
          맞춤 학습 요청서 등록
        </h1>
        <p className="cmt-section-subtitle">
          원하는 과목과 목표를 적어주시면 적합한 선배 튜터를 찾거나 대기 신청을 진행할 수 있습니다.
        </p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit}>
          {/* 1. 학습 목적 구분 (SRC-01) */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "0.88rem", fontWeight: 700, display: "block", marginBottom: "8px" }}>
              학습자 구분 (대학 재학 증빙 불필요, SRC-01)
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setPurpose("enrolled_prep")}
                style={{
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  border: `2px solid ${purpose === "enrolled_prep" ? "var(--primary)" : "var(--border-subtle)"}`,
                  background: purpose === "enrolled_prep" ? "var(--primary-light)" : "var(--bg-surface)",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-main)" }}>
                  재학생 / 복수전공생
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  학기 과제, 실습, 전공 심화 개념 정리
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPurpose("transfer_prep")}
                style={{
                  padding: "12px",
                  borderRadius: "var(--radius-md)",
                  border: `2px solid ${purpose === "transfer_prep" ? "var(--primary)" : "var(--border-subtle)"}`,
                  background: purpose === "transfer_prep" ? "var(--primary-light)" : "var(--bg-surface)",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-main)" }}>
                  편입준비생 / 비전공자
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  지원 학과 기초 개념, 전공 면접 질문 정리
                </div>
              </button>
            </div>
          </div>

          {/* 2. 학습 목표 & 단원 */}
          <FormField
            label="해결하고 싶은 전공 내용 및 구체적 목표"
            fieldId="lr-goal"
            as="textarea"
            required
            value={goal}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGoal(e.target.value)}
            placeholder="예: 자료구조 트리/그래프 구현 과제 코드 리뷰와 시간복잡도 질문, 60분 집중 실습"
            helperText="단원명, 사용 언어, 막히는 지점을 구체적으로 적어주실수록 적합한 튜터가 매칭됩니다."
          />

          {/* 3. 수준 (자기신고, 부적격 처리 없음) */}
          <FormField
            label="현재 본인의 이해 수준"
            fieldId="lr-level"
            value={level}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLevel(e.target.value)}
            placeholder="예: 비전공자 입문, 완전 기초, C언어 기본 문법만 앎, 수준 확인 필요"
            helperText="'수준 확인 필요'를 적으셔도 부적격 처리되지 않으며 튜터가 사전 질의로 조율합니다."
          />

          {/* 4. 생활권 */}
          <FormField
            label="희망 생활권 / 지역"
            fieldId="lr-lifezone"
            as="select"
            required
            value={lifeZoneId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLifeZoneId(e.target.value)}
          >
            {lifeZones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </FormField>

          {/* 5. 예산 범위 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <FormField
              label="희망 최소 예산 (1시간/KRW)"
              fieldId="lr-budget-min"
              type="number"
              value={budgetMin}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBudgetMin(e.target.value)}
            />
            <FormField
              label="희망 최대 예산 (1시간/KRW)"
              fieldId="lr-budget-max"
              type="number"
              value={budgetMax}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBudgetMax(e.target.value)}
            />
          </div>

          {/* 6. 희망 기한 */}
          <FormField
            label="학습 희망 기한 (선택)"
            fieldId="lr-deadline"
            type="date"
            value={deadline}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeadline(e.target.value)}
            helperText="과제 제출일이나 시험일이 있다면 지정해주세요."
          />

          {errorText && (
            <div className="cmt-notice cmt-notice--critical" role="alert" style={{ marginBottom: "16px" }}>
              {errorText}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "24px" }}>
            <Link href="/learning-requests">
              <Button variant="secondary" type="button">
                취소
              </Button>
            </Link>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              학습 요청서 등록 완료
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function NewLearningRequestPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>요청 양식을 준비 중입니다...</div>}>
      <NewLearningRequestForm />
    </Suspense>
  );
}
