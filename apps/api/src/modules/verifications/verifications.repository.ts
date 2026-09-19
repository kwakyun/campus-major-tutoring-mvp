import { Injectable } from "@nestjs/common";

export interface VerificationRecord {
  id: string;
  userId: string;
  type: "school_enrollment" | "major" | "career" | "certification";
  status: "self_reported" | "pending" | "verified" | "rejected";
  evidenceKey: string | null;
  rejectionReason: string | null;
}

/**
 * S03 기반 단계의 임시 인메모리 저장소. 실제 PostgreSQL 테이블(`verifications`)은
 * S03-T02(db/migrations)에서 스키마가 생성되고, S04에서 이 리포지토리가 실제
 * DB 접근으로 교체된다. 지금은 "본인/제3자 접근 제어" 규칙을 검증 가능하게
 * 시연하는 것이 목적이다(S03-T05 acceptance: 상대방 증빙 조회 거절).
 */
@Injectable()
export class VerificationsRepository {
  private records: VerificationRecord[] = [];
  private seq = 1;

  create(userId: string, type: VerificationRecord["type"], evidenceKey: string): VerificationRecord {
    const record: VerificationRecord = {
      id: `verification-${this.seq++}`,
      userId,
      type,
      status: "pending",
      evidenceKey,
      rejectionReason: null,
    };
    this.records.push(record);
    return record;
  }

  listByUser(userId: string): VerificationRecord[] {
    return this.records.filter((r) => r.userId === userId);
  }

  findById(id: string): VerificationRecord | undefined {
    return this.records.find((r) => r.id === id);
  }
}
