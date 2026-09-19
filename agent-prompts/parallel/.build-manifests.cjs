const fs=require('node:fs'),path=require('node:path');
const Y=require(path.join(process.env.TEMP,'codex-major-hour-yaml-validation/node_modules/yaml'));
const dir=__dirname, parent=path.dirname(dir);
const w=Y.parse(fs.readFileSync(path.join(parent,'00-workflow.yaml'),'utf8'));
const stages=w.execution_order.map(f=>Y.parse(fs.readFileSync(path.join(parent,path.basename(f)),'utf8')));
const index=new Map(stages.flatMap(s=>s.commands.map(c=>[c.id,{stage:s,command:c}])));
const roleFiles={A0:'A0-coordinator.yaml',A1:'A1-contracts.yaml',A2:'A2-backend.yaml',A3:'A3-frontend.yaml',A4:'A4-billing.yaml',A5:'A5-ai-data.yaml',A6:'A6-qa.yaml',A7:'A7-platform.yaml'};
const rolePaths={
 A0:['docs/product/**','docs/decisions/**','docs/tasks/index.md','docs/releases/**'],
 A1:['db/**','packages/contracts/**','docs/architecture/**','docs/api/**'],
 A2:['apps/api/src/**','apps/worker/src/**','packages/domain/time/**','docs/backend/**'],
 A3:['apps/web/**','packages/ui/**','docs/ux/**'],
 A4:['apps/api/src/modules/billing/**','packages/domain/money/**','docs/payments/**'],
 A5:['apps/api/src/modules/recommendations/**','services/ai/**','docs/ai/**'],
 A6:['tests/**','docs/qa/**'],
 A7:['infra/**','scripts/**','.github/workflows/**','docs/operations/**']
};
const excludes={A2:['apps/api/src/modules/billing/**','apps/api/src/modules/recommendations/**']};
const focus={
 'S01-T02':'확정된 요구사항을 기술 모듈·외부 의존·추가 계약에 연결한다. A6 문서는 수정하지 않는다.',
 'S01-T03':'S01-T01을 기준으로 인수 검증 사례 초안을 작성한다. A1 기술 범위 결과 반영은 통합 시 수행한다.',
 'S02-T02':'핵심 API 초안으로 UX·실패 상태를 설계하고 계약 차이는 요청 문서에 남긴다.',
 'S02-T03':'금액·원장·환불 계약 제안만 작성한다. 공통 OpenAPI를 수정하지 않는다.',
 'S02-T04':'추천·이벤트·지표 계약 제안을 작성한다. Billing 제안의 미확정 부분은 명시하고 통합 시 대조한다.',
 'S03-T03':'확정된 인증 계약·스키마로 서버 인증과 권한 모듈을 준비한다.',
 'S03-T04':'인증 UI와 계약 기반 대역 검증을 준비한다. 실제 서버 인증 연결 완료를 주장하지 않는다.',
 'S04-T01':'회원·교육자·수업·가능 시간·대기·후보 조회 API를 자신의 모듈 안에서 구현한다.',
 'S04-T02':'후보 조회 계약 대역으로 조건·태그 추천과 이벤트 처리를 구현한다. 실제 후보 API 검증은 통합 시 한다.',
 'S04-T03':'수업·탐색·추천·대기 UI를 계약으로 준비한다. 미완성 API를 직접 참조하지 않는다.',
 'S05-T03':'검증된 납부 의무 인터페이스와 예약 계약으로 협의·수락·예약 업무를 구현한다.',
 'S05-T04':'학습 범위·동의·예약 UI와 실패 상태를 계약으로 준비한다. 실제 동시성 검증은 통합 시 한다.',
 'S06-T02':'모의 금융 adapter·원장·환불·정산을 Billing 경계에서 준비한다.',
 'S06-T03':'금융 계약 대역으로 완료·취소·분쟁·업무 worker·재예약을 준비한다. 실제 Billing 연결은 통합 시 한다.',
 'S06-T04':'완료·거래·운영·활동 보고 UI를 계약으로 준비한다. 대역 검증을 실연동으로 기록하지 않는다.',
 'S07-T02':'확인된 제공자 테스트 사양으로 Billing adapter를 준비한다. 실수납·실송금은 실행하지 않는다.',
 'S07-T03':'확정된 제공자 결과 계약으로 예약·분쟁 상태 연결을 준비한다. adapter의 실제 결과 검증은 통합 시 한다.',
 'S07-T04':'제공자 테스트 흐름의 결제 복귀·실패 UI를 준비한다. 실제 테스트 결제 연동은 통합 시 한다.',
 'S08-T02':'배정된 실제 운영 로그만 읽고 관측 자료를 정리한다. 운영 환경을 수정하지 않는다.',
 'S08-T03':'배정된 실제 원장·결제 자료의 대사 초안을 작성한다. 미확인 비용·운영 자료는 한계로 남긴다.',
 'S08-T04':'동일 스냅샷의 실제 이벤트로 지표 초안을 작성한다. A4의 확정 대사 및 A7 관측 결과 반영은 통합 시 한다.',
 'S09-T03':'services/ai와 recommendations 내부에 의미 검색·초안·평가를 구현한다. apps/worker의 업무 worker는 수정하지 않는다.',
 'S09-T04':'AI 계약 대역으로 업무 이벤트·권한·공개/삭제 전파를 준비한다. 실제 AI 연동 검증은 통합 시 한다.',
 'S09-T05':'AI 검색·초안 검토 UI를 계약으로 준비한다. 실제 모델/업무 서버 연결은 통합 시 한다.',
 'S10-T03':'선택한 개인화 또는 생활권 추천 모듈만 계약에 맞춰 준비한다.',
 'S10-T04':'선택한 그룹·회차·지역·지인 추천 업무를 계약 및 Billing 대역으로 준비한다.',
 'S10-T05':'선택한 수업 금액 또는 지인 추천 보상 원장을 준비한다. 실제 보상을 지급하지 않는다.',
 'S10-T06':'선택한 확장 UI를 계약 기반으로 준비한다. 실제 통합은 생산자 명령 완료 후 수행한다.'
};
const C=(...ids)=>({type:'complete_original',command_ids:ids});
const P=(...ids)=>({type:'parallel_prepare',jobs:ids.map(id=>({preparation_id:'P-'+id,original_command_id:id,role:index.get(id).command.agent,condition:'원본 명령의 condition을 그대로 적용',focus:focus[id],report:'docs/parallel-preparation/<run_id>/'+id+'.md'}))});
const schedule={
 S01:[C('S01-T01'),P('S01-T02','S01-T03'),C('S01-T02','S01-T03','S01-GATE')],
 S02:[C('S02-T01'),P('S02-T02','S02-T03','S02-T04'),C('S02-T02','S02-T03','S02-T04','S02-T05','S02-T06','S02-GATE')],
 S03:[C('S03-T01','S03-T02'),P('S03-T03','S03-T04'),C('S03-T03','S03-T04','S03-T05','S03-GATE')],
 S04:[P('S04-T01','S04-T02','S04-T03'),C('S04-T01','S04-T02','S04-T03','S04-T04','S04-GATE')],
 S05:[C('S05-T01','S05-T02'),P('S05-T03','S05-T04'),C('S05-T03','S05-T04','S05-T05','S05-GATE')],
 S06:[C('S06-T01'),P('S06-T02','S06-T03','S06-T04'),C('S06-T02','S06-T03','S06-T04','S06-T05','S06-T06','S06-T07','S06-GATE')],
 S07:[C('S07-T01'),P('S07-T02','S07-T03','S07-T04'),C('S07-T02','S07-T03','S07-T04','S07-T05','S07-T06','S07-GATE')],
 S08:[C('S08-T01'),P('S08-T02','S08-T03','S08-T04'),C('S08-T02','S08-T03','S08-T04','S08-T05','S08-GATE')],
 S09:[C('S09-T01','S09-T02'),P('S09-T03','S09-T04','S09-T05'),C('S09-T03','S09-T04','S09-T05','S09-T06','S09-GATE')],
 S10:[C('S10-T01','S10-T02'),P('S10-T03','S10-T04','S10-T05'),P('S10-T06'),C('S10-T03','S10-T04','S10-T05','S10-T06','S10-T07','S10-T08','S10-GATE')]
};
const coordinatorPrompt=`너는 A0 총괄이다. 사용자가 지정한 단계 범위만 실행하라.
원본 공통 파일·해당 단계·source-alignment와 병렬 계획을 읽고 선행 게이트의 실제 근거를 확인하라.
새 run_id를 정하고 docs/product/parallel-runs/<run_id>.md에 단계 범위·역할·입력 계약 해시·쓰기 경로·진행 결과를 기록하라.
steps를 순서대로 처리하라. complete_original은 원본 depends_on이 충족된 명령만 하나씩 해당 역할에게 맡겨 전체 프롬프트·완료 기준을 검증한다.
parallel_prepare는 원본 명령 실행과 다른 보조 작업이다. 최대 3명에게 role 파일·focus·명령 참조·입력 버전·배정 경로를 전달하라. 미완성 생산자 대신 동결된 계약만 사용하게 하라.
준비 배치 내 독립 작업은 동시에 실행하되, 현재 배치가 종료되기 전에 다음 step을 시작하지 마라. 각 작업자의 완료/차단 보고를 수집하고 쓰기 작업 종료를 확인하라.
계약·상태·정책이 부족하면 영향받는 준비만 BLOCKED로 기록하고 공통 소유자의 보완을 별도로 배정하라. 빈 값을 운영 정책으로 확정하지 마라.
조건부 명령은 원본 condition을 평가하라. 미선택만 NOT_APPLICABLE로 남기고 데이터 부족은 BLOCKED다. S10 개인화의 추가 S09 평가 조건도 유지한다.
준비 READY_FOR_INTEGRATION은 원본 PASS가 아니다. 통합 시 실제 생산자 API·상태·DB·금액·UI 연결과 전체 원본 완료 기준을 확인하라. A6 검증은 쓰기가 멈춘 통합 버전에서 실행한다.
준비 FAIL/BLOCKED를 해소하지 않은 채 해당 원본 명령이나 GATE를 통과시키지 마라. 통합에서 같은 역할의 보완 작업을 수행한 경우 수정·재검증 근거를 남겨라.
같은 프로젝트 경로의 작업자를 하나의 명부로 관리하라. 원본 명령을 따로 실행하는 두 번째 총괄이나 별도 작업과 병행하지 마라.
현재 실행 범위의 단계 GATE를 마친 뒤 멈추고 완료·차단·다음 가능 단계를 보고하라. 병렬 계획을 읽었다고 전체 개발·배포·모집·자금 이동 권한을 얻은 것은 아니다.`;
const plan={schema_version:'1.0',kind:'parallel_preparation_plan',status:'PLANNED',project_root:'D:/WorkSpace/campus-major-tutoring-mvp',common_file:'agent-prompts/00-workflow.yaml',source_alignment_file:'agent-prompts/source-alignment.md',source_content_revision:w.content_revision,
 intent:'기존 65개 명령의 완료 순서를 유지하면서 역할별 독립 준비를 병렬 배분한다. 자동 실행 프로그램이 아니다.',
 concurrency:{coordinators:1,max_workers:3,max_active_stages:1,max_jobs_per_role:1,limit_rule:'실제 도구 한도가 더 낮으면 줄인다. 잠금·입력이 부족하면 병렬 수를 줄인다.'},
 authority:{original_completion:'원본 depends_on·stage gates·prompt·allowed_paths·condition·acceptance_criteria가 실제 명령 완료 기준이다.',preparation:'준비 작업은 원본 선행 명령의 PASS를 우회하지 않는 별도 보조 작업이다. 원본 prompt는 읽기 맥락이며 focus에 지정한 준비 범위만 수행한다.',write_scope:'원본 allowed_paths와 역할 write_paths의 교집합에서 excluded_paths를 뺀 범위다. 현재 준비 보고서 경로만 추가로 허용한다.',original_exceptions:'S03-T01 및 S09-T02의 A7 초기 골격 예외는 원본 complete_original에만 적용한다.',no_pass:'준비 중 원본 handoff_file·GATE·전체 tasks/index를 쓰지 않는다.'},
 role_files:Object.fromEntries(Object.entries(roleFiles).map(([r,f])=>[r,'agent-prompts/parallel/'+f])),
 preparation_statuses:{READY_FOR_INTEGRATION:'배정한 준비 범위를 확인했으며 실제 연결·원본 완료 검증은 남아 있음',BLOCKED:'입력·계약·환경·정책이 부족함',FAIL:'준비 검증에서 결함이 확인됨',NOT_APPLICABLE:'S10에서 선택하지 않은 트랙의 조건부 준비만 해당'},
 shared_resources:{exclusive_write_roles:['A1','A7'],exception:'S01-T02의 A1은 docs/architecture의 기술 범위 문서만 쓰므로 해당 준비 배치에서 허용한다.',root_files_owner:'A7',contracts_migrations_owner:'A1',server_composition_owner:'A2',global_status_owner:'A0',rules:['공통 계약·DB migration·설치·lockfile·루트 설정·codegen 변경은 다른 쓰기 작업 종료 후 단독 실행한다.','서버 공통 조립 변경은 A2에게 요청하고 A4/A5가 apps/api의 공통 엔트리를 수정하지 않는다.','공용 fixture는 A6 단일 소유자다. 다른 역할은 자기 모듈 내부 테스트 대역만 작성한다.','공유 DB reset/seed/migration·포트를 동시에 사용하지 않는다. 격리되지 않은 전체 빌드·통합 테스트는 직렬 실행한다.','A0가 각 준비 작업의 read contract 해시·허용 write 경로·제외 경로를 확인한 뒤 배분한다. 계약 변경 시 소비자 준비를 다시 확인한다.']},
 input_snapshot:{required:['run_id','stage_id','command_id','contract_revision_or_hashes','policy_revision','completed_original_handoffs','write_paths','excluded_paths'],optional_isolated_test_resources:['test_db_or_schema','ports','build_output_dir','temporary_dir'],fallback:'독립 테스트 자원을 배정할 수 없으면 병렬 쓰기 테스트를 하지 말고 통합 단계에서 직렬 검증한다.'},
 preparation_report:{path:'docs/parallel-preparation/<run_id>/<command_id>.md',fields:['preparation_id','original_command_id','run_id','role','status','input_hashes','changed_files','checks_run','test_doubles_used','checks_not_run','producer_dependencies_remaining','contract_requests','next_integration_steps']},
 cross_stage_policy:'같은 경로에서는 S07과 S09를 동시 활성화하지 않는다. 단계 대기 시 작업자를 회수·기록한 후 허용된 다른 단계로 전환한다. 원본 S09의 S06 이후 독립 실행 자격은 유지한다.',
 stages:stages.map(s=>({id:s.id,source_file:w.stage_registry.find(r=>r.id===s.id).file,requires_stage_gates:s.requires_stage_gates,steps:schedule[s.id]})),
 coordinator_prompt:coordinatorPrompt};
