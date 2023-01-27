import { expectTypeOf } from "expect-type";
import { ExtractAddTuplesFromUE, IsUEValidForADD } from "../src/type-helpers/UE/ADD";
import { ExtractPropsToRemoveFromUE, IsUEValidForREMOVE } from "../src/type-helpers/UE/REMOVE";
import { BreakUpValuePartOfSetterTuples, CreatePickedAndComputedTypesForSetters, ExtractSetterPartOfUE, ExtractSetterTuplesLookAhead, FinalValidationOfSetterUE, GetFinalValuesOfSetterTuples, IsUEValidForSET, SplitOnOneOpenParen } from "../src/type-helpers/UE/SET";
import { IsUEValid, UEIsValid, UppercaseUEClauses } from "../src/type-helpers/UE/ue-lib";
import { CICDSmaller } from "./lib/types";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { ExtractDeleteTuplesFromUE, IsUEValidForDELETE } from "../src/type-helpers/UE/DELETE";
import { ProjectUpdateExpression } from "../src/type-helpers/UE/output";

type rawUE = `
  set 
#datum=if_not_exists(#datum,:zero)+:datum,
#map.howdy.hola=:hola,
#final=:final,
prop[1]=:funky,
prop[0].weird.peculiar[1]=:peculiar,
prop[0].weird.wack.even=:even,
thebig.rangeKey=:bigrKey,
thebig.#d.quantity=thebig.#d.quantity+:quantity,
thebig.#d.myTuple[1].tup3=:tup3,
thebig.#d.myRestArray[2].boo=thebig.#d.myRestArray[2].boo+:boo,
#rest=list_append(#rest,:rest),
nest[1][0]=if_not_exists(nest[1][0],:nest),
thebig.#d.foo=if_not_exists(#map.hi.hello,:doobedoo),
pure=list_append(if_not_exists(pure,:emptyList),:pure),
thebig.#d.#set=:set,
#datumStr=:datumStr

  add
#map.#hi.#exists :doobedoo,
thebig.#d.myRestArray[0] :doobedoo,
myNumberSet :numberSet,
thebig.#d.myTuple[1].myBinarySet :binarySet

  remove
thebig.#d.relatedItems[0],
prop[0].strange,
thebig.#d.product,
thebig.#d.myRestArray[1],
thebig.#d.relatedItems[1000]

  delete
thebig.#d.myStringSet :stringSet`;
type cleanedUE = UppercaseUEClauses<rawUE>;

test('common', () => {

  expectTypeOf<cleanedUE>().toEqualTypeOf<
    "   SET  #datum=if_not_exists(#datum,:zero)+:datum, #map.howdy.hola=:hola, #final=:final, prop[1]=:funky, prop[0].weird.peculiar[1]=:peculiar, prop[0].weird.wack.even=:even, thebig.rangeKey=:bigrKey, thebig.#d.quantity=thebig.#d.quantity+:quantity, thebig.#d.myTuple[1].tup3=:tup3, thebig.#d.myRestArray[2].boo=thebig.#d.myRestArray[2].boo+:boo, #rest=list_append(#rest,:rest), nest[1][0]=if_not_exists(nest[1][0],:nest), thebig.#d.foo=if_not_exists(#map.hi.hello,:doobedoo), pure=list_append(if_not_exists(pure,:emptyList),:pure), thebig.#d.#set=:set, #datumStr=:datumStr    ADD #map.#hi.#exists :doobedoo, thebig.#d.myRestArray[0] :doobedoo, myNumberSet :numberSet, thebig.#d.myTuple[1].myBinarySet :binarySet    REMOVE thebig.#d.relatedItems[0], prop[0].strange, thebig.#d.product, thebig.#d.myRestArray[1], thebig.#d.relatedItems[1000]    DELETE thebig.#d.myStringSet :stringSet"
  >();

});

