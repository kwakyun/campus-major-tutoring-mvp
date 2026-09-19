import { Injectable } from "@nestjs/common";
import { DomainError } from "../../common/errors";
import { TimeWindow } from "../catalog/course.types";

export type LearningRequestStatus = "open" | "matched" | "waitlisted" | "expired" | "withdrawn";
export type AcquisitionChannel = "organic" | "community_post" | "referral_manual" | "paid_ad" | "direct";
/** events.yaml acquisition_and_matching.matching_failure_reason */
export type MatchingFailureReason =
  | "time_mismatch"
  | "price_gap"
  | "subject_or_level_mismatch"
  | "quality_concern"
  | "no_candidate";

export interface LearningRequestRecord {
  id: string;
  learnerId: string;
  goal: string;
  level: string | null; // 값 없음 = "수준 확인 필요", 부적격 처리 아님(data-model.md §7)
  deadline: string | null;
  budgetRange: { min?: number; max?: number } | null;
  desiredWindows: TimeWindow[];
  lifeZoneId: string;
  acquisitionChannel: AcquisitionChannel | null;
  status: LearningRequestStatus;
  matchingFailureReason: MatchingFailureReason | null;
  operatorNote: string | null;
  createdAt: string;
}

export interface CreateLearningRequestInput {
  goal: string;
  level?: string | null;
  deadline?: string | null;
  budgetRange?: { min?: number; max?: number } | null;
  desiredWindows?: TimeWindow[];
  lifeZoneId: string;
  acquisitionChannel?: AcquisitionChannel | null;
}

/**
 * 학습 요청(learning_requests) 인메모리 저장소 (S04-T01, SRC-03).
 * 대학 재학 여부는 이 저장소·API 어디에서도 필수 조건으로 검사하지 않는다(SRC-01).
 * 실제 자동 매칭 알고리즘은 A5(S04-T02) 담당이며, 여기서는 저장·조회·운영자 수동
 * 처리(상태 전이 + 실패 사유 기록)만 다룬다.
 *
 * 2026-09-19: 사용자 요청("데이터셋을 더미데이터로 구성")에 따라 더미 학습 요청 2건을
 * 시드한다. 첫 번째(learning-request-seed-1)는 편입준비생(seed-learner-prep-0001,
 * SRC-01 — 학교 미재학이어도 정상 요청)이며, 같은 생활권에 아직 맞는 시간대의
 * 편입영어 교육자를 찾지 못해 운영자가 waitlisted로 처리했다는 시나리오로
 * matching/waitlist-entries.repository.ts의 시드 대기 신청과 짝을 이룬다(SRC-03).
 */
const SEED_LIFE_ZONE_MAIN = "00000000-0000-0000-0000-000000000101"; // 부산대학교 정문~부산대역 생활권
const SEED_REQUESTS: LearningRequestRecord[] = [
  {
    id: "learning-request-seed-1",
    learnerId: "seed-learner-prep-0001",
    goal: "편입 영어 독해 기초부터 시작하고 싶습니다",
    level: null,
    deadline: null,
    budgetRange: null,
    desiredWindows: [],
    lifeZoneId: SEED_LIFE_ZONE_MAIN,
    acquisitionChannel: "community_post",
    status: "waitlisted",
    matchingFailureReason: "time_mismatch",
    operatorNote: "생활권 내 편입영어 교육자와 희망 시간대가 아직 맞지 않아 대기 신청으로 안내함",
    createdAt: new Date().toISOString(),
  },
  {
    id: "learning-request-seed-2",
    learnerId: "seed-learner-enrolled-0001",
    goal: "자료구조 전공 수업을 따라가기 어려워서 그래프 알고리즘부터 다시 배우고 싶습니다",
    level: "중급",
    deadline: null,
    budgetRange: { max: 300000 },
    desiredWindows: [],
    lifeZoneId: SEED_LIFE_ZONE_MAIN,
    acquisitionChannel: "organic",
    status: "open",
    matchingFailureReason: null,
    operatorNote: null,
    createdAt: new Date().toISOString(),
  },
];

@Injectable()
export class LearningRequestsRepository {
  private records = new Map<string, LearningRequestRecord>(
    SEED_REQUESTS.map((r): [string, LearningRequestRecord] => [r.id, r]),
  );
  private seq = 1000;

  create(learnerId: string, input: CreateLearningRequestInput): LearningRequestRecord {
    const record: LearningRequestRecord = {
      id: `learning-request-${this.seq++}`,
      learnerId,
      goal: input.goal,
      level: input.level ?? null,
      deadline: input.deadline ?? null,
      budgetRange: input.budgetRange ?? null,
      desiredWindows: input.desiredWindows ?? [],
      lifeZoneId: input.lifeZoneId,
      acquisitionChannel: input.acquisitionChannel ?? null,
      status: "open",
      matchingFailureReason: null,
      operatorNote: null,
      createdAt: new Date().toISOString(),
    };
    this.records.set(record.id, record);
    return record;
  }

  findById(id: string): LearningRequestRecord | undefined {
    return this.records.get(id);
  }

  requireOwnedOrOperator(id: string, user: { userId: string; roles: string[]; operatorPermissions?: string[] }): LearningRequestRecord {
    const record = this.records.get(id);
    if (!record) throw new DomainError("NOT_FOUND", "학습 요청을 찾을 수 없습니다.", 404);

    const isOwner = record.learnerId === user.userId;
    const isOperator = user.roles.includes("operator") && user.operatorPermissions?.includes("ops.matching");
    if (!isOwner && !isOperator) {
      throw new DomainError("FORBIDDEN", "본인 또는 매칭 담당 운영자만 조회할 수 있습니다.", 403);
    }
    return record;
  }

  listByLearner(learnerId: string): LearningRequestRecord[] {
    return [...this.records.values()].filter((r) => r.learnerId === learnerId);
  }

  listForAdmin(status?: string): LearningRequestRecord[] {
    const all = [...this.records.values()];
    return status ? all.filter((r) => r.status === status) : all;
  }

  /** 학습자 본인의 철회만 허용한다(운영자는 assist()로 별도 처리). */
  withdraw(id: string, learnerId: string): LearningRequestRecord {
    const record = this.records.get(id);
    if (!record) throw new DomainError("NOT_FOUND", "학습 요청을 찾을 수 없습니다.", 404);
    if (record.learnerId !== learnerId) {
      throw new DomainError("FORBIDDEN", "본인 학습 요청만 철회할 수 있습니다.", 403);
    }
    record.status = "withdrawn";
    return record;
  }

  /** 운영자 매칭 보조 — 상태 전이 + 실패 사유·메모 기록(허위 매칭 생성 금지: 후보를 직접
   * 만들어내지 않고 상태·사유만 남긴다). */
  assist(
    id: string,
    nextStatus: LearningRequestStatus,
    reason: MatchingFailureReason | null,
    note: string | null,
  ): LearningRequestRecord {
    const record = this.records.get(id);
    if (!record) throw new DomainError("NOT_FOUND", "학습 요청을 찾을 수 없습니다.", 404);

    if (nextStatus === "waitlisted" || nextStatus === "expired") {
      if (!reason) {
        throw new DomainError("VALIDATION_ERROR", "waitlisted/expired 전이에는 matchingFailureReason이 필요합니다.");
      }
    }
    record.status = nextStatus;
    record.matchingFailureReason = reason;
    record.operatorNote = note;
    return record;
  }
}
