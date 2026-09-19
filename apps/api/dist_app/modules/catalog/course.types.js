"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COURSE_STATUS_TRANSITIONS = void 0;
exports.isPubliclyVisible = isPubliclyVisible;
/** state-machines.md §9 — 이 표에 없는 전이는 허용하지 않는다. */
exports.COURSE_STATUS_TRANSITIONS = {
    draft: ["pending_review"],
    pending_review: ["published", "draft"],
    published: ["unpublished"],
    unpublished: [],
};
/**
 * 공개 응답에서 제외할 필드는 없다 — Course 자체에는 실명·연락처·비공개 증빙이
 * 없기 때문이다(tutorId는 식별자일 뿐 실명이 아니며, 실명 공개는 identity 모듈의
 * TutorPublicProfile에서 별도로 마스킹한다). 다만 비공개(draft/pending_review/
 * unpublished) 상태의 수업은 소유자·운영자 외에는 아예 조회 자체를 거절한다.
 */
function isPubliclyVisible(course) {
    return course.status === "published";
}