type setterPartOfUE = '#datum=if_not_exists(#datum,:zero)+:datum,#map.howdy.hola=:hola,#final=:final,prop[1]=:funky,prop[0].weird.peculiar[1]=:peculiar,prop[0].weird.wack.even=:even,thebig.rangeKey=:bigrKey,thebig.#d.quantity=thebig.#d.quantity+:quantity,thebig.#d.myTuple[1].tup3=:tup3,thebig.#d.myRestArray[2].boo=thebig.#d.myRestArray[2].boo+:boo,#rest=list_append(#rest,:rest),nest[1][0]=if_not_exists(nest[1][0],:nest),thebig.#d.foo=if_not_exists(#map.hi.hello,:doobedoo),pure=list_append(if_not_exists(pure,:emptyList),:pure),thebig.#d.#set=:set,#datumStr=:datumStr';
type setterTuples = [
  ["#datum", "if_not_exists(#datum,:zero)+:datum"],
  ["#map.howdy.hola", ":hola"],
  ["#final", ":final"],
  ["prop[1]", ":funky"],
  ["prop[0].weird.peculiar[1]", ":peculiar"],
  ["prop[0].weird.wack.even", ":even"],
  ["thebig.rangeKey", ":bigrKey"],
  ["thebig.#d.quantity", "thebig.#d.quantity+:quantity"],
  ["thebig.#d.myTuple[1].tup3", ":tup3"],
  ["thebig.#d.myRestArray[2].boo", "thebig.#d.myRestArray[2].boo+:boo"],
  ["#rest", "list_append(#rest,:rest)"],
  ["nest[1][0]", "if_not_exists(nest[1][0],:nest)"],
  ["thebig.#d.foo", "if_not_exists(#map.hi.hello,:doobedoo)"],
  ["pure", "list_append(if_not_exists(pure,:emptyList),:pure)"],
  ["thebig.#d.#set", ":set"],
  ["#datumStr", ":datumStr"]
];
type brokenUpSetterTuples = [
  [
    "#datum",
    {
      crement: true;
      left: {
        if_not_exists: true;
        left: {
          docpath: true;
          path: "#datum";
        };
        right: {
          eav: true;
          key: ':zero';
        }
      };
      right: {
        eav: true;
        key: ":datum";
      };
    }
  ],
  [
    "#map.howdy.hola",
    {
      eav: true;
      key: ":hola";
    }
  ],
  [
    "#final",
    {
      eav: true;
      key: ":final";
    }
  ],
  [
    "prop[1]",
    {
      eav: true;
      key: ":funky";
    }
  ],
  [
    "prop[0].weird.peculiar[1]",
    {
      eav: true;
      key: ":peculiar";
    }
  ],
  [
    "prop[0].weird.wack.even",
    {
      eav: true;
      key: ":even";
    }
  ],
  [
    "thebig.rangeKey",
    {
      eav: true;
      key: ":bigrKey";
    }
  ],
  [
    "thebig.#d.quantity",
    {
      crement: true;
      left: {
        docpath: true;
        path: "thebig.#d.quantity";
      };
      right: {
        eav: true;
        key: ":quantity";
      };
    }
  ],
  [
    "thebig.#d.myTuple[1].tup3",
    {
      eav: true;
      key: ":tup3";
    }
  ],
  [
    "thebig.#d.myRestArray[2].boo",
    {
      crement: true;
      left: {
        docpath: true;
        path: "thebig.#d.myRestArray[2].boo";
      };
      right: {
        eav: true;
        key: ":boo";
      };
    }
  ],
  [
    "#rest",
    {
      list_append: true;
      left: {
        docpath: true;
        path: "#rest";
      };
      right: {
        eav: true;
        key: ":rest";
      };
    }
  ],
  [
    "nest[1][0]",
    {
      if_not_exists: true;
      left: {
        docpath: true;
        path: "nest[1][0]";
      };
      right: {
        eav: true;
        key: ":nest";
      };
    }
  ],
  [
    "thebig.#d.foo",
    {
      if_not_exists: true;
      left: {
        docpath: true;
        path: "#map.hi.hello";
      };
      right: {
        eav: true;
        key: ":doobedoo";
      };
    }
  ],
  [
    "pure",
    {
      list_append: true;
      left: {
        if_not_exists: true;
        left: {
          docpath: true;
          path: "pure";
        };
        right: {
          eav: true;
          key: ":emptyList";
        };
      };
      right: {
        eav: true;
        key: ":pure";
      };
    }
  ],
  [
    "thebig.#d.#set",
    {
      eav: true;
      key: ":set";
    }
  ],
  [
    "#datumStr",
    {
      eav: true;
      key: ":datumStr";
    }
  ]
];

