"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listTutorCourses,
  updateCourse,
  cloneCourseVersion,
  listCourseVersions,
  listSubjects,
  listLifeZones,
  type CourseRecord,
  type CourseStatus,
  type CurriculumVersionRecord,
  type SubjectRecord,
  type LifeZoneRecord,
  ApiError,
} from "../../../lib/api-client";
import { Button, Card, CardBody, CardFooter, CardHeader, StatusBadge } from "@campus-major-tutoring-mvp/ui";

export default function TutorCoursesPage() {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [lifeZones, setLifeZones] = useState<LifeZoneRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // 버전 히스토리 모달
  const [selectedCourseForVersions, setSelectedCourseForVersions] = useState<CourseRecord | null>(null);
  const [versions, setVersions] = useState<CurriculumVersionRecord[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  async function loadData() {
    setIsLoading(true);
    setErrorText(null);
    try {
      const [list, subs, zones] = await Promise.all([
        listTutorCourses(),
        listSubjects().catch(() => [] as SubjectRecord[]),
        listLifeZones().catch(() => [] as LifeZoneRecord[]),
      ]);
      setCourses(list);
      setSubjects(subs);
      setLifeZones(zones);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setErrorText(
          err.status === 401
            ? "로그인이 필요합니다. 상단 로그인 메뉴에서 교육자 계정으로 로그인해주세요."
            : "교육자(tutor) 권한 세션이 필요합니다. 상단에서 세션을 tutor로 설정해주세요.",
        );
      } else {
        setErrorText(err instanceof Error ? err.message : "수업 목록을 불러오지 못했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleStatusChange(courseId: string, nextStatus: CourseStatus) {
    try {
      await updateCourse(courseId, { status: nextStatus });
      alert(`수업 상태가 '${nextStatus}'(으)로 변경되었습니다.`);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "상태 변경에 실패했습니다.");
    }
  }

  async function handleCloneCourse(courseId: string) {
    if (!confirm("이 수업의 커리큘럼을 새 버전으로 복제하시겠습니까? (소유자 본인 커리큘럼만 복제 가능)")) {
      return;
    }

    try {
      const cloned = await cloneCourseVersion(courseId, courseId);
      alert(`커리큘럼 버전 ${cloned.version}이(가) 복제 생성되었습니다.`);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "커리큘럼 복제에 실패했습니다.");
    }
  }

  async function handleViewVersions(c: CourseRecord) {
    setSelectedCourseForVersions(c);
    setIsLoadingVersions(true);
    try {
      const vList = await listCourseVersions(c.id);
      setVersions(vList);
    } catch (err) {
      alert(err instanceof Error ? err.message : "버전 목록 조회 실패");
      setVersions([]);
    } finally {
      setIsLoadingVersions(false);
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
      {/* Top Subnav & Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          {/* Subnav Pills */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
            <span
              style={{
                padding: "4px 14px",
                borderRadius: "var(--radius-full)",
                background: "var(--charcoal-deep)",
                color: "var(--bg-cream)",
                fontSize: "0.78rem",
                fontWeight: 700,
              }}
            >
              내 수업 관리
            </span>
            <Link
              href="/tutor/profile"
              style={{
                padding: "4px 14px",
                borderRadius: "var(--radius-full)",
                background: "var(--bg-ivory)",
                color: "var(--charcoal-deep)",
                fontSize: "0.78rem",
                fontWeight: 600,
              }}
            >
              프로필 및 공식 검증
            </Link>
            <Link
              href="/tutor/availability"
              style={{
                padding: "4px 14px",
                borderRadius: "var(--radius-full)",
                background: "var(--bg-ivory)",
                color: "var(--charcoal-deep)",
                fontSize: "0.78rem",
                fontWeight: 600,
              }}
            >
              가능 시간대 설정
            </Link>
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
            내 개설 수업 관리
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
            작성한 커리큘럼의 심사·공개 상태를 제어하고 버전을 복제 관리합니다.
          </p>
        </div>

        <Link href="/tutor/courses/new">
          <Button variant="primary">
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
            <span>새 수업 작성하기</span>
          </Button>
        </Link>
      </div>

      {errorText && (
        <div className="cmt-notice cmt-notice--critical" role="alert">
          {errorText}
          <div style={{ marginTop: "8px" }}>
            <Link href="/login">
              <Button size="sm" variant="outline">
                교육자(tutor) 세션으로 전환하기 →
              </Button>
            </Link>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          수업 목록을 불러오는 중입니다...
        </div>
      ) : courses.length === 0 ? (
        <div className="cmt-empty-state">
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📚</div>
          <h2 className="cmt-empty-state__title">개설된 수업이 없습니다</h2>
          <p className="cmt-empty-state__desc">
            자신의 전공 지식을 살려 1:1 튜터링 수업을 등록해보세요.
            <br />
            임시저장(draft) 후 심사를 거쳐 학생들에게 공개됩니다.
          </p>
          <div className="cmt-empty-state__actions">
            <Link href="/tutor/courses/new">
              <Button variant="primary">첫 수업 작성하기</Button>
            </Link>
            <Link href="/tutor/availability">
              <Button variant="secondary">수업 가능 시간 먼저 설정하기</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {courses.map((course) => (
            <Card key={course.id} padding="lg">
              <CardHeader>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <StatusBadge label={course.status} />
                    <StatusBadge label={getSubjectName(course.subjectId)} tone="info" size="sm" />
                    <StatusBadge label={getLifeZoneName(course.lifeZoneId)} tone="neutral" size="sm" />
                  </div>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>ID: {course.id}</span>
                </div>

                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "10px", color: "var(--text-main)" }}>
                  {course.learningGoal}
                </h3>
              </CardHeader>

              <CardBody>
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "0.86rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                  <span>희망가: <strong>₩{course.askingPrice.toLocaleString()}</strong> (60분 기준)</span>
                  <span>단원 수: <strong>{course.unitBreakdown?.length ?? 0}개 단원</strong></span>
                  <span>권장 수준: <strong>{course.prerequisiteLevel ?? "제한 없음"}</strong></span>
                </div>

                {course.sampleDescription && (
                  <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", background: "var(--bg-subtle)", padding: "8px 12px", borderRadius: "var(--radius-sm)", marginBottom: "8px" }}>
                    📖 <strong>샘플 설명:</strong> {course.sampleDescription}
                  </p>
                )}

                {course.expectedOutcome && (
                  <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", background: "var(--accent-light)", padding: "8px 12px", borderRadius: "var(--radius-sm)" }}>
                    🎯 <strong>예상 결과물:</strong> {course.expectedOutcome}
                  </p>
                )}
              </CardBody>

              <CardFooter>
                {/* Status Transitions & Curriculum Cloning */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {course.status === "draft" && (
                    <>
                      <Button size="sm" variant="primary" onClick={() => handleStatusChange(course.id, "pending_review")}>
                        심사 대기 요청 (pending_review)
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(course.id, "published")}>
                        즉시 공개 (published)
                      </Button>
                    </>
                  )}

                  {course.status === "pending_review" && (
                    <>
                      <Button size="sm" variant="primary" onClick={() => handleStatusChange(course.id, "published")}>
                        공개 승인 완료 (published)
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleStatusChange(course.id, "draft")}>
                        임시저장 복귀 (draft)
                      </Button>
                    </>
                  )}

                  {course.status === "published" && (
                    <Button size="sm" variant="danger" onClick={() => handleStatusChange(course.id, "unpublished")}>
                      수업 비공개 전환 (unpublished)
                    </Button>
                  )}

                  {/* 커리큘럼 복제 버튼 (S04-T01 소유자만 복제 가능) */}
                  <Button size="sm" variant="outline" onClick={() => handleCloneCourse(course.id)}>
                    📋 커리큘럼 복제 (새 버전 생성)
                  </Button>

                  <Button size="sm" variant="ghost" onClick={() => handleViewVersions(course)}>
                    버전 히스토리 보기
                  </Button>
                </div>

                {course.status === "published" && (
                  <Link href={`/courses/${course.id}`}>
                    <Button size="sm" variant="secondary">
                      공개 상세 화면 확인 →
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Version History Modal */}
      {selectedCourseForVersions && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "var(--radius-lg)",
              maxWidth: "540px",
              width: "100%",
              padding: "28px",
              boxShadow: "var(--shadow-lg)",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>
              커리큘럼 버전 이력: {selectedCourseForVersions.learningGoal}
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "16px" }}>
              소유자 복제를 통해 관리된 버전 스냅샷 목록입니다. (과거 예약 사본에는 소급 적용되지 않음)
            </p>

            {isLoadingVersions ? (
              <p style={{ color: "var(--text-muted)", padding: "20px 0" }}>버전 목록을 불러오는 중...</p>
            ) : versions.length === 0 ? (
              <p style={{ color: "var(--text-muted)", padding: "20px 0" }}>
                아직 생성된 복제 버전이 없습니다. &apos;커리큘럼 복제&apos; 버튼으로 새 버전을 만드실 수 있습니다.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                {versions.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px 16px",
                      background: "var(--bg-subtle)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700 }}>버전 {v.version}</span>
                      <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                        {new Date(v.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {v.clonedFromCourseId && (
                      <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        복제 원본: {v.clonedFromCourseId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={() => setSelectedCourseForVersions(null)}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
