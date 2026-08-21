'use strict';

(()=>{
  const facts=[
    [/Visitor|방문자/i,'객체 구조의 원소를 변경하지 않고 새로운 연산을 추가하는 행위 패턴이다.'],
    [/Builder|빌더/i,'복합 객체의 생성 과정과 표현 방법을 분리하는 생성 패턴이다.'],
    [/Prototype|프로토타입/i,'기존 객체를 복제해 새 객체를 만드는 생성 패턴이다.'],
    [/Bridge|브리지/i,'추상화와 구현을 분리해 각각 독립적으로 확장하는 구조 패턴이다.'],
    [/Singleton|싱글톤/i,'클래스의 인스턴스를 하나만 만들고 전역 접근점을 제공하는 생성 패턴이다.'],
    [/Observer|옵서버/i,'한 객체의 상태 변화를 여러 의존 객체에 통지하는 행위 패턴이다.'],
    [/Adapter|어댑터/i,'호환되지 않는 인터페이스를 클라이언트가 기대하는 형태로 변환하는 구조 패턴이다.'],
    [/Factory|팩토리/i,'객체 생성 책임을 별도 메서드나 객체로 분리하는 생성 관련 패턴이다.'],
    [/화이트박스|white\s*box/i,'프로그램 내부 제어 구조와 경로를 기준으로 테스트한다.'],
    [/블랙박스|black\s*box/i,'내부 구현이 아니라 입력과 출력의 명세를 기준으로 테스트한다.'],
    [/경계값/i,'입력 영역의 경계와 경계 바로 안팎의 값을 선택하는 블랙박스 테스트 기법이다.'],
    [/동등\s*분할/i,'동일하게 처리될 것으로 예상되는 입력 영역을 대표값으로 나누는 블랙박스 기법이다.'],
    [/제\s*1\s*정규형|1NF/i,'모든 속성값을 더 이상 나눌 수 없는 원자값으로 만든 정규형이다.'],
    [/제\s*2\s*정규형|2NF/i,'제1정규형에서 복합키 일부에 대한 부분 함수 종속을 제거한 정규형이다.'],
    [/제\s*3\s*정규형|3NF/i,'제2정규형에서 기본키가 아닌 속성 사이의 이행 함수 종속을 제거한 정규형이다.'],
    [/원자성|Atomicity/i,'트랜잭션의 연산을 모두 수행하거나 모두 수행하지 않아야 한다는 성질이다.'],
    [/일관성|Consistency/i,'트랜잭션 전후에 데이터베이스의 무결성 규칙이 유지되어야 한다는 성질이다.'],
    [/고립성|Isolation/i,'동시에 실행되는 트랜잭션의 중간 결과가 서로 간섭하지 않게 하는 성질이다.'],
    [/지속성|Durability/i,'완료된 트랜잭션의 결과가 장애 후에도 보존되어야 한다는 성질이다.'],
    [/COMMIT/i,'트랜잭션에서 수행한 변경을 확정하는 명령이다.'],
    [/ROLLBACK/i,'트랜잭션에서 수행한 변경을 취소하고 이전 상태로 되돌리는 명령이다.'],
    [/기본키|Primary\s*Key/i,'튜플을 유일하게 식별하며 NULL과 중복 값을 허용하지 않는 키다.'],
    [/외래키|Foreign\s*Key/i,'다른 릴레이션의 기본키 등을 참조해 릴레이션 사이의 관계를 표현하는 키다.'],
    [/DDL|CREATE|ALTER|DROP/i,'데이터베이스 객체의 구조를 정의하거나 변경·삭제하는 데이터 정의 기능이다.'],
    [/DML|SELECT|INSERT|UPDATE|DELETE/i,'데이터를 조회하거나 삽입·수정·삭제하는 데이터 조작 기능이다.'],
    [/DCL|GRANT|REVOKE/i,'데이터 접근 권한을 부여하거나 회수하는 데이터 제어 기능이다.'],
    [/스택|Stack|LIFO/i,'가장 나중에 삽입한 데이터를 먼저 꺼내는 LIFO 자료구조다.'],
    [/큐|Queue|FIFO/i,'가장 먼저 삽입한 데이터를 먼저 꺼내는 FIFO 자료구조다.'],
    [/TCP/i,'연결 설정과 오류·흐름 제어를 통해 신뢰성 있는 전송을 제공한다.'],
    [/UDP/i,'연결 설정과 재전송 보장 없이 오버헤드를 줄인 비연결형 전송을 제공한다.'],
    [/프로세스/i,'실행 중인 프로그램으로서 독립된 자원과 주소 공간을 갖는 자원 소유 단위다.'],
    [/스레드/i,'프로세스 자원을 공유하면서 실행 흐름을 구성하는 처리 단위다.'],
    [/기밀성|Confidentiality/i,'인가된 사용자만 정보에 접근할 수 있도록 보호하는 보안 목표다.'],
    [/무결성|Integrity/i,'정보가 허가 없이 변경되거나 훼손되지 않도록 정확성을 보호하는 보안 목표다.'],
    [/가용성|Availability/i,'인가된 사용자가 필요할 때 정보와 시스템을 사용할 수 있게 하는 보안 목표다.'],
    [/대칭키/i,'암호화와 복호화에 같은 비밀키를 사용하는 방식이다.'],
    [/공개키|비대칭키/i,'공개키와 개인키의 서로 다른 키 쌍을 사용하는 방식이다.'],
    [/폭포수/i,'분석·설계·구현·시험 등의 단계를 순차적으로 진행하는 생명주기 모형이다.'],
    [/나선형|Spiral/i,'위험 분석을 포함한 반복 주기로 점진적으로 개발하는 생명주기 모형이다.'],
    [/캡슐화/i,'데이터와 연산을 하나로 묶고 내부 구현을 감춰 정보 은닉을 돕는 객체지향 원리다.'],
    [/상속/i,'상위 클래스의 속성과 연산을 하위 클래스가 물려받아 재사용·확장하는 원리다.'],
    [/다형성/i,'같은 메시지나 인터페이스가 객체에 따라 서로 다르게 동작할 수 있는 성질이다.'],
    [/응집도/i,'한 모듈 내부 요소들이 하나의 목적을 위해 관련된 정도이며 일반적으로 높을수록 좋다.'],
    [/결합도/i,'모듈 사이의 의존 정도이며 일반적으로 낮을수록 변경과 유지보수에 유리하다.']
  ];
  const generic=/원본\s*기출|정답표.*기준|정답표와\s*대조/;
  const negative=/아닌|옳지\s*않|틀린|거리가\s*먼|포함되지\s*않/;
  function optionExplanations(q){
    const concept=globalThis.CBT_CONCEPTS.profile(q);
    const stored=q.optionReasons||[];
    const detailed=stored.length===(q.options||[]).length&&new Set(stored.filter(Boolean)).size>1&&stored.every(reason=>!generic.test(reason));
    const asksNegative=negative.test(q.stem||'');
    return (q.options||[]).map((option,index)=>{
      const correct=(q.answer||[]).includes(index);
      const wording=(option||'').trim();
      const isTermLike=wording.length<=28&&!/[.?!:]|이다|한다|된다|사용|제공|설명/.test(wording);
      const hit=isTermLike?facts.find(([pattern])=>pattern.test(wording)):null;
      let detail,basis;
      if(detailed){detail=stored[index];basis='원자료 해설';}
      else if(hit){
        const conclusion=correct?(asksNegative?'문제의 부정 조건에서 제외 대상으로 판단되는 선지다.':'문제가 묻는 조건에 부합해 정답이 된다.'):(asksNegative?'해당 개념의 올바른 설명이므로 부정형 질문의 정답이 아니다.':'문제가 묻는 대상·목적 또는 특성과 일치하지 않아 오답이다.');
        detail=`${hit[1]} ${conclusion}`;basis='개념 근거';
      }else if(correct){detail=`검증된 정답표에서 정답으로 확인된 선지다. 이 문항은 “${concept.memory}”를 기준으로 판단한다.`;basis='정답표·판단 기준';}
      else{detail=`검증된 정답표에서 정답으로 채택되지 않은 선지다. “${concept.compare}” 기준으로 정답 선지와 구분한다.`;basis='정답표·비교 기준';}
      return {correct,label:correct?'정답 선지':'오답 선지',detail,basis};
    });
  }
  globalThis.CBT_OPTION_EXPLAINER={optionExplanations};
})();