type ean = {
  '#map': 'map',
  '#exists': 'exists',
  '#datum': 'datum',
  '#final': 'final',
  '#hashKey': 'hashKey',
  '#rangeKey': 'rangeKey',
  '#hi': 'hi',
  '#d': 'data',
  '#rest': 'rest',
  '#set': 'set',
  '#datumStr': 'datumStr'
};
type eav = {
  ':tup3': 999,
  ':quantity': 22,
  ':doobedoo': 100,
  ':even': 'str',
  ':peculiar': number,
  ':final': "const",
  ':hola': 7,
  ':funky': 'funky',
  ':datum': 5,
  ':sparseUuid': '---',
  ':smallCiCd': 'small-cicd',
  ':bigrKey': "big-cicd",
  ':boo': 44,
  ':rest': [[{ x: 99, y: boolean }]],
  ':nest': true,
  ':pure': [[0, 1, 2, 3]],
  ':set': 'set',
  ':datumStr': `datum_`,
  ':emptyList': [],
  ':zero': 0,
  ':numberSet': DocumentClient.NumberSet,
  ':binarySet': DocumentClient.BinarySet,
  ':stringSet': DocumentClient.StringSet
};

type finalValuesOfSetterTuples = [
  ["#datum", number],
  ["#map.howdy.hola", 7],
  ["#final", "const"],
  ["prop[1]", "funky"],
  ["prop[0].weird.peculiar[1]", number],
  ["prop[0].weird.wack.even", "str"],
  ["thebig.rangeKey", "big-cicd"],
  ["thebig.#d.quantity", number],
  ["thebig.#d.myTuple[1].tup3", 999],
  ["thebig.#d.myRestArray[2].boo", number],
  ["#rest", [boolean, ...{ x: number; y: boolean; }[][], [{ x: 99; y: boolean; }]]],
  ["nest[1][0]", true],
  ["thebig.#d.foo", number], // reminder on this one, map.hi.hello is on the left side of if_not_exists, so undefined is removed from the number? type
  ["pure", [[0, 1, 2, 3]] | [...number[][], [0, 1, 2, 3]]],
  ["thebig.#d.#set", "set"],
  ["#datumStr", "datum_"]
];

type pickedAndComputed = [
  [
    picked: {
      datum: number;
    },
    computed: {
      datum: number;
    }
  ],
  [
    picked: {
      map:
      | {
        howdy: {
          hola: 7;
        };
      }
      | undefined;
    },
    computed: {
      map: {
        howdy: {
          hola: 7;
        };
      };
    }
  ],
  [
    picked: {
      final: "const" | null;
    },
    computed: {
      final: "const";
    }
  ],
  [
    picked: {
      prop: ["funky"];
    },
    computed: {
      prop: ["funky"];
    }
  ],
  [
    picked: {
      prop: [
        {
          weird: {
            peculiar: [number | null];
          };
        }
      ];
    },
    computed: {
      prop: [
        {
          weird: {
            peculiar: [number];
          };
        }
      ];
    }
  ],
  [
    picked: {
      prop: [
        {
          weird: {
            wack:
            | {
              even: "string" | "str";
            }
            | {}
            | {};
          };
        }
      ];
    },
    computed: {
      prop: [
        {
          weird: {
            wack: {
              even: "str";
            };
          };
        }
      ];
    }
  ],
  [
    picked: {
      thebig:
      | {
        rangeKey: "big-cicd";
      }
      | undefined;
    },
    computed: {
      thebig: {
        rangeKey: "big-cicd";
      };
    }
  ],
  [
    picked: {
      thebig:
      | {
        data:
        | {
          quantity: number;
        }
        | undefined;
      }
      | undefined;
    },
    computed: {
      thebig: {
        data: {
          quantity: number;
        };
      };
    }
  ],
  [
    picked: {
      thebig:
      | {
        data:
        | {
          myTuple: [
            {
              tup3: number | undefined;
            }
          ];
        }
        | undefined;
      }
      | undefined;
    },
    computed: {
      thebig: {
        data: {
          myTuple: [
            {
              tup3: 999;
            }
          ];
        };
      };
    }
  ],
  [
    picked: {
      thebig:
      | {
        data:
        | {
          myRestArray: [
            | {
              boo: number;
            }
            | undefined
          ];
        }
        | undefined;
      }
      | undefined;
    },
    computed: {
      thebig: {
        data: {
          myRestArray: [
            {
              boo: number;
            }
          ];
        };
      };
    }
  ],
  [
    picked: {
      rest: [
        boolean,
        ...{
          x: number;
          y: boolean;
        }[][]
      ];
    },
    computed: {
      rest: [
        boolean,
        ...{
          x: number;
          y: boolean;
        }[][],
        [
          {
            x: 99;
            y: boolean;
          }
        ]
      ];
    }
  ],
  [
    picked: {
      nest: [[true]];
    },
    computed: {
      nest: [[true]];
    }
  ],
  [
    picked: {
      thebig:
      | {
        data:
        | {
          foo: number;
        }
        | undefined;
      }
      | undefined;
    },
    computed: {
      thebig: {
        data: {
          foo: number;
        };
      };
    }
  ],
  [
    picked: {
      pure: number[][];
    },
    computed:
    | {
      pure: [[0, 1, 2, 3]];
    }
    | {
      pure: [...number[][], [0, 1, 2, 3]];
    }
  ],
  [
    picked: {
      thebig:
      | {
        data:
        | {
          set: "set" | undefined;
        }
        | undefined;
      }
      | undefined;
    },
    computed: {
      thebig: {
        data: {
          set: "set";
        };
      };
    }
  ],
  [
    picked: {
      datumStr: `datum_${string}` | `blah_${number}` | undefined;
    },
    computed: {
      datumStr: "datum_";
    }
  ]
];

