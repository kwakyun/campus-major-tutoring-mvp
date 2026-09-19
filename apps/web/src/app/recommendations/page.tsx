"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  queryRecommendations,
  listSubjects,
  listLifeZones,
  REASON_CODE_LABELS,
  type RecommendedCandidate,
  type SubjectRecord,
  type LifeZoneRecord,
  type ReasonCode,
} from "../../lib/api-client";
import { eventTracker } from "../../lib/event-tracker";
import { Button, Card, CardBody, CardFooter, FormField, StatusBadge } from "@campus-major-tutoring-mvp/ui";

/**
 * 뷰포트 진입 감지 컴포넌트:
 * 카드가 화면에 실제로 노출되었을 때만 'recommendation_impression' 이벤트를 전송한다 (중복 제거 포함).
 */
function ImpressionCandidateCard({
  candidate,
  sessionId,
  getSubjectName,
  getLifeZoneName,
}: {
  candidate: RecommendedCandidate;
  sessionId: string;
  getSubjectName: (id: string) => string;
  getLifeZoneName: (id: string) => string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasReportedImpression, setHasReportedImpression] = useState(false);

  useEffect(() => {
    if (!cardRef.current || hasReportedImpression) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            eventTracker.trackImpression(candidate.course.id, sessionId);
            setHasReportedImpression(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [candidate.course.id, sessionId, hasReportedImpression]);

  const { course, reasonCodes } = candidate;
  const anonymousTutorLabel = `교육자-${course.tutorId.slice(-4)}`;

  return (
    <div ref={cardRef}>
      <Card interactive padding="md" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <CardBody style={{ flex: 1 }}>
          {/* Reason Code Badges */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
            {reasonCodes.map((code) => (
              <span
                key={code}
                style={{
                  background: "var(--soft-lime)",
                  color: "var(--charcoal-deep)",
                  borderRadius: "var(--radius-full)",
                  padding: "3px 10px",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                  check
                </span>
                {REASON_CODE_LABELS[code as ReasonCode] ?? code}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            <StatusBadge label={getSubjectName(course.subjectId)} tone="info" size="sm" />
            <StatusBadge label={getLifeZoneName(course.lifeZoneId)} tone="neutral" size="sm" />
          </div>

          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, lineHeight: 1.4, marginBottom: "8px" }}>
            <Link href={`/courses/${course.id}`} style={{ color: "var(--text-main)" }}>
              {course.learningGoal}
            </Link>
          </h3>

          {course.expectedOutcome && (
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "12px" }}>
              🎯 <strong>예상 결과:</strong> {course.expectedOutcome}
            </p>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.82rem",
              paddingTop: "8px",
              borderTop: "1px dashed var(--border-subtle)",
            }}
          >
            <span style={{ fontWeight: 600 }}>{anonymousTutorLabel}</span>
            <StatusBadge label="학교·신원 확인됨" tone="positive" size="sm" />
          </div>
        </CardBody>

        <CardFooter>
          <div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>협의 시작 가격</div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--primary)" }}>
              ₩{course.askingPrice.toLocaleString()}
            </div>
          </div>
          <Link href={`/courses/${course.id}`}>
            <Button size="sm">상세 보기 및 협의</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RecommendationsPage() {
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [lifeZones, setLifeZones] = useState<LifeZoneRecord[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  // Query state
  const [goal, setGoal] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedLifeZone, setSelectedLifeZone] = useState("");
  const [targetLevel, setTargetLevel] = useState("introductory");

  const [candidates, setCandidates] = useState<RecommendedCandidate[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasQueried, setHasQueried] = useState<boolean>(false);
  const [failureReason, setFailureReason] = useState<string | null>(null);

  async function loadMeta() {
    setIsLoadingMeta(true);
    setMetaError(null);
    try {
      const [subs, zones] = await Promise.all([
        listSubjects(),
        listLifeZones(),
      ]);
      setSubjects(subs);
      setLifeZones(zones);
      setSelectedLifeZone((current) => zones.some((zone) => zone.id === current) ? current : (zones[0]?.id ?? ""));
    } catch {
      setMetaError("과목·생활권 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoadingMeta(false);
    }
  }

  useEffect(() => {
    void loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (isLoadingMeta || metaError) return;
    if (!selectedLifeZone) {
      alert("생활권을 선택해주세요.");
      return;
    }

    setIsLoading(true);
    setHasQueried(true);
    setFailureReason(null);

    const currentSessionId = `rec-session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setSessionId(currentSessionId);

    try {
      const result = await queryRecommendations({
        goal: goal.trim() || undefined,
        subjectId: selectedSubject || undefined,
        lifeZoneId: selectedLifeZone,
        level: targetLevel,
      });

      // Track recommendation served event (추천 반환 시점 1회 기록)
      eventTracker.track("recommendation_served", {
        candidateCount: result.candidates.length,
        recommendationSessionId: currentSessionId,
        metadata: {
          goal,
          subjectId: selectedSubject,
          lifeZoneId: selectedLifeZone,
          level: targetLevel,
        },
      });

      setCandidates(result.candidates);
      setFailureReason(result.failureReason ?? null);
    } catch (err) {
      setFailureReason(err instanceof Error ? err.message : "추천 결과를 조회하지 못했습니다.");
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  }

  function getSubjectName(id: string) {
    return subjects.find((s) => s.id === id)?.name ?? id;
  }

  function getLifeZoneName(id: string) {
    return lifeZones.find((z) => z.id === id)?.name ?? id;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div className="cmt-section-header">
        <h1 className="cmt-section-title">조건·태그 기반 맞춤 추천</h1>
        <p className="cmt-section-subtitle">
          학습자의 목표와 시간·생활권 조건에 부합하는 검증된 교육자 수업을 추천합니다.
        </p>
      </div>

      {/* Query Form */}
      <Card padding="lg">
        {metaError && (
          <div role="alert" className="cmt-notice cmt-notice--critical">
            {metaError}
            <Button type="button" variant="outline" size="sm" onClick={() => void loadMeta()}>
              다시 불러오기
            </Button>
          </div>
        )}
        <form onSubmit={handleSearch}>
          <div className="cmt-grid-2">
            <FormField
              label="학습 목표 또는 키워드"
              fieldId="rec-goal"
              value={goal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoal(e.target.value)}
              placeholder="예: 자료구조 기초 개념, 파이썬 알고리즘 실습, 편입 전공 면접"
              helperText="해당 키워드가 포함된 수업을 선호 조건으로 우선 평가합니다."
            />

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "160px" }}>
                <FormField
                  label="과목"
                  fieldId="rec-subject"
                  as="select"
                  disabled={isLoadingMeta || !!metaError}
                  value={selectedSubject}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedSubject(e.target.value)}
                >
                  <option value="">전체 과목</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </FormField>
              </div>

              <div style={{ flex: 1, minWidth: "160px" }}>
                <FormField
                  label="희망 생활권"
                  fieldId="rec-lifezone"
                  as="select"
                  disabled={isLoadingMeta || !!metaError || lifeZones.length === 0}
                  required
                  value={selectedLifeZone}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedLifeZone(e.target.value)}
                >
                  <option value="" disabled>
                    {isLoadingMeta ? "생활권 불러오는 중…" : metaError ? "생활권 조회 실패" : lifeZones.length === 0 ? "등록된 생활권 없음" : "생활권을 선택해주세요"}
                  </option>
                  {lifeZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </FormField>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "8px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>학습 수준:</span>
              <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <input
                  type="radio"
                  name="level"
                  value="introductory"
                  checked={targetLevel === "introductory"}
                  onChange={() => setTargetLevel("introductory")}
                />
                비전공자/입문
              </label>
              <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <input
                  type="radio"
                  name="level"
                  value="intermediate"
                  checked={targetLevel === "intermediate"}
                  onChange={() => setTargetLevel("intermediate")}
                />
                전공 심화
              </label>
              <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <input
                  type="radio"
                  name="level"
                  value="exam_prep"
                  checked={targetLevel === "exam_prep"}
                  onChange={() => setTargetLevel("exam_prep")}
                />
                편입/시험 대비
              </label>
            </div>

            <Button type="submit" variant="primary" style={{ marginLeft: "auto" }} isLoading={isLoading} disabled={isLoadingMeta || !!metaError || !selectedLifeZone}>
              추천 검색 실행
            </Button>
          </div>
        </form>
      </Card>

      {/* Results Section */}
      {hasQueried && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
              추천 후보 {candidates.length}건
            </h2>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              * 화면에 보이는 카드에 한해 노출(Impression) 이벤트가 개별 전송됩니다.
            </span>
          </div>

          {isLoading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              조건에 맞는 교육자를 탐색 중입니다...
            </div>
          ) : candidates.length === 0 ? (
            /* Empty Result & Alternative Actions (SRC-03) */
            <div className="cmt-empty-state">
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📋</div>
              <h3 className="cmt-empty-state__title">
                {failureReason ?? "조건에 일치하는 교육자 수업이 없습니다"}
              </h3>
              <p className="cmt-empty-state__desc">
                필수 조건을 임의로 완화하여 부정확한 수업을 추천하지 않습니다.
                <br />
                대체 시간을 확인하시거나, 적합한 교육자 등록 시 알림을 받으실 수 있도록 <strong>대기 신청</strong>을 남겨주세요.
                <br />
                <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>
                  (대기 신청은 예약 또는 결제가 아닙니다)
                </span>
              </p>
              <div className="cmt-empty-state__actions">
                <Link href="/learning-requests/new">
                  <Button variant="primary">맞춤 학습 요청서 등록하기</Button>
                </Link>
                <Link href="/courses">
                  <Button variant="outline">전체 개설 수업 보기</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="cmt-grid-2">
              {candidates.map((cand) => (
                <ImpressionCandidateCard
                  key={cand.course.id}
                  candidate={cand}
                  sessionId={sessionId}
                  getSubjectName={getSubjectName}
                  getLifeZoneName={getLifeZoneName}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Guidance */}
      <div className="cmt-notice cmt-notice--info">
        <strong>💡 추천 이유 표시 안내:</strong> 상단의 태그(✓ 희망 시간대 일치, ✓ 비전공자 입문 맞춤 등)는 객관적으로 확인된 조건만을 근거로 부여됩니다. 확인되지 않은 교육 능력이나 합격 여부를 예측하여 추천하지 않습니다.
      </div>
    </div>
  );
}
