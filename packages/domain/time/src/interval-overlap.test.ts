import { describe, expect, it } from "vitest";
import { hasAnyOverlap, intervalsOverlap, mergeOverlappingIntervals } from "./interval-overlap";

function d(hhmm: string): Date {
  return new Date(`2026-09-21T${hhmm}:00+09:00`);
}

describe("intervalsOverlap", () => {
  it("겹치는 두 구간은 true를 반환한다", () => {
    const a = { startAt: d("10:00"), endAt: d("12:00") };
    const b = { startAt: d("11:00"), endAt: d("13:00") };
    expect(intervalsOverlap(a, b)).toBe(true);
  });

  it("맞닿기만 한 구간은 겹치지 않는다([a,b)와 [b,c))", () => {
    const a = { startAt: d("10:00"), endAt: d("12:00") };
    const b = { startAt: d("12:00"), endAt: d("13:00") };
    expect(intervalsOverlap(a, b)).toBe(false);
  });

  it("완전히 분리된 구간은 겹치지 않는다", () => {
    const a = { startAt: d("09:00"), endAt: d("10:00") };
    const b = { startAt: d("11:00"), endAt: d("12:00") };
    expect(intervalsOverlap(a, b)).toBe(false);
  });

  it("한 구간이 다른 구간을 완전히 포함하면 겹친다", () => {
    const a = { startAt: d("09:00"), endAt: d("18:00") };
    const b = { startAt: d("11:00"), endAt: d("12:00") };
    expect(intervalsOverlap(a, b)).toBe(true);
  });

  it("endAt이 startAt보다 앞서면 예외를 던진다", () => {
    const a = { startAt: d("12:00"), endAt: d("10:00") };
    const b = { startAt: d("09:00"), endAt: d("11:00") };
    expect(() => intervalsOverlap(a, b)).toThrow(RangeError);
  });
});

describe("hasAnyOverlap", () => {
  it("겹치는 쌍이 없으면 false", () => {
    const intervals = [
      { startAt: d("09:00"), endAt: d("10:00") },
      { startAt: d("10:00"), endAt: d("11:00") },
      { startAt: d("14:00"), endAt: d("15:00") },
    ];
    expect(hasAnyOverlap(intervals)).toBe(false);
  });

  it("입력 순서가 뒤섞여 있어도 겹침을 정확히 감지한다", () => {
    const intervals = [
      { startAt: d("14:00"), endAt: d("15:00") },
      { startAt: d("09:00"), endAt: d("10:30") },
      { startAt: d("10:00"), endAt: d("11:00") },
    ];
    expect(hasAnyOverlap(intervals)).toBe(true);
  });
});

describe("mergeOverlappingIntervals", () => {
  it("빈 배열은 빈 배열을 반환한다", () => {
    expect(mergeOverlappingIntervals([])).toEqual([]);
  });

  it("겹치거나 맞닿은 구간을 하나로 합친다", () => {
    const intervals = [
      { startAt: d("09:00"), endAt: d("10:00") },
      { startAt: d("10:00"), endAt: d("11:30") },
      { startAt: d("13:00"), endAt: d("14:00") },
    ];
    const merged = mergeOverlappingIntervals(intervals);
    expect(merged).toHaveLength(2);
    expect(merged[0]).toEqual({ startAt: d("09:00"), endAt: d("11:30") });
    expect(merged[1]).toEqual({ startAt: d("13:00"), endAt: d("14:00") });
  });

  it("완전히 분리된 구간은 그대로 유지한다", () => {
    const intervals = [
      { startAt: d("09:00"), endAt: d("10:00") },
      { startAt: d("11:00"), endAt: d("12:00") },
    ];
    expect(mergeOverlappingIntervals(intervals)).toHaveLength(2);
  });
});