test('SET', () => {

  expectTypeOf<ExtractSetterPartOfUE<cleanedUE>>().toEqualTypeOf<
    setterPartOfUE
  >();

  expectTypeOf<ExtractSetterTuplesLookAhead<setterPartOfUE>>().toEqualTypeOf<
    setterTuples
  >();
  // A poorly formed setter part that will error on DynamoDB validation (trailing comma)
  expectTypeOf<ExtractSetterTuplesLookAhead<"#datum=#datum+:datum,">>().toEqualTypeOf<[["#datum", "#datum+:datum"], []]>();

  expectTypeOf<SplitOnOneOpenParen<"list_append(if_not_exists(pure,:emptyList),if_not_exists(pure,:emptyList))">>().toEqualTypeOf<["list_append(if_not_exists(pure,:emptyList)", "if_not_exists(pure,:emptyList))"]>();
  expectTypeOf<SplitOnOneOpenParen<"list_append(if_not_exists(pure,:emptyList),pure)">>().toEqualTypeOf<["list_append(if_not_exists(pure,:emptyList)", "pure)"]>();
  expectTypeOf<SplitOnOneOpenParen<"list_append(if_not_exists(pure :emptyList),pure)">>().toEqualTypeOf<["list_append(if_not_exists(pure :emptyList)", "pure)"]>();
  expectTypeOf<SplitOnOneOpenParen<"list_append(if_not_exists(pure :emptyList,pure)">>().toBeNever();

  expectTypeOf<BreakUpValuePartOfSetterTuples<setterTuples>>().toEqualTypeOf<brokenUpSetterTuples>();

  expectTypeOf<GetFinalValuesOfSetterTuples<brokenUpSetterTuples, CICDSmaller, ean, eav>>().toEqualTypeOf<finalValuesOfSetterTuples>();

  expectTypeOf<CreatePickedAndComputedTypesForSetters<finalValuesOfSetterTuples, CICDSmaller, ean>>().toEqualTypeOf<pickedAndComputed>();

  expectTypeOf<FinalValidationOfSetterUE<pickedAndComputed>>().toEqualTypeOf<1>();

  // INVALID SET with a valid set
  // @ts-expect-error This is broken for the nested tuple, see https://github.com/microsoft/TypeScript/issues/52267
  expectTypeOf<IsUEValidForSET<"SET thebig.data.myTuple[0]=:tup,final=:final", CICDSmaller, {}, { ':tup': { tup1: null; extraAndIllegal: string }; ':final': null }>>().toEqualTypeOf<0 | 1>();
  // INVALID SET (missing property 'y')
  expectTypeOf<IsUEValidForSET<"SET rest[1]=:rest", CICDSmaller, {}, { ':rest': { x: 0; }[] }>>().toEqualTypeOf<0>();
  // no SET clause in UE
  expectTypeOf<IsUEValidForSET<'REMOVE thing ADD thingNum :num', CICDSmaller, {}, {}>>().toEqualTypeOf<1>();
  // incrementing to constant number the same value!
  expectTypeOf<IsUEValidForSET<'SET map.howdy.hola=map.howdy.hola + :hola', CICDSmaller, {}, { ':hola': 7 }>>().toEqualTypeOf<0>();
  // incrementing to constant number the same value!
  expectTypeOf<IsUEValidForSET<'SET num=num+num', { num: 7 }, {}, {}>>().toEqualTypeOf<0>();

});

