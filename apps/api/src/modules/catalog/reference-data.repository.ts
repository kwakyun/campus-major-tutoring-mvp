import { Injectable } from "@nestjs/common";

/**
 * 과목(subjects)·생활권(life_zones) 참조 데이터 (S04-T01, 생활권 타겟 갱신).
 *
 * DB 테이블(subjects, life_zones, campuses, campus_life_zones)은 이미 S03-T02에서
 * 생성되었지만, apps/api는 아직 실제 PostgreSQL 접속 수단(pg 등 DB 클라이언트
 * 의존성)을 갖고 있지 않다 — apps/api/package.json·pnpm-lock.yaml은 A7 소유
 * 영역이며 이번 명령의 allowed_paths(apps/api/src/modules/identity|catalog|matching/**)
 * 밖이라 추가할 수 없다(docs/handoffs/S04-T01.md "다음 단계로 이관하는 항목" 참고).
 *
 * 그래서 db/seeds/demo.sql과 동일한 UUID·이름으로 인메모리 참조 데이터를 둔다.
 * 실제 DB 연동 시 이 파일은 Postgres 조회로 교체되며, 이 파일이 정의하는
 * ReferenceDataRepository 인터페이스(형태)는 그대로 유지될 수 있도록 설계했다.
 *
 * 2026-09-19 갱신: 사용자 요청으로 초기 출시 생활권을 "가상대학교/서울" 플레이스홀더
 * 대신 목표 상권인 "부산대학교/부산"으로 타겟팅한다. UUID는 db/seeds/demo.sql과
 * 그대로 동기화했다 — ID를 바꾸면 이를 참조하는 courses/learning_requests 행이
 * 깨지므로 이름만 바꿨다. 이는 실제 부산대학교와의 공식 제휴를 의미하지 않는
 * 가상의 초기 출시 시나리오다(docs/decisions/policies.md — 허구 데이터에 실제
 * 기관명을 오인시키지 않을 것).
 *
 * 2026-09-19 추가 갱신: 사용자 요청("데이터셋을 더미데이터로 구성")에 따라 과목을
 * 하나 더 추가했다 — "자료구조와 알고리즘"(컴퓨터공학). courses/tutor-profile 등
 * 다른 인메모리 저장소의 더미 시드가 이 과목을 실제로 사용한다
 * (docs/backend/course-discovery.md §10 참고).
 */
export interface Subject {
  id: string;
  name: string;
}

export interface LifeZone {
  id: string;
  name: string;
}

@Injectable()
export class ReferenceDataRepository {
  private readonly subjects: Subject[] = [
    { id: "00000000-0000-0000-0000-000000000204", name: "파이썬 프로그래밍" },
    { id: "00000000-0000-0000-0000-000000000201", name: "미시경제학" },
    { id: "00000000-0000-0000-0000-000000000202", name: "편입영어" },
    { id: "00000000-0000-0000-0000-000000000203", name: "자료구조와 알고리즘" },
  ];

  private readonly lifeZones: LifeZone[] = [
    { id: "00000000-0000-0000-0000-000000000101", name: "부산대학교 정문~부산대역 생활권" },
  ];

  listSubjects(): Subject[] {
    return [...this.subjects];
  }

  listLifeZones(): LifeZone[] {
    return [...this.lifeZones];
  }

  subjectExists(id: string): boolean {
    return this.subjects.some((s) => s.id === id);
  }

  lifeZoneExists(id: string): boolean {
    return this.lifeZones.some((z) => z.id === id);
  }
}
