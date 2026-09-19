"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listMyLearningRequests,
  withdrawLearningRequest,
  registerWaitlist,
  withdrawWaitlist,
  listLifeZones,
  type LearningRequestRecord,
  type LifeZoneRecord,
  ApiError,
} from "../../lib/api-client";
import { Button, Card, CardBody, CardFooter, CardHeader, StatusBadge } from "@campus-major-tutoring-mvp/ui";

export default function LearningRequestsPage() {
  const [requests, setRequests] = useState<LearningRequestRecord[]>([]);
  const [lifeZones, setLifeZones] = useState<LifeZoneRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  // 대기 신청 모달/상태
  const [activeWaitlistRequestId, setActiveWaitlistRequestId] = useState<string | null>(null);
  const [alternativeTimeAccepted, setAlternativeTimeAccepted] = useState(true);
  const [notifyConsent, setNotifyConsent] = useState(true);
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);

  async function loadData() {
    setIsLoading(true);
    setErrorText(null);
    setNeedsLogin(false);
    try {
      const [list, zones] = await Promise.all([
        listMyLearningRequests(),
        listLifeZones().catch(() => [] as LifeZoneRecord[]),
      ]);
      setRequests(list);
      setLifeZones(zones);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setNeedsLogin(true);
        setErrorText(err.status === 401
          ? "로그인 후 내 학습 요청을 확인할 수 있습니다."
          : "학습자 계정으로 로그인해주세요.");
      } else {
        setErrorText(err instanceof Error ? err.message : "학습 요청 목록을 불러오지 못했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleWithdrawRequest(id: string) {
    if (!confirm("이 학습 요청을 철회하시겠습니까?")) return;
    try {
      await withdrawLearningRequest(id);
      alert("학습 요청이 철회되었습니다.");
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "철회 실패");
    }
  }

  async function handleRegisterWaitlist(requestId: string) {
    setIsSubmittingWaitlist(true);
    try {
      const res = await registerWaitlist(requestId, {
        alternativeTimeAccepted,
        notifyConsent,
      });

      if (res.isNew === false) {
        alert("이미 활성 상태인 대기 신청이 존재합니다 (기존 신청 유지).");
      } else {
        alert("대기 신청이 완료되었습니다. (예약·결제는 발생하지 않으며, 신규 교육자 매칭 시 알림이 제공됩니다)");
      }
      setActiveWaitlistRequestId(null);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "대기 신청에 실패했습니다.");
    } finally {
      setIsSubmittingWaitlist(false);
    }
  }

  async function handleWithdrawWaitlist(requestId: string, waitlistId: string) {
    if (!confirm("대기 신청을 철회하시겠습니까?")) return;
    try {
      await withdrawWaitlist(requestId, waitlistId);
      alert("대기 신청이 철회되었습니다.");
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "대기 신청 철회 실패");
    }
  }

  function getLifeZoneName(id: string) {
    return lifeZones.find((z) => z.id === id)?.name ?? id;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--electric-chartreuse)" }} />
            <span style={{ fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
              Learning Journey
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.2rem)",
              fontWeight: 800,
              color: "var(--charcoal-deep)",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            내 학습 요청 및 대기 현황
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
            등록하신 맞춤 학습 요청과 1:1 튜터 매칭 대기 현황을 확인하세요.
          </p>
        </div>
        <Link href="/learning-requests/new">
          <Button variant="primary">
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
            <span>새 맞춤 요청 작성</span>
          </Button>
        </Link>
      </div>

      {errorText && (
        <div className="cmt-notice cmt-notice--critical" role="alert">
          {errorText}
          {needsLogin && <div style={{ marginTop: "8px" }}>
            <Link href="/login">
              <Button size="sm" variant="outline">
                학습자 세션으로 전환하기 →
              </Button>
            </Link>
          </div>}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          학습 요청 목록을 불러오는 중입니다...
        </div>
      ) : errorText ? null : requests.length === 0 ? (
        <div className="cmt-empty-state">
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📝</div>
          <h2 className="cmt-empty-state__title">등록된 학습 요청이 없습니다</h2>
          <p className="cmt-empty-state__desc">
            원하는 수업을 찾지 못하셨다면 목표와 예산을 적어 맞춤 학습 요청을 등록해보세요.
            <br />
            대학 재학생뿐 아니라 편입준비생, 비전공자 누구나 등록 가능합니다.
          </p>
          <div className="cmt-empty-state__actions">
            <Link href="/learning-requests/new">
              <Button variant="primary">첫 학습 요청서 등록하기</Button>
            </Link>
            <Link href="/courses">
              <Button variant="secondary">개설 수업 둘러보기</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {requests.map((req) => (
            <Card key={req.id} padding="lg">
              <CardHeader>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <StatusBadge label={req.status} />
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      등록일: {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>ID: {req.id}</span>
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "8px", color: "var(--text-main)" }}>
                  {req.goal}
                </h3>
              </CardHeader>

              <CardBody>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "0.86rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                  <div>
                    📍 <strong>생활권:</strong> {getLifeZoneName(req.lifeZoneId)}
                  </div>
                  <div>
                    📊 <strong>현재 수준:</strong> {req.level ?? "수준 확인 필요 (제한 없음)"}
                  </div>
                  <div>
                    💰 <strong>희망 예산:</strong>{" "}
                    {req.budgetRange
                      ? `₩${req.budgetRange.min?.toLocaleString()} ~ ₩${req.budgetRange.max?.toLocaleString()}`
                      : "미지정"}
                  </div>
                  {req.deadline && (
                    <div>
                      📅 <strong>희망 기한:</strong> {new Date(req.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {req.matchingFailureReason && (
                  <div className="cmt-notice cmt-notice--warning" style={{ margin: "10px 0" }}>
                    <strong>매칭 알림:</strong> {req.matchingFailureReason}
                    {req.operatorNote ? ` (${req.operatorNote})` : ""}
                  </div>
                )}
              </CardBody>

              <CardFooter>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {req.status === "open" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveWaitlistRequestId(req.id)}
                    >
                      대기 신청 등록
                    </Button>
                  )}

                  {req.status !== "withdrawn" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleWithdrawRequest(req.id)}
                    >
                      요청 철회
                    </Button>
                  )}
                </div>

                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  * 대기 신청은 예약·결제를 생성하지 않습니다 (SRC-03)
                </div>
              </CardFooter>

              {/* Waitlist Registration Modal for this Request */}
              {activeWaitlistRequestId === req.id && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "16px",
                    background: "var(--bg-subtle)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-strong)",
                  }}
                >
                  <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "8px" }}>
                    튜터 매칭 대기 신청 (Waitlist)
                  </h4>
                  <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "12px" }}>
                    조건에 맞는 튜터가 새로 등록되거나 대체 일정이 확보되면 즉시 알림을 전달합니다.
                    <br />
                    <strong>(대기 신청은 좌석 점유나 결제를 발생시키지 않으며, 언제든 철회할 수 있습니다)</strong>
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                    <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="checkbox"
                        checked={alternativeTimeAccepted}
                        onChange={(e) => setAlternativeTimeAccepted(e.target.checked)}
                      />
                      대체 가능한 다른 시간대 수업 제안 수용
                    </label>

                    <label style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="checkbox"
                        checked={notifyConsent}
                        onChange={(e) => setNotifyConsent(e.target.checked)}
                      />
                      신규 튜터 등록 시 알림 수신 동의 (필수)
                    </label>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={!notifyConsent || isSubmittingWaitlist}
                      isLoading={isSubmittingWaitlist}
                      onClick={() => handleRegisterWaitlist(req.id)}
                    >
                      대기 신청 확정
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setActiveWaitlistRequestId(null)}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
