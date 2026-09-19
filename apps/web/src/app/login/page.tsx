"use client";

import { useEffect, useState } from "react";
import { Button, FormField, StatusBadge } from "@campus-major-tutoring-mvp/ui";
import { ApiError, fetchWhoAmI, type WhoAmI } from "../../lib/api-client";

export default function LoginPage() {
  const [sessionKeyInput, setSessionKeyInput] = useState("fake-learner-prep");
  const [currentUser, setCurrentUser] = useState<WhoAmI | null>(null);
  const [errorText, setErrorText] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  async function refreshWhoAmI() {
    setIsLoading(true);
    setErrorText(undefined);
    try {
      const user = await fetchWhoAmI();
      setCurrentUser(user);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorText(`${error.code}: ${error.message}`);
      } else {
        setErrorText("알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshWhoAmI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogin() {
    document.cookie = `session=${sessionKeyInput}; path=/; SameSite=Lax`;
    void refreshWhoAmI();
  }

  function handleLogout() {
    document.cookie = "session=; path=/; SameSite=Lax; Max-Age=0";
    setCurrentUser(null);
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 12px",
            borderRadius: "var(--radius-full)",
            background: "var(--soft-lime)",
            color: "var(--charcoal-deep)",
            fontSize: "0.78rem",
            fontWeight: 800,
            marginBottom: "10px",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
            key
          </span>
          세션 전환기
        </div>
        <h1
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.2rem)",
            fontWeight: 800,
            color: "var(--charcoal-deep)",
            letterSpacing: "-0.02em",
            margin: "0 0 8px 0",
          }}
        >
          로그인 및 역할 세션 선택
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
          개발 및 시연 환경용 테스트 계정 선택 화면입니다. 원하는 역할을 클릭하여 즉시 세션을 전환할 수 있습니다.
        </p>
      </div>

      <div
        className="cmt-card"
        style={{
          padding: "28px",
          background: "var(--bg-surface)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <FormField
          label="테스트 세션 키"
          fieldId="session-key"
          value={sessionKeyInput}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSessionKeyInput(event.target.value)}
          placeholder="fake-learner-prep | fake-learner-enrolled | fake-tutor | fake-operator"
          helperText="아래 버튼을 눌러 테스트 역할을 간편하게 선택하세요."
        />

        <div>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>
            빠른 역할 프리셋:
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Button
              size="sm"
              variant={sessionKeyInput === "fake-learner-prep" ? "primary" : "secondary"}
              type="button"
              onClick={() => setSessionKeyInput("fake-learner-prep")}
            >
              편입준비생 (학습자)
            </Button>
            <Button
              size="sm"
              variant={sessionKeyInput === "fake-learner-enrolled" ? "primary" : "secondary"}
              type="button"
              onClick={() => setSessionKeyInput("fake-learner-enrolled")}
            >
              재학생 (학습자)
            </Button>
            <Button
              size="sm"
              variant={sessionKeyInput === "fake-tutor" ? "primary" : "secondary"}
              type="button"
              onClick={() => setSessionKeyInput("fake-tutor")}
            >
              튜터 (교육자)
            </Button>
            <Button
              size="sm"
              variant={sessionKeyInput === "fake-operator" ? "primary" : "secondary"}
              type="button"
              onClick={() => setSessionKeyInput("fake-operator")}
            >
              운영자
            </Button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", paddingTop: "8px", borderTop: "1px solid var(--border-subtle)" }}>
          <Button onClick={handleLogin} disabled={isLoading} isLoading={isLoading}>
            <span>로그인 (세션 활성화)</span>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              login
            </span>
          </Button>
          <Button variant="secondary" onClick={handleLogout} disabled={isLoading}>
            로그아웃
          </Button>
        </div>

        {errorText && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--tone-critical-bg)",
              color: "var(--tone-critical-text)",
              fontSize: "0.85rem",
            }}
            role="alert"
          >
            {errorText}
          </div>
        )}
      </div>

      {currentUser ? (
        <div
          className="cmt-card"
          style={{
            padding: "24px",
            background: "var(--bg-ivory)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--charcoal-deep)", margin: 0 }}>
              현재 활성 세션 정보
            </h2>
            <StatusBadge label={currentUser.identityVerificationStatus} dot />
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--charcoal-deep)", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div>
              <strong>User ID:</strong> <code>{currentUser.userId}</code>
            </div>
            <div>
              <strong>역할 (Roles):</strong> {currentUser.roles.join(", ")}
            </div>
            <div>
              <strong>소속 유형:</strong> {currentUser.schoolAffiliation.affiliationType}
              {currentUser.schoolAffiliation.campusId ? ` (${currentUser.schoolAffiliation.campusId})` : ""}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--border-strong)",
            fontSize: "0.88rem",
            color: "var(--text-muted)",
          }}
        >
          현재 로그인되어 있지 않습니다. 위에서 역할을 선택한 뒤 로그인하세요.
        </div>
      )}
    </div>
  );
}
