import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { DomainError } from "../../common/errors";

/**
 * Idempotency-Key 최소 구현 (docs/api/internal-contracts.md §5, PR-04).
 *
 * "사용자 + 작업 + 키" 단위로 요청 해시와 결과를 저장한다. 같은 키에 다른 요청
 * 본문이 오면 409 IDEMPOTENCY_KEY_CONFLICT로 거절한다. 외부 PG 멱등키와는 별개
 * 개념이며(§5 원문), 이 저장소는 이번 명령 범위(수업 등록)에서만 쓴다.
 *
 * 실제 서비스에서는 Redis/DB TTL 저장소로 교체해야 한다(메모리 저장소는 재시작 시
 * 초기화되고 만료 정책이 없음 — remaining_work로 문서화).
 */
@Injectable()
export class IdempotencyStore {
  private cache = new Map<string, { bodyHash: string; result: unknown }>();

  private hashBody(body: unknown): string {
    return createHash("sha256").update(JSON.stringify(body)).digest("hex");
  }

  /**
   * 이미 처리된 요청이면 캐시된 결과를 반환하고, 다른 본문으로 같은 키가 재사용되면
   * DomainError(IDEMPOTENCY_KEY_CONFLICT)를 던진다. 처음 보는 키면 null을 반환한다.
   */
  checkExisting(userId: string, action: string, key: string, body: unknown): unknown | null {
    const cacheKey = `${userId}:${action}:${key}`;
    const bodyHash = this.hashBody(body);
    const existing = this.cache.get(cacheKey);

    if (!existing) return null;
    if (existing.bodyHash !== bodyHash) {
      throw new DomainError(
        "IDEMPOTENCY_KEY_CONFLICT",
        "같은 Idempotency-Key로 다른 요청 본문이 전달되었습니다.",
        409,
      );
    }
    return existing.result;
  }

  save(userId: string, action: string, key: string, body: unknown, result: unknown): void {
    const cacheKey = `${userId}:${action}:${key}`;
    this.cache.set(cacheKey, { bodyHash: this.hashBody(body), result });
  }
}
