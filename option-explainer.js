'use strict';

(()=>{
  const compactTopics={
    CASE:{
      definition:'소프트웨어 생명주기 전 과정을 자동화 도구로 지원하는 개발 환경',
      features:['그래픽 기반 분석·설계','단계별 산출물 연결·추적','다양한 개발 모형 지원']
    }
  };
  const facts=[
    [/^\+$/,'+는 두 수를 더하는 산술 연산자이며, 일부 언어에서는 문자열이나 컬렉션을 이어 붙이는 데도 사용한다.','산술 연산자'],
    [/^-$/,'-는 두 수의 차를 구하거나 한 값의 부호를 반대로 만드는 산술 연산자다.','산술 연산자'],
    [/^\*$/,'*는 두 값을 곱하는 산술 연산자다. 포인터를 지원하는 C에서는 문맥에 따라 역참조 기호로도 쓰인다.','산술 연산자'],
    [/^\/$/,'/는 나눗셈 연산자다. 정수끼리 계산할 때 결과 처리 방식은 언어에 따라 다르므로 자료형을 함께 확인한다.','산술 연산자'],
    [/^\*\*$/,'Python에서 **는 왼쪽 값을 오른쪽 값만큼 거듭제곱하는 연산자다. 예: 2 ** 3 = 8.','산술 연산자'],
    [/^\/\/$/,'Python에서 //는 나눗셈의 몫을 내림해 반환하는 바닥 나눗셈 연산자다. 예: 7 // 2 = 3.','산술 연산자'],
    [/^%$/,'%는 나눗셈의 나머지를 구하는 연산자다. 예: 7 % 2 = 1.','산술 연산자'],
    [/^=$/,'=는 오른쪽에서 계산한 값을 왼쪽 변수에 저장하는 대입 연산자다. 두 값이 같은지 비교하는 ==와 다르다.','대입 연산자'],
    [/^==$/,'==는 양쪽 값이 같은지 비교해 참 또는 거짓을 만드는 동등 비교 연산자다. 값을 저장하는 =와 다르다.','비교 연산자'],
    [/^!=$/,'!=는 양쪽 값이 서로 다른지 비교해 참 또는 거짓을 만드는 비교 연산자다.','비교 연산자'],
    [/^(?:<|>|<=|>=)$/,'<, >, <=, >=는 두 값의 크기 관계를 비교해 참 또는 거짓을 만드는 관계 연산자다.','비교 연산자'],
    [/^\(\)$/,'괄호 ()는 식의 계산 순서를 먼저 묶거나 함수 호출의 인수를 표시한다. 연산자 우선순위 문제에서는 괄호 안을 가장 먼저 계산한다.','괄호 표기'],
    [/^&&$/,'C·Java에서 &&는 두 조건이 모두 참일 때만 참인 논리 AND 연산자다.','논리 연산자'],
    [/^\|\|$/,'C·Java에서 ||는 두 조건 중 하나 이상이 참이면 참인 논리 OR 연산자다.','논리 연산자'],
    [/^!$/,'C·Java에서 !는 참과 거짓을 반대로 바꾸는 논리 NOT 연산자다.','논리 연산자'],
    [/^\+\+$/,'++는 변수 값을 1 증가시키는 증가 연산자다. 전위형은 증가 후 값을, 후위형은 사용 후 증가한 값을 적용한다.','증감 연산자'],
    [/^--$/,'--는 변수 값을 1 감소시키는 감소 연산자다. 전위형과 후위형은 값이 적용되는 시점이 다르다.','증감 연산자'],
    [/\bCASE\b/i,'CASE(Computer-Aided Software Engineering)는 요구분석·설계·구현·테스트·문서화 등 소프트웨어 생명주기 활동을 자동화 도구로 지원해 개발 생산성과 산출물의 일관성을 높이는 방식이다.','CASE'],
    [/그래픽\s*지원/i,'CASE 도구는 모델과 설계 산출물을 다이어그램으로 작성·관리할 수 있도록 그래픽 기능을 지원한다.','CASE'],
    [/소프트웨어\s*생명주기\s*전\s*단계의\s*연결/i,'CASE는 생명주기 각 단계의 산출물을 저장소로 연결해 단계 사이의 추적성과 일관성을 유지한다.','CASE'],
    [/언어\s*번역/i,'언어 번역은 컴파일러·인터프리터·어셈블러처럼 원시 프로그램을 다른 언어나 실행 형태로 바꾸는 언어 처리 기능이다. CASE의 주요 고유 기능과는 구분한다.','언어 처리'],
    [/다양한\s*소프트웨어\s*개발\s*모형\s*지원/i,'CASE 도구는 폭포수·프로토타입·구조적 방법론 등 여러 개발 모형과 분석·설계 방법을 지원할 수 있다.','CASE'],
    [/행위\s*패턴/i,'객체 사이의 책임 분배와 협력 방식을 다루는 GoF 패턴 분류다.','행위 패턴'],
    [/생성\s*패턴/i,'객체 생성 과정과 인스턴스화 책임을 분리하는 GoF 패턴 분류다.','생성 패턴'],
    [/구조\s*패턴/i,'클래스와 객체를 조합해 더 큰 구조를 만드는 GoF 패턴 분류다.','구조 패턴'],
    [/Visitor|방문자/i,'객체 구조를 바꾸지 않고 원소에 수행할 연산을 추가하는 행위 패턴이다.','행위 패턴'],
    [/Observer|옵서버/i,'한 객체의 상태 변화를 여러 의존 객체에 자동 통지하는 행위 패턴이다.','행위 패턴'],
    [/Strategy|전략/i,'교환 가능한 알고리즘들을 캡슐화해 실행 중 선택하는 행위 패턴이다.','행위 패턴'],
    [/Command|커맨드/i,'요청을 객체로 캡슐화해 실행·취소·대기열 처리를 가능하게 하는 행위 패턴이다.','행위 패턴'],
    [/Builder|빌더/i,'복합 객체의 생성 과정과 표현을 분리하는 생성 패턴이다.','생성 패턴'],
    [/Prototype/i,'기존 객체를 복제해 새 객체를 만드는 생성 패턴이다.','생성 패턴'],
    [/Singleton|싱글톤/i,'인스턴스를 하나로 제한하고 전역 접근점을 제공하는 생성 패턴이다.','생성 패턴'],
    [/Factory|팩토리/i,'구체 객체의 생성 책임을 별도 메서드나 객체에 맡기는 생성 패턴이다.','생성 패턴'],
    [/Bridge|브리지/i,'추상화와 구현을 분리해 각각 독립적으로 확장하는 구조 패턴이다.','구조 패턴'],
    [/Adapter|어댑터/i,'호환되지 않는 인터페이스를 기대하는 형태로 변환하는 구조 패턴이다.','구조 패턴'],
    [/Decorator|데코레이터/i,'객체를 감싸 기능을 동적으로 추가하는 구조 패턴이다.','구조 패턴'],
    [/Facade|퍼사드/i,'복잡한 서브시스템에 단순한 통합 인터페이스를 제공하는 구조 패턴이다.','구조 패턴'],
    [/클래스|\bClass\b/i,'같은 속성과 행위를 갖는 객체를 생성하기 위한 틀이다.','클래스'],
    [/인스턴스|\bInstance\b/i,'클래스를 바탕으로 실제 메모리에 생성된 객체다.','인스턴스'],
    [/메서드|메소드|\bMethod\b|\bOperation\b/i,'객체가 수행할 수 있는 행위나 연산을 정의한다.','메서드'],
    [/메시지|\bMessage\b/i,'객체가 다른 객체에 메서드 수행을 요청하는 통신 수단이다.','메시지'],
    [/캡슐화|Encapsulation/i,'데이터와 연산을 하나로 묶고 내부 구현의 직접 접근을 제한한다.','객체지향 원리'],
    [/상속/i,'상위 클래스의 속성과 연산을 하위 클래스가 물려받아 확장한다.','객체지향 원리'],
    [/다형성/i,'같은 메시지가 실제 객체에 따라 서로 다르게 동작할 수 있는 성질이다.','객체지향 원리'],
    [/정보\s*은닉/i,'모듈 내부 구현을 감추고 공개 인터페이스를 통해서만 접근하게 한다.','설계 원리'],
    [/기능적\s*응집/i,'모듈 요소가 하나의 명확한 기능 수행에 집중된 가장 강한 응집 형태다.','응집도'],
    [/응집도/i,'모듈 내부 요소가 하나의 목적을 위해 관련된 정도이며 높을수록 좋다.','응집도'],
    [/자료\s*결합|Data\s*Coupling/i,'모듈 사이에 필요한 단순 데이터만 매개변수로 전달하는 낮은 결합 형태다.','결합도'],
    [/스탬프\s*결합|Stamp\s*Coupling/i,'자료구조 전체를 전달해 일부만 사용하는 결합 형태다.','결합도'],
    [/제어\s*결합|Control\s*Coupling/i,'제어 플래그를 전달해 다른 모듈의 처리 흐름을 지시하는 결합 형태다.','결합도'],
    [/공통\s*결합|Common\s*Coupling/i,'여러 모듈이 전역 데이터를 함께 참조하는 결합 형태다.','결합도'],
    [/내용\s*결합|Content\s*Coupling/i,'한 모듈이 다른 모듈의 내부를 직접 참조하는 가장 강한 결합 형태다.','결합도'],
    [/결합도/i,'모듈 사이의 의존 정도이며 낮을수록 변경과 유지보수에 유리하다.','결합도'],
    [/Dependency|의존\s*관계/i,'한 요소의 변경이 다른 요소에 영향을 주는 사용 관계다.','UML 관계'],
    [/Generalization|일반화/i,'하위 요소가 상위 요소의 특성을 물려받는 상속 관계다.','UML 관계'],
    [/Realization|실체화/i,'클래스가 인터페이스에 정의된 책임을 구현하는 관계다.','UML 관계'],
    [/Association|연관\s*관계/i,'객체들이 구조적으로 연결되어 서로를 알고 사용하는 관계다.','UML 관계'],
    [/include|포함\s*관계/i,'여러 유스케이스가 공통 기능을 반드시 포함하는 관계다.','유스케이스 관계'],
    [/extend|확장\s*관계/i,'특정 조건에서 기본 유스케이스에 기능을 선택적으로 추가하는 관계다.','유스케이스 관계'],
    [/화이트박스|white\s*box/i,'프로그램 내부 제어 구조·분기·경로를 기준으로 테스트한다.','화이트박스 테스트'],
    [/블랙박스|black\s*box/i,'내부 구현이 아니라 외부 입력·출력 명세를 기준으로 테스트한다.','블랙박스 테스트'],
    [/경계\s*값|경계값/i,'입력 영역의 경계와 경계 바로 안팎 값을 검사하는 블랙박스 기법이다.','블랙박스 테스트'],
    [/동등\s*분할|등가\s*분할/i,'같게 처리될 입력 영역을 유효·무효 집합으로 나눠 대표값을 검사한다.','블랙박스 테스트'],
    [/문장\s*커버리지/i,'실행 가능한 모든 문장을 적어도 한 번 수행하게 하는 기준이다.','화이트박스 테스트'],
    [/결정\s*커버리지|분기\s*커버리지/i,'각 결정의 참과 거짓 결과를 모두 적어도 한 번 수행하게 한다.','화이트박스 테스트'],
    [/기초\s*경로/i,'제어 흐름 그래프의 순환 복잡도를 이용해 독립 경로를 테스트한다.','화이트박스 테스트'],
    [/통합\s*테스트.*(?:틀린|설명)/i,'통합 테스트는 결합된 모듈 사이의 인터페이스와 상호작용을 확인한다.','통합 테스트 원리'],
    [/상향식.*최상위.*먼저/i,'상향식 통합은 최하위 모듈부터 시작하므로 최상위 모듈부터 구현한다는 설명은 반대다.','통합 테스트 오류'],
    [/하향식.*넓이\s*우선/i,'하향식 통합 테스트는 깊이 우선 또는 넓이 우선 방식으로 모듈을 결합할 수 있다.','통합 테스트 원리'],
    [/모듈.*인터페이스.*결합|인터페이스.*시스템.*동작/i,'통합 테스트는 모듈 사이 인터페이스와 결합 후 동작을 확인한다.','통합 테스트 원리'],
    [/단위\s*테스트/i,'개별 모듈이나 컴포넌트를 가장 작은 단위로 검증한다.','테스트 수준'],
    [/통합\s*테스트/i,'결합된 모듈 사이의 인터페이스와 상호작용을 검증한다.','테스트 수준'],
    [/시스템\s*테스트/i,'완성된 전체 시스템이 명세를 충족하는지 검증한다.','테스트 수준'],
    [/인수\s*테스트/i,'사용자 관점에서 업무 요구와 인수 조건 충족 여부를 확인한다.','테스트 수준'],
    [/\bStub\b|스텁/i,'하향식 통합 테스트에서 아직 결합하지 않은 하위 모듈을 대신한다.','테스트 도구'],
    [/\bDriver\b|드라이버/i,'상향식 통합 테스트에서 아직 결합하지 않은 상위 호출 모듈을 대신한다.','테스트 도구'],
    [/제\s*1\s*정규형|1NF/i,'모든 속성값을 더 나눌 수 없는 원자값으로 만든 정규형이다.','정규화'],
    [/제\s*2\s*정규형|2NF/i,'제1정규형에서 복합키 일부에 대한 부분 함수 종속을 제거한다.','정규화'],
    [/제\s*3\s*정규형|3NF/i,'제2정규형에서 일반 속성 사이의 이행 함수 종속을 제거한다.','정규화'],
    [/부분적?\s*함수\s*종속/i,'일반 속성이 복합키 전체가 아닌 일부에 종속되는 상태다.','정규화'],
    [/이행적?\s*함수\s*종속/i,'기본키가 아닌 속성을 거쳐 다른 속성이 간접 종속되는 상태다.','정규화'],
    [/원자성|Atomicity/i,'트랜잭션 연산을 모두 수행하거나 모두 취소해야 한다는 ACID 성질이다.','ACID'],
    [/일관성|Consistency/i,'트랜잭션 전후에 무결성 규칙을 유지해야 한다는 ACID 성질이다.','ACID'],
    [/격리성|고립성|Isolation/i,'동시 트랜잭션의 중간 결과가 서로 간섭하지 않게 하는 ACID 성질이다.','ACID'],
    [/지속성|Durability/i,'완료된 트랜잭션 결과가 장애 뒤에도 보존되어야 한다는 ACID 성질이다.','ACID'],
    [/COMMIT/i,'트랜잭션에서 수행한 변경을 영구 확정하는 명령이다.','트랜잭션 제어'],
    [/ROLLBACK/i,'트랜잭션에서 수행한 변경을 취소하고 이전 상태로 되돌린다.','트랜잭션 제어'],
    [/후보키|Candidate\s*Key/i,'튜플을 유일하게 식별하는 최소 속성 집합이다.','관계키'],
    [/슈퍼키|Super\s*Key/i,'튜플을 유일하게 식별하지만 불필요한 속성을 포함할 수 있는 집합이다.','관계키'],
    [/기본키|Primary\s*Key/i,'후보키 중 대표로 선택되며 NULL과 중복을 허용하지 않는 키다.','관계키'],
    [/외래키|Foreign\s*Key/i,'다른 릴레이션의 키를 참조해 릴레이션 사이 관계를 표현한다.','관계키'],
    [/개체\s*무결성/i,'기본키 값은 NULL이 될 수 없다는 제약이다.','무결성 제약'],
    [/참조\s*무결성/i,'외래키 값은 참조키 값과 일치하거나 NULL이어야 한다는 제약이다.','무결성 제약'],
    [/도메인\s*무결성/i,'속성값이 정의된 도메인의 형식·범위·제약을 따라야 한다.','무결성 제약'],
    [/\bCREATE\b|\bALTER\b|\bDROP\b|\bDDL\b/i,'데이터베이스 객체의 구조를 정의·변경·삭제하는 DDL이다.','DDL'],
    [/\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDML\b/i,'데이터를 조회·삽입·수정·삭제하는 DML이다.','DML'],
    [/\bGRANT\b|\bREVOKE\b|\bDCL\b/i,'데이터 접근 권한을 부여하거나 회수하는 DCL이다.','DCL'],
    [/GROUP\s+BY/i,'같은 값을 가진 행을 그룹으로 묶어 집계할 때 사용한다.','SQL 절'],
    [/HAVING/i,'GROUP BY로 묶은 그룹 결과에 조건을 적용한다.','SQL 절'],
    [/DISTINCT/i,'SELECT 결과에서 중복 행을 제거한다.','SQL 절'],
    [/\bCASCADE\b/i,'부모 행의 삭제·변경을 참조하는 자식 행에도 연쇄 적용한다.','참조 동작'],
    [/SET[-_ ]?NULL/i,'부모 행이 삭제·변경될 때 자식 외래키 값을 NULL로 설정한다.','참조 동작'],
    [/RESTRICT(?:ED)?/i,'참조하는 자식 행이 있으면 부모 행의 삭제·변경을 거부한다.','참조 동작'],
    [/\bCLUSTER\b/i,'관련 데이터를 물리적으로 가깝게 배치하는 저장 구조와 관련되며 참조 연쇄 삭제 옵션이 아니다.','저장 구조'],
    [/\bSelect\b|선택\s*연산/i,'관계대수에서 조건을 만족하는 행을 고르는 연산이다.','관계대수'],
    [/\bProject\b|투영\s*연산/i,'관계대수에서 필요한 열을 고르는 연산이다.','관계대수'],
    [/\bDivision\b|나눗셈\s*연산/i,'특정 속성값 집합을 모두 만족하는 튜플을 구하는 관계대수 연산이다.','관계대수'],
    [/스택|\bStack\b|LIFO/i,'가장 나중에 삽입한 데이터를 먼저 꺼내는 LIFO 자료구조다.','자료구조'],
    [/큐|\bQueue\b|FIFO/i,'가장 먼저 삽입한 데이터를 먼저 꺼내는 FIFO 자료구조다.','자료구조'],
    [/선택\s*정렬/i,'최솟값을 찾아 앞쪽 위치와 교환하는 과정을 반복하는 정렬이다.','정렬'],
    [/병합\s*정렬/i,'자료를 나눈 뒤 정렬된 부분 배열을 합치며 완성하는 정렬이다.','정렬'],
    [/이진\s*탐색/i,'정렬된 자료에서 중앙값과 비교해 범위를 절반씩 줄이는 탐색이다.','탐색'],
    [/\bTCP\b/i,'연결 설정·순서 제어·재전송으로 신뢰성 있는 전송을 제공한다.','전송 계층'],
    [/\bUDP\b/i,'연결 설정과 전달 보장을 생략해 오버헤드가 작은 전송을 제공한다.','전송 계층'],
    [/\bHTTP\b/i,'웹 문서를 전송하는 응용 계층 프로토콜이다.','응용 계층'],
    [/\bSMTP\b/i,'전자우편을 전송하는 응용 계층 프로토콜이다.','응용 계층'],
    [/\bFTP\b/i,'파일 전송을 위한 응용 계층 프로토콜이다.','응용 계층'],
    [/\bDNS\b/i,'도메인 이름을 IP 주소 등의 자원 레코드로 변환한다.','응용 계층'],
    [/\bARP\b/i,'같은 네트워크에서 IPv4 주소에 대응하는 MAC 주소를 찾는다.','네트워크 접근'],
    [/\bRIP\b/i,'홉 수를 메트릭으로 사용하며 최대 홉 수가 15인 거리 벡터 라우팅 프로토콜이다.','라우팅 프로토콜'],
    [/\bOSPF\b/i,'링크 상태와 비용을 이용해 최단 경로를 구하는 라우팅 프로토콜이다.','라우팅 프로토콜'],
    [/물리\s*계층/i,'비트의 전기적·기계적 전송 규격을 담당하는 OSI 1계층이다.','OSI 계층'],
    [/데이터\s*링크\s*계층/i,'프레임·MAC 주소·오류 검출을 담당하는 OSI 2계층이다.','OSI 계층'],
    [/네트워크\s*계층/i,'논리 주소와 라우팅을 담당하는 OSI 3계층이다.','OSI 계층'],
    [/전송\s*계층/i,'종단 간 연결·신뢰성·흐름 제어를 담당하는 OSI 4계층이다.','OSI 계층'],
    [/세션\s*계층/i,'응용 간 대화의 설정·유지·동기화를 담당하는 OSI 5계층이다.','OSI 계층'],
    [/표현\s*계층/i,'데이터 형식 변환·압축·암호화를 담당하는 OSI 6계층이다.','OSI 계층'],
    [/응용\s*계층/i,'사용자 응용에 네트워크 서비스를 제공하는 OSI 7계층이다.','OSI 계층'],
    [/데이터\s*관리\s*프로그램/i,'주기억장치와 보조기억장치 사이의 데이터 전송과 파일 처리를 관리하는 제어 프로그램이다.','제어 프로그램'],
    [/작업\s*제어\s*프로그램/i,'작업의 시작·종료와 실행 순서를 관리하는 제어 프로그램이다.','제어 프로그램'],
    [/감시\s*프로그램/i,'시스템 전체의 동작 상태와 프로그램 실행을 감독하는 제어 프로그램이다.','제어 프로그램'],
    [/서비스\s*프로그램/i,'사용자 편의를 위한 정렬·편집·유틸리티 등을 제공하는 처리 프로그램이다.','처리 프로그램'],
    [/프로세스.*기억장치.*입출력.*관리|자원\s*관리/i,'프로세스·메모리·입출력 자원 관리는 쉘이 아니라 커널의 핵심 기능이다.','커널'],
    [/프로세스|\bProcess\b/i,'실행 중이며 독립된 주소 공간과 자원을 할당받은 프로그램이다.','운영체제'],
    [/스레드/i,'한 프로세스의 자원을 공유하며 독립적으로 스케줄되는 실행 흐름이다.','운영체제'],
    [/쉘|명령어\s*해석기|사용자.*인터페이스/i,'사용자 명령을 해석해 커널에 전달하는 인터페이스다.','쉘'],
    [/\bfork\b/i,'UNIX에서 현재 프로세스를 복제해 자식 프로세스를 생성한다.','UNIX 명령'],
    [/\bls\b/i,'UNIX에서 디렉터리의 파일 목록을 출력한다.','UNIX 명령'],
    [/\bcat\b/i,'UNIX에서 파일 내용을 출력하거나 파일을 연결한다.','UNIX 명령'],
    [/\bchmod\b/i,'UNIX에서 파일이나 디렉터리의 접근 권한을 변경한다.','UNIX 명령'],
    [/기밀성|Confidentiality/i,'인가된 사용자만 정보에 접근하도록 보호하는 보안 목표다.','CIA'],
    [/무결성|Integrity/i,'정보가 허가 없이 변경·훼손되지 않도록 정확성을 보호하는 목표다.','CIA'],
    [/가용성|Availability/i,'인가된 사용자가 필요할 때 시스템을 사용할 수 있게 하는 목표다.','CIA'],
    [/\bAES\b|\bDES\b|\bSEED\b|\bARIA\b/i,'암호화와 복호화에 같은 비밀키를 사용하는 대칭키 암호 알고리즘이다.','대칭키 암호'],
    [/\bRSA\b|\bECC\b/i,'공개키와 개인키의 쌍을 사용하는 공개키 암호 알고리즘이다.','공개키 암호'],
    [/\bMD4\b|\bMD5\b|SHA-?1|해시\s*함수/i,'임의 길이 입력을 고정 길이 값으로 바꾸는 단방향 해시 방식이다.','해시'],
    [/\bIDS\b/i,'침입 징후를 탐지해 관리자에게 경보하는 시스템이다.','보안 통제'],
    [/\bIPS\b/i,'침입을 탐지하고 악성 트래픽 차단까지 수행하는 시스템이다.','보안 통제'],
    [/방화벽/i,'보안 정책에 따라 네트워크 경계의 트래픽을 허용하거나 차단한다.','보안 통제'],
    [/\bNAC\b/i,'단말의 보안 상태를 검사해 네트워크 접속을 통제한다.','접근 통제'],
    [/\bVPN\b|Virtual\s*Private\s*Network/i,'공용망에 암호화된 사설 통신 경로를 구성한다.','네트워크 보안'],
    [/Worm|웜/i,'스스로 복제하며 네트워크를 통해 확산하는 악성코드다.','악성코드'],
    [/Ransomware|랜섬웨어/i,'데이터를 암호화하거나 사용을 막고 금전을 요구하는 악성코드다.','악성코드'],
    [/Adware|애드웨어/i,'광고 노출을 목적으로 설치되어 사용자 활동을 방해할 수 있는 프로그램이다.','악성코드'],
    [/Smishing|스미싱/i,'문자메시지의 악성 링크 등으로 개인정보 탈취나 악성앱 설치를 유도한다.','사회공학 공격'],
    [/SQL\s*삽입|SQL\s*Injection/i,'입력을 SQL 구문의 일부로 해석시켜 질의 의도를 바꾸는 공격이다.','웹 공격'],
    [/\bXSS\b/i,'악성 스크립트를 다른 사용자의 브라우저에서 실행시키는 공격이다.','웹 공격'],
    [/\bCSRF\b/i,'인증된 사용자의 권한으로 공격자가 의도한 요청을 보내게 하는 공격이다.','웹 공격'],
    [/\bJSON\b/i,'데이터를 속성·값 쌍과 배열로 표현하는 경량 텍스트 형식이다.','데이터 형식'],
    [/\bXML\b/i,'사용자 정의 태그로 계층 구조 데이터를 표현하는 마크업 형식이다.','데이터 형식'],
    [/프로토타입.*장점/i,'초기 모형으로 사용자 피드백을 받아 요구를 구체화하는 프로토타입 모형의 장점을 묻는다.','프로토타입 장점'],
    [/단기간.*비효율적인.*(?:언어|알고리즘)/i,'빠른 모형 제작 때문에 비효율적 구현을 선택할 수 있다는 것은 프로토타입 모형의 단점이다.','프로토타입 단점'],
    [/사용자.*요구.*반영|일부.*모형.*볼\s*수|공동.*참조\s*모델/i,'사용자 피드백과 가시적인 모형 제공은 프로토타입 모형의 장점이다.','프로토타입 장점'],
    [/프로토타입\s*모형/i,'초기 모형을 빠르게 만들어 사용자 반응으로 요구사항을 구체화하는 개발 모형이다.','프로토타입 모형'],
    [/폭포수|Waterfall/i,'분석·설계·구현·시험 단계를 순차적으로 진행하는 생명주기 모형이다.','개발 모형'],
    [/나선형|Spiral/i,'위험 분석을 포함한 반복 주기로 점진적으로 개발하는 모형이다.','개발 모형'],
    [/\bCOCOMO\b/i,'소프트웨어 규모를 바탕으로 개발 노력·기간·비용을 추정한다.','비용 산정'],
    [/Critical\s*Path|임계\s*경로|CPM/i,'프로젝트 완료 기간을 결정하는 여유시간 0인 작업 경로다.','일정 관리'],
    [/Work\s*Breakdown\s*Structure|WBS/i,'프로젝트 범위를 관리 가능한 작업 단위로 계층 분해한 구조다.','범위 관리'],
    [/\bIaaS\b/i,'서버·스토리지·네트워크 같은 인프라를 서비스로 제공한다.','클라우드 서비스'],
    [/\bPaaS\b/i,'애플리케이션 개발·실행 플랫폼을 서비스로 제공한다.','클라우드 서비스'],
    [/\bSaaS\b/i,'완성된 애플리케이션을 인터넷을 통해 서비스로 제공한다.','클라우드 서비스']
  ];
  const generic=/원본\s*기출|정답표.*기준|정답표와\s*대조/;
  const negative=/아닌|옳지\s*않|틀린|거리가\s*먼|포함되지\s*않|해당하지\s*않/;
  const findFact=text=>{
    for(const [pattern,description,group] of facts){
      const match=String(text||'').match(pattern);
      if(match)return {term:match[0],description,group};
    }
    return null;
  };
  const cleanStem=stem=>String(stem||'').replace(/\s+/g,' ').slice(0,90);
  const words=text=>(String(text||'').match(/[A-Za-z][A-Za-z0-9+#.-]*|[가-힣]{2,}/g)||[]).filter(word=>!/^(다음|설명|대한|것은|있는|없는|가장|옳은|아닌|보기|해당)$/.test(word));
  function contrast(wrong,correct){
    const wrongWords=words(wrong),correctWords=words(correct);
    const wrongOnly=wrongWords.filter(word=>!correctWords.includes(word)).slice(0,2);
    const correctOnly=correctWords.filter(word=>!wrongWords.includes(word)).slice(0,2);
    if(wrongOnly.length&&correctOnly.length)return `이 선지는 ‘${wrongOnly.join('·')}’을 제시하지만, 정답 판단에는 ‘${correctOnly.join('·')}’이 필요하다.`;
    return `정답 선지인 “${correct}”와 적용 대상 또는 처리 결과가 다르다.`;
  }
  function boundaryExplanation(q,wording,correct){
    if(!/경계\s*값|경계값/.test(q.stem||'')||!/^[-+]?\d+(?:\.\d+)?$/.test(wording))return null;
    const ranges=[...(q.stem||'').matchAll(/(\d+)\s*[~～-]\s*(\d+)/g)].map(match=>[Number(match[1]),Number(match[2])]);
    if(!ranges.length)return null;
    const boundaries=new Set(ranges.flatMap(([lo,hi])=>[lo-1,lo,lo+1,hi-1,hi,hi+1]));
    const value=Number(wording),isBoundary=boundaries.has(value);
    return {concept:`경계값 분석은 각 구간의 시작·끝과 바로 안팎 값을 검사한다. 이 문제의 경계 후보는 ${[...boundaries].sort((a,b)=>a-b).join(', ')}이다.`,why:correct?`${value}은(는) ${isBoundary?'경계 후보에 포함되므로':'경계 후보가 아니므로'} 부정형 질문의 정답이 된다.`:`${value}은(는) ${isBoundary?'실제 경계 후보이므로':'경계 후보가 아니지만 정답으로 지정된 값과 다르므로'} 이 문항의 정답이 아니다.`};
  }
  function distinctExplanation(q,correct){
    if(!/SELECT\s+DISTINCT/i.test(q.stem||''))return null;
    return {concept:'일반 SELECT는 중복을 포함한 모든 행을 반환하고, DISTINCT는 중복 값을 제거한다.',why:correct?'전체 행 수와 서로 다른 값의 수를 각각 적용한 결과와 일치한다.':`일반 SELECT의 전체 행 수와 DISTINCT의 서로 다른 값 개수를 구분하지 못한 결과다. 정답 결과는 “${q.answer.map(i=>q.options[i]).join(' / ')}”이다.`};
  }
  function optionExplanations(q){
    const profile=globalThis.CBT_CONCEPTS.profile(q);
    const stored=q.optionReasons||[];
    const detailed=stored.length===(q.options||[]).length&&new Set(stored.filter(Boolean)).size>1&&stored.every(reason=>!generic.test(reason));
    const asksNegative=negative.test(q.stem||'');
    const stemFact=findFact(q.stem);
    const correctText=(q.answer||[]).map(i=>q.options[i]).join(' / ');
    const correctFact=findFact(correctText);
    return (q.options||[]).map((option,index)=>{
      const correct=(q.answer||[]).includes(index),wording=String(option||'').trim();
      const special=boundaryExplanation(q,wording,correct)||distinctExplanation(q,correct);
      const optionFact=findFact(wording);
      let concept,why,basis;
      if(detailed){
        concept=optionFact?.description||`${profile.label} 문항의 선지다.`;
        why=stored[index];basis='원자료 선지 해설';
      }else if(special){
        concept=special.concept;why=special.why;basis='문항 조건 계산';
      }else if(optionFact){
        concept=`${optionFact.term}: ${optionFact.description}`;
        if(correct&&asksNegative&&stemFact&&optionFact.group!==stemFact.group){
          why=stemFact.group==='CASE'&&optionFact.group==='언어 처리'
            ?`“${wording}”은 CASE가 아니라 컴파일러·인터프리터·어셈블러가 수행하는 언어 처리 기능이다.`
            :`“${wording}”은 “${stemFact.group}”가 아니라 “${optionFact.group}” 기능이다.`;
        }else if(correct){
          why=asksNegative?'정답표와 개념 분류를 함께 보면 이 설명은 문항의 부정 조건에 해당한다.':`이 선지의 ${optionFact.group} 특성이 문항에서 요구한 조건과 일치한다.`;
        }else if(asksNegative&&stemFact&&optionFact.group===stemFact.group){
          why=`이 설명은 실제로 ${stemFact.group}에 해당하므로, 부정형 조건의 정답이 아니다.`;
        }else if(correctFact&&optionFact.group===correctFact.group){
          why=`둘 다 ${optionFact.group} 범주지만 동작이 다르다. 이 선지는 ${optionFact.description} 문항에서 요구한 동작은 “${correctText}”의 ${correctFact.description}`;
        }else if(correctFact&&optionFact.group!==correctFact.group){
          why=`이 선지는 ${optionFact.group}에 해당하지만 정답 “${correctText}”은(는) ${correctFact.group}에 해당한다. 분류·역할이 서로 달라 오답이다.`;
        }else if(stemFact&&optionFact.group!==stemFact.group){
          why=`문항은 ${stemFact.group}을 묻지만 이 선지는 ${optionFact.group}에 해당하므로 오답이다.`;
        }else{
          why=`${contrast(wording,correctText)} ${profile.compare}`;
        }
        basis='정보처리기사 개념 비교';
      }else if(correct){
        concept=stemFact?`${stemFact.term}: ${stemFact.description}`:`${profile.label}: ${profile.memory}`;
        why=asksNegative?`위 개념 정의와 선지의 주장 또는 분류가 어긋나므로 부정형 문항의 정답이다.`:`“${wording}”이(가) 문항의 요구 조건을 만족한다. 판단 기준은 ${stemFact?.description||profile.memory}`;
        basis=stemFact?'정보처리기사 개념 비교':'정답표·문항 판단 기준';
      }else{
        concept=correctFact?`정답 기준 ${correctFact.term}: ${correctFact.description}`:`${profile.label}에서는 선지의 목적·대상·결과를 정답 개념과 비교해야 한다.`;
        why=correctFact?`${contrast(wording,correctText)} 정답 개념의 핵심은 ${correctFact.description}`:`${contrast(wording,correctText)} ${profile.compare}`;
        basis=correctFact?'정보처리기사 개념 비교':'정답 선지와 개념 대조';
      }
      return {correct,label:correct?'정답 선지':'오답 선지',concept,why,basis,focus:cleanStem(q.stem)};
    });
  }
  function topicExplanation(q){
    const profile=globalThis.CBT_CONCEPTS.profile(q);
    const fact=findFact(q.stem);
    if(fact)return {
      title:`${fact.term}부터 이해하기`,
      definition:fact.description,
      examPoint:profile.memory,
      compare:profile.compare
    };
    const keywords=profile.keywords?.slice(0,2).join(' · ')||profile.label;
    return {
      title:`${profile.label}부터 이해하기`,
      definition:`${profile.summary.join(' ')}`,
      examPoint:`${keywords}: ${profile.memory}`,
      compare:profile.compare
    };
  }
  function compactExplanation(q){
    const profile=globalThis.CBT_CONCEPTS.profile(q);
    const stemFact=findFact(q.stem);
    const curated=compactTopics[stemFact?.group];
    const rows=optionExplanations(q);
    const definition=curated?.definition||stemFact?.description||profile.summary[0];
    const matchedFeatures=stemFact?(q.options||[])
      .map(findFact)
      .filter(fact=>fact&&fact.group===stemFact.group&&fact.description!==definition)
      .map(fact=>fact.description):[];
    const fallbackFeatures=(profile.summary||[]).filter(line=>line!==definition).concat(profile.memory||[]);
    const features=curated?.features||[...new Set(matchedFeatures.length?matchedFeatures:fallbackFeatures)].slice(0,3);
    const answers=(q.answer||[]).map(index=>({index,text:q.options[index],contrast:rows[index]?.why||''}));
    return {keyword:stemFact?.term||profile.label,definition,features,answers};
  }
  globalThis.CBT_OPTION_EXPLAINER={optionExplanations,topicExplanation,compactExplanation,findFact};
})();
