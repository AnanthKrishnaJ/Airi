import { TopicInfo } from '../types/quiz';

export const ALL_TOPICS: TopicInfo[] = [
  // ================= QUANTITATIVE APTITUDE (1-26) =================
  {
    id: 'number-system',
    name: 'Number System',
    category: 'quantitative',
    description: 'Divisibility rules, unit digits, remainders, factors, prime numbers, and numeral properties.',
    subtopics: ['Divisibility Rules', 'Unit Digit Theorems', 'Remainder Theorem', 'Factors & Multiples', 'Prime Numbers']
  },
  {
    id: 'hcf-and-lcm',
    name: 'HCF and LCM',
    category: 'quantitative',
    description: 'Highest Common Factor and Least Common Multiple of integers, fractions, and recurring decimals.',
    subtopics: ['Product of Numbers', 'HCF of Fractions', 'LCM of Fractions', 'Remainder Problems']
  },
  {
    id: 'simplification',
    name: 'Simplification',
    category: 'quantitative',
    description: 'BODMAS rules, surds, indices, approximation, fractions, and algebraic identities.',
    subtopics: ['BODMAS Order', 'Surds & Indices', 'Decimals & Fractions', 'Algebraic Simplification']
  },
  {
    id: 'percentages',
    name: 'Percentages',
    category: 'quantitative',
    description: 'Percentage calculation, successive percentage change, population variation, and marks distribution.',
    subtopics: ['Percentage Increase/Decrease', 'Successive Change Formula', 'Consumption & Expenditure', 'Election Problems']
  },
  {
    id: 'profit-and-loss',
    name: 'Profit and Loss',
    category: 'quantitative',
    description: 'Cost price, selling price, marked price, trade discount, false weights, and profit margins.',
    subtopics: ['CP and SP Calculation', 'Marked Price & Discount', 'Dishonest Dealer', 'Successive Discounts']
  },
  {
    id: 'simple-interest',
    name: 'Simple Interest',
    category: 'quantitative',
    description: 'Principal, rate of interest, time period, amounts, and annual installments under simple interest.',
    subtopics: ['SI Formula (PTR/100)', 'Sum doubling in T years', 'Varying Interest Rates', 'Installments']
  },
  {
    id: 'compound-interest',
    name: 'Compound Interest',
    category: 'quantitative',
    description: 'Annual, half-yearly, and quarterly compounding, differences between CI and SI, and depreciation.',
    subtopics: ['CI Formula', 'Half-Yearly Compounding', 'Difference between CI and SI', 'Depreciation']
  },
  {
    id: 'ratio-and-proportion',
    name: 'Ratio and Proportion',
    category: 'quantitative',
    description: 'Compounded ratio, mean proportional, third and fourth proportional, and coin-based distribution.',
    subtopics: ['Basic Proportions', 'Coin Box Problems', 'Income and Expenditure', 'Mean Proportional']
  },
  {
    id: 'average',
    name: 'Average',
    category: 'quantitative',
    description: 'Arithmetic mean, weighted average, batting/bowling averages, and replacement in groups.',
    subtopics: ['Weighted Average', 'Group Replacement', 'Cricket Score Averages', 'Consecutive Numbers']
  },
  {
    id: 'problems-on-ages',
    name: 'Problems on Ages',
    category: 'quantitative',
    description: 'Age ratios across past, present, and future, linear equations in ages, and family member ages.',
    subtopics: ['Past and Future Ratios', 'Sum & Difference of Ages', 'Father and Son Relations']
  },
  {
    id: 'time-and-work',
    name: 'Time and Work',
    category: 'quantitative',
    description: 'Efficiency ratios, alternate work days, work-leave-join scenarios, and wages distribution.',
    subtopics: ['Unit Work Method', 'Men-Women-Boys Equivalence', 'Leaving Before Completion', 'Wages Sharing']
  },
  {
    id: 'pipes-and-cisterns',
    name: 'Pipes and Cisterns',
    category: 'quantitative',
    description: 'Inlet and outlet filling rates, cistern leaks, alternating taps, and reservoir capacity.',
    subtopics: ['Filling & Emptying Pipes', 'Leaks at Bottom', 'Pipes Opened Alternately', 'Capacity Calculation']
  },
  {
    id: 'time-speed-and-distance',
    name: 'Time, Speed and Distance',
    category: 'quantitative',
    description: 'Speed conversions, relative speed, meeting points, early and late arrival conditions.',
    subtopics: ['km/h to m/s Conversion', 'Average Speed (Harmonic Mean)', 'Early/Late Problems', 'Relative Speed']
  },
  {
    id: 'boats-and-streams',
    name: 'Boats and Streams',
    category: 'quantitative',
    description: 'Downstream speed, upstream speed, still water speed, river current velocity, and round trips.',
    subtopics: ['Upstream/Downstream Speeds', 'Speed in Still Water', 'Stream Velocity', 'Round Trips']
  },
  {
    id: 'trains',
    name: 'Trains',
    category: 'quantitative',
    description: 'Crossing stationary poles/persons, crossing platforms/bridges, and two trains moving in opposite directions.',
    subtopics: ['Train Crossing Pole', 'Train Crossing Platform', 'Two Trains Relative Speed', 'Opposite/Same Directions']
  },
  {
    id: 'mixtures-and-alligation',
    name: 'Mixtures and Alligation',
    category: 'quantitative',
    description: 'Rule of alligation, replacement of liquids, milk and water ratios, and alloy mixtures.',
    subtopics: ['Rule of Alligation', 'Repeated Dilution Formula', 'Mixing Two Solutions', 'Cost Price of Mixture']
  },
  {
    id: 'partnership',
    name: 'Partnership',
    category: 'quantitative',
    description: 'Capital-time ratio, active vs sleeping partners, management fees, and profit-sharing distributions.',
    subtopics: ['Simple Partnership', 'Compound Partnership', 'Working Partner Salary', 'Investment Duration']
  },
  {
    id: 'permutation-and-combination',
    name: 'Permutation and Combination',
    category: 'quantitative',
    description: 'Arrangements, word formations, committee selections, circular permutations, and handshakes.',
    subtopics: ['Word Arrangements', 'Committee Selection (nCr)', 'Circular Seating', 'Identical Objects']
  },
  {
    id: 'probability',
    name: 'Probability',
    category: 'quantitative',
    description: 'Coin tosses, dice rolls, playing cards, coloured balls in urns, and independent/mutually exclusive events.',
    subtopics: ['Coins & Dice', 'Pack of Cards', 'Balls from Urn', 'Independent Events']
  },
  {
    id: 'algebra',
    name: 'Algebra',
    category: 'quantitative',
    description: 'Polynomial identities, factorization, exponents, symmetry, and simplification of expressions.',
    subtopics: ['Identities (a+b)³ & (a³+b³)', 'Symmetric Expressions', 'x + 1/x relations', 'Factorization']
  },
  {
    id: 'linear-equations',
    name: 'Linear Equations',
    category: 'quantitative',
    description: 'Single variable equations, simultaneous two-variable equations, and word problem formulations.',
    subtopics: ['Two Variable Systems', 'Unique/Infinite/No Solutions', 'Cost & Quantity Equations']
  },
  {
    id: 'quadratic-equations',
    name: 'Quadratic Equations',
    category: 'quantitative',
    description: 'Roots of equations, discriminant analysis, sum and product of roots, and sign comparison questions.',
    subtopics: ['Roots Calculation', 'Sum & Product of Roots', 'Discriminant Properties', 'Root Comparison']
  },
  {
    id: 'geometry',
    name: 'Geometry',
    category: 'quantitative',
    description: 'Triangles, similarity, circles, tangents, chords, quadrilaterals, coordinate geometry, and angles.',
    subtopics: ['Angle Properties', 'Circle Chords & Tangents', 'Triangle Congruence/Similarity', 'Polygons']
  },
  {
    id: 'mensuration',
    name: 'Mensuration',
    category: 'quantitative',
    description: '2D area & perimeter, 3D volume & total surface area for cubes, cylinders, cones, and spheres.',
    subtopics: ['2D Area & Perimeter', 'Cylinder & Cone Volumes', 'Sphere & Hemisphere', 'Cost of Fencing/Painting']
  },
  {
    id: 'data-interpretation',
    name: 'Data Interpretation',
    category: 'quantitative',
    description: 'Tables, bar graphs, pie charts, line charts, caselets, and percentage/ratio analysis of figures.',
    subtopics: ['Table Analysis', 'Bar Charts', 'Pie Chart Degrees/Percentages', 'Line Graphs']
  },
  {
    id: 'statistics',
    name: 'Statistics',
    category: 'quantitative',
    description: 'Mean, median, mode, range, variance, standard deviation, and frequency distribution.',
    subtopics: ['Mean, Median, Mode Relationship', 'Standard Deviation', 'Range & Variance', 'Frequency Tables']
  },

  // ================= LOGICAL REASONING (27-48) =================
  {
    id: 'number-series',
    name: 'Number Series',
    category: 'logical',
    description: 'Arithmetic, geometric, difference of difference, prime numbers, and alternating patterns.',
    subtopics: ['Difference Patterns', 'Double Difference', 'Multiplication + Addition', 'Square/Cube Series']
  },
  {
    id: 'alphabet-series',
    name: 'Alphabet Series',
    category: 'logical',
    description: 'Letter sequences, positional value patterns, skip intervals, and reverse alphabet orders.',
    subtopics: ['Forward Positional Values', 'Reverse Positional Values', 'Skipped Letter Patterns', 'Vowel/Consonant Series']
  },
  {
    id: 'alphanumeric-series',
    name: 'Alphanumeric Series',
    category: 'logical',
    description: 'Hybrid sequences of numbers, letters, and special symbols with positional conditions.',
    subtopics: ['Preceded by / Followed by', 'Step Counting in Mixed Series', 'Elimination Rules']
  },
  {
    id: 'analogy',
    name: 'Analogy',
    category: 'logical',
    description: 'Word pairs, numerical relationships, functional analogies, and tool-worker associations.',
    subtopics: ['Direct Relationships', 'Mathematical Analogies', 'Cause-Effect Analogies', 'Unit & Quantity']
  },
  {
    id: 'classification',
    name: 'Classification',
    category: 'logical',
    description: 'Odd one out based on properties, semantic grouping, prime characteristics, and alphabetical rules.',
    subtopics: ['Semantic Odd One Out', 'Number Properties', 'Letter Clusters', 'Functional Categories']
  },
  {
    id: 'coding-decoding',
    name: 'Coding-Decoding',
    category: 'logical',
    description: 'Letter coding, direct substitution, matrix codes, number coding, and fictitious language ciphering.',
    subtopics: ['Positional Shift Ciphers', 'Substitution Codes', 'Reverse Letter Codes', 'Word-Sentence Ciphers']
  },
  {
    id: 'blood-relations',
    name: 'Blood Relations',
    category: 'logical',
    description: 'Family tree diagrams, coded blood relations, and pointing to portraits or photographs.',
    subtopics: ['Family Tree Diagrams', 'Coded Relations (A+B means A is father)', 'Pointing Statements']
  },
  {
    id: 'direction-sense',
    name: 'Direction Sense',
    category: 'logical',
    description: 'Cardinal and ordinal directions, left/right turns, shadow at sunrise/sunset, and shortest displacement.',
    subtopics: ['Pythagoras Displacement', 'Clockwise/Counter-clockwise Turns', 'Shadow at Sunrise/Sunset', 'Relative Facing']
  },
  {
    id: 'ranking-and-ordering',
    name: 'Ranking and Ordering',
    category: 'logical',
    description: 'Positions from top/bottom, left/right in queues, interchanging positions, and comparative heights/weights.',
    subtopics: ['Total in Row Formula (L + R - 1)', 'Interchanging Positions', 'Comparative Ranking']
  },
  {
    id: 'syllogism',
    name: 'Syllogism',
    category: 'logical',
    description: 'Deductive reasoning using Euler/Venn diagrams, "All/Some/No/Some Not" and "Only a few" conditions.',
    subtopics: ['Universal Affirmative (All A are B)', 'Particular Negative', 'Possibility Cases', 'Only A Few Rules']
  },
  {
    id: 'statement-and-conclusion',
    name: 'Statement and Conclusion',
    category: 'logical',
    description: 'Validating conclusions derived strictly from provided factual premises without outside assumptions.',
    subtopics: ['Direct Deductions', 'Strict Logical Follows', 'Irrelevant Conclusions']
  },
  {
    id: 'statement-and-assumption',
    name: 'Statement and Assumption',
    category: 'logical',
    description: 'Identifying implicit hypotheses, unstated premises, and underlying motivations behind statements.',
    subtopics: ['Implicit Assumptions', 'Author Intentions', 'Advertisements and Notices']
  },
  {
    id: 'statement-and-argument',
    name: 'Statement and Argument',
    category: 'logical',
    description: 'Evaluating strong vs weak arguments, factual evidence, societal impact, and logical fallacy analysis.',
    subtopics: ['Strong Arguments', 'Weak Arguments', 'Fallacies & Emotional Appeals']
  },
  {
    id: 'cause-and-effect',
    name: 'Cause and Effect',
    category: 'logical',
    description: 'Determining which statement is the principal cause, the direct effect, or independent effects.',
    subtopics: ['Immediate Cause', 'Common Cause', 'Independent Effects']
  },
  {
    id: 'data-sufficiency',
    name: 'Data Sufficiency',
    category: 'logical',
    description: 'Assessing whether Statement 1, Statement 2, both, or neither are sufficient to answer a problem.',
    subtopics: ['Single Statement Sufficiency', 'Combined Statements', 'Mathematical Sufficiency']
  },
  {
    id: 'seating-arrangement',
    name: 'Seating Arrangement',
    category: 'logical',
    description: 'Linear rows (north/south facing), circular tables (facing center or outward), and parallel rows.',
    subtopics: ['Circular Facing Inward/Outward', 'Linear Row Arrangement', 'Parallel Rows', 'Square Table']
  },
  {
    id: 'puzzles',
    name: 'Puzzles',
    category: 'logical',
    description: 'Floor puzzles, box stacking, scheduling days/months, and multi-attribute grid deductions.',
    subtopics: ['Floor Puzzles', 'Box Stacking', 'Day-Month Scheduling', 'Attribute Matching']
  },
  {
    id: 'logical-sequence',
    name: 'Logical Sequence',
    category: 'logical',
    description: 'Chronological events, stages of production, hierarchical order, and dictionary sorting.',
    subtopics: ['Chronological Ordering', 'Dictionary Order', 'Process Flow Stages']
  },
  {
    id: 'calendar',
    name: 'Calendar',
    category: 'logical',
    description: 'Odd days calculation, leap year rules, day of the week on any date, and calendar repetition.',
    subtopics: ['Odd Days Calculation', 'Leap Year Century Rules', 'Day on Historical Dates', 'Repeating Calendars']
  },
  {
    id: 'clock',
    name: 'Clock',
    category: 'logical',
    description: 'Angle between hands (|30H - 5.5M|), coincidence of hands, right angles, and gaining/losing clocks.',
    subtopics: ['Angle Formula |30H - 11/2 M|', 'Coincident Hands', 'Opposite Direction Hands', 'Fast and Slow Clocks']
  },
  {
    id: 'venn-diagrams',
    name: 'Venn Diagrams',
    category: 'logical',
    description: 'Three-circle Venn diagrams, class relationships, subset intersections, and survey data deductions.',
    subtopics: ['3-Circle Deductions', 'Subset Inclusions', 'Exclusive Disjoint Sets']
  },
  {
    id: 'non-verbal-reasoning',
    name: 'Non-Verbal Reasoning',
    category: 'logical',
    description: 'Mirror images, water images, paper folding, pattern completion, and figure matrices.',
    subtopics: ['Mirror & Water Images', 'Paper Folding & Cutting', 'Embedded Figures', 'Figure Series']
  },

  // ================= VERBAL ABILITY (49-62) =================
  {
    id: 'grammar',
    name: 'Grammar',
    category: 'verbal',
    description: 'Parts of speech, subject-verb agreement, tenses, conditional sentences, modifiers, and parallelism.',
    subtopics: ['Subject-Verb Agreement', 'Tense Consistency', 'Dangling Modifiers', 'Parallel Structure']
  },
  {
    id: 'sentence-correction',
    name: 'Sentence Correction',
    category: 'verbal',
    description: 'Identifying structural, syntactical, or idiomatic errors and choosing the best phrased alternative.',
    subtopics: ['Pronoun Ambiguity', 'Comparative Clauses', 'Conjunction Usage', 'Idiomatic Phrasing']
  },
  {
    id: 'error-detection',
    name: 'Error Detection',
    category: 'verbal',
    description: 'Spotting the erroneous segment in divided sentences (Part A, B, C, D or No Error).',
    subtopics: ['Preposition Errors', 'Article Misuse', 'Singular/Plural Noun Forms', 'Adverb Placement']
  },
  {
    id: 'fill-in-the-blanks',
    name: 'Fill in the Blanks',
    category: 'verbal',
    description: 'Single and double blank contextual vocabulary and prepositional fit in sentences.',
    subtopics: ['Contextual Clues', 'Double Blanks', 'Prepositional Phrases', 'Tone Matching']
  },
  {
    id: 'synonyms',
    name: 'Synonyms',
    category: 'verbal',
    description: 'Closest meaning words, nuanced connotations, elevated collegiate vocabulary, and contextual usage.',
    subtopics: ['Direct Synonyms', 'Nuanced Connotations', 'Academic Word List', 'Contextual Substitutes']
  },
  {
    id: 'antonyms',
    name: 'Antonyms',
    category: 'verbal',
    description: 'Exact opposite words, complementary antonyms, prefix polarity, and degree opposites.',
    subtopics: ['Prefix Inversions (un-, in-, dis-)', 'Polar Opposites', 'Graded Antonyms']
  },
  {
    id: 'vocabulary',
    name: 'Vocabulary',
    category: 'verbal',
    description: 'Root words (Greek/Latin roots), high-frequency GRE/CAT words, prefixes, and suffixes.',
    subtopics: ['Latin & Greek Roots', 'Etymology Patterns', 'High Frequency CAT/GRE Words']
  },
  {
    id: 'idioms-and-phrases',
    name: 'Idioms and Phrases',
    category: 'verbal',
    description: 'Figurative expressions, colloquial idioms, phrasal verbs, and metaphorical usage in modern English.',
    subtopics: ['Common Idioms', 'Phrasal Verbs with Multiple Meanings', 'Proverbs and Adages']
  },
  {
    id: 'one-word-substitution',
    name: 'One Word Substitution',
    category: 'verbal',
    description: 'Single concise term representing a complex phrase, description of personality, science, or phobia.',
    subtopics: ['Person Types & Occupations', 'Studies & Sciences', 'Phobias & Manias', 'Government Forms']
  },
  {
    id: 'para-jumbles',
    name: 'Para Jumbles',
    category: 'verbal',
    description: 'Arranging 4-5 scrambled sentences into a coherent, logically progressing paragraph.',
    subtopics: ['Mandatory Pairs', 'Pronoun-Noun Antecedent Links', 'Opening & Concluding Sentences']
  },
  {
    id: 'reading-comprehension',
    name: 'Reading Comprehension',
    category: 'verbal',
    description: 'Passage analysis, primary purpose, tone of the author, inference, and supporting details.',
    subtopics: ['Main Idea & Title', 'Direct Factual Retrieval', 'Author Tone & Attitude', 'Logical Inference']
  },
  {
    id: 'sentence-completion',
    name: 'Sentence Completion',
    category: 'verbal',
    description: 'Completing sentences with cohesive clauses, logical contrast markers (although, however), and transition.',
    subtopics: ['Contrast Transitions', 'Cause-and-Effect Connectors', 'Clausal Progression']
  },
  {
    id: 'active-and-passive-voice',
    name: 'Active and Passive Voice',
    category: 'verbal',
    description: 'Transformation between active and passive forms across past, present, future, and modal tenses.',
    subtopics: ['Tense Transformations', 'Imperative Sentences', 'Interrogative Sentences', 'Prepositional Verbs']
  },
  {
    id: 'direct-and-indirect-speech',
    name: 'Direct and Indirect Speech',
    category: 'verbal',
    description: 'Reported speech conversion, reporting verbs, backshift in tenses, and changes in time/place adverbs.',
    subtopics: ['Backshift of Tenses', 'Pronoun Modifications', 'Time & Place Adverbs (now -> then)', 'Questions & Imperatives']
  }
];

export const CATEGORY_LABELS: Record<string, string> = {
  quantitative: 'Quantitative Aptitude',
  logical: 'Logical Reasoning',
  verbal: 'Verbal Ability'
};

export const TOPIC_BY_ID = new Map(ALL_TOPICS.map(t => [t.id, t]));
