document.body.innerHTML = `<div class="app" id="app"><aside class="sidebar" id="sidebar"><a class="brand" href="#home"><span class="brand-mark">∑</span><span class="brand-name">quant<span>wise</span><small>APTITUDE STUDIO</small></span></a><div class="side-label">WORKSPACE</div><nav class="side-nav" aria-label="Main navigation"><button class="nav-link active" data-view="home"><span class="nav-icon">⌂</span>Overview</button><button class="nav-link" data-view="topics"><span class="nav-icon">▦</span>Practice by topic</button><button class="nav-link" data-view="mock"><span class="nav-icon">◷</span>Mock tests</button><button class="nav-link" data-view="mixed"><span class="nav-icon">⤨</span>Mixed quiz</button><button class="nav-link" data-view="di"><span class="nav-icon">▤</span>Data interpretation</button><button class="nav-link" data-view="bank"><span class="nav-icon">⌕</span>Question bank</button></nav><div class="side-label side-label-spaced">YOUR ACCOUNT</div><nav class="side-nav" aria-label="Your account"><button class="nav-link" data-view="progress"><span class="nav-icon">↗</span>Your progress</button></nav><div class="sidebar-bottom"><div class="sidebar-tip"><span class="tip-icon">✳</span><strong>Small steps, sharp skills.</strong><span>Consistency compounds.</span></div><div class="profile"><div class="avatar">Q</div><div><strong>Practice session</strong><small>Local profile</small></div><span class="profile-more">•••</span></div></div></aside><main class="main-area"><header class="topbar"><button class="icon-button menu-button" id="menu-toggle" aria-label="Open navigation">☰</button><div class="breadcrumb"><span>Workspace</span><b>/</b><strong id="crumb-current">Overview</strong></div><div class="top-actions"><span class="today-label" id="today-label"></span><button class="icon-button theme-toggle" id="theme-toggle" aria-label="Switch color theme" title="Switch color theme">◐</button></div></header><div class="content" id="content" tabindex="-1"></div><footer class="footer"><span>Quantwise Aptitude Studio</span><span>Practice thoughtfully. Improve measurably.</span></footer></main><div class="sidebar-scrim" id="sidebar-scrim"></div><div id="modal-root"></div><div class="toast" id="toast" role="status" aria-live="polite"></div></div>`;