test('REMOVE', () => {

  expectTypeOf<ExtractPropsToRemoveFromUE<cleanedUE>>().toEqualTypeOf<"thebig.#d.relatedItems[1000]" | "thebig.#d.relatedItems[0]" | "prop[0].strange" | "thebig.#d.product" | "thebig.#d.myRestArray[1]">();

  expectTypeOf<IsUEValidForREMOVE<cleanedUE, CICDSmaller, ean>>().toEqualTypeOf<1>();

  // INVALID REMOVE with a valid remove
  expectTypeOf<IsUEValidForREMOVE<"REMOVE final,thebig", CICDSmaller, {}>>().toEqualTypeOf<0 | 1>();
  // no REMOVE clause in UE
  expectTypeOf<IsUEValidForREMOVE<'SET thing = :thing ADD thingNum :num', CICDSmaller, {}>>().toEqualTypeOf<1>();

});

test('ADD', () => {

  expectTypeOf<ExtractAddTuplesFromUE<cleanedUE>>().toEqualTypeOf<["#map.#hi.#exists", ":doobedoo"] | ["thebig.#d.myRestArray[0]", ":doobedoo"] | ["myNumberSet", ":numberSet"] | ["thebig.#d.myTuple[1].myBinarySet", ":binarySet"]>();

  expectTypeOf<IsUEValidForADD<cleanedUE, CICDSmaller, ean, eav>>().toEqualTypeOf<1>();
  // Squished together path:eav
  expectTypeOf<IsUEValidForADD<"ADD datum:doobedoo", CICDSmaller, ean, eav>>().toEqualTypeOf<1>();

  // INVALID ADD with a valid add
  expectTypeOf<IsUEValidForADD<"ADD datum :doobedoo map.howdy.hola :doobedoo", CICDSmaller, ean, eav>>().toEqualTypeOf<0>();
  // no ADD clause in UE (there is but no adder tuples to extract)
  expectTypeOf<IsUEValidForADD<'SET thing = :thing REMOVE thingNum :num ADD   ', CICDSmaller, {}, {}>>().toEqualTypeOf<1>();
  // not set types
  expectTypeOf<IsUEValidForADD<'ADD thebig.#d.myStringSet :zero', CICDSmaller, ean, eav>>().toEqualTypeOf<0>();
  // wrong set types
  expectTypeOf<IsUEValidForADD<'ADD thebig.#d.myStringSet :numberSet', CICDSmaller, ean, eav>>().toEqualTypeOf<0>();
  // adding to constant number the same value!
  expectTypeOf<IsUEValidForADD<'ADD map.howdy.hola :hola', CICDSmaller, {}, { ':hola': 7 }>>().toEqualTypeOf<0>();

});

test('DELETE', () => {

  expectTypeOf<ExtractDeleteTuplesFromUE<cleanedUE>>().toEqualTypeOf<["thebig.#d.myStringSet", ":stringSet"]>();

  expectTypeOf<IsUEValidForDELETE<cleanedUE, CICDSmaller, ean, eav>>().toEqualTypeOf<1>();
  // Squished together path:eav
  expectTypeOf<IsUEValidForDELETE<"DELETE thebig.#d.myStringSet:stringSet", CICDSmaller, ean, eav>>().toEqualTypeOf<1>();

  // INVALID DELETE with a valid delete
  expectTypeOf<IsUEValidForDELETE<"DELETE myNumberSet :numberSet map.howdy.hola :doobedoo", CICDSmaller, ean, eav>>().toEqualTypeOf<0>();
  // no DELETE clause in UE (there is but no deleter tuples to extract)
  expectTypeOf<IsUEValidForDELETE<'SET thing = :thing REMOVE thingNum :num DELETE   ', CICDSmaller, {}, {}>>().toEqualTypeOf<1>();
  // not set types
  expectTypeOf<IsUEValidForDELETE<'DELETE thebig.#d.myStringSet :zero', CICDSmaller, ean, eav>>().toEqualTypeOf<0>();
  // wrong set types
  expectTypeOf<IsUEValidForDELETE<'DELETE thebig.#d.myStringSet :numberSet', CICDSmaller, ean, eav>>().toEqualTypeOf<0>();

});

