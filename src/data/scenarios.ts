export interface Scenario {
  id: string;
  unitId: number;
  unitTitle: string;
  achievementStandard: string;
  studentUtterance: string;
  context: string;
  exemplarAnswer: string;
}

export interface Unit {
  id: number;
  title: string;
  scenarios: Scenario[];
}

export const UNITS: Unit[] = [
  {
    id: 1,
    title: '제곱근과 실수',
    scenarios: [
      {
        id: '1-1',
        unitId: 1,
        unitTitle: '제곱근과 실수',
        achievementStandard: '제곱근의 뜻과 성질을 알고, 제곱근의 대소 관계를 판단할 수 있다.',
        studentUtterance: '√4 = ±2 아닌가요?',
        context: '근호 기호가 양의 제곱근만을 나타낸다는 약속과, 제곱해서 4가 되는 수인 4의 제곱근을 혼동하고 있음.',
        exemplarAnswer: '4의 제곱근은 2와 -2 두 개가 맞아요. 하지만 √4는 제곱해서 4가 되는 수 중에서 양수인 값을 나타내기로 한 기호예요. 그래서 √4 = 2이고, -2까지 함께 쓰려면 ±√4 또는 ±2라고 표현해야 해요.',
      },
      {
        id: '1-2',
        unitId: 1,
        unitTitle: '제곱근과 실수',
        achievementStandard: '근호를 포함한 식의 사칙계산의 원리를 이해하고 계산할 수 있다.',
        studentUtterance: '√2 + √3 = √5 아닌가요?',
        context: '근호 안의 수를 일반적인 자연수처럼 더할 수 있다고 생각하며, 무리수 계산의 원리를 이해하지 못함.',
        exemplarAnswer: '√2와 √3은 서로 다른 수라서 근호 안의 수를 그냥 더할 수 없어요. 실제로 √2는 약 1.41, √3은 약 1.73이므로 더하면 약 3.14예요. 그런데 √5는 약 2.24라서 값이 다르죠. 따라서 √2 + √3은 √5가 아니라 그대로 √2 + √3으로 두어야 해요.',
      },
      {
        id: '1-3',
        unitId: 1,
        unitTitle: '제곱근과 실수',
        achievementStandard: '무리수의 개념을 이해하고, 무리수의 필요성을 인식할 수 있다.',
        studentUtterance: 'π는 3.14니까 유리수 아닌가요?',
        context: '자주 사용하는 근삿값 3.14와 실제 값인 무한소수 π를 혼동하고, 유리수와 무리수의 정의를 정확히 연결하지 못함.',
        exemplarAnswer: '3.14는 π의 정확한 값이 아니라 계산하기 쉽게 쓰는 근삿값이에요. π는 3.141592...처럼 끝없이 이어지고 같은 숫자 배열이 반복되지 않아서 분수로 정확히 나타낼 수 없어요. 그래서 π는 유리수가 아니라 무리수예요.',
      },
    ],
  },
  {
    id: 2,
    title: '다항식의 곱셈과 인수분해',
    scenarios: [
      {
        id: '2-1',
        unitId: 2,
        unitTitle: '다항식의 곱셈과 인수분해',
        achievementStandard: '다항식의 곱셈과 인수분해를 할 수 있다.',
        studentUtterance: 'x²-9를 인수분해하면 (x-3)² 아닌가요? 3을 제곱하면 9이니까요.',
        context: '완전제곱식과 차의 제곱 공식을 혼동하며, 완전제곱식을 전개했을 때 생기는 중간항의 존재를 간과함.',
        exemplarAnswer: '(x-3)²을 직접 전개해 볼까요? (x-3)² = x²-6x+9가 되어서 x²-9와는 달라요. x²-9는 x²-3²으로 볼 수 있으므로 차의 제곱 공식 a²-b²=(a+b)(a-b)를 사용하면 (x+3)(x-3)이 됩니다.',
      },
      {
        id: '2-2',
        unitId: 2,
        unitTitle: '다항식의 곱셈과 인수분해',
        achievementStandard: '다항식의 곱셈과 인수분해를 할 수 있다.',
        studentUtterance: 'x²-5x+6을 인수분해하면 (x+2)(x+3) 아닌가요? 2×3=6, 2+3=5니까요.',
        context: '곱해서 6, 더해서 -5가 되는 두 수를 찾는 과정에서 부호 처리를 놓치고 양수만 적용함.',
        exemplarAnswer: '2×3=6이고 2+3=5인 것은 맞아요. 하지만 원래 식은 x²-5x+6이므로 가운데 항의 부호가 -5예요. 곱해서 +6, 더해서 -5가 되는 두 수는 -2와 -3입니다. 그래서 정답은 (x-2)(x-3)이에요.',
      },
    ],
  },
  {
    id: 3,
    title: '이차방정식',
    scenarios: [
      {
        id: '3-1',
        unitId: 3,
        unitTitle: '이차방정식',
        achievementStandard: '이차방정식을 풀 수 있고, 이를 활용하여 문제를 해결할 수 있다.',
        studentUtterance: 'x²=4이면 x=2 아닌가요?',
        context: '양의 제곱근만 떠올리고, 음수를 제곱해도 양수가 된다는 사실을 놓쳐 이차방정식의 두 근을 간과함.',
        exemplarAnswer: '2를 제곱하면 4가 되는 것은 맞아요. 그런데 -2를 제곱해도 (-2)×(-2)=4가 됩니다. x²=4는 제곱해서 4가 되는 모든 x를 찾는 문제이므로 x=2뿐 아니라 x=-2도 해예요.',
      },
      {
        id: '3-2',
        unitId: 3,
        unitTitle: '이차방정식',
        achievementStandard: '이차방정식을 풀 수 있고, 이를 활용하여 문제를 해결할 수 있다.',
        studentUtterance: '직사각형의 가로가 x, 세로가 x-2이고 넓이가 24이면 x=-4 또는 6이에요?',
        context: '이차방정식의 해를 구했지만 실제 상황의 물리적 조건, 즉 길이는 0보다 커야 한다는 제한을 고려하지 않음.',
        exemplarAnswer: '방정식만 풀면 x=-4와 x=6이 나올 수 있어요. 하지만 x는 직사각형의 가로 길이이므로 음수가 될 수 없어요. x=-4이면 길이가 -4cm가 되어 실제 상황에 맞지 않고, x=6이면 가로 6cm, 세로 4cm가 되어 조건에 맞습니다. 따라서 이 문제의 답은 x=6이에요.',
      },
    ],
  },
  {
    id: 4,
    title: '이차함수',
    scenarios: [
      {
        id: '4-1',
        unitId: 4,
        unitTitle: '이차함수',
        achievementStandard: '이차함수의 개념을 이해한다.',
        studentUtterance: 'y=(x-3)²의 꼭짓점이 x=-3 아닌가요?',
        context: '이차함수 y=a(x-p)²+q의 꼭짓점 형태에서 괄호 안의 상수 부호를 보고 x좌표를 단순 추측함.',
        exemplarAnswer: '괄호 안에 -3이 보여서 그렇게 생각할 수 있어요. 그런데 y=(x-3)²에서는 괄호 안의 식이 0이 되는 x값을 찾아야 해요. x=3을 넣으면 (3-3)²=0이 되므로 꼭짓점의 x좌표는 -3이 아니라 3입니다.',
      },
      {
        id: '4-2',
        unitId: 4,
        unitTitle: '이차함수',
        achievementStandard: '이차함수의 개념을 이해한다.',
        studentUtterance: 'a가 크면 포물선이 넓어지는 거 아닌가요?',
        context: '이차함수 y=ax²에서 a의 절댓값이 그래프의 폭을 결정한다는 사실을 반대로 이해함.',
        exemplarAnswer: '직접 비교해 볼게요. y=x²과 y=2x²에서 x=1을 넣으면 각각 y=1, y=2가 됩니다. 같은 x값에서 y값이 더 빨리 커지므로 그래프가 더 가파르고 좁아져요. 그래서 a의 절댓값이 클수록 포물선은 넓어지는 것이 아니라 좁아집니다.',
      },
      {
        id: '4-3',
        unitId: 4,
        unitTitle: '이차함수',
        achievementStandard: '이차함수의 개념을 이해한다.',
        studentUtterance: 'y=x²를 x축 방향으로 3만큼 평행이동하면 y=(x+3)² 아닌가요?',
        context: '그래프의 평행이동에서 x좌표 변화가 식 안에서는 반대 부호로 나타나는 규칙을 혼동함.',
        exemplarAnswer: '오른쪽으로 3만큼 이동하면 꼭짓점이 (0,0)에서 (3,0)으로 옮겨져야 해요. 이때 식은 y=(x-3)²입니다. 실제로 x=3을 넣으면 y=0이 되어 꼭짓점이 (3,0)에 있음을 확인할 수 있어요. 반대로 y=(x+3)²은 꼭짓점이 (-3,0)이므로 왼쪽으로 이동한 그래프예요.',
      },
    ],
  },
];

export const ALL_SCENARIOS = UNITS.flatMap((unit) => unit.scenarios);
