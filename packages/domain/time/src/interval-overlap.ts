/**
 * 시간대 겹침 판정 (S03-T01, A7).
 *
 * 튜터 가용시간(Availability)과 예약(Booking) 간 스케줄 충돌(SCHEDULE_CONFLICT,
 * packages/contracts/openapi.yaml Error 코드) 판정에 쓰이는 순수 함수 모음이다.
 * 실제 예약 충돌 검사(DB 트랜잭션·락 전략)는 S04(A2)에서 구현하며, 여기서는
 * 그 판정에 필요한 도메인 로직만 분리해 단위 테스트 가능하게 만든다.
 *
 * 구간은 반열림 구간 [startAt, endAt) 으로 다룬다 — 즉 한 예약의 끝 시각과
 * 다음 예약의 시작 시각이 정확히 같으면 겹치지 않는다(뒤이어 바로 시작 가능).
 */
export interface TimeInterval {
  startAt: Date;
  endAt: Date;
}

function assertValidInterval(interval: TimeInterval, label: string): void {
  if (interval.endAt.getTime() <= interval.startAt.getTime()) {
    throw new RangeError(`${label}: endAt은 startAt보다 뒤여야 합니다.`);
  }
}

/** 두 구간이 겹치는지 판정한다. 맞닿기만 하는 경우([a,b)와 [b,c))는 겹치지 않는다. */
export function intervalsOverlap(a: TimeInterval, b: TimeInterval): boolean {
  assertValidInterval(a, "a");
  assertValidInterval(b, "b");
  return a.startAt.getTime() < b.endAt.getTime() && b.startAt.getTime() < a.endAt.getTime();
}

/** 주어진 구간들 중 서로 겹치는 쌍이 하나라도 있는지 판정한다. */
export function hasAnyOverlap(intervals: TimeInterval[]): boolean {
  const sorted = [...intervals].sort((x, y) => x.startAt.getTime() - y.startAt.getTime());
  for (let i = 1; i < sorted.length; i += 1) {
    if (intervalsOverlap(sorted[i - 1], sorted[i])) return true;
  }
  return false;
}

/** 겹치거나 맞닿은 구간을 하나로 합쳐 정렬된 최소 구간 목록을 반환한다(가용시간 등록 정규화용). */
export function mergeOverlappingIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((x, y) => x.startAt.getTime() - y.startAt.getTime());
  const merged: TimeInterval[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i += 1) {
    const last = merged[merged.length - 1];
    const current = sorted[i];
    if (current.startAt.getTime() <= last.endAt.getTime()) {
      if (current.endAt.getTime() > last.endAt.getTime()) {
        last.endAt = current.endAt;
      }
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}