(() => {
  'use strict';

  const topicNames = [
    'Number System','H.C.F. and L.C.M. of Numbers','Decimal Fractions','Simplification','Square Roots and Cube Roots','Average','Problems on Numbers','Problems on Ages','Surds and Indices','Logarithms','Percentage','Profit and Loss','Ratio and Proportion','Partnership','Chain Rule','Pipes and Cisterns','Time and Work','Time and Distance','Boats and Streams','Problems on Trains','Alligation or Mixture','Simple Interest','Compound Interest','Area','Volume and Surface Area','Races and Games of Skill','Calendar','Clocks','Stocks and Shares','Permutations and Combinations','Probability','True Discount',"Banker's Discount",'Heights and Distances','Odd Man Out and Series','Tabulation','Bar Graphs','Pie Chart','Line Graphs'
  ];
  const topics = topicNames.map((name, index) => ({ id: `t${String(index + 1).padStart(2, '0')}`, name, section: index < 35 ? 'Arithmetical Ability' : 'Data Interpretation', index }));
  const difficulties = ['Easy', 'Medium', 'Hard', 'Expert'];
  const letters = ['A', 'B', 'C', 'D'];
  const STORAGE_KEY = 'quantwise.practice.v1';
  const content = document.getElementById('content');
  const modalRoot = document.getElementById('modal-root');
  const crumb = document.getElementById('crumb-current');
  let view = 'home';
  let activeTest = null;
  let timerHandle = null;
  let toastHandle = null;
  let bankPage = 0;
  let bankFilters = { search: '', topic: 'all', difficulty: 'all', type: 'all', attempted: 'all' };
  let topicSearch = '';
  let topicSection = 'all';
  let generatedCache = new Map();
  let record = loadRecord();

  function loadRecord() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { history: Array.isArray(value.history) ? value.history : [], seen: Array.isArray(value.seen) ? value.seen : [], topicStats: value.topicStats || {}, theme: value.theme === 'dark' ? 'dark' : 'light', featureSaved: Boolean(value.featureSaved) };
    } catch { return { history: [], seen: [], topicStats: {}, theme: 'light', featureSaved: false }; }
  }
  function saveRecord() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(record)); } catch { toast('Storage is full. Recent progress may not be saved.'); } }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
  function fmt(value) { return Number.isInteger(value) ? String(value) : Number(value.toFixed(2)).toString(); }
  function gcd(a, b) { while (b) [a, b] = [b, a % b]; return Math.abs(a); }
  function lcm(a, b) { return a * b / gcd(a, b); }
  function money(value) { return `₹${fmt(value)}`; }
  function seeded(seed) { let x = (seed + 1) * 2654435761 >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }
  function shuffle(items, rand) { const copy = [...items]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }

  function makeQuestion(topic, index, prompt, answer, explanation, extra = {}) {
    const difficulty = difficulties[Math.floor(index / 25) % 4];
    const type = index % 9 === 0 ? 'Shortcut' : 'Calculation';
    const answerNum = Number(Number(answer).toFixed(2));
    const candidates = [];
    const baseStep = Math.max(1, Math.round(Math.abs(answerNum) * (Math.abs(answerNum) < 10 ? 0.15 : 0.08)));
    for (const delta of [baseStep, -baseStep, baseStep * 2, -baseStep * 2, 1, -1, 3, -3, 5, -5, 10, -10]) {
      const value = Number((answerNum + delta).toFixed(2));
      if (Number.isFinite(value) && value !== answerNum && !candidates.includes(value)) candidates.push(value);
      if (candidates.length === 3) break;
    }
    let options = [answerNum, ...candidates].map(fmt);
    const rand = seeded(topic.index * 1009 + index * 31 + 7);
    options = shuffle(options, rand);
    const correctAnswer = options.findIndex(option => Number(option) === answerNum);
    return { id: `${topic.id}-${String(index + 1).padStart(3, '0')}`, question: prompt, options, correctAnswer, explanation, topic: topic.name, topicId: topic.id, difficulty, type, stimulus: extra.stimulus || '' };
  }

  const concepts = [
    ['Which quick test determines whether an integer is divisible by 9?', 'Its digit sum is divisible by 9.', ['Its last digit is even.', 'Its last two digits are divisible by 9.', 'Its alternating digit sum is divisible by 9.'], 'A number is divisible by 9 exactly when the sum of its digits is divisible by 9.'],
    ['Which statement is true of the H.C.F. of two positive integers?', 'It is the greatest integer dividing both exactly.', ['It is always their product.', 'It is always greater than both numbers.', 'It is the smallest common multiple.'], 'The H.C.F. is the greatest common divisor shared by the given integers.'],
    ['When multiplying two decimal numbers, how is the product’s decimal-place count found?', 'Add the decimal places in both factors.', ['Use only the decimal places in the first factor.', 'Use the larger decimal-place count.', 'Always place the decimal two places from the right.'], 'The product has as many decimal places as the sum of the decimal places in its factors.'],
    ['In an expression with brackets and the four basic operations, which should be evaluated first?', 'Operations inside brackets.', ['Addition from left to right.', 'Subtraction before multiplication.', 'Division only after addition.'], 'Brackets are resolved before exponentiation, multiplication/division, and addition/subtraction.'],
    ['What does the principal square root of a non-negative number represent?', 'The non-negative value whose square is that number.', ['Half of the number.', 'The number multiplied by itself twice.', 'The reciprocal of the number.'], 'The principal square root is the non-negative inverse of squaring.'],
    ['How is the arithmetic mean of a set of observations calculated?', 'Sum of observations divided by their count.', ['Largest observation minus smallest observation.', 'Product of observations divided by their count.', 'Count divided by the sum.'], 'Arithmetic mean = total of observations ÷ number of observations.'],
    ['In a two-digit number, what does the tens digit contribute to its value?', 'Ten times the tens digit.', ['The tens digit divided by ten.', 'The tens digit times the units digit.', 'One hundred times the tens digit.'], 'Place value gives a two-digit number as 10 × tens digit + units digit.'],
    ['If two people’s present ages differ by 6 years, how does their age difference change after 10 years?', 'It remains 6 years.', ['It becomes 16 years.', 'It becomes 4 years.', 'It doubles.'], 'Adding the same elapsed time to both ages leaves their difference unchanged.'],
    ['When multiplying powers with the same base, what happens to their exponents?', 'The exponents are added.', ['The exponents are subtracted.', 'The base and exponents are added.', 'The exponents are multiplied by the base.'], 'For nonzero base a, a^m × a^n = a^(m+n).'],
    ['For a positive base b not equal to 1, what does log_b(x) = k mean?', 'b raised to k equals x.', ['k raised to b equals x.', 'b multiplied by k equals x.', 'x raised to b equals k.'], 'A logarithm is the exponent to which the base is raised to produce the argument.'],
    ['A percentage is a ratio expressed with what denominator?', '100', ['10', '1,000', 'The original quantity'], 'Per cent means per hundred, so p% = p/100.'],
    ['In a basic profit-percentage calculation, profit is expressed as a percentage of which amount?', 'Cost price.', ['Selling price only.', 'Marked price only.', 'Tax amount.'], 'Profit percentage = profit ÷ cost price × 100.'],
    ['If A:B = 3:5 and both terms are multiplied by the same positive number, what happens to the ratio?', 'Its value remains 3:5.', ['It becomes 8:1.', 'It becomes 5:3.', 'Its value doubles.'], 'Multiplying both terms of a ratio by the same nonzero number preserves the ratio.'],
    ['When partners invest different amounts for different durations, how are profits shared?', 'In proportion to capital × time.', ['In proportion to time alone.', 'Equally in all cases.', 'In inverse proportion to capital × time.'], 'A partner’s profit share follows the product of invested capital and investment duration.'],
    ['For a fixed amount of work and a constant rate, how do worker count and completion time vary?', 'They are inversely proportional.', ['They are directly proportional.', 'They are always equal.', 'Neither affects the other.'], 'More workers reduce the time in inverse proportion when work rates are equal.'],
    ['How are simultaneous filling rates for two inlet pipes combined?', 'Add their fractions of the tank filled per unit time.', ['Add the times each takes to fill the tank.', 'Subtract their capacities.', 'Multiply their filling times.'], 'Rates add: combined rate = 1/t₁ + 1/t₂ tank per unit time.'],
    ['If A finishes a job in m days, what fraction of the job does A complete in one day?', '1/m', ['m', 'm/2', '1/(m²)'], 'A’s one-day work rate is the reciprocal of the number of days needed for the whole job.'],
    ['What is the standard relation among distance, speed, and time?', 'Distance = speed × time.', ['Distance = speed ÷ time.', 'Speed = distance × time.', 'Time = distance × speed.'], 'For uniform motion, distance = speed multiplied by elapsed time.'],
    ['How is a boat’s downstream speed related to still-water speed and stream speed?', 'Still-water speed plus stream speed.', ['Still-water speed minus twice stream speed.', 'Stream speed minus still-water speed.', 'Their product.'], 'The current assists motion downstream, so the two speeds add.'],
    ['When a train crosses a platform, what distance does the train cover?', 'Train length plus platform length.', ['Only the platform length.', 'Only the train length, regardless of platform.', 'Train length minus platform length.'], 'The train must move its own length plus the platform length to clear the platform.'],
    ['For two quantities mixed at different prices, what determines the average price per unit?', 'The total cost divided by the total quantity.', ['The sum of prices divided by the price difference.', 'The higher price alone.', 'The unweighted average in every case.'], 'A mixture’s mean price is a quantity-weighted average.'],
    ['Under simple interest, which expression gives the interest?', 'Principal × rate × time ÷ 100.', ['Principal × (1 + rate/100)^time.', 'Principal ÷ (rate × time).', 'Rate × time ÷ principal.'], 'Simple interest is PRT/100 when rate is annual and time is in years.'],
    ['With annual compounding, what is the amount after t years at annual rate r?', 'P(1 + r/100)^t', ['P + rt/100', 'P(1 − r/100)^t', 'P × r × t'], 'Each year’s interest joins the principal, giving A = P(1+r/100)^t.'],
    ['What is the area of a rectangle with length l and breadth b?', 'l × b', ['2(l + b)', 'l + b', 'l × b ÷ 2'], 'Rectangle area is the product of its perpendicular side lengths.'],
    ['What is the volume of a cuboid with length l, breadth b, and height h?', 'l × b × h', ['2(lb + bh + hl)', 'l + b + h', ['l × b ÷ h']], 'A cuboid’s volume is base area multiplied by height: lbh.'],
    ['When two runners move in the same direction, what is their relative speed?', 'The difference of their speeds.', ['The sum of their speeds.', 'Their speed product.', 'The larger speed divided by the smaller.'], 'For same-direction motion, relative speed is the difference; for opposite directions, it is the sum.'],
    ['How many days are there in a leap year?', '366', ['364', '365', '367'], 'A leap year has 366 days, including 29 days in February.'],
    ['How many degrees does the minute hand move in one minute?', '6°', ['1°', '30°', '0.5°'], 'The minute hand completes 360° in 60 minutes, or 6° per minute.'],
    ['A dividend declared as a percentage is ordinarily calculated on which share value?', 'Face value.', ['Market value on the purchase date.', 'Brokerage paid.', 'Current yield.'], 'The stated dividend rate is applied to a share’s face value.'],
    ['In a permutation problem, does the order of selected objects matter?', 'Yes, different orders count separately.', ['No, order is always ignored.', 'Only when all objects are identical.', 'Only for combinations.'], 'Permutations count ordered arrangements; combinations count selections without order.'],
    ['For equally likely outcomes, how is probability calculated?', 'Favourable outcomes divided by total possible outcomes.', ['Total outcomes divided by favourable outcomes.', 'Favourable plus total outcomes.', 'Favourable outcomes multiplied by total outcomes.'], 'P(E) = number of favourable outcomes / number of equally likely outcomes.'],
    ['True discount is the difference between which two amounts?', 'Amount due and its present worth.', ['Face value and bank interest.', 'Principal and compound amount.', 'Cost price and selling price.'], 'True discount = amount due − present worth.'],
    ["A banker's discount on a bill is calculated on which value?", 'The face value or amount due.', ['The present worth only.', 'The true discount only.', 'The bill’s original purchase price.'], "Banker's discount is simple interest on the face value for the unexpired term."],
    ['In a right-triangle height-and-distance problem, what does tan θ equal?', 'Opposite side divided by adjacent side.', ['Adjacent side divided by hypotenuse.', 'Opposite side divided by hypotenuse.', 'The sum of the two legs.'], 'The tangent ratio is perpendicular ÷ base (opposite ÷ adjacent).'],
    ['What is a useful first check when identifying an odd term in a number series?', 'Compare successive differences or ratios.', ['Add all terms and divide by the first.', 'Check only whether the terms are even.', 'Reverse the order of the terms.'], 'Successive differences and ratios often reveal the governing pattern or the outlier.'],
    ['What is the first step when reading a data table?', 'Identify the row, column, labels, and units.', ['Add every entry in the table.', 'Assume all values use the same unit.', 'Read only the largest value.'], 'Read headings and units first so each value is interpreted in the correct context.'],
    ['In a bar graph, what does the height or length of a bar represent?', 'The value for its labelled category on the chosen scale.', ['The number of categories in the graph.', 'The graph’s title.', 'Always the percentage of the total.'], 'Bar length maps a category’s value to the graph’s scale.'],
    ['What is the sum of all central angles in a complete pie chart?', '360°', ['180°', '100°', '90°'], 'A complete circle is 360°, so pie-slice angles sum to 360°.'],
    ['What does the slope between two points on a line graph measure?', 'Change in the vertical quantity per change in the horizontal quantity.', ['The sum of both quantities.', 'The largest value shown.', 'The vertical quantity at the first point only.'], 'Slope = change in y divided by change in x between the two points.']
  ];
  function makeConceptQuestion(topic, index) {
    const [prompt, answer, distractors, explanation] = concepts[topic.index];
    const options = shuffle([answer, ...distractors], seeded(topic.index * 1009 + index * 31 + 7));
    return { id: `${topic.id}-${String(index + 1).padStart(3, '0')}`, question: prompt, options, correctAnswer: options.indexOf(answer), explanation, topic: topic.name, topicId: topic.id, difficulty: difficulties[Math.floor(index / 25) % 4], type: 'Conceptual', stimulus: '' };
  }

  function generateQuestion(topic, index) {
    if (topic.index < 35 && index === 12) return makeConceptQuestion(topic, index);
    const n = index + 1;
    const a = 3 + ((n * 37 + topic.index * 19) % 97);
    const b = 2 + ((n * 53 + topic.index * 11) % 89);
    const c = 2 + ((n * 29 + topic.index * 7) % 47);
    const pat = index % 3;
    let q, ans, why, stimulus = '';
    switch (topic.index) {
      case 0:
        if (pat === 0) { const x = 100 + a * 7 + b; q = `What is the remainder when ${x} is divided by 9?`; ans = x % 9; why = `The remainder is the same as the digit sum modulo 9: ${String(x).split('').join(' + ')} = ${[...String(x)].reduce((s, d) => s + Number(d), 0)}.`; }
        else if (pat === 1) { const p = 2 + (n % 8), qPower = 1 + (Math.floor(n / 8) % 8), x = 2 ** p * 3 ** qPower; q = `How many positive divisors does ${x} have?`; ans = (p + 1) * (qPower + 1); why = `For prime factorization 2^${p} × 3^${qPower}, the divisor count is (${p}+1)(${qPower}+1) = ${ans}.`; }
        else { const x = 7 * a + 1; q = `What is the least positive integer that must be added to ${x} to make it divisible by 7?`; ans = (7 - x % 7) % 7; why = `The next multiple of 7 is ${x + ans}; add ${ans}.`; }
        break;
      case 1: { const x = a * 6, y = b * 9; ans = pat === 0 ? gcd(x, y) : pat === 1 ? lcm(x, y) : gcd(a * 12, b * 18); q = pat === 0 ? `Find the H.C.F. of ${x} and ${y}.` : pat === 1 ? `Find the L.C.M. of ${x} and ${y}.` : `Find the H.C.F. of ${a * 12} and ${b * 18}.`; why = pat === 1 ? `Using H.C.F. × L.C.M. = product, L.C.M. = (${x} × ${y}) ÷ ${gcd(x, y)} = ${ans}.` : `The greatest common divisor of the given numbers is ${ans}.`; break; }
      case 2: { const x = a + b / 10, y = c / 10; ans = pat === 0 ? Number((x + y).toFixed(2)) : pat === 1 ? Number((x - y).toFixed(2)) : Number((x * (1 + c / 100)).toFixed(2)); q = pat === 0 ? `Evaluate ${fmt(x)} + ${fmt(y)}.` : pat === 1 ? `Evaluate ${fmt(x)} − ${fmt(y)}.` : `Increase ${fmt(x)} by ${c}%. What is the result?`; why = pat === 2 ? `Multiply by 1 + ${c}/100: ${fmt(x)} × ${fmt(1 + c / 100)} = ${fmt(ans)}.` : `Align decimal places and calculate: ${fmt(ans)}.`; break; }
      case 3: { const x = 24 + a, y = 6 + b; ans = pat === 0 ? (x + y) * c : pat === 1 ? x * y - c : (x - y) * c; q = pat === 0 ? `Evaluate (${x} + ${y}) × ${c}.` : pat === 1 ? `Evaluate ${x} × ${y} − ${c}.` : `Evaluate (${x} − ${y}) × ${c}.`; why = `Apply brackets and multiplication before addition/subtraction: the value is ${ans}.`; break; }
      case 4: { const root = 5 + index; ans = pat === 1 ? 3 + index : root; const value = pat === 1 ? ans ** 3 : ans ** 2; q = pat === 1 ? `Find the cube root of ${value}.` : `Find the square root of ${value}.`; why = pat === 1 ? `${ans} × ${ans} × ${ans} = ${value}.` : `${ans} × ${ans} = ${value}.`; break; }
      case 5: { const count = 4; const start = 10 + a; const values = Array.from({ length: count }, (_, j) => start + j * c); ans = values.reduce((s, v) => s + v, 0) / count; q = `Find the average of ${values.join(', ')}.`; why = `Average = sum ÷ number of values = ${values.reduce((s, v) => s + v, 0)} ÷ ${count} = ${fmt(ans)}.`; break; }
      case 6: { const tens = 1 + a % 9, units = b % 10; const value = 10 * tens + units; ans = pat === 0 ? Math.abs(value - (10 * units + tens)) : pat === 1 ? tens + units : value; q = pat === 0 ? `A two-digit number has tens digit ${tens} and units digit ${units}. What is the absolute difference between it and the number formed by reversing its digits?` : pat === 1 ? `The tens and units digits of a two-digit number are ${tens} and ${units}. What is their sum?` : `Form the two-digit number whose tens digit is ${tens} and units digit is ${units}.`; why = pat === 0 ? `The number is ${value} and its reversal is ${10 * units + tens}; their absolute difference is ${ans}.` : `Use place value: 10 × ${tens} + ${units} = ${value}.`; break; }
      case 7: { const age = 18 + a, years = 2 + b % 8; const other = age + c; ans = pat === 0 ? age : pat === 1 ? age + years : other; q = pat === 0 ? `Riya is ${c} years younger than Sam. If Sam is ${other} years old, how old is Riya?` : pat === 1 ? `A person is ${age} years old now. How old will the person be in ${years} years?` : `Sam is ${age} years old. How many years older will Sam be than a ${age - c}-year-old sibling?`; why = pat === 0 ? `${other} − ${c} = ${ans} years.` : pat === 1 ? `${age} + ${years} = ${ans} years.` : `The age difference remains ${c} years.`; break; }
      case 8: { const cycle = Math.floor(index / 3); const base = pat === 1 ? 2 + cycle % 10 : 2 + cycle % 8; const power = pat === 2 ? 3 + Math.floor(cycle / 8) : 2 + Math.floor(cycle / (pat === 1 ? 10 : 8)); ans = pat === 2 ? base ** (power - 1) : pat === 1 ? base ** (2 * power) : base ** power; q = pat === 2 ? `Simplify ${base}^${power} ÷ ${base}.` : pat === 1 ? `Evaluate (${base}^${power})^2.` : `Evaluate ${base}^${power}.`; why = pat === 2 ? `When dividing like bases, subtract exponents: ${base}^${power - 1} = ${ans}.` : pat === 1 ? `For a power raised to a power, multiply exponents: ${base}^(${power}×2) = ${ans}.` : `Multiply the base by itself ${power} times to get ${ans}.`; break; }
      case 9: { const cycle = Math.floor(index / 3); const base = 2 + cycle % 10, power = (pat === 0 ? 2 : pat === 1 ? 6 : 10) + Math.floor(cycle / 10); ans = power; q = `Evaluate log base ${base} of ${base ** power}.`; why = `Since ${base}^${power} = ${base ** power}, log_${base}(${base ** power}) = ${power}.`; break; }
      case 10: { const value = 80 + a * 5; const pct = 5 + (b % 15) * 5; ans = pat === 0 ? value * pct / 100 : pat === 1 ? value * (100 + pct) / 100 : value * (100 - pct) / 100; q = pat === 0 ? `Find ${pct}% of ${value}.` : pat === 1 ? `Increase ${value} by ${pct}%.` : `Decrease ${value} by ${pct}%.`; why = `Use ${pct}/100 ${pat === 0 ? 'of' : 'times'} ${value}: the result is ${fmt(ans)}.`; break; }
      case 11: { const cost = 100 * (5 + a), pct = 5 + (b % 15) * 5; ans = pat === 0 ? cost * (100 + pct) / 100 : pat === 1 ? cost * pct / 100 : cost * (100 - pct) / 100; q = pat === 0 ? `An article costs ${money(cost)}. Find its selling price after a ${pct}% profit.` : pat === 1 ? `An item is bought for ${money(cost)} and sold for ${money(cost + cost * pct / 100)}. Find the profit.` : `An item costing ${money(cost)} is sold at a ${pct}% loss. Find its selling price.`; why = `Profit or loss is calculated on cost price. The required amount is ${money(ans)}.`; break; }
      case 12: { const x = 2 + a % 8, y = 2 + b % 8, unit = 3 + c; ans = pat === 0 ? unit * Math.max(x, y) : pat === 1 ? unit * x : unit * y; q = pat === 0 ? `Divide ${unit * (x + y)} in the ratio ${x}:${y}. What is the larger share?` : `If A:B = ${x}:${y} and B = ${unit * y}, find A.`; why = `One ratio part equals ${unit}; the requested value is ${ans}.`; break; }
      case 13: { const daysA = 3 + a, daysB = 3 + b, cap = 1000; ans = cap * daysA / (daysA + daysB); q = `Two partners' capital × time contributions are in the ratio ${daysA}:${daysB}. If the profit is ₹${cap}, what is A's share?`; why = `Profit shares follow capital × time. A's share = ${cap} × ${daysA}/(${daysA}+${daysB}) = ₹${fmt(ans)}.`; break; }
      case 14: { const workers = 4 + a, days = 5 + b, newWorkers = workers * 2; ans = days * workers / newWorkers; q = `${workers} workers complete a job in ${days} days. At the same rate, how many days will ${newWorkers} workers take?`; why = `Workers and days are inversely proportional: ${workers} × ${days} = ${newWorkers} × ${fmt(ans)}.`; break; }
      case 15: { const fillA = 4 + a, fillB = 5 + b; ans = pat === 0 ? fillA * fillB / (fillA + fillB) : pat === 1 ? fillA * 2 : fillB * 4; q = pat === 0 ? `Pipe A fills a tank in ${fillA} hours and pipe B in ${fillB} hours. Approximately how many hours do they take together (nearest hundredth)?` : `A pipe fills ${pat === 1 ? 'half' : 'one quarter'} of a tank in ${pat === 1 ? fillA : fillB} hours. What is its full-tank time?`; why = pat === 0 ? `Combined rate = 1/${fillA} + 1/${fillB}; time = ${fillA} × ${fillB}/(${fillA}+${fillB}) ≈ ${fmt(ans)} hours.` : `Scale the time for the stated fraction of the tank: ${fmt(ans)} hours.`; break; }
      case 16: { const daysA = 4 + a, daysB = 5 + b; ans = pat === 0 ? daysA * daysB / (daysA + daysB) : pat === 1 ? daysA / 2 : daysA / 3; q = pat === 0 ? `A can finish a task in ${daysA} days and B in ${daysB} days. Approximately how long working together (nearest hundredth)?` : `A completes a task in ${daysA} days. How many days will A take to complete ${pat === 1 ? 'half' : 'one-third'} of the task at the same rate?`; why = pat === 0 ? `Combined daily work = 1/${daysA} + 1/${daysB}; time ≈ ${fmt(ans)} days.` : `Scale the full completion time by the fraction of work: ${daysA} × ${pat === 1 ? '1/2' : '1/3'} = ${fmt(ans)} days.`; break; }
      case 17: { const speed = 30 + a * 3, time = 2 + b % 5; ans = pat === 0 ? speed * time : speed; q = pat === 0 ? `A vehicle travels at ${speed} km/h for ${time} hours. How far does it travel?` : pat === 1 ? `A ${speed * time} km journey takes ${time} hours. Find the average speed in km/h.` : `Convert ${fmt(speed * 18 / 5)} km/h to metres per second.`; why = pat === 0 ? `Distance = speed × time = ${speed} × ${time} = ${ans} km.` : pat === 1 ? `Speed = distance ÷ time = ${speed * time} ÷ ${time} = ${ans} km/h.` : `Multiply km/h by 5/18: ${fmt(speed * 18 / 5)} × 5/18 = ${fmt(ans)} m/s.`; break; }
      case 18: { const boat = 12 + a, stream = 2 + b % 7; ans = pat === 0 ? boat + stream : pat === 1 ? boat - stream : (boat + stream + boat - stream) / 2; q = pat === 0 ? `A boat moves at ${boat} km/h in still water and the stream flows at ${stream} km/h. Find its downstream speed.` : pat === 1 ? `A boat's still-water speed is ${boat} km/h and stream speed is ${stream} km/h. Find its upstream speed.` : `Downstream speed is ${boat + stream} km/h and upstream speed is ${boat - stream} km/h. Find still-water speed.`; why = pat === 0 ? `Downstream speed = still-water speed + stream speed = ${ans} km/h.` : pat === 1 ? `Upstream speed = still-water speed − stream speed = ${ans} km/h.` : `Still-water speed = (downstream + upstream)/2 = ${ans} km/h.`; break; }
      case 19: { const length = 100 + a * 10, speed = 10 + b * 2; ans = pat === 0 ? length / speed : pat === 1 ? (length + 200) / speed : speed; q = pat === 0 ? `A ${length} m train passes a pole at ${speed} m/s. How many seconds does it take?` : pat === 1 ? `A ${length} m train passes a 200 m platform at ${speed} m/s. Find the time in seconds.` : `Convert a train speed of ${fmt(speed * 18 / 5)} km/h to m/s.`; why = pat === 0 ? `Time = distance/speed = ${length}/${speed} = ${fmt(ans)} seconds.` : pat === 1 ? `Total distance = train + platform = ${length + 200} m; time = ${fmt(ans)} seconds.` : `Multiply km/h by 5/18 to get ${fmt(ans)} m/s.`; break; }
      case 20: { const low = 10 + a, high = low + 20 + b, qty1 = 2 + c, qty2 = 3 + a % 5; ans = pat === 0 ? (low * qty1 + high * qty2) / (qty1 + qty2) : pat === 1 ? (low + high) / 2 : high - low; q = pat === 0 ? `A ${qty1} L mixture at ₹${low}/L is combined with ${qty2} L at ₹${high}/L. Find the mean price per litre.` : pat === 1 ? `Equal quantities of ingredients cost ₹${low}/kg and ₹${high}/kg. Find their mean price per kg.` : `Two ingredients cost ₹${low}/kg and ₹${high}/kg. What is their price difference per kg?`; why = pat === 0 ? `Weighted mean = (${low}×${qty1} + ${high}×${qty2})/(${qty1}+${qty2}) = ₹${fmt(ans)}/L.` : pat === 1 ? `Equal quantities have mean price (${low}+${high})/2 = ₹${fmt(ans)}/kg.` : `Subtract the lower price from the higher price: ${high} − ${low} = ${ans}.`; break; }
      case 21: { const p = 1000 * (2 + a), r = 5 + b, t = 1 + c; ans = pat === 0 ? p * r * t / 100 : pat === 1 ? p + p * r * t / 100 : p * r / 100; q = pat === 0 ? `Find the simple interest on ₹${p} at ${r}% per annum for ${t} years.` : pat === 1 ? `Find the amount on ₹${p} at ${r}% simple interest for ${t} years.` : `Find one year's simple interest on ₹${p} at ${r}% per annum.`; why = `Simple interest = PRT/100. ${pat === 1 ? `Amount = principal + interest = ${money(p)} + ${money(p * r * t / 100)}.` : `Interest = ${money(ans)}.`}`; break; }
      case 22: { const p = 1000 * (2 + a), r = 10, t = 2; ans = pat === 0 ? p * ((1 + r / 100) ** t - 1) : pat === 1 ? p * (1 + r / 100) ** t : p * ((1 + r / 100) ** t - 1) - p * r * t / 100; q = pat === 0 ? `Find compound interest on ₹${p} at 10% per annum, compounded annually for 2 years.` : pat === 1 ? `Find the amount on ₹${p} at 10% per annum, compounded annually for 2 years.` : `For ₹${p} at 10% compounded annually for 2 years, how much greater is compound interest than simple interest?`; why = pat === 1 ? `Amount = P(1+r/100)^t = ${money(ans)}.` : `Compound interest is P[(1+r/100)^t−1] = ${money(ans)}.`; break; }
      case 23: { const length = 8 + a, breadth = 5 + b; ans = pat === 0 ? length * breadth : pat === 1 ? 2 * (length + breadth) : 2 * length * breadth; q = pat === 0 ? `Find the area of a rectangle ${length} cm long and ${breadth} cm wide.` : pat === 1 ? `Find the perimeter of a ${length} cm by ${breadth} cm rectangle.` : `Find the area of a triangle with base ${length} cm and height ${breadth} cm.`; if (pat === 2) ans = length * breadth / 2; why = pat === 0 ? `Area = length × breadth = ${length} × ${breadth} = ${ans} cm².` : pat === 1 ? `Perimeter = 2(length + breadth) = ${ans} cm.` : `Triangle area = ½ × base × height = ${fmt(ans)} cm².`; break; }
      case 24: { const x = 2 + a, y = 3 + b, z = 4 + c; ans = pat === 0 ? x * y * z : pat === 1 ? 2 * (x * y + y * z + x * z) : x ** 3; q = pat === 0 ? `Find the volume of a cuboid with dimensions ${x} cm × ${y} cm × ${z} cm.` : pat === 1 ? `Find the total surface area of a ${x} cm × ${y} cm × ${z} cm cuboid.` : `Find the volume of a cube whose edge is ${x} cm.`; why = pat === 0 ? `Volume = lbh = ${x}×${y}×${z} = ${ans} cm³.` : pat === 1 ? `TSA = 2(lb+bh+hl) = ${ans} cm².` : `Cube volume = edge³ = ${ans} cm³.`; break; }
      case 25: { const speedA = 10 + a, speedB = 8 + b; ans = pat === 0 ? Math.abs(speedA - speedB) : pat === 1 ? speedA * 2 : speedA + speedB; q = pat === 0 ? `In a 100 m race, A runs at ${speedA} m/s and B at ${speedB} m/s. What is the difference in their speeds?` : pat === 1 ? `A runner moves at ${speedA} m/s. How far does the runner travel in 2 seconds?` : `Two runners approach each other at ${speedA} m/s and ${speedB} m/s. Find their relative speed.`; why = pat === 1 ? `Distance = speed × time = ${speedA} × 2 = ${ans} m.` : `Relative speed is the ${pat === 0 ? 'absolute difference' : 'sum'} of the speeds: ${ans} m/s.`; break; }
      case 26: { const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; const months = ['January','February','March','April','May','June','July','August','September','October','November','December']; const firstDay = (a + b) % 7, dayNumber = 1 + ((n * 5 + topic.index) % 28), month = months[(n * 5 + topic.index) % 12]; ans = (firstDay + dayNumber - 1) % 7; q = `In ${month}, day 1 falls on ${days[firstDay]}. What weekday number (0 = Sunday, 6 = Saturday) is ${month} ${dayNumber}?`; why = `Advance ${dayNumber - 1} days from ${days[firstDay]}; ${month} ${dayNumber} falls on ${days[ans]} (number ${ans}).`; break; }
      case 27: { const clockMinutes = (n * 137 + topic.index * 31) % 720, hour = Math.floor(clockMinutes / 60) + 1, minute = clockMinutes % 60; const hourAngle = (hour % 12) * 30 + minute * 0.5, minuteAngle = minute * 6, difference = Math.abs(hourAngle - minuteAngle); ans = Math.min(difference, 360 - difference); q = `Find the smaller angle between the hands of a clock at ${hour}:${String(minute).padStart(2, '0')}.`; why = `Hour-hand angle = 30×${hour} + 0.5×${minute} = ${fmt(hourAngle)}°. Minute-hand angle = 6×${minute} = ${minuteAngle}°. The smaller difference is ${fmt(ans)}°.`; break; }
      case 28: { const shares = 100 + a * 10, dividend = 5 + b; ans = pat === 0 ? shares * dividend / 100 : pat === 1 ? dividend : shares * 100; q = pat === 0 ? `A share with face value ₹100 pays a ${dividend}% dividend. What dividend is earned on ${shares} shares?` : pat === 1 ? `A company declares a ${dividend}% dividend on a ₹100 face-value share. What is the dividend per share?` : `What is the total face value of ${shares} shares worth ₹100 each?`; why = pat === 0 ? `Dividend = number of shares × face value × rate/100 = ${shares} × 100 × ${dividend}/100 = ${money(ans)}.` : pat === 1 ? `Dividend per share = ₹100 × ${dividend}/100 = ${money(ans)}.` : `Total face value = ${shares} × ₹100 = ${money(ans)}.`; break; }
      case 29: { const objects = 5 + index, choose = 2 + b % 4; ans = pat === 0 ? npr(objects, 3) : npr(objects, choose); q = pat === 0 ? `In how many ways can 3 distinct books be selected and arranged from ${objects} books?` : `How many ordered selections of ${choose} people can be made from ${objects} people?`; why = pat === 0 ? `${objects}P3 = ${objects} × ${objects - 1} × ${objects - 2} = ${ans}.` : `Ordered selections = ${objects}P${choose} = ${objects}!/(${objects}-${choose})! = ${ans}.`; break; }
      case 30: { const favorable = 2 + a % 17, total = favorable + 4 + b % 13; ans = Math.round(favorable / total * 100); q = `A bag contains ${favorable} red counters and ${total - favorable} blue counters. What is the probability of selecting a red counter, as a percentage to the nearest whole percent?`; why = `Probability = favourable outcomes / total outcomes = ${favorable}/${total}; as a percentage, this is approximately ${ans}%.`; break; }
      case 31: { const amount = 5000 + a * 1000, rate = 5 + b, time = 1 + c; ans = Math.round(amount * rate * time / (100 + rate * time)); q = `Find the true discount, to the nearest rupee, on a bill due for ₹${amount} after ${time} year(s), at ${rate}% simple interest.`; why = `True discount = (amount due × rate × time)/(100 + rate × time) = ₹${ans} (rounded to the nearest rupee).`; break; }
      case 32: { const face = 5000 + a * 1000, rate = 5 + b, time = 1 + c; ans = face * rate * time / 100; q = `Find the banker's discount on a bill of ₹${face} due in ${time} year(s), at ${rate}% per annum.`; why = `Banker's discount = face value × rate × time / 100 = ₹${fmt(ans)}.`; break; }
      case 33: { const height = 10 + a * 2, distance = 8 + b * 2; ans = pat === 0 ? height : pat === 1 ? Math.round(height * Math.sqrt(3)) : distance; q = pat === 0 ? `From a point ${height} m from a tower, the angle of elevation is 45°. Find the tower's height.` : pat === 1 ? `A tower's base is ${height} m horizontally from an observer. Its angle of elevation is 60°. Estimate the tower's height to the nearest metre.` : `A point is ${distance} m from a tower and the angle of elevation is 45°. What is the tower's height?`; why = pat === 0 || pat === 2 ? `tan 45° = height/distance = 1, so height equals the horizontal distance: ${ans} m.` : `For 60°, tan 60° = √3; height = ${height} × √3 ≈ ${ans} m.`; break; }
      case 34: { const start = 2 + a, step = 2 + b % 8; ans = start + 5 * step; q = `Find the next term in the arithmetic series ${Array.from({ length: 5 }, (_, j) => start + j * step).join(', ')}, __.`; why = `The common difference is ${step}; add it to the final term: ${start + 4 * step} + ${step} = ${ans}.`; break; }
      case 35: case 36: case 37: case 38: {
        const group = Math.floor(index / 3) + 1;
        const dataA = 3 + ((group * 7 + topic.index * 3) % 17);
        const dataB = 2 + ((group * 11 + topic.index * 5) % 13);
        const dataC = 2 + ((group * 5 + topic.index) % 9);
        const values = [18 + dataA, 25 + dataB, 30 + dataC, 41 + dataA + dataB];
        const rows = topic.index === 35 ? ['North','South','East','West'] : ['Q1','Q2','Q3','Q4'];
        const seriesValues = topic.index === 38 ? [45 + dataA, 49 + dataA + dataB % 4, 53 + dataA + dataB % 4 + dataC % 3, 58 + dataA + dataB % 4 + dataC % 3 + 5] : values;
        const rowLabels = rows;
        const col = topic.index === 35 ? 'Candidates' : topic.index === 36 ? 'Units sold' : topic.index === 37 ? 'Share of total' : 'Monthly output';
        const displayValues = topic.index === 37 ? [20 + dataA % 10, 25 + dataB % 10, 15 + dataC % 10, 100 - (20 + dataA % 10) - (25 + dataB % 10) - (15 + dataC % 10)] : seriesValues;
        stimulus = `${topic.name} data (${col})\n${rowLabels.map((r, j) => `${r.padEnd(8)} ${displayValues[j]}${topic.index === 37 ? '%' : ''}`).join('\n')}`;
        const askRow = n % 4;
        if (topic.index === 37) {
          const total = 800 + dataA * 10;
          ans = Math.round(total * displayValues[askRow] / 100);
          q = `The pie chart shows percentage shares. If the total is ${total}, approximately how many units correspond to ${rowLabels[askRow]} (nearest whole unit)?`;
          why = `${displayValues[askRow]}% of ${total} = ${total} × ${displayValues[askRow]}/100 ≈ ${ans}.`;
        } else if (topic.index === 38) {
          const before = displayValues[(askRow + 2) % 4], after = displayValues[(askRow + 3) % 4];
          ans = after - before;
          q = `According to the line-graph values, what is the change from ${rowLabels[(askRow + 2) % 4]} to ${rowLabels[(askRow + 3) % 4]}?`;
          why = `Change = later value − earlier value = ${after} − ${before} = ${ans}.`;
        } else {
          ans = displayValues[askRow];
          q = topic.index === 35 ? `According to the table, how many candidates are recorded for ${rowLabels[askRow]}?` : `According to the bar graph values, what is the value for ${rowLabels[askRow]}?`;
          why = `Read the value aligned with ${rowLabels[askRow]}: ${ans}.`;
        }
        break;
      }
      default: q = `Evaluate ${a} + ${b}.`; ans = a + b; why = `${a} + ${b} = ${ans}.`;
    }
    return makeQuestion(topic, index, q, ans, why, { stimulus });
  }
  function factorial(n) { let out = 1; for (let i = 2; i <= n; i++) out *= i; return out; }
  function npr(n, r) { let out = 1; for (let i = 0; i < r; i++) out *= n - i; return out; }
  function getBank(topic) { if (!generatedCache.has(topic.id)) generatedCache.set(topic.id, Array.from({ length: 100 }, (_, i) => generateQuestion(topic, i))); return generatedCache.get(topic.id); }
  function allQuestions() { return topics.flatMap(getBank); }
  function randomize(list) { return shuffle(list, Math.random); }
  function progressForTopic(topic) { const stat = record.topicStats[topic.id]; return stat && stat.attempted ? Math.round(stat.correct / stat.attempted * 100) : 0; }
  function setView(next) {
    if (activeTest && !activeTest.result) { toast('Finish or submit your current quiz before leaving.'); return; }
    view = next; document.querySelectorAll('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.view === next));
    const names = { home: 'Overview', topics: 'Practice by topic', mock: 'Mock tests', mixed: 'Mixed quiz', di: 'Data interpretation', bank: 'Question bank', progress: 'Your progress', results: 'Test results' };
    crumb.textContent = names[next] || 'Overview'; renderView(); closeSidebar();
  }
  function renderView() {
    document.body.classList.toggle('home-view', view === 'home');
    if (view === 'home') renderHome();
    else if (view === 'topics') renderTopics();
    else if (view === 'mock') renderMock();
    else if (view === 'mixed') renderMixed();
    else if (view === 'di') renderDI();
    else if (view === 'bank') renderBank();
    else if (view === 'progress') renderProgress();
    else if (view === 'results') renderResults();
  }
  function metric(label, value, foot, icon) { return `<div class="metric"><div class="metric-top"><span>${label}</span><span class="metric-icon">${icon}</span></div><div class="metric-value">${value}</div><div class="metric-foot">${foot}</div></div>`; }
  function renderHome() {
    document.body.classList.add('home-view');
    const tests = record.history.length;
    const questions = record.history.reduce((s, h) => s + h.attempted, 0);
    const correct = record.history.reduce((s, h) => s + h.correct, 0);
    const accuracy = questions ? Math.round(correct / questions * 100) : 0;
    const best = tests ? Math.max(...record.history.map(h => h.score)) : 0;
    content.innerHTML = `<section class="editorial-board"><header class="editorial-nav"><a href="#home" class="editorial-brand" data-view="home"><span class="brand-mark">∑</span><span>QUANTWISE</span></a><nav aria-label="Featured navigation"><button data-view="topics">Help</button><button data-view="bank">Originals</button><button data-view="mixed">Combi</button><button data-view="progress">About</button><button data-view="home" class="editorial-home">Home <span>⌂</span></button></nav><button class="icon-button editorial-theme" id="theme-toggle" aria-label="Switch color theme" title="Switch color theme">◐</button></header>
      <div class="editorial-body"><div class="editorial-art"><img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&q=85" alt="A student working through a practice sheet at a desk"><div class="art-index"><span>39</span><small>CHAPTERS</small></div><div class="art-caption"><span>THE PRACTICE SERIES</span><b>Think clearly.<br>Calculate confidently.</b></div></div>
      <div class="editorial-details"><div class="edition-line"><span class="edition-dots">•••</span><span>QUANTITATIVE APTITUDE</span><span class="star-rating" aria-label="Five star practice">★★★★★</span></div><h1>Quantitative<br>Aptitude</h1><p class="editorial-description">Master quantitative aptitude through thousands of original, exam-style practice questions.</p><div class="editorial-actions"><button class="button editorial-play" data-action="quick-start"><span>▶</span> PLAY</button><button class="button secondary editorial-list" data-view="bank">MY LIBRARY <span>↗</span></button><button class="editorial-heart ${record.featureSaved ? 'is-saved' : ''}" data-action="save-home" aria-label="${record.featureSaved ? 'Remove saved practice studio' : 'Save this practice studio'}" title="${record.featureSaved ? 'Remove from saved' : 'Save this practice studio'}">${record.featureSaved ? '♥' : '♡'}</button></div>
      <div class="gallery-label"><span>EXPLORE PRACTICE</span><button data-view="topics">VIEW ALL ↗</button></div><div class="editorial-gallery">
        <button class="gallery-thumb" data-view="topics"><img src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=420&q=75" alt="Books arranged for focused study"><span class="thumb-play">▶</span><small>PRACTICE BY TOPIC</small></button>
        <button class="gallery-thumb" data-view="mock"><img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=420&q=75" alt="A bright classroom prepared for an exam"><span class="thumb-play">▶</span><small>FULL MOCK TEST</small></button>
        <button class="gallery-thumb" data-view="mixed"><img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=420&q=75" alt="Open study books and notes"><span class="thumb-play">▶</span><small>MIXED QUIZ</small></button>
        <button class="gallery-thumb" data-view="di"><img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=420&q=75" alt="Students learning together"><span class="thumb-play">▶</span><small>DATA INTERPRETATION</small></button>
      </div><div class="editorial-footnote">39 TOPICS <span>·</span> 3,900 QUESTIONS <span>·</span> YOUR PROGRESS, SAVED LOCALLY</div></div></div></section>
      <div class="section-head"><div><h2>Your practice at a glance</h2><p>Your activity is saved privately in this browser.</p></div><button class="text-link" data-view="progress">View progress →</button></div>
      <div class="metrics">${metric('Tests completed', tests, 'Saved on this device', '◷')}${metric('Questions attempted', questions, 'Across all sessions', '▤')}${metric('Overall accuracy', `${accuracy}%`, 'Correct / attempted', '◎')}${metric('Best score', tests ? fmt(best) : '—', 'Highest test score', '↗')}</div>
      <div class="section-head"><div><h2>Choose your practice</h2><p>Pick a focused session or explore the full question bank.</p></div></div>
      <div class="feature-grid">
        <article class="feature-card" data-view="topics"><span class="feature-arrow">↗</span><div class="feature-icon">▦</div><h3>Practice by topic</h3><p>Build fluency chapter by chapter with 100 generated variations per topic.</p></article>
        <article class="feature-card" data-view="mock"><span class="feature-arrow">↗</span><div class="feature-icon">◷</div><h3>Full mock test</h3><p>Simulate timed competitive exams with a question palette and negative marking.</p></article>
        <article class="feature-card" data-view="mixed"><span class="feature-arrow">↗</span><div class="feature-icon">⤨</div><h3>Mixed quiz</h3><p>Switch topics and difficulty to keep recall sharp under varied conditions.</p></article>
        <article class="feature-card" data-view="di"><span class="feature-arrow">↗</span><div class="feature-icon">▤</div><h3>Data interpretation</h3><p>Practice table, bar, pie, and line graph questions with shared data sets.</p></article>
        <article class="feature-card" data-view="progress"><span class="feature-arrow">↗</span><div class="feature-icon">↗</div><h3>Performance</h3><p>Review topic strengths, difficulty balance, score trends, and past sessions.</p></article>
        <article class="feature-card" data-view="bank"><span class="feature-arrow">↗</span><div class="feature-icon">⌕</div><h3>Question bank</h3><p>Search questions and filter by chapter, difficulty, type, and attempt status.</p></article>
      </div>
      <div class="section-head"><div><h2>Explore the syllabus</h2><p>39 chapters · 3,900 original parameterized questions</p></div><button class="text-link" data-view="topics">All topics →</button></div>
      <div class="topic-grid">${topics.slice(0, 6).map(topicCard).join('')}</div>`;
  }
  function topicCard(topic) { const percent = progressForTopic(topic); return `<button class="topic-card" data-topic="${topic.id}"><span class="topic-index">${String(topic.index + 1).padStart(2, '0')} · ${topic.index < 35 ? 'ARITHMETICAL ABILITY' : 'DATA INTERPRETATION'}</span><h3>${escapeHtml(topic.name)}</h3><div class="topic-card-bottom"><span>100 questions</span><b>${percent ? `${percent}%` : 'Start'} <span aria-hidden="true">→</span></b></div><div class="progress-line"><span style="width:${percent}%"></span></div></button>`; }
  function renderTopics() {
    const filtered = topics.filter(topic => topic.name.toLowerCase().includes(topicSearch.toLowerCase()) && (topicSection === 'all' || (topicSection === 'di' ? topic.index >= 35 : topic.index < 35)));
    content.innerHTML = `<div class="eyebrow">COMPLETE SYLLABUS</div><h1 class="page-heading">Practice by topic</h1><p class="page-subtitle">Choose a chapter, set a question count, and work at your own pace.</p>
      <div class="section-head"><div><h2>${filtered.length} chapters</h2><p>100 reproducible, original variations are available for every chapter.</p></div></div>
      <div class="topic-tools"><div class="search-field"><span class="search-symbol">⌕</span><input class="field" id="topic-search" value="${escapeHtml(topicSearch)}" placeholder="Search all 39 topics" aria-label="Search topics"></div><select class="select" id="topic-section"><option value="all" ${topicSection === 'all' ? 'selected' : ''}>All sections</option><option value="arith" ${topicSection === 'arith' ? 'selected' : ''}>Arithmetical ability</option><option value="di" ${topicSection === 'di' ? 'selected' : ''}>Data interpretation</option></select></div>
      <div class="topic-grid">${filtered.map(topicCard).join('') || '<div class="empty-state">No chapters match this search.</div>'}</div>`;
    document.getElementById('topic-search').addEventListener('input', event => { topicSearch = event.target.value; renderTopics(); const input = document.getElementById('topic-search'); input.focus(); input.setSelectionRange(input.value.length, input.value.length); });
    document.getElementById('topic-section').addEventListener('change', event => { topicSection = event.target.value; renderTopics(); });
  }
  function renderMock() {
    content.innerHTML = `<div class="eyebrow">EXAM SIMULATION</div><h1 class="page-heading">Full mock test</h1><p class="page-subtitle">A timed, mixed-syllabus test. Answers and explanations stay hidden until submission.</p>
      <div class="mode-cards"><article class="mode-card"><div class="feature-icon">◷</div><strong>Exam conditions</strong><p>Navigate with the palette, mark questions for review, and submit once you're ready. Correct +1, incorrect −1, unanswered 0.</p></article><article class="mode-card"><div class="feature-icon">▦</div><strong>Complete syllabus</strong><p>Questions span all 39 chapters and four difficulty levels. The timer submits automatically at zero.</p></article></div>
      <div class="mode-controls"><div class="control-group"><label for="mock-count">Question count</label><select id="mock-count" class="select"><option value="50">50 questions</option><option value="100">100 questions</option></select></div><div class="control-group"><label for="mock-duration">Duration</label><select id="mock-duration" class="select"><option value="30">30 minutes</option><option value="60" selected>60 minutes</option><option value="90">90 minutes</option></select></div><button class="button" data-action="start-mock">Start mock test →</button></div>`;
  }
  function renderMixed() {
    content.innerHTML = `<div class="eyebrow">RANDOMIZED PRACTICE</div><h1 class="page-heading">Mixed quiz</h1><p class="page-subtitle">A varied set from across the syllabus with immediate feedback after each answer.</p><div class="mode-controls"><div class="control-group"><label for="mixed-count">Question count</label><select id="mixed-count" class="select"><option value="10">10 questions</option><option value="20" selected>20 questions</option><option value="50">50 questions</option><option value="100">100 questions</option></select></div><div class="control-group"><label for="mixed-difficulty">Difficulty</label><select id="mixed-difficulty" class="select"><option value="all">All levels</option>${difficulties.map(d => `<option>${d}</option>`).join('')}</select></div><button class="button" data-action="start-mixed">Start mixed quiz →</button></div><div class="mode-cards"><article class="mode-card"><div class="feature-icon">⤨</div><strong>Random topics</strong><p>Questions are drawn across the complete syllabus and shuffled for each session.</p></article><article class="mode-card"><div class="feature-icon">✓</div><strong>Immediate review</strong><p>Answer explanations appear as you go. Your score is saved when the set is complete.</p></article></div>`;
  }
  function renderDI() {
    const dataTopics = topics.slice(35);
    content.innerHTML = `<div class="eyebrow">READ THE DATA</div><h1 class="page-heading">Data interpretation</h1><p class="page-subtitle">Practice questions based on small shared data sets. Pick a format to start a focused set.</p><div class="topic-grid">${dataTopics.map(topicCard).join('')}</div><div class="mode-controls"><div class="control-group"><label for="di-count">Question count</label><select id="di-count" class="select"><option value="10">10 questions</option><option value="20" selected>20 questions</option><option value="50">50 questions</option><option value="100">100 questions</option></select></div><button class="button" data-action="start-di">Practice all data formats →</button></div>`;
  }

  function renderBank() {
    const options = [];
    for (const topic of topics) {
      for (const question of getBank(topic)) {
        if (bankFilters.topic !== 'all' && question.topicId !== bankFilters.topic) continue;
        if (bankFilters.difficulty !== 'all' && question.difficulty !== bankFilters.difficulty) continue;
        if (bankFilters.type !== 'all' && question.type !== bankFilters.type) continue;
        if (bankFilters.attempted === 'attempted' && !record.seen.includes(question.id)) continue;
        if (bankFilters.attempted === 'unattempted' && record.seen.includes(question.id)) continue;
        if (bankFilters.search && !`${question.question} ${question.topic} ${question.stimulus}`.toLowerCase().includes(bankFilters.search.toLowerCase())) continue;
        options.push(question);
      }
    }
    const pageSize = 12, pages = Math.max(1, Math.ceil(options.length / pageSize));
    bankPage = Math.min(bankPage, pages - 1);
    const page = options.slice(bankPage * pageSize, (bankPage + 1) * pageSize);
    content.innerHTML = `<div class="eyebrow">QUESTION LIBRARY</div><h1 class="page-heading">Question bank</h1><p class="page-subtitle">Search and explore 3,900 reproducible original questions across the complete syllabus.</p>
      <div class="section-head"><div><h2>${options.length.toLocaleString()} questions</h2><p>Filter by chapter, challenge, style, or your attempt history.</p></div></div>
      <div class="filter-row"><div class="search-field"><span class="search-symbol">⌕</span><input id="bank-search" class="field" placeholder="Search questions" value="${escapeHtml(bankFilters.search)}"></div><select id="bank-topic" class="select"><option value="all">All topics</option>${topics.map(t => `<option value="${t.id}" ${bankFilters.topic === t.id ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('')}</select><select id="bank-difficulty" class="select"><option value="all">All difficulties</option>${difficulties.map(d => `<option ${bankFilters.difficulty === d ? 'selected' : ''}>${d}</option>`).join('')}</select><select id="bank-type" class="select"><option value="all">All question types</option>${['Calculation','Shortcut','Conceptual'].map(t => `<option ${bankFilters.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select><select id="bank-attempted" class="select"><option value="all">All questions</option><option value="attempted" ${bankFilters.attempted === 'attempted' ? 'selected' : ''}>Attempted</option><option value="unattempted" ${bankFilters.attempted === 'unattempted' ? 'selected' : ''}>Unattempted</option></select></div>
      <div class="panel" style="margin-top:14px">${page.length ? page.map(bankQuestionRow).join('') : '<div class="empty-state">No questions match these filters.</div>'}</div>
      <div class="pagination"><button class="small-button" data-action="bank-prev" ${bankPage === 0 ? 'disabled' : ''}>← Previous</button><span style="font-size:10px;color:var(--muted)">Page ${bankPage + 1} of ${pages}</span><button class="small-button" data-action="bank-next" ${bankPage >= pages - 1 ? 'disabled' : ''}>Next →</button></div>`;
    ['bank-search','bank-topic','bank-difficulty','bank-type','bank-attempted'].forEach(id => document.getElementById(id).addEventListener(id === 'bank-search' ? 'input' : 'change', event => {
      const keys = { 'bank-search':'search', 'bank-topic':'topic', 'bank-difficulty':'difficulty', 'bank-type':'type', 'bank-attempted':'attempted' };
      bankFilters[keys[id]] = event.target.value; bankPage = 0;
      if (id === 'bank-search') { const cursor = event.target.selectionStart; renderBank(); const field = document.getElementById('bank-search'); field.focus(); field.setSelectionRange(cursor, cursor); } else renderBank();
    }));
  }
  function bankQuestionRow(question) {
    return `<article class="bank-row"><div class="bank-question">${escapeHtml(question.question)}</div>${question.stimulus ? renderStimulus(question) : ''}<div class="bank-meta">${escapeHtml(question.topic)} · ${question.difficulty} · ${question.type}${record.seen.includes(question.id) ? ' · Attempted' : ''}</div><div class="bank-options">${question.options.map((o, i) => `<span>${letters[i]}. ${escapeHtml(o)}</span>`).join('')}</div><details style="margin-top:8px;font-size:10px;color:var(--muted)"><summary style="cursor:pointer">Show answer and explanation</summary><div style="margin-top:7px"><strong>Answer: ${letters[question.correctAnswer]}. ${escapeHtml(question.options[question.correctAnswer])}</strong><br>${escapeHtml(question.explanation)}</div></details></article>`;
  }
  function renderProgress() {
    const history = record.history;
    const tests = history.length;
    const attempted = history.reduce((sum, item) => sum + item.attempted, 0);
    const correct = history.reduce((sum, item) => sum + item.correct, 0);
    const wrong = history.reduce((sum, item) => sum + item.wrong, 0);
    const avg = tests ? history.reduce((sum, item) => sum + item.score, 0) / tests : 0;
    const best = tests ? Math.max(...history.map(item => item.score)) : 0;
    const accuracy = attempted ? Math.round(correct / attempted * 100) : 0;
    const ranked = topics.map(t => ({ topic: t, ...record.topicStats[t.id] })).filter(t => t.attempted).sort((a, b) => b.correct / b.attempted - a.correct / a.attempted);
    const strong = ranked.length ? `${ranked[0].topic.name} · ${Math.round(ranked[0].correct / ranked[0].attempted * 100)}%` : 'Not enough data';
    const weak = ranked.length ? `${ranked[ranked.length - 1].topic.name} · ${Math.round(ranked[ranked.length - 1].correct / ranked[ranked.length - 1].attempted * 100)}%` : 'Not enough data';
    const topicRows = ranked.map(t => performanceRow(t.topic.name, Math.round(t.correct / t.attempted * 100))).join('');
    const difficultyRows = difficulties.map(d => {
      const qs = history.flatMap(h => h.details || []).filter(x => x.difficulty === d && x.userAnswer !== null);
      return performanceRow(d, qs.length ? Math.round(qs.filter(x => x.userAnswer === x.correctAnswer).length / qs.length * 100) : 0);
    }).join('');
    content.innerHTML = `<div class="eyebrow">YOUR LEARNING, OVER TIME</div><h1 class="page-heading">Your progress</h1><p class="page-subtitle">A personal performance record, saved only in this browser.</p><div class="section-head"><div><h2>Performance summary</h2><p>Based on submitted practice sets and mock tests.</p></div></div><div class="metrics">${metric('Total tests', tests, 'Completed sessions', '◷')}${metric('Questions attempted', attempted, `${correct} correct · ${wrong} wrong`, '▤')}${metric('Average score', tests ? fmt(avg) : '—', 'Across completed tests', '◎')}${metric('Best score', tests ? fmt(best) : '—', `Overall accuracy ${accuracy}%`, '↗')}</div>
      <div class="analysis-grid" style="margin-top:14px"><section class="panel"><h3>Topic performance</h3>${topicRows || '<div class="empty-state">Complete a practice set to see topic performance.</div>'}</section><section class="panel"><h3>Difficulty performance</h3>${difficultyRows}</section></div>
      <div class="analysis-grid" style="margin-top:14px"><section class="panel"><h3>Strengths to build on</h3><div class="performance-row"><span>Strongest topic</span><span>${escapeHtml(strong)}</span><b></b></div><div class="performance-row"><span>Topic to revisit</span><span>${escapeHtml(weak)}</span><b></b></div></section><section class="panel"><h3>Recent sessions</h3>${history.length ? history.slice(0, 8).map(historyRow).join('') : '<div class="empty-state">Your completed test history will appear here.</div>'}</section></div>
      <div style="margin-top:14px;display:flex;justify-content:flex-end"><button class="small-button" data-action="clear-progress">Clear saved progress</button></div>`;
  }
  function performanceRow(name, percent) { return `<div class="performance-row"><span>${escapeHtml(name)}</span><div class="progress-line"><span style="width:${percent}%"></span></div><b>${percent}%</b></div>`; }
  function historyRow(item, index) { return `<div class="history-row"><strong>${escapeHtml(item.title)}</strong><span>${new Date(item.date).toLocaleDateString()}</span><b>${fmt(item.score)} / ${item.total}</b><button class="small-button" data-history="${escapeHtml(item.id)}">Review</button></div>`; }
  function renderResults() {
    const result = activeTest && activeTest.result;
    if (!result) { view = 'home'; return renderHome(); }
    const topicRows = result.topicStats.map(item => performanceRow(item.topic, item.attempted ? Math.round(item.correct / item.attempted * 100) : 0)).join('');
    const difficultyRows = result.difficultyStats.map(item => performanceRow(item.difficulty, item.attempted ? Math.round(item.correct / item.attempted * 100) : 0)).join('');
    const details = result.details.map((item, i) => reviewCard(item, i)).join('');
    content.innerHTML = `<div class="eyebrow">SESSION COMPLETE</div><h1 class="page-heading">Test results</h1><p class="page-subtitle">${escapeHtml(result.title)} · ${new Date(result.date).toLocaleString()}</p><div class="result-score" style="margin-top:18px"><div><span>FINAL SCORE</span><strong>${fmt(result.score)} <small style="font-size:14px;font-weight:500;color:#c8ded2">/ ${result.total}</small></strong></div><div class="score-right"><span>Score percentage</span><strong>${fmt(result.percentage)}%</strong><span>Accuracy ${fmt(result.accuracy)}%</span></div></div>
      <div class="stats-grid">${statTile('Total questions', result.total)}${statTile('Attempted', result.attempted)}${statTile('Correct', result.correct)}${statTile('Wrong', result.wrong)}${statTile('Unanswered', result.unanswered)}${statTile('Positive marks', `+${fmt(result.positive)}`)}${statTile('Negative marks', `−${fmt(result.negative)}`)}${statTile('Accuracy', `${fmt(result.accuracy)}%`)}</div>
      <div class="analysis-grid"><section class="panel"><h3>Topic-wise performance</h3>${topicRows}</section><section class="panel"><h3>Difficulty-wise performance</h3>${difficultyRows}</section></div>
      <div class="section-head"><div><h2>Answer review</h2><p>Every response, correct answer, and explanation from this session.</p></div><button class="button secondary" data-view="home">Back to overview</button></div><div class="review-list">${details}</div>`;
  }
  function statTile(label, value) { return `<div class="stat-tile"><span>${label}</span><strong>${value}</strong></div>`; }
  function reviewCard(item, index) {
    const user = item.userAnswer === null ? 'Unanswered' : `${letters[item.userAnswer]}. ${item.options[item.userAnswer]}`;
    const isCorrect = item.userAnswer === item.correctAnswer;
    return `<article class="review-card"><div class="review-title"><span class="topic-index">Q${index + 1}</span> ${escapeHtml(item.question)}</div>${item.stimulus ? renderStimulus(item) : ''}<div class="review-meta"><span class="pill">${escapeHtml(item.topic)}</span><span class="pill ${item.difficulty.toLowerCase()}">${item.difficulty}</span><span class="pill">${item.userAnswer === null ? 'Unanswered' : isCorrect ? 'Correct' : 'Wrong'}</span></div><div class="review-answer"><strong>Your answer:</strong> ${escapeHtml(user)}<br><strong>Correct answer:</strong> ${letters[item.correctAnswer]}. ${escapeHtml(item.options[item.correctAnswer])}</div><div class="review-explanation"><strong>Explanation:</strong> ${escapeHtml(item.explanation)}</div></article>`;
  }

  function openTopicSetup(topic) {
    modalRoot.innerHTML = `<div class="modal-backdrop" data-dismiss="true"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="setup-title"><div class="eyebrow">TOPIC PRACTICE</div><h2 id="setup-title">${escapeHtml(topic.name)}</h2><p>Choose how many questions to include. Answers are checked immediately after each selection.</p><div class="control-group"><label for="topic-count">Question count</label><select class="select" id="topic-count"><option value="20">20 questions</option><option value="50">50 questions</option><option value="100">100 questions</option></select></div><div class="modal-actions"><button class="button secondary" data-action="close-modal">Cancel</button><button class="button" data-action="begin-topic" data-topic-id="${topic.id}">Start practice →</button></div></section></div>`;
  }
  function startTest({ title, mode, count, duration = 0, sourceTopics = topics, difficulty = 'all', immediate = true }) {
    let pool = sourceTopics.flatMap(getBank);
    if (difficulty !== 'all') pool = pool.filter(q => q.difficulty === difficulty);
    let chosen;
    if (mode === 'data-interpretation') {
      const groups = sourceTopics.flatMap(topic => {
        const bank = getBank(topic);
        return Array.from({ length: Math.floor(bank.length / 3) }, (_, i) => bank.slice(i * 3, i * 3 + 3));
      });
      chosen = randomize(groups).flat().slice(0, Math.min(count, pool.length));
    } else chosen = randomize(pool).slice(0, Math.min(count, pool.length));
    if (!chosen.length) { toast('No questions available for this selection.'); return; }
    activeTest = { title, mode, questions: chosen, answers: Array(chosen.length).fill(null), review: Array(chosen.length).fill(false), current: 0, immediate, endAt: duration ? Date.now() + duration * 60 * 1000 : null, remaining: duration * 60, result: null };
    view = 'exam'; crumb.textContent = title; renderExam();
    if (duration) startTimer();
  }
  function startTimer() {
    clearInterval(timerHandle);
    timerHandle = setInterval(() => {
      if (!activeTest || !activeTest.endAt) return;
      activeTest.remaining = Math.max(0, Math.ceil((activeTest.endAt - Date.now()) / 1000));
      const timer = document.getElementById('exam-timer');
      if (timer) { timer.textContent = timeString(activeTest.remaining); timer.classList.toggle('warning', activeTest.remaining <= 300); }
      if (activeTest.remaining <= 0) { clearInterval(timerHandle); finishTest(true); }
    }, 250);
  }
  function timeString(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
  function renderStimulus(question) {
    const lines = question.stimulus.split('\n');
    const rows = lines.slice(1).map(line => {
      const match = line.trim().match(/^(.+?)\s+(\d+)%?$/);
      return match ? { label: match[1].trim(), value: Number(match[2]) } : null;
    }).filter(Boolean);
    if (!rows.length) return `<pre class="question-stimulus">${escapeHtml(question.stimulus)}</pre>`;
    if (question.topicId === 't37') return `<div class="chart-card"><div class="chart-caption">${escapeHtml(lines[0])}</div><div class="chart-bars">${rows.map(row => `<div class="chart-bar-column"><span>${row.value}</span><div class="chart-bar-track"><i style="height:${Math.max(5, row.value / Math.max(...rows.map(r => r.value)) * 100)}%"></i></div><small>${escapeHtml(row.label)}</small></div>`).join('')}</div></div>`;
    if (question.topicId === 't38') {
      let cursor = 0;
      const colors = ['#227958','#e6a353','#6389b5','#d77a68'];
      const stops = rows.map((row, i) => { const start = cursor; cursor += row.value; return `${colors[i]} ${start}% ${cursor}%`; }).join(', ');
      return `<div class="chart-card"><div class="chart-caption">${escapeHtml(lines[0])}</div><div class="pie-layout"><div class="pie-chart" style="background:conic-gradient(${stops})" role="img" aria-label="Pie chart: ${rows.map(row => `${escapeHtml(row.label)} ${row.value}%`).join(', ')}"></div><div class="chart-legend">${rows.map((row, i) => `<span><i style="background:${colors[i]}"></i>${escapeHtml(row.label)} <b>${row.value}%</b></span>`).join('')}</div></div></div>`;
    }
    if (question.topicId === 't39') {
      const low = Math.min(...rows.map(row => row.value)), high = Math.max(...rows.map(row => row.value));
      const points = rows.map((row, i) => ({ x: 45 + i * 135, y: 112 - (row.value - low) / (high - low || 1) * 78, ...row }));
      const path = points.map(point => `${point.x},${point.y}`).join(' ');
      return `<div class="chart-card"><div class="chart-caption">${escapeHtml(lines[0])}</div><svg class="line-chart" viewBox="0 0 480 155" role="img" aria-label="Line graph showing ${points.map(point => `${escapeHtml(point.label)} ${point.value}`).join(', ')}"><line x1="30" y1="120" x2="465" y2="120" class="chart-axis"/><line x1="30" y1="20" x2="30" y2="120" class="chart-axis"/><polyline points="${path}" class="chart-line"/>${points.map(point => `<circle cx="${point.x}" cy="${point.y}" r="4" class="chart-point"/><text x="${point.x}" y="${point.y - 9}" text-anchor="middle" class="chart-value">${point.value}</text><text x="${point.x}" y="142" text-anchor="middle" class="chart-label">${escapeHtml(point.label)}</text>`).join('')}</svg></div>`;
    }
    return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Category</th><th>${escapeHtml(lines[0].match(/\((.*?)\)/)?.[1] || 'Value')}</th></tr></thead><tbody>${rows.map(row => `<tr><td>${escapeHtml(row.label)}</td><td>${row.value}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function renderExam() {
    if (!activeTest) return;
    const test = activeTest, index = test.current, question = test.questions[index], answered = test.answers.filter(a => a !== null).length;
    const optionMarkup = question.options.map((option, i) => {
      let classes = 'option';
      if (test.answers[index] === i) classes += ' selected';
      if (test.immediate && test.answers[index] !== null && i === question.correctAnswer) classes += ' correct';
      if (test.immediate && test.answers[index] === i && i !== question.correctAnswer) classes += ' incorrect';
      return `<button class="${classes}" data-option="${i}" ${test.answers[index] !== null && test.immediate ? 'disabled' : ''}><span class="option-key">${letters[i]}</span><span>${escapeHtml(option)}</span></button>`;
    }).join('');
    const feedback = test.immediate && test.answers[index] !== null ? `<div class="feedback ${test.answers[index] === question.correctAnswer ? 'good' : 'bad'}"><strong>${test.answers[index] === question.correctAnswer ? 'Correct answer' : 'Not quite'}</strong>${escapeHtml(question.explanation)}</div>` : '';
    const palette = test.questions.map((q, i) => `<button class="palette-item ${test.answers[i] !== null ? 'answered' : ''} ${test.review[i] ? 'review' : ''} ${i === index ? 'current' : ''}" data-jump="${i}" aria-label="Question ${i + 1}${test.answers[i] !== null ? ', answered' : ', unanswered'}${test.review[i] ? ', marked for review' : ''}">${i + 1}</button>`).join('');
    content.innerHTML = `<div class="exam-layout"><section class="exam-main"><div class="exam-top"><div><div class="exam-kicker">${test.mode === 'mock' ? 'MOCK TEST' : 'PRACTICE SESSION'}<strong>${escapeHtml(question.topic)}</strong></div><div class="question-type-label">${question.difficulty} · ${question.type}</div></div><div style="text-align:right"><div class="exam-counter">Question ${index + 1} of ${test.questions.length}</div>${test.endAt ? `<div class="timer ${test.remaining <= 300 ? 'warning' : ''}" id="exam-timer">${timeString(test.remaining)}</div>` : ''}</div></div>
      ${question.stimulus ? renderStimulus(question) : ''}<h1 class="question-title">${escapeHtml(question.question)}</h1><div class="option-list">${optionMarkup}</div>${feedback}<div class="question-actions"><button class="small-button" data-action="previous" ${index === 0 ? 'disabled' : ''}>← Previous</button><button class="small-button" data-action="clear-answer" ${test.answers[index] === null ? 'disabled' : ''}>Clear answer</button><button class="small-button ${test.review[index] ? 'marked' : ''}" data-action="mark-review">${test.review[index] ? '★ Marked' : '☆ Mark for review'}</button><span class="spacer"></span><button class="button" data-action="next">${index === test.questions.length - 1 ? (test.immediate ? 'Finish practice' : 'Submit test') : 'Next →'}</button></div></section>
      <aside class="exam-aside"><div class="palette-head"><span>Question palette</span><small>${answered}/${test.questions.length} answered</small></div><div class="palette-grid">${palette}</div><div class="palette-legend"><span><i class="legend-dot current"></i>Current</span><span><i class="legend-dot answered"></i>Answered</span><span><i class="legend-dot empty"></i>Unanswered</span><span><i class="legend-dot review"></i>Review</span></div><div class="exam-aside-summary"><span>Answered</span><strong>${answered}</strong></div><div class="exam-aside-summary"><span>Unanswered</span><strong>${test.questions.length - answered}</strong></div>${test.immediate ? '' : `<button class="button danger submit-wide" data-action="submit">Submit test</button>`}</aside></div>`;
  }
  function selectAnswer(index) {
    if (!activeTest || (activeTest.immediate && activeTest.answers[activeTest.current] !== null)) return;
    activeTest.answers[activeTest.current] = index;
    markSeen(activeTest.questions[activeTest.current].id);
    renderExam();
  }
  function markSeen(id) { if (!record.seen.includes(id)) { record.seen.push(id); if (record.seen.length > 5000) record.seen.splice(0, record.seen.length - 5000); saveRecord(); } }
  function nextQuestion() {
    if (!activeTest) return;
    if (activeTest.current === activeTest.questions.length - 1) { if (activeTest.immediate) finishTest(false); else confirmSubmit(); return; }
    activeTest.current++; renderExam();
  }
  function confirmSubmit() {
    if (!activeTest) return;
    const unanswered = activeTest.answers.filter(a => a === null).length;
    modalRoot.innerHTML = `<div class="modal-backdrop" data-dismiss="true"><section class="modal" role="dialog" aria-modal="true"><div class="eyebrow">SUBMIT TEST</div><h2>Ready to submit?</h2><p>You have answered ${activeTest.answers.length - unanswered} of ${activeTest.answers.length} questions. ${unanswered ? `${unanswered} unanswered question(s) will receive 0 marks.` : 'All questions have a response.'} You cannot change answers after submission.</p><div class="modal-actions"><button class="button secondary" data-action="close-modal">Continue test</button><button class="button danger" data-action="confirm-submit">Submit test</button></div></section></div>`;
  }
  function finishTest(autoSubmitted) {
    if (!activeTest || activeTest.result) return;
    clearInterval(timerHandle); timerHandle = null; modalRoot.innerHTML = '';
    const test = activeTest, details = test.questions.map((question, i) => ({ ...question, userAnswer: test.answers[i] }));
    const correct = details.filter(d => d.userAnswer === d.correctAnswer).length;
    const attempted = details.filter(d => d.userAnswer !== null).length;
    const wrong = attempted - correct, unanswered = details.length - attempted, negative = wrong, positive = correct;
    const score = positive - negative, accuracy = attempted ? correct / attempted * 100 : 0, percentage = score / details.length * 100;
    const topicStats = topics.filter(topic => details.some(d => d.topicId === topic.id)).map(topic => {
      const qs = details.filter(d => d.topicId === topic.id && d.userAnswer !== null);
      return { topic: topic.name, attempted: qs.length, correct: qs.filter(d => d.userAnswer === d.correctAnswer).length };
    });
    const difficultyStats = difficulties.map(difficulty => {
      const qs = details.filter(d => d.difficulty === difficulty && d.userAnswer !== null);
      return { difficulty, attempted: qs.length, correct: qs.filter(d => d.userAnswer === d.correctAnswer).length };
    });
    details.forEach(item => { if (item.userAnswer !== null) { const stat = record.topicStats[item.topicId] || { attempted: 0, correct: 0, wrong: 0 }; stat.attempted++; if (item.userAnswer === item.correctAnswer) stat.correct++; else stat.wrong++; record.topicStats[item.topicId] = stat; } });
    const result = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: test.title, mode: test.mode, date: new Date().toISOString(), total: details.length, attempted, correct, wrong, unanswered, positive, negative, score, accuracy, percentage, topicStats, difficultyStats, details, autoSubmitted };
    record.history.unshift(result); record.history = record.history.slice(0, 50); saveRecord();
    test.result = result; view = 'results'; crumb.textContent = 'Test results'; renderResults();
    if (autoSubmitted) toast('Time is up. Your test was submitted automatically.');
  }

  function showModal(title, body, confirmText, onConfirm) {
    modalRoot.innerHTML = `<div class="modal-backdrop" data-dismiss="true"><section class="modal" role="dialog" aria-modal="true"><div class="eyebrow">CONFIRMATION</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p><div class="modal-actions"><button class="button secondary" data-action="close-modal">Cancel</button><button class="button danger" data-action="confirm-generic">${escapeHtml(confirmText)}</button></div></section></div>`;
    modalRoot.querySelector('[data-action="confirm-generic"]').addEventListener('click', () => { modalRoot.innerHTML = ''; onConfirm(); });
  }
  function toast(message) { const element = document.getElementById('toast'); element.textContent = message; element.classList.add('show'); clearTimeout(toastHandle); toastHandle = setTimeout(() => element.classList.remove('show'), 2600); }
  function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('sidebar-scrim').classList.remove('open'); }

  document.addEventListener('click', event => {
    const navButton = event.target.closest('[data-view]');
    if (navButton) { setView(navButton.dataset.view); return; }
    const topicButton = event.target.closest('[data-topic]');
    if (topicButton && (!activeTest || activeTest.result)) { const topic = topics.find(item => item.id === topicButton.dataset.topic); if (topic) openTopicSetup(topic); return; }
    const option = event.target.closest('[data-option]'); if (option) { selectAnswer(Number(option.dataset.option)); return; }
    const jump = event.target.closest('[data-jump]'); if (jump && activeTest) { activeTest.current = Number(jump.dataset.jump); renderExam(); return; }
    const historyButton = event.target.closest('[data-history]'); if (historyButton) { const old = record.history.find(item => item.id === historyButton.dataset.history); if (old) { activeTest = { result: old }; view = 'results'; crumb.textContent = 'Test results'; renderResults(); } return; }
    const action = event.target.closest('[data-action]'); if (!action) return;
    switch (action.dataset.action) {
      case 'quick-start': startTest({ title: 'Quick practice', mode: 'quick', count: 10, immediate: true, sourceTopics: topics }); break;
      case 'save-home': record.featureSaved = !record.featureSaved; saveRecord(); renderHome(); toast(record.featureSaved ? 'Practice studio saved.' : 'Practice studio removed from saved.'); break;
      case 'go-mock': setView('mock'); break;
      case 'start-mock': startTest({ title: `Full mock test · ${document.getElementById('mock-count').value} questions`, mode: 'mock', count: Number(document.getElementById('mock-count').value), duration: Number(document.getElementById('mock-duration').value), immediate: false }); break;
      case 'start-mixed': startTest({ title: 'Mixed quiz', mode: 'mixed', count: Number(document.getElementById('mixed-count').value), difficulty: document.getElementById('mixed-difficulty').value, immediate: true }); break;
      case 'start-di': startTest({ title: 'Data interpretation practice', mode: 'data-interpretation', count: Number(document.getElementById('di-count').value), sourceTopics: topics.slice(35), immediate: true }); break;
      case 'begin-topic': { const topic = topics.find(item => item.id === action.dataset.topicId); if (topic) { const count = Number(document.getElementById('topic-count').value); modalRoot.innerHTML = ''; startTest({ title: topic.name, mode: 'topic', count, sourceTopics: [topic], immediate: true }); } break; }
      case 'next': nextQuestion(); break;
      case 'previous': if (activeTest && activeTest.current > 0) { activeTest.current--; renderExam(); } break;
      case 'clear-answer': if (activeTest) { activeTest.answers[activeTest.current] = null; renderExam(); } break;
      case 'mark-review': if (activeTest) { activeTest.review[activeTest.current] = !activeTest.review[activeTest.current]; renderExam(); } break;
      case 'submit': confirmSubmit(); break;
      case 'confirm-submit': finishTest(false); break;
      case 'close-modal': modalRoot.innerHTML = ''; break;
      case 'bank-prev': bankPage = Math.max(0, bankPage - 1); renderBank(); break;
      case 'bank-next': bankPage++; renderBank(); break;
      case 'clear-progress': showModal('Clear saved progress?', 'This removes your saved test history, topic performance, and question attempts from this browser.', 'Clear progress', () => { record.history = []; record.seen = []; record.topicStats = {}; saveRecord(); setView('progress'); }); break;
    }
  });
  modalRoot.addEventListener('click', event => { if (event.target.matches('.modal-backdrop[data-dismiss="true"]')) modalRoot.innerHTML = ''; });
  document.getElementById('theme-toggle').addEventListener('click', () => { record.theme = record.theme === 'dark' ? 'light' : 'dark'; document.documentElement.classList.toggle('theme-dark', record.theme === 'dark'); saveRecord(); });
  document.getElementById('menu-toggle').addEventListener('click', () => { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebar-scrim').classList.toggle('open'); });
  document.getElementById('sidebar-scrim').addEventListener('click', closeSidebar);
  document.getElementById('today-label').textContent = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  document.documentElement.classList.toggle('theme-dark', record.theme === 'dark');
  renderHome();
})();
