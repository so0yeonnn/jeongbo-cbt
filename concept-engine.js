'use strict';

(()=>{
  const catalog=[
    {s:'소프트웨어 설계',r:/UML|유스케이스|클래스\s*다이어그램|시퀀스|객체\s*다이어그램/i,l:'UML',sum:['UML은 시스템의 구조와 동작을 표준 기호로 표현한다.','구조 다이어그램과 행위 다이어그램을 구분한다.','문제의 관계선·화살표·생명선을 먼저 확인한다.'],memo:'구조=클래스·객체·컴포넌트, 행위=유스케이스·시퀀스·활동',compare:'클래스는 정적 구조, 시퀀스는 시간 순 상호작용을 표현한다.',k:['UML','구조 다이어그램','행위 다이어그램','관계','표기법']},
    {s:'소프트웨어 설계',r:/객체지향|캡슐화|상속|다형성|추상화|결합도|응집도/i,l:'객체지향 설계',sum:['객체는 상태와 행위를 함께 캡슐화한다.','응집도는 높이고 결합도는 낮추는 설계를 지향한다.','상속·다형성·추상화의 역할을 구분한다.'],memo:'좋은 모듈 = 높은 응집도 + 낮은 결합도',compare:'응집도는 모듈 내부, 결합도는 모듈 사이의 연관 정도다.',k:['객체지향','캡슐화','응집도','결합도','다형성']},
    {s:'소프트웨어 설계',r:/디자인\s*패턴|GoF|팩토리|싱글톤|옵서버|어댑터/i,l:'디자인 패턴',sum:['디자인 패턴은 반복되는 설계 문제의 검증된 해결 구조다.','생성·구조·행위 패턴으로 분류한다.','문제에 제시된 의도와 참여 객체의 역할을 연결한다.'],memo:'생성=객체 생성, 구조=객체 조합, 행위=책임·협력',compare:'팩토리는 생성 책임을 분리하고 싱글톤은 인스턴스를 하나로 제한한다.',k:['GoF','생성 패턴','구조 패턴','행위 패턴','의도']},
    {s:'소프트웨어 설계',r:/요구사항|요구\s*공학|DFD|자료\s*흐름|CASE/i,l:'요구사항 분석',sum:['요구사항은 기능·비기능 요구로 구분해 명확히 정의한다.','분석 모델은 사용자의 요구와 시스템 경계를 표현한다.','추적성과 검증 가능성을 함께 확인한다.'],memo:'좋은 요구사항 = 명확성·완전성·일관성·검증 가능성',compare:'기능 요구는 수행할 일, 비기능 요구는 품질·제약 조건이다.',k:['요구사항','기능 요구','비기능 요구','추적성','분석 모델']},
    {s:'소프트웨어 개발',r:/테스트|화이트박스|블랙박스|경계값|동등\s*분할|검증|확인/i,l:'소프트웨어 테스트',sum:['테스트는 결함을 발견하고 요구 충족 여부를 확인한다.','화이트박스는 내부 구조, 블랙박스는 외부 명세를 기준으로 한다.','테스트 수준과 설계 기법을 구분한다.'],memo:'화이트박스=코드 구조, 블랙박스=입출력 명세',compare:'검증은 제품을 올바르게 만들었는지, 확인은 올바른 제품을 만들었는지 본다.',k:['테스트','화이트박스','블랙박스','검증','확인']},
    {s:'소프트웨어 개발',r:/스택|큐|트리|그래프|정렬|탐색|자료\s*구조/i,l:'자료구조와 알고리즘',sum:['자료구조는 데이터의 저장·접근 방식을 결정한다.','알고리즘은 시간·공간 복잡도로 효율을 비교한다.','연산 순서와 입력 크기에 따른 변화를 추적한다.'],memo:'스택=LIFO, 큐=FIFO',compare:'깊이 우선 탐색은 스택, 너비 우선 탐색은 큐를 활용한다.',k:['자료구조','알고리즘','스택','큐','복잡도']},
    {s:'소프트웨어 개발',r:/형상\s*관리|버전|빌드|릴리스|패키징/i,l:'형상관리와 배포',sum:['형상관리는 변경 항목을 식별·통제·감사한다.','버전과 변경 이력을 일관되게 관리한다.','빌드·릴리스·배포 단계를 구분한다.'],memo:'형상관리 절차 = 식별 → 통제 → 감사 → 기록',compare:'빌드는 실행 산출물 생성, 배포는 운영 환경에 전달하는 과정이다.',k:['형상관리','버전','빌드','릴리스','배포']},
    {s:'데이터베이스 구축',r:/정규화|정규형|함수\s*종속|이상\s*현상/i,l:'데이터베이스 정규화',sum:['정규화는 데이터 중복과 이상 현상을 줄이는 과정이다.','함수 종속성을 기준으로 릴레이션을 분해한다.','무손실 분해와 종속성 보존을 확인한다.'],memo:'1NF 원자값 → 2NF 부분 종속 제거 → 3NF 이행 종속 제거',compare:'부분 종속은 복합키 일부, 이행 종속은 일반 속성을 거쳐 종속된다.',k:['정규화','함수 종속','이상 현상','무손실 분해','정규형']},
    {s:'데이터베이스 구축',r:/SELECT|INSERT|UPDATE|DELETE|JOIN|GROUP BY|HAVING|SQL|DDL|DML|DCL/i,l:'SQL',sum:['SQL은 데이터 정의·조작·제어 기능을 제공한다.','실행 순서와 집계 전후의 조건 위치를 구분한다.','조인 조건과 NULL 처리에 주의한다.'],memo:'WHERE는 그룹 전, HAVING은 GROUP BY 후 조건',compare:'DDL은 구조 정의, DML은 데이터 처리, DCL은 권한 제어다.',k:['SQL','DDL','DML','JOIN','GROUP BY']},
    {s:'데이터베이스 구축',r:/트랜잭션|ACID|COMMIT|ROLLBACK|병행|락|교착/i,l:'트랜잭션과 병행제어',sum:['트랜잭션은 논리적으로 하나인 작업 단위다.','ACID 특성으로 데이터의 신뢰성을 보장한다.','락과 스케줄을 통해 병행 실행의 문제를 제어한다.'],memo:'ACID = 원자성·일관성·고립성·지속성',compare:'COMMIT은 변경 확정, ROLLBACK은 변경 취소다.',k:['트랜잭션','ACID','병행제어','LOCK','회복']},
    {s:'데이터베이스 구축',r:/키|무결성|개체\s*무결성|참조\s*무결성|관계\s*대수/i,l:'관계 데이터 모델',sum:['관계 모델은 릴레이션·튜플·속성으로 데이터를 표현한다.','키와 무결성 제약으로 데이터의 유일성과 관계를 보장한다.','관계 연산의 입력과 결과 릴레이션을 구분한다.'],memo:'개체 무결성=기본키 NULL 금지, 참조 무결성=외래키 일치',compare:'기본키는 행 식별, 외래키는 다른 릴레이션과의 참조를 담당한다.',k:['릴레이션','기본키','외래키','무결성','관계 대수']},
    {s:'프로그래밍 언어 활용',r:/OSI|TCP|UDP|IP|프로토콜|라우팅|네트워크/i,l:'네트워크 프로토콜',sum:['프로토콜은 통신 규칙과 데이터 형식을 정한다.','OSI 계층별 기능과 대표 장비·프로토콜을 연결한다.','TCP와 UDP의 신뢰성·속도 차이를 구분한다.'],memo:'TCP=연결·신뢰성, UDP=비연결·속도',compare:'IP는 주소 지정·라우팅, TCP는 종단 간 신뢰성 전달을 담당한다.',k:['OSI','TCP','UDP','IP','프로토콜']},
    {s:'프로그래밍 언어 활용',r:/프로세스|스레드|스케줄링|교착\s*상태|세마포어|페이지|가상\s*메모리/i,l:'운영체제',sum:['운영체제는 프로세서·메모리·입출력 자원을 관리한다.','프로세스 상태와 스케줄링 기준을 구분한다.','동기화와 교착상태 조건을 함께 확인한다.'],memo:'교착상태 4조건 = 상호배제·점유대기·비선점·환형대기',compare:'프로세스는 자원 소유 단위, 스레드는 실행 단위다.',k:['운영체제','프로세스','스레드','스케줄링','교착상태']},
    {s:'프로그래밍 언어 활용',r:/C언어|Java|Python|포인터|배열|반복문|재귀|연산자|변수/i,l:'프로그래밍 언어',sum:['프로그램은 변수·제어문·함수의 실행 순서로 결과를 만든다.','연산자 우선순위와 자료형 변환을 먼저 확인한다.','코드는 각 단계의 값 변화를 표로 추적한다.'],memo:'코드 문제는 변수의 초기값과 반복 1회 후 값을 먼저 적는다.',compare:'값 전달은 복사본, 참조 전달은 원본 변경 가능성을 가진다.',k:['자료형','연산자','제어문','함수','실행 추적']},
    {s:'정보시스템 구축관리',r:/암호|해시|인증|접근\s*통제|공격|보안|취약점|방화벽/i,l:'정보보안',sum:['정보보안은 기밀성·무결성·가용성을 보호한다.','위협·취약점·통제의 관계를 구분한다.','암호화·해시·인증의 목적을 혼동하지 않는다.'],memo:'CIA = 기밀성·무결성·가용성',compare:'암호화는 복호화 가능, 해시는 원문 복원이 어려운 단방향 처리다.',k:['CIA','암호화','해시','인증','접근통제']},
    {s:'정보시스템 구축관리',r:/개발\s*방법론|애자일|스크럼|XP|폭포수|프로젝트|비용|일정/i,l:'개발 방법론과 프로젝트 관리',sum:['개발 방법론은 생명주기 활동과 역할을 체계화한다.','순차형과 반복·점진형의 변화 대응 방식을 구분한다.','프로젝트는 범위·일정·비용·품질을 함께 관리한다.'],memo:'애자일은 짧은 반복과 지속적인 피드백을 중시한다.',compare:'폭포수는 단계 순차 진행, 애자일은 반복 개발과 변화 수용이 핵심이다.',k:['개발 방법론','애자일','스크럼','프로젝트','생명주기']}
  ];
  const fallback={
    '소프트웨어 설계':['소프트웨어 설계 원리','요구를 구조와 인터페이스로 구체화하고 모듈 간 책임을 분리한다.','설계 문제는 역할·관계·표기 목적을 먼저 구분한다.'],
    '소프트웨어 개발':['소프트웨어 구현과 품질','구현 결과를 테스트하고 변경·품질·배포 과정을 통제한다.','구현 절차와 산출물의 목적을 연결해 암기한다.'],
    '데이터베이스 구축':['데이터베이스 구축','데이터 모델·SQL·무결성·트랜잭션을 통해 일관된 데이터를 관리한다.','키·제약·연산의 적용 대상을 먼저 확인한다.'],
    '프로그래밍 언어 활용':['프로그래밍과 시스템','언어의 실행 규칙과 운영체제·네트워크 동작을 함께 이해한다.','코드와 프로토콜 문제는 실행 순서와 계층을 먼저 표시한다.'],
    '정보시스템 구축관리':['정보시스템 구축관리','개발 프로세스·인프라·보안 통제를 통해 시스템을 안정적으로 운영한다.','보안 목표와 관리 절차의 적용 단계를 구분한다.']
  };
  function extractedKeywords(q){
    const text=`${q.stem||''} ${(q.options||[]).join(' ')}`;
    const raw=text.match(/[A-Z][A-Z0-9+.#-]{1,}|[가-힣]{2,8}/g)||[];
    const stop=new Set(['것은','대한','다음','설명','해당','으로','에서','있는','없는','가장','올바른','아닌','보기']);
    return [...new Set(raw.filter(x=>!stop.has(x)).map(x=>x.replace(/[.,:;()]/g,'')))].slice(0,5);
  }
  function profile(q){
    const text=`${q.stem||''} ${(q.options||[]).join(' ')}`;
    const hit=catalog.find(row=>row.s===q.subject&&row.r.test(text));
    if(hit)return {label:hit.l,summary:hit.sum,memory:hit.memo,compare:hit.compare,keywords:hit.k};
    const [label,definition,memory]=fallback[q.subject]||['핵심 개념','문항의 정의와 조건을 중심으로 판단한다.','정답을 가르는 조건어를 먼저 표시한다.'];
    const keywords=extractedKeywords(q);
    return {label,summary:[definition,`이 문항은 ${keywords.slice(0,2).join('·')||'핵심 용어'}의 정의와 적용 조건을 묻는다.`,'선지마다 적용 대상과 예외 조건을 비교한다.'],memory,compare:'비슷한 용어는 목적·적용 대상·결과의 차이로 구분한다.',keywords:keywords.length?keywords:[label]};
  }
  function analyze(items,answers,confidences){
    const map=new Map();
    items.forEach((q,index)=>{
      if(q.void)return;
      const p=profile(q), key=`${q.subject}::${p.label}`;
      const row=map.get(key)||{key,subject:q.subject,concept:p.label,total:0,correct:0,wrong:0,uncertain:0,score:0,profile:p};
      const picked=answers[index]||[];
      const ok=q.acceptAny?picked.length===1&&q.answer.includes(picked[0]):globalThis.CBT_LOGIC.sameAnswers(q.answer,picked);
      row.total+=1; row.correct+=ok?1:0; row.wrong+=ok?0:1; row.uncertain+=confidences?.[index]==='low'?1:0; row.score=row.wrong*3+row.uncertain;
      map.set(key,row);
    });
    return [...map.values()].map(row=>({...row,rate:row.total?Math.round(row.correct/row.total*100):0})).sort((a,b)=>b.score-a.score||a.rate-b.rate||b.total-a.total);
  }
  function frequency(bank){
    const rounds=[...new Set(bank.map(q=>q.round))];
    const selected=new Set(rounds.slice(-6));
    const map=new Map();
    bank.filter(q=>selected.has(q.round)).forEach(q=>{const p=profile(q),key=`${q.subject}::${p.label}`;const row=map.get(key)||{subject:q.subject,concept:p.label,count:0,profile:p};row.count+=1;map.set(key,row);});
    const rows=[...map.values()].sort((a,b)=>b.count-a.count);const high=rows[Math.max(0,Math.floor(rows.length*.33)-1)]?.count||1;const mid=rows[Math.max(0,Math.floor(rows.length*.66)-1)]?.count||1;
    return rows.map(row=>({...row,level:row.count>=high?'상':row.count>=mid?'중':'하'}));
  }
  globalThis.CBT_CONCEPTS={profile,analyze,frequency};
})();
