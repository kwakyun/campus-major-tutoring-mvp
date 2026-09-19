"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchWhoAmI,
  getTutorPublicProfile,
  upsertTutorProfile,
  type TutorCareerItem,
  type WhoAmI,
  ApiError,
} from "../../../lib/api-client";
import { Button, Card, CardBody, FormField, StatusBadge } from "@campus-major-tutoring-mvp/ui";

export default function TutorProfilePage() {
  const [currentUser, setCurrentUser] = useState<WhoAmI | null>(null);
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [careers, setCareers] = useState<TutorCareerItem[]>([
    { label: "", verified: false },
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
        setCurrentUser(user);

        if (user && user.roles.includes("tutor")) {
          const profile = await getTutorPublicProfile(user.userId).catch(() => null);
          if (profile) {
            setSchool(profile.school ?? "");
            setMajor(profile.major ?? "");
          }
        }
      } catch (err) {
        setErrorText(err instanceof Error ? err.message : "프로필 조회에 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  function handleAddCareer() {
    setCareers([...careers, { label: "", verified: false }]);
  }

  function handleCareerChange(index: number, val: string) {
    const next = [...careers];
    next[index].label = val;
    setCareers(next);
  }

  function handleRemoveCareer(index: number) {
    setCareers(careers.filter((_, i) => i !== index));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setErrorText(null);
    setSuccessText(null);

    try {
      const validCareers = careers.filter((c) => c.label.trim().length > 0);
      await upsertTutorProfile({
        selfReportedSchool: school.trim() || undefined,
        selfReportedMajor: major.trim() || undefined,
        selfReportedCareer: validCareers,
      });

      setSuccessText("교육자 자기기재 프로필이 성공적으로 저장되었습니다.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setErrorText("교육자(tutor) 권한이 필요합니다. 상단에서 세션을 tutor로 설정해주세요.");
      } else {
        setErrorText(err instanceof Error ? err.message : "프로필 저장 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  const isTutor = currentUser?.roles.includes("tutor");

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="cmt-section-header">
        <div style={{ display: "flex", gap: "12px", marginBottom: "8px", fontSize: "0.85rem" }}>
          <Link href="/tutor/courses" style={{ color: "var(--text-muted)" }}>
            내 수업 관리
          </Link>
          <span>·</span>
          <span style={{ color: "var(--primary)", fontWeight: 700 }}>프로필 및 경력</span>
          <span>·</span>
          <Link href="/tutor/availability" style={{ color: "var(--text-muted)" }}>
            가능 시간 설정
          </Link>
        </div>
        <h1 className="cmt-section-title">교육자 프로필 및 경력 관리</h1>
        <p className="cmt-section-subtitle">
          자기기재 정보와 공식 검증 정보를 분리하여 학습자에게 투명하게 제공합니다.
        </p>
      </div>

      {!isTutor && !isLoading && (
        <div className="cmt-notice cmt-notice--warning">
          현재 세션은 교육자(tutor) 역할이 아닙니다. 교육자 프로필을 저장하려면 상단에서 <strong>tutor 세션</strong>으로 전환해주세요.
          <div style={{ marginTop: "8px" }}>
            <Link href="/login">
              <Button size="sm">세션 설정 페이지로 이동</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Verification Status Banner (SRC-02) */}
      <Card padding="md" style={{ background: "var(--bg-subtle)" }}>
        <CardBody>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "4px" }}>
                현재 공식 신원 확인 상태
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                학생증 및 재학 서류 증빙을 통해 공식 인증 배지를 부여받을 수 있습니다.
              </p>
            </div>
            <StatusBadge
              label={currentUser?.identityVerificationStatus ?? "self_reported"}
              size="md"
            />
          </div>
        </CardBody>
      </Card>

      {/* Profile Form */}
      <Card padding="lg">
        <form onSubmit={handleSave}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <FormField
              label="소속 학교 (자기기재)"
              fieldId="tutor-school"
              value={school}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSchool(e.target.value)}
              placeholder="예: 한국대학교 (재학 또는 졸업)"
              helperText="학생증 인증 전까지는 '자기기재'로 노출됩니다."
            />

            <FormField
              label="전공 학과 (자기기재)"
              fieldId="tutor-major"
              value={major}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMajor(e.target.value)}
              placeholder="예: 컴퓨터공학과 / 데이터사이언스"
              helperText="실제 개설할 수업 과목과 관련된 전공을 적어주세요."
            />
          </div>

          {/* Career Section */}
          <div style={{ marginTop: "12px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ fontSize: "0.88rem", fontWeight: 700 }}>
                수업 및 전공 관련 경력 (자기기재)
              </label>
              <Button size="sm" variant="outline" type="button" onClick={handleAddCareer}>
                + 경력 항목 추가
              </Button>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "12px" }}>
              검증되지 않은 경력이나 자격은 상세 페이지에서 &apos;자기기재&apos;로 명확히 라벨링됩니다.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {careers.map((career, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="text"
                    value={career.label}
                    onChange={(e) => handleCareerChange(idx, e.target.value)}
                    placeholder="예: 알고리즘 학부 학점 A+, 오픈소스 프로젝트 컨트리뷰터, 교내 튜터링 1회 활동"
                    className="cmt-form-field__input"
                    style={{ flex: 1 }}
                  />
                  {careers.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => handleRemoveCareer(idx)}
                    >
                      삭제
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {errorText && (
            <div className="cmt-notice cmt-notice--critical" role="alert">
              {errorText}
            </div>
          )}

          {successText && (
            <div className="cmt-notice cmt-notice--info" role="status">
              {successText}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
            <Button type="submit" variant="primary" isLoading={isSaving} disabled={!isTutor}>
              프로필 저장 완료
            </Button>
          </div>
        </form>
      </Card>

      <div className="cmt-notice cmt-notice--info">
        <strong>🔒 개인정보 및 명칭 보호:</strong> 전공한시간은 교육자의 실명과 연락처를 공개 화면에 노출하지 않고 &apos;교육자-xxxx&apos; 형태의 비식별 닉네임으로 보호합니다. 공식 인증 및 협의 단계에서만 시스템상 안전하게 관리됩니다.
      </div>
    </div>
  );
}