type expectedOutputUPDATED_NEW = {
  nest: [[true]];
  thebig: {
    data: {
      myStringSet:
      | {
        wrapperName: "Set";
        type: "String";
        values: string[];
      }
      | undefined;
      relatedItems:
      | (
        | number
        | {
          hi: string;
          bye: number;
        }
      )[]
      | undefined;
      set: "set";
      foo: number;
      myRestArray:
      | [
        number,
        ...(
          | string
          | {
            boo: number;
            moo: "moo";
          }
          | {
            boo: number;
          }
        )[]
      ]
      | undefined;
      myTuple: [
        {
          myBinarySet: {
            wrapperName: "Set";
            type: "Binary";
            values: DocumentClient.binaryType[];
          };
          tup3: number;
        }
      ];
      quantity: number;
    };
    rangeKey: "big-cicd";
  };
  prop: [
    {
      weird: {
        wack:
        | {
          even: "string" | "str";
        }
        | {
          even: never;
        }
        | {
          even: never;
        };
        peculiar: [number | null];
      };
    },
    "funky"
  ];
  map: {
    hi: {
      exists: number;
    };
    howdy: {
      hola: 7;
    };
  };
  myNumberSet: {
    wrapperName: "Set";
    type: "Number";
    values: number[];
  };
  pure: number[][];
  datumStr: `datum_${string}` | `blah_${number}`;
  rest: [
    boolean,
    ...{
      x: number;
      y: boolean;
    }[][]
  ];
  final: "const" | null;
  datum: number;
};

type expectedOutputUPDATED_OLD = {
  nest: [[true]];
  thebig:
  | {
    data:
    | {
      myStringSet:
      | {
        wrapperName: "Set";
        type: "String";
        values: string[];
      }
      | undefined;
      product: string | undefined;
      relatedItems:
      | (
        | number
        | {
          hi: string;
          bye: number;
        }
      )[]
      | undefined;
      set: "set" | undefined;
      foo: number;
      myRestArray:
      | [
        number,
        ...(
          | string
          | {
            boo: number;
            moo: "moo";
          }
          | {
            boo: number;
          }
          | undefined
        )[]
      ]
      | undefined;
      myTuple: unknown[] | undefined; // this is because tup3 is optional, and because myBinarySet is union'ed with undefined in a PE. myTuple is of length 1 and only contains this object, in which both of the top level fields can be undefined, thus, making the entire array unknown[]
      quantity: number;
    }
    | undefined;
    rangeKey: "big-cicd";
  }
  | undefined;
  prop: [
    {
      strange: [string] | undefined;
      weird: {
        wack:
        | {
          even: "string" | "str";
        }
        | {
          even?: undefined;
        }
        | {
          even?: undefined;
        }
        | undefined;
        peculiar: [number | null];
      };
    },
    "funky"
  ];
  map:
  | {
    hi: {
      exists: number;
    };
    howdy:
    | {
      hola: 7;
    }
    | undefined;
  }
  | undefined;
  myNumberSet:
  | {
    wrapperName: "Set";
    type: "Number";
    values: number[];
  }
  | undefined;
  pure: number[][];
  datumStr?: `datum_${string}` | `blah_${number}`;
  rest: [
    boolean,
    ...{
      x: number;
      y: boolean;
    }[][]
  ];
  final: "const" | null;
  datum: number;
};

test('output', () => {

  expectTypeOf<ProjectUpdateExpression<rawUE, CICDSmaller, ean, 'UPDATED_NEW'>>().toEqualTypeOf<expectedOutputUPDATED_NEW>();

  expectTypeOf<ProjectUpdateExpression<rawUE, CICDSmaller, ean, 'UPDATED_OLD'>>().toEqualTypeOf<expectedOutputUPDATED_OLD>();

});

test('number branded type', async () => {
  // see DeepWriteable for why this test case is needed. Some absolute wackery.
  type PositiveNumber = number & {
    __brand: 'PositiveNumber';
  };
  const g = {
    ':one': 1 as PositiveNumber
  };
  type User = {
    hashKey: string & { __brand: 'UserID' };
    rangeKey: 'user';
    created: number;
    updated?: number | undefined;
    username: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    lastLogin: number;
    favoriteSites?: (string & { __brand: 'SiteID' })[] | undefined;
    numLogins: PositiveNumber;
  }
  type t = IsUEValid<`ADD numLogins:one`, User, {}, typeof g>;
  expectTypeOf<t>().toEqualTypeOf<UEIsValid>();
});