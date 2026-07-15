export const LESSONS: Record<number, string[]> = {
  1: [
    // Lesson 1 — f and j only (index finger anchors)
    // Drill each key alone, then alternate, then mix
    "fff jjj fff jjj fj jf fj jf fff jjj ffjj jjff ff jj fj jf jf fj fff jjj ffjj jjff fj jf fj jf fff jjj",

    // Lesson 2 — add d and k (middle fingers)
    // Isolate d and k first, then pair with f and j
    "ddd kkk ddd kkk dk kd dk kd fdf jkj fd jk dk fd jk dk kd ddd kkk fd jk fdk jkd dfk kdj fdjk jkfd dk fd",

    // Lesson 3 — add s and l (ring fingers)
    // Isolate s and l, then build on d k f j
    "sss lll sss lll sl ls sl ls sdf lkj fds jkl sld klf fsd jlk sls lsl fsdl lkjs sdfl lkjf sl ls sdf lkj sl",

    // Lesson 4 — add a and ; (pinky fingers)
    // Isolate a and ; first, then build full home row
    "aaa ;;; aaa ;;; a; ;a a; ;a asd ;lk ads ;lk asl ;la asdf jkl; fdsa ;lkj asd; jkl; a;sl jkla; asdf jkl;",

    // Lesson 5 — Full home row mastery
    // Longer sequences combining all eight home row keys
    "asdf jkl; asdf jkl; fdsa ;lkj asdf jkl; fdsa ;lkj fda jl; sda lkj asdf jkl; fdsa ;lkj asdf jkl; fdsa",
  ],

  2: [
    // Lesson 1 — add e and i (most common vowels, just above home row)
    // Drill e above d and i above k before combining
    "eee iii eee iii ei ie ede kik dee kii see did fee lid ede kik eee iii ei ie seed lied feel file idle",

    // Lesson 2 — add r and u (index finger stretch from f and j)
    // Isolate r and u, then build er ui words
    "rrr uuu rrr uuu ru ur frf juj rde uik red rub run fur rude true lure rule ruse ruff furl dude reside",

    // Lesson 3 — add t and y, then o and w
    // t is left-index stretch, y is right-index stretch; o and w widen reach
    "ttt yyy ooo www ty yt ow wo trt yty owo wow try you two wow toy tow row yet now stew flow town tower",

    // Lesson 4 — add q and p, then n and m
    // Pinky stretches and bottom-row index keys
    "qqq ppp nnn mmm qp pq nm mn quip pump map nip pin men pen pun num quit pump camp jump upon nine pump",

    // Lesson 5 — add g h b v c x z (remaining keys)
    // Fill in center and bottom-row stragglers, then full-keyboard words
    "ggg hhh bbb vvv ccc xxx zzz gh bv cx gz big hat box van cut six zip the big cat sat on the mat",
  ],

  3: [
    "cat dog fish bird frog duck bear wolf fox hen rat bat cow pig owl elk cub pup kit calf lamb",
    "sun moon star sky rain snow leaf rock tree lake hill cave pond reef dune bush vine mist dawn",
    "run kick jump swim dive spin race jog hop leap pull push grab hold toss throw catch roll flip",
    "cake milk rice soup bread eggs fish meat corn bean nuts peas lime pear plum peach grape lemon",
    "the big cat sat on the mat and the fat dog ran fast by the old red barn near the oak tree",
  ],

  4: [
    "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
    "A wizard named Joe quickly mixed up some very bad batter. How vexingly quick daft zebras jump.",
    "The five boxing wizards jump quickly. Sphinx of black quartz, judge my vow.",
    "We promptly judged antique ivory buckles for the next prize. Crazy Fredrick bought many very exquisite opal jewels.",
    "The job requires extra pluck and zeal from every young wage earner. Sixty zippers were quickly picked from the woven jute bag.",
  ],

  5: [
    "My phone number is 555-1234. Call me at 9:00 AM or 3:30 PM.",
    "The price is $24.99 + $5.00 = $29.99 total. Save 10% today!",
    "Password: A1b2@C3! Email: user@example.com. Score: 100/100!",
    "3 cats + 4 dogs = 7 pets. (a + b)^2 = a^2 + 2ab + b^2.",
    "Version 2.0.1 released! Bug #42 fixed. Use --verbose flag for output. Run: npm install && npm start",
  ],
};

export const ASSESSMENTS: Record<number, string[]> = {
  1: [
    "asdf jkl; asdf jkl; fdsa ;lkj asdf jkl; fdsajkl; aaa sss ddd fff jjj kkk lll ;;; dk sl a; fdjk slak",
    "fff jjj asdf fdsa jkl; ;lkj asdf jkl; fff jjj aaa ;;; sss lll ddd kkk fd jk sl a; asdf jkl; fdsa ;lkj",
    "asdf jkl; asdf jkl; fdsa ;lkj fda jl; sda lkj asdf jkl; fdsa ;lkj asdf jkl; fdsajkl; asdf jkl; fdsa",
  ],
  2: [
    "qwer tyui op qwerty uiop asdf jkl zxcv bnm qwerty asdfgh zxcvbn the cat sat on the mat see did",
    "qwertyuiop asdfghjkl zxcvbnm qwerty uiop asdf jkl zxcv bnm true rude flow town pump jump nine",
    "the cat sat on the mat zxcv bnm qwerty uiop asdf jkl qwertyuiop feel file idle seed lied town",
  ],
  3: [
    "the big cat sat on the mat the fat dog ran fast the red hen laid eggs the fox and the hound ran in the park",
    "the sun and moon star sky rain snow leaf rock tree lake the dog and cat run fast and leap high",
    "run kick jump swim dive spin race jog hop leap cake milk rice soup bread eggs fish meat corn bean",
  ],
  4: [
    "The quick brown fox jumps over the lazy dog. A wizard named Joe quickly mixed up some very bad batter. Sphinx of black quartz, judge my vow.",
    "The five boxing wizards jump quickly. We promptly judged antique ivory buckles for the next prize. Crazy Fredrick bought many very exquisite opal jewels.",
    "The job requires extra pluck and zeal from every young wage earner. Sixty zippers were quickly picked from the woven jute bag. Sphinx of black quartz, judge my vow.",
  ],
  5: [
    "My score is 100/100! The price is $29.99. Email user@example.com for help. Password: A1b2@C3! Call 555-1234 at 9:00 AM.",
    "3 cats + 4 dogs = 7 pets. (a + b)^2 = a^2 + 2ab + b^2. Version 2.0.1 released! Bug #42 fixed.",
    "Use --verbose flag for output. Run: npm install && npm start The price is $24.99 + $5.00 = $29.99 total. Save 10% today!",
  ],
};

export const LEVEL_NAMES = [
  "Home Row Hero",
  "Key Explorer",
  "Word Builder",
  "Speed Racer",
  "Expert Mode",
];