fs.writeFileSync(path.join(dir,'00-orchestration.yaml'),Y.stringify(plan,{lineWidth:0}));
for(const [r,file] of Object.entries(roleFiles)){
 const role={schema_version:'1.0',kind:'parallel_role_dispatch',status:'PLANNED',role:r,name:w.roles[r].name,common_file:'agent-prompts/00-workflow.yaml',parallel_plan:'agent-prompts/parallel/00-orchestration.yaml',responsibility:w.roles[r].responsibility,write_paths:rolePaths[r],excluded_paths:excludes[r]||[],write_scope_rule:'현재 원본 명령 allowed_paths와 교집합만 수정한다. 원본의 현재 handoff는 complete_original에서만, 준비 보고서는 prepare에서만 쓴다. 역할 목록은 소유권 확대 권한이 아니다.',
 command_refs:stages.flatMap(s=>s.commands.filter(c=>c.agent===r).map(c=>({id:c.id,stage:s.id,source_file:w.stage_registry.find(x=>x.id===s.id).file,title:c.title,condition:c.condition}))),
 prompt:r==='A0'?coordinatorPrompt:`너는 ${r} ${w.roles[r].name} 담당이다. A0가 배정한 command_id·phase·run_id·계약 버전을 먼저 확인하라.
원본 common_file·source-alignment·해당 단계의 원본 명령을 읽고 필요한 입력·권한을 확인하라. command_refs 전체를 자동 실행하지 마라.
phase=prepare이면 계획의 해당 focus만 수행하라. 원본 선행 명령을 완료했다고 가정하지 말고 동결된 계약으로 독립 부분을 준비하라. 없는 생산자는 자신의 소유 범위에 명시적 테스트 대역을 두고 미연결 검증을 보고하라.
수정 범위는 원본 allowed_paths와 이 역할 write_paths의 교집합에서 excluded_paths를 제외한다. 준비 중 공통 계약·lockfile·설치·migration·공용 DB 초기화는 하지 마라. 필요한 변경은 A0에게 요청하라.
준비 보고서만 docs/parallel-preparation/<run_id>/<command_id>.md에 기록하라. READY_FOR_INTEGRATION은 준비 상태이며 원본 PASS가 아니다. phase=prepare에서 원본 handoff_file을 쓰지 마라.
phase=complete_original이면 원본 depends_on의 실제 PASS/허용된 NOT_APPLICABLE를 확인하고 기존 준비 결과를 검토하라. 원본 프롬프트 전체를 수행하며 실제 API·DB 연결·관련 검증을 마친 뒤 원본 handoff_file에 결과를 기록하라.
준비 코드와 계약 버전이 다르면 재검증하라. 전역 빌드·공유 DB를 사용하는 테스트는 A0의 단독 실행 배정을 확인하라.
역할 밖 버그는 재현·변경 요청으로 전달하고 완료 조건을 낮추지 마라. 현재 작업 결과를 보고한 후 다음 배정을 기다려라.`};
 if(r==='A7')role.original_exceptions=['S03-T01: 원본 allowed_paths에 명시된 초기 골격·루트 파일 작성','S09-T02: services/ai 골격을 작성한 뒤 A5에게 인계'];
 fs.writeFileSync(path.join(dir,file),Y.stringify(role,{lineWidth:0}));
}
console.log(JSON.stringify({role_files:8,plan_files:1,commands:index.size,preparations:Object.keys(focus).length}));
