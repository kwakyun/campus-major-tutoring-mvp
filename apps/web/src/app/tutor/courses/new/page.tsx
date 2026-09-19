"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createCourse,
  generateCurriculumDraft,
  listSubjects,
  listLifeZones,
  fetchWhoAmI,
  type SubjectRecord,
  type LifeZoneRecord,
  type UnitBreakdownItem,
  type CurriculumSource,
  ApiError,
} from "../../../../lib/api-client";
import { Button, Card, FormField } from "@campus-major-tutoring-mvp/ui";

export default function NewCoursePage() {
  const router = useRouter();

  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [lifeZones, setLifeZones] = useState<LifeZoneRecord[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [lifeZoneId, setLifeZoneId] = useState("");

  const [learningGoal, setLearningGoal] = useState("");
  const [askingPrice, setAskingPrice] = useState("25000");
  const [totalMinutes, setTotalMinutes] = useState("60");
  const [prerequisiteLevel, setPrerequisiteLevel] = useState("introductory");
  const [targetAudience, setTargetAudience] = useState("");
  const [sampleDescription, setSampleDescription] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");

  const [units, setUnits] = useState<UnitBreakdownItem[]>([
    { title: "1단원: 핵심 개념 이해 및 질의응답", description: "주요 이론 및 배경 지식 1:1 점검" },
    { title: "2단원: 실습 과제 및 코드 리뷰", description: "작성한 코드 디버깅 및 피드백" },
  ]);

  // AI 커리큘럼 초안 생성 (에드혹 추가, docs/handoffs/ADHOC-01-ai-curriculum-draft.md).
  // 튜터는 이 섹션으로 "AI로 빠르게 만들기"를, 아래 기존 폼으로 "직접 작성"을 선택할 수 있다 —
  // 둘 다 같은 폼 필드를 채울 뿐이며, 등록 경로(POST /tutor/courses)는 하나로 공유한다.
  const [aiTopic, setAiTopic] = useState("");
  const [aiSessionCount, setAiSessionCount] = useState("4");
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [curriculumSource, setCurriculumSource] = useState<CurriculumSource>("manual");
  const [generatorVersion, setGeneratorVersion] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [subs, zones, user] = await Promise.all([
          listSubjects(),
          listLifeZones(),
          fetchWhoAmI(),
        ]);
        setSubjects(subs);
        setLifeZones(zones);
        if (subs.length > 0) setSubjectId(subs[0].id);
        if (zones.length > 0) setLifeZoneId(zones[0].id);

        if (!user || !user.roles.includes("tutor")) {
          // not tutor notification handled
        }
      } catch {
        // handled
      }
    }
    void init();
  }, []);

  function handleAddUnit() {
    setUnits([...units, { title: `${units.length + 1}단원: `, description: "" }]);
  }

  function handleUnitChange(index: number, field: "title" | "description", val: string) {
    const next = [...units];
    next[index][field] = val;
    setUnits(next);
  }

  function handleRemoveUnit(index: number) {
    setUnits(units.filter((_, i) => i !== index));
  }

  async function handleGenerateDraft() {
    if (!aiTopic.trim()) {
      setDraftError("가르치고 싶은 분야를 입력해주세요. (예: 자료구조, 편입영어 독해)");
      return;
    }

    setIsGeneratingDraft(true);
    setDraftError(null);

    try {
      const draft = await generateCurriculumDraft({
        topic: aiTopic.trim(),
        subjectId: subjectId || undefined,
        level: prerequisiteLevel,
        sessionCount: Number(aiSessionCount) || 4,
      });

      setLearningGoal(draft.learningGoal);
      setUnits(draft.unitBreakdown);
      setExpectedOutcome(draft.expectedOutcome);
      setTotalMinutes(String(draft.totalMinutes));
      setCurriculumSource(draft.curriculumSource);
      setGeneratorVersion(draft.generatorVersion);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setDraftError("교육자(tutor) 권한 세션이 필요합니다. 상단에서 세션을 tutor로 설정해주세요.");
      } else {
        setDraftError(err instanceof Error ? err.message : "커리큘럼 초안 생성에 실패했습니다.");
      }
    } finally {
      setIsGeneratingDraft(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!learningGoal.trim()) {
      setErrorText("학습 목표를 입력해주세요.");
      return;
    }
    if (!subjectId || !lifeZoneId) {
      setErrorText("과목과 생활권을 선택해주세요.");
      return;
    }

    const priceNum = Number(askingPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setErrorText("희망가는 0 이상의 금액이어야 합니다.");
      return;
    }

    setIsLoading(true);
    setErrorText(null);

    try {
      const idempotencyKey = `course-create-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      await createCourse(
        {
          learningGoal: learningGoal.trim(),
          subjectId,
          lifeZoneId,
          askingPrice: priceNum,
          totalMinutes: Number(totalMinutes) || 60,
          prerequisiteLevel,
          targetAudience: targetAudience.trim() || null,
          sampleDescription: sampleDescription.trim() || null,
          expectedOutcome: expectedOutcome.trim() || null,
          unitBreakdown: units.filter((u) => u.title.trim().length > 0),
          curriculumSource,
        },
        idempotencyKey,
      );

      alert("수업이 등록되었습니다 (기본 상태: draft). 내 수업 관리 페이지로 이동합니다.");
      router.push("/tutor/courses");
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setErrorText("교육자(tutor) 권한 세션이 필요합니다. 상단에서 세션을 tutor로 설정해주세요.");
      } else {
        setErrorText(err instanceof Error ? err.message : "수업 생성에 실패했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="cmt-section-header">
        <Link href="/tutor/courses" style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600 }}>
          ← 내 개설 수업 목록
        </Link>
        <h1 className="cmt-section-title" style={{ marginTop: "8px" }}>
          신규 전공 튜터링 수업 개설
        </h1>
        <p className="cmt-section-subtitle">
          자신의 전공 전문성을 살려 1:1 수업을 개설하세요. 등록 후 심사 요청이 가능합니다.
        </p>
      </div>

      <Card padding="lg" style={{ background: "var(--bg-subtle)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
          <div>
            <label style={{ fontSize: "0.88rem", fontWeight: 700 }}>AI로 커리큘럼 초안 빠르게 만들기</label>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
              가르치고 싶은 분야만 입력하면 아래 학습 목표·단원별 커리큘럼 초안을 채워드립니다. 그대로 쓰거나 자유롭게
              수정한 뒤 등록하면 되고, 원하지 않으면 이 단계를 건너뛰고 아래에서 직접 작성해도 됩니다.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
          <input
            type="text"
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder="예: 자료구조, 미시경제학, 편입영어 독해"
            className="cmt-form-field__input"
            style={{ flex: "1 1 240px" }}
          />
          <select
            value={aiSessionCount}
            onChange={(e) => setAiSessionCount(e.target.value)}
            className="cmt-form-field__input"
            style={{ flex: "0 0 120px" }}
          >
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}단원
              </option>
            ))}
          </select>
          <Button type="button" variant="primary" isLoading={isGeneratingDraft} onClick={handleGenerateDraft}>
            AI 초안 생성
          </Button>
        </div>

        {draftError && (
          <div className="cmt-notice cmt-notice--critical" role="alert" style={{ marginTop: "10px" }}>
            {draftError}
          </div>
        )}

        {curriculumSource === "ai_generated" && (
          <div
            className="cmt-notice"
            style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}
          >
            <span style={{ fontSize: "0.82rem" }}>
              아래 내용은 AI 초안({generatorVersion ?? "rule-based"})입니다. 실제 LLM이 아닌 규칙 기반 임시 생성기 결과이니
              내용을 꼭 확인하고 필요한 부분을 직접 수정한 뒤 등록해주세요.
            </span>
            <Button size="sm" variant="ghost" type="button" onClick={() => setCurriculumSource("manual")}>
              직접 작성으로 표시 전환
            </Button>
          </div>
        )}
      </Card>

      <Card padding="lg">
        <form onSubmit={handleSubmit}>
          {/* 과목 & 생활권 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <FormField
              label="과목 분야"
              fieldId="course-subject"
              as="select"
              required
              value={subjectId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSubjectId(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category})
                </option>
              ))}
            </FormField>

            <FormField
              label="수업 생활권"
              fieldId="course-lifezone"
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
          </div>

          {/* 학습 목표 */}
          <FormField
            label="수업 핵심 목표 (Learning Goal)"
            fieldId="course-goal"
            required
            value={learningGoal}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLearningGoal(e.target.value)}
            placeholder="예: 60분 완성 자료구조 연결 리스트 & 트리 구현 마스터"
            helperText="학습자가 탐색 목록에서 가장 먼저 확인하는 수업 명칭이자 목표입니다."
          />

          {/* 가격 & 시간 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <FormField
              label="협의 시작 가격 (KRW / 60분)"
              fieldId="course-price"
              type="number"
              required
              value={askingPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAskingPrice(e.target.value)}
              helperText="협의 시작 가격이며, 교육자 수수료 15%가 적용됩니다."
            />

            <FormField
              label="1회 진행 시간 (분)"
              fieldId="course-duration"
              type="number"
              value={totalMinutes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTotalMinutes(e.target.value)}
            />
          </div>

          {/* 대상 & 수준 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <FormField
              label="권장 선수 수준"
              fieldId="course-level"
              as="select"
              value={prerequisiteLevel}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPrerequisiteLevel(e.target.value)}
            >
              <option value="introductory">비전공자 입문</option>
              <option value="intermediate">전공 기초/중급</option>
              <option value="advanced">전공 심화</option>
              <option value="exam_prep">편입/시험 대비</option>
            </FormField>

            <FormField
              label="추천 수강 대상"
              fieldId="course-audience"
              value={targetAudience}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetAudience(e.target.value)}
              placeholder="예: 자료구조 과제에서 포인터 개념이 막힌 비전공자"
            />
          </div>

          {/* 교육 품질 근거 (Teaching Evidence - SRC-02) */}
          <FormField
            label="샘플 수업 설명 (Sample Description)"
            fieldId="course-sample"
            as="textarea"
            value={sampleDescription}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSampleDescription(e.target.value)}
            placeholder="실제 60분 동안 어떤 흐름으로 수업이 진행되는지 구체적인 진행 예시를 적어주세요."
            helperText="수업의 질과 준비도를 판단할 수 있는 중요한 교육 품질 근거가 됩니다."
          />

          <FormField
            label="달성 예상 결과물 (Expected Outcome)"
            fieldId="course-outcome"
            value={expectedOutcome}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpectedOutcome(e.target.value)}
            placeholder="예: 연결 리스트 삽입/삭제 완전 동작 C 코드 및 메모리 구조 다이어그램 이해"
            helperText="과대광고 및 합격보장 문구는 금지되며, 구체적인 산출물 위주로 작성하세요."
          />

          {/* 단원별 커리큘럼 계획 */}
          <div style={{ marginTop: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <label style={{ fontSize: "0.88rem", fontWeight: 700 }}>
                단원별 커리큘럼 구성 (Unit Breakdown)
              </label>
              <Button size="sm" variant="outline" type="button" onClick={handleAddUnit}>
                + 단원 추가
              </Button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {units.map((unit, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "flex-start",
                    background: "var(--bg-subtle)",
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <input
                      type="text"
                      value={unit.title}
                      onChange={(e) => handleUnitChange(idx, "title", e.target.value)}
                      placeholder="단원 제목"
                      className="cmt-form-field__input"
                    />
                    <input
                      type="text"
                      value={unit.description ?? ""}
                      onChange={(e) => handleUnitChange(idx, "description", e.target.value)}
                      placeholder="단원 세부 실습 및 진행 내용"
                      className="cmt-form-field__input"
                      style={{ fontSize: "0.82rem" }}
                    />
                  </div>
                  {units.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      onClick={() => handleRemoveUnit(idx)}
                    >
                      삭제
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {errorText && (
            <div className="cmt-notice cmt-notice--critical" role="alert" style={{ marginBottom: "16px" }}>
              {errorText}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "24px" }}>
            <Link href="/tutor/courses">
              <Button variant="secondary" type="button">
                취소
              </Button>
            </Link>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              수업 개설 완료 (임시저장)
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
