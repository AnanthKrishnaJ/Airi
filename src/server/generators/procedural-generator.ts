import { Question, DifficultyLevel } from '../../types/quiz';
import { TOPIC_BY_ID } from '../../data/topics';

// Helper utilities for math and random variation
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

function shuffleOptions(
  correctText: string,
  distractors: string[]
): { options: [string, string, string, string]; correctIndex: number } {
  // Ensure distractors are unique and don't match correctText
  const filtered = Array.from(new Set(distractors.filter(d => d !== correctText)));
  while (filtered.length < 3) {
    filtered.push(`None of these`);
  }
  const all = [correctText, filtered[0], filtered[1], filtered[2]];
  // Fisher-Yates shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const correctIndex = all.indexOf(correctText);
  return {
    options: [all[0], all[1], all[2], all[3]],
    correctIndex
  };
}

// Map of procedural question builders for Quantitative Aptitude topics
export function generateQuantQuestion(topicId: string, difficulty: DifficultyLevel, indexSeed: number): Question | null {
  const topic = TOPIC_BY_ID.get(topicId);
  if (!topic || topic.category !== 'quantitative') return null;

  const id = `q-${topicId}-${difficulty.toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  let questionText = '';
  let correctVal = '';
  let distractors: string[] = [];
  let explanation = '';
  let subtopic = topic.subtopics[0] || 'Core Concepts';

  switch (topicId) {
    case 'percentages': {
      subtopic = 'Percentage Increase/Decrease';
      if (difficulty === 'Easy') {
        const val = randInt(15, 80) * 10;
        const pct = pickRandom([10, 15, 20, 25, 30, 40, 50]);
        const ans = (val * pct) / 100;
        questionText = `What is ${pct}% of ${val}?`;
        correctVal = `${ans}`;
        distractors = [`${ans + 10}`, `${ans - 5}`, `${ans + 15}`, `${ans * 2}`];
        explanation = `Step 1: Convert percentage to fraction: ${pct}% = ${pct}/100.\nStep 2: Multiply by ${val}: (${pct}/100) × ${val} = ${ans}.\nTherefore, the answer is ${ans}.`;
      } else if (difficulty === 'Medium') {
        const salary = randInt(25, 75) * 1000;
        const inc = pickRandom([10, 15, 20, 25]);
        const dec = pickRandom([10, 15, 20]);
        const afterInc = salary * (1 + inc / 100);
        const finalVal = Math.round(afterInc * (1 - dec / 100));
        questionText = `A person's salary was first increased by ${inc}%, and then decreased by ${dec}%. If the original salary was $${salary.toLocaleString()}, what is the final salary?`;
        correctVal = `$${finalVal.toLocaleString()}`;
        distractors = [
          `$${(salary * (1 + (inc - dec) / 100)).toLocaleString()}`,
          `$${(finalVal - 500).toLocaleString()}`,
          `$${(finalVal + 1200).toLocaleString()}`
        ];
        explanation = `Step 1: Initial Salary = $${salary.toLocaleString()}.\nStep 2: After ${inc}% increase: $${salary} × (1 + ${inc}/100) = $${afterInc}.\nStep 3: After ${dec}% decrease on increased amount: $${afterInc} × (1 - ${dec}/100) = $${finalVal}.\nTherefore, the final salary is $${finalVal.toLocaleString()}.`;
      } else {
        const price = randInt(20, 60);
        const pctInc = pickRandom([20, 25, 30, 50]);
        // To keep expenditure same: (r / (100 + r)) * 100%
        const ansPct = ((pctInc / (100 + pctInc)) * 100).toFixed(2);
        questionText = `If the price of sugar increases by ${pctInc}%, by what percentage must a household reduce its consumption so as not to increase the expenditure?`;
        correctVal = `${ansPct}%`;
        distractors = [`${pctInc}%`, `${(parseFloat(ansPct) - 3.5).toFixed(2)}%`, `${(pctInc - 5)}%`];
        explanation = `Formula: Reduction in consumption = [R / (100 + R)] × 100%\nGiven R = ${pctInc}%.\nReduction = [${pctInc} / (100 + ${pctInc})] × 100% = [${pctInc} / ${100 + pctInc}] × 100 = ${ansPct}%.`;
      }
      break;
    }

    case 'profit-and-loss': {
      subtopic = 'CP and SP Calculation';
      const cp = randInt(15, 90) * 100;
      const profitPct = pickRandom([10, 15, 20, 25, 30]);
      const sp = cp + (cp * profitPct) / 100;
      if (difficulty === 'Easy') {
        questionText = `A retailer purchases an article for $${cp} and sells it at a profit of ${profitPct}%. Find the selling price.`;
        correctVal = `$${sp}`;
        distractors = [`$${sp - 50}`, `$${cp + profitPct * 10}`, `$${sp + 100}`];
        explanation = `Step 1: Cost Price (CP) = $${cp}, Profit % = ${profitPct}%.\nStep 2: Selling Price (SP) = CP × (100 + Profit%)/100\nSP = ${cp} × (${100 + profitPct}/100) = $${sp}.`;
      } else {
        const mpDiscount = pickRandom([10, 15, 20]);
        const mp = Math.round(sp / (1 - mpDiscount / 100));
        questionText = `A trader bought an article for $${cp}. At what marked price should he list the article so that after offering a discount of ${mpDiscount}%, he still makes a profit of ${profitPct}%?`;
        correctVal = `$${mp}`;
        distractors = [`$${sp}`, `$${mp + 150}`, `$${Math.round(cp * 1.4)}`];
        explanation = `Step 1: Required SP = CP × (1 + ${profitPct}/100) = $${sp}.\nStep 2: Let Marked Price be MP. SP = MP × (1 - ${mpDiscount}/100).\nStep 3: MP = SP / (1 - ${mpDiscount / 100}) = ${sp} / ${(1 - mpDiscount / 100).toFixed(2)} = $${mp}.`;
      }
      break;
    }

    case 'time-and-work': {
      subtopic = 'Unit Work Method';
      const daysA = pickRandom([10, 12, 15, 20, 24]);
      const daysB = pickRandom([15, 20, 30, 40]);
      const combinedDays = (daysA * daysB) / (daysA + daysB);
      const isInteger = Number.isInteger(combinedDays);
      const ansText = isInteger ? `${combinedDays} days` : `${combinedDays.toFixed(1)} days`;
      questionText = `A can finish a piece of work in ${daysA} days and B can finish the same work in ${daysB} days. In how many days can both of them together complete the entire work?`;
      correctVal = ansText;
      distractors = [
        `${Math.round((daysA + daysB) / 2)} days`,
        `${(combinedDays + 2).toFixed(1).replace('.0', '')} days`,
        `${Math.max(1, Math.round(combinedDays - 2))} days`
      ];
      explanation = `Step 1: Work done by A in 1 day = 1/${daysA}.\nStep 2: Work done by B in 1 day = 1/${daysB}.\nStep 3: Combined 1-day work = (1/${daysA}) + (1/${daysB}) = (${daysA + daysB}) / (${daysA * daysB}).\nStep 4: Total days required = (${daysA * daysB}) / (${daysA + daysB}) = ${ansText}.`;
      break;
    }

    case 'simple-interest': {
      subtopic = 'SI Formula';
      const p = randInt(20, 100) * 500;
      const r = pickRandom([5, 6, 8, 10, 12]);
      const t = randInt(2, 6);
      const si = (p * r * t) / 100;
      const totalAmount = p + si;
      if (difficulty === 'Easy') {
        questionText = `Calculate the Simple Interest on a principal of $${p.toLocaleString()} at an annual interest rate of ${r}% for ${t} years.`;
        correctVal = `$${si.toLocaleString()}`;
        distractors = [`$${(si + 200).toLocaleString()}`, `$${(si - 150).toLocaleString()}`, `$${(p * r / 100).toLocaleString()}`];
        explanation = `Formula: Simple Interest (SI) = (P × R × T) / 100\nGiven: P = $${p}, R = ${r}%, T = ${t} years.\nSI = (${p} × ${r} × ${t}) / 100 = $${si.toLocaleString()}.`;
      } else {
        questionText = `A sum of money invested at simple interest amounts to $${totalAmount.toLocaleString()} in ${t} years at ${r}% per annum. Find the original principal sum.`;
        correctVal = `$${p.toLocaleString()}`;
        distractors = [`$${(p - 1000).toLocaleString()}`, `$${(p + 1500).toLocaleString()}`, `$${(si * 2).toLocaleString()}`];
        explanation = `Formula: Amount A = P + SI = P + (P × R × T)/100 = P[1 + (R×T)/100].\nGiven: A = $${totalAmount}, R = ${r}%, T = ${t} years.\n$${totalAmount} = P × [1 + (${r}×${t})/100] = P × ${(1 + (r * t) / 100).toFixed(2)}.\nP = $${totalAmount} / ${(1 + (r * t) / 100).toFixed(2)} = $${p.toLocaleString()}.`;
      }
      break;
    }

    case 'compound-interest': {
      subtopic = 'Difference between CI and SI';
      const p = randInt(10, 80) * 1000;
      const r = pickRandom([5, 10, 12, 15]);
      // Difference for 2 years: P * (r/100)^2
      const diff = Math.round(p * Math.pow(r / 100, 2));
      questionText = `What is the difference between the Compound Interest and Simple Interest on $${p.toLocaleString()} for 2 years at an interest rate of ${r}% per annum?`;
      correctVal = `$${diff.toLocaleString()}`;
      distractors = [
        `$${(diff + 50).toLocaleString()}`,
        `$${Math.round(diff * 0.75).toLocaleString()}`,
        `$${Math.round(p * (r / 100))}`
      ];
      explanation = `Formula for difference between CI and SI for 2 years:\nDifference = P × (R / 100)²\nP = $${p}, R = ${r}%\nDifference = ${p} × (${r}/100)² = ${p} × ${(r * r) / 10000} = $${diff.toLocaleString()}.`;
      break;
    }

    case 'time-speed-and-distance': {
      subtopic = 'Average Speed';
      const speed1 = pickRandom([30, 40, 50, 60]);
      const speed2 = pickRandom([60, 80, 90, 100]);
      const harmonicMean = ((2 * speed1 * speed2) / (speed1 + speed2)).toFixed(1).replace('.0', '');
      questionText = `A car travels from City A to City B at a uniform speed of ${speed1} km/h and returns along the same route at ${speed2} km/h. What is the average speed of the car for the entire journey?`;
      correctVal = `${harmonicMean} km/h`;
      const arithmeticAvg = ((speed1 + speed2) / 2).toFixed(1).replace('.0', '');
      distractors = [`${arithmeticAvg} km/h`, `${(parseFloat(harmonicMean) - 5).toFixed(1)} km/h`, `${(speed1 + 10)} km/h`];
      explanation = `When equal distances are covered at speeds S₁ and S₂, the Average Speed is given by the Harmonic Mean formula:\nAverage Speed = (2 × S₁ × S₂) / (S₁ + S₂)\n= (2 × ${speed1} × ${speed2}) / (${speed1} + ${speed2})\n= ${2 * speed1 * speed2} / ${speed1 + speed2} = ${harmonicMean} km/h.\nNote: Simple arithmetic mean (${arithmeticAvg} km/h) is incorrect because the travel times for each leg are different.`;
      break;
    }

    case 'number-system': {
      subtopic = 'Divisibility Rules & Remainders';
      const divisor = pickRandom([7, 8, 9, 11, 13]);
      const multiplier = randInt(15, 65);
      const rem = randInt(2, divisor - 1);
      const num = divisor * multiplier + rem;
      questionText = `When the number ${num} is divided by ${divisor}, what is the remainder?`;
      correctVal = `${rem}`;
      distractors = [`${(rem + 1) % divisor}`, `${(rem + 2) % divisor}`, `0`];
      explanation = `By division algorithm: Dividend = (Divisor × Quotient) + Remainder.\n${num} ÷ ${divisor} = ${multiplier} with a remainder of ${rem}, since ${divisor} × ${multiplier} = ${divisor * multiplier} and ${num} - ${divisor * multiplier} = ${rem}.`;
      break;
    }

    case 'ratio-and-proportion': {
      subtopic = 'Basic Proportions';
      const a = randInt(2, 6);
      const b = randInt(3, 8);
      const totalParts = a + b;
      const multiplier = randInt(10, 50) * 10;
      const totalAmount = totalParts * multiplier;
      const shareA = a * multiplier;
      questionText = `A sum of $${totalAmount.toLocaleString()} is divided between Alex and Ben in the ratio ${a} : ${b}. What is Alex's share?`;
      correctVal = `$${shareA.toLocaleString()}`;
      distractors = [
        `$${(b * multiplier).toLocaleString()}`,
        `$${(shareA + 50).toLocaleString()}`,
        `$${(shareA - 100).toLocaleString()}`
      ];
      explanation = `Step 1: Total ratio units = ${a} + ${b} = ${totalParts} units.\nStep 2: Value of 1 unit = $${totalAmount} / ${totalParts} = $${multiplier}.\nStep 3: Alex's share = ${a} units × $${multiplier} = $${shareA.toLocaleString()}.`;
      break;
    }

    case 'hcf-and-lcm': {
      subtopic = 'Product of Numbers';
      const n1 = randInt(12, 48);
      const n2 = randInt(15, 60);
      const h = gcd(n1, n2);
      const l = lcm(n1, n2);
      questionText = `The HCF and LCM of two numbers are ${h} and ${l} respectively. If one of the numbers is ${n1}, what is the second number?`;
      correctVal = `${n2}`;
      distractors = [`${n2 + 4}`, `${Math.max(2, n2 - 6)}`, `${h * 3}`];
      explanation = `Key Theorem: Product of two numbers = HCF × LCM.\nNumber₁ × Number₂ = HCF × LCM\n${n1} × Number₂ = ${h} × ${l} = ${h * l}\nNumber₂ = ${h * l} / ${n1} = ${n2}.`;
      break;
    }

    case 'probability': {
      subtopic = 'Balls from Urn';
      const red = randInt(3, 7);
      const blue = randInt(4, 8);
      const total = red + blue;
      const g = gcd(red, total);
      const redProb = `${red / g}/${total / g}`;
      questionText = `A bag contains ${red} red balls and ${blue} blue balls. If one ball is drawn at random, what is the probability that it is red?`;
      correctVal = redProb;
      const blueProb = `${blue / g}/${total / g}`;
      distractors = [blueProb, `${red}/${blue}`, `1/2`];
      explanation = `Total possible outcomes = Number of red balls + Number of blue balls = ${red} + ${blue} = ${total}.\nFavourable outcomes (getting red) = ${red}.\nProbability = Favourable / Total = ${red}/${total} = ${redProb}.`;
      break;
    }

    case 'quadratic-equations': {
      subtopic = 'Roots Calculation';
      const r1 = randInt(2, 6);
      const r2 = randInt(3, 7);
      const bCoeff = -(r1 + r2);
      const cCoeff = r1 * r2;
      const signB = bCoeff < 0 ? `- ${Math.abs(bCoeff)}` : `+ ${bCoeff}`;
      questionText = `Find the roots of the quadratic equation: x² ${signB}x + ${cCoeff} = 0`;
      correctVal = `x = ${r1}, ${r2}`;
      distractors = [`x = ${-r1}, ${-r2}`, `x = ${r1}, ${-r2}`, `x = ${r1 + 1}, ${r2 - 1}`];
      explanation = `Given equation: x² ${signB}x + ${cCoeff} = 0.\nFactoring: (x - ${r1})(x - ${r2}) = 0.\nTherefore, x - ${r1} = 0 => x = ${r1}, or x - ${r2} = 0 => x = ${r2}.\nThe roots are ${r1} and ${r2}.`;
      break;
    }

    default: {
      // General quantitative question generator for other 15 topics
      const n1 = randInt(15, 60);
      const n2 = randInt(4, 12);
      const result = n1 * n2;
      questionText = `In a ${topic.name.toLowerCase()} evaluation, if variable P = ${n1} and scaling factor Q = ${n2}, what is the product P × Q?`;
      correctVal = `${result}`;
      distractors = [`${result + n2}`, `${result - n1}`, `${result + 10}`];
      explanation = `Calculation: P × Q = ${n1} × ${n2} = ${result}.`;
      break;
    }
  }

  const { options, correctIndex } = shuffleOptions(correctVal, distractors);

  return {
    id,
    topicId,
    topicName: topic.name,
    category: 'quantitative',
    subtopic,
    difficulty,
    questionText,
    options,
    correctOption: correctIndex,
    explanation,
    tags: [topic.name, difficulty, subtopic],
    status: 'active',
    createdAt: now,
    updatedAt: now
  };
}

// Map of procedural question builders for Logical Reasoning topics
export function generateLogicalQuestion(topicId: string, difficulty: DifficultyLevel, indexSeed: number): Question | null {
  const topic = TOPIC_BY_ID.get(topicId);
  if (!topic || topic.category !== 'logical') return null;

  const id = `q-${topicId}-${difficulty.toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  let questionText = '';
  let correctVal = '';
  let distractors: string[] = [];
  let explanation = '';
  let subtopic = topic.subtopics[0] || 'Deductive Logic';

  switch (topicId) {
    case 'number-series': {
      subtopic = 'Difference Patterns';
      const step = pickRandom([3, 4, 5, 7, 8, 9]);
      const start = randInt(4, 25);
      const s = [start, start + step, start + 2 * step, start + 3 * step, start + 4 * step];
      const nextNum = start + 5 * step;
      questionText = `Identify the missing number in the series:\n${s.join(', ')}, ?`;
      correctVal = `${nextNum}`;
      distractors = [`${nextNum + step}`, `${nextNum - 2}`, `${nextNum + 2 * step}`];
      explanation = `Pattern: The sequence increases by a constant common difference of +${step}.\n${s[0]} + ${step} = ${s[1]}\n${s[1]} + ${step} = ${s[2]}\n${s[2]} + ${step} = ${s[3]}\n${s[3]} + ${step} = ${s[4]}\nNext term = ${s[4]} + ${step} = ${nextNum}.`;
      break;
    }

    case 'direction-sense': {
      subtopic = 'Pythagoras Displacement';
      const distNorth = pickRandom([6, 9, 12, 15]);
      const distEast = pickRandom([8, 12, 16, 20]);
      const hyp = Math.round(Math.sqrt(distNorth * distNorth + distEast * distEast));
      questionText = `Rohan walks ${distNorth} km towards North. He then turns right and walks ${distEast} km towards East. What is the shortest distance between his starting point and ending point?`;
      correctVal = `${hyp} km`;
      distractors = [`${distNorth + distEast} km`, `${hyp + 2} km`, `${Math.max(2, hyp - 3)} km`];
      explanation = `By Pythagoras Theorem:\nShortest distance = √(North² + East²)\n= √(${distNorth}² + ${distEast}²)\n= √(${distNorth * distNorth} + ${distEast * distEast}) = √(${distNorth * distNorth + distEast * distEast}) = ${hyp} km.`;
      break;
    }

    case 'blood-relations': {
      subtopic = 'Family Tree Diagrams';
      const names = [
        { subject: 'Rahul', relative: 'Anjali', relation: 'Brother', exp: 'Rahul is Anjali’s brother' },
        { subject: 'Priya', relative: 'Kavita', relation: 'Mother', exp: 'Priya is Kavita’s mother' },
        { subject: 'David', relative: 'Mark', relation: 'Uncle', exp: 'David is Mark’s father’s brother, making him Mark’s uncle' }
      ];
      const item = pickRandom(names);
      questionText = `Pointing towards a photograph, ${item.subject} says, "She/He is the only child of my mother's husband." How is the person in the photograph related to ${item.subject}?`;
      correctVal = `Himself/Herself`;
      distractors = ['Brother', 'Father', 'Cousin'];
      explanation = `Breakdown:\n1. "Mother's husband" = Father.\n2. "Only child of my father" = The person himself/herself.\nTherefore, the person in the portrait is himself/herself.`;
      break;
    }

    case 'ranking-and-ordering': {
      subtopic = 'Total in Row Formula';
      const left = randInt(8, 25);
      const right = randInt(10, 30);
      const total = left + right - 1;
      questionText = `In a row of students, Priya ranks ${left}th from the left end and ${right}th from the right end. How many students are there in total in the row?`;
      correctVal = `${total}`;
      distractors = [`${total + 1}`, `${total - 1}`, `${left + right}`];
      explanation = `Formula: Total = (Rank from Left + Rank from Right) - 1\nTotal = (${left} + ${right}) - 1 = ${left + right} - 1 = ${total}.\nWe subtract 1 because Priya is counted twice (once from each end).`;
      break;
    }

    case 'clock': {
      subtopic = 'Angle Formula |30H - 11/2 M|';
      const hour = pickRandom([2, 3, 4, 7, 8, 9]);
      const minute = pickRandom([0, 10, 20, 30, 40]);
      const angle = Math.abs(30 * hour - 5.5 * minute);
      const formattedAngle = angle > 180 ? 360 - angle : angle;
      questionText = `Find the angle between the hour hand and the minute hand of a clock at ${hour}:${minute === 0 ? '00' : minute}.`;
      correctVal = `${formattedAngle}°`;
      distractors = [`${(formattedAngle + 15) % 180}°`, `${Math.abs(formattedAngle - 20)}°`, `90°`];
      explanation = `Formula: Angle θ = |30H - (11/2)M|\nGiven H = ${hour}, M = ${minute}.\nθ = |30(${hour}) - (11/2)(${minute})| = |${30 * hour} - ${(5.5 * minute).toFixed(1)}| = ${angle}°.\nReflex adjustment if > 180° gives ${formattedAngle}°.`;
      break;
    }

    case 'calendar': {
      subtopic = 'Odd Days Calculation';
      questionText = `If today is Monday, what day of the week will it be after 61 days?`;
      correctVal = `Saturday`;
      distractors = ['Friday', 'Sunday', 'Tuesday'];
      explanation = `Every 7 days the day of the week repeats.\n61 ÷ 7 = 8 weeks with a remainder of 5 odd days.\nCounting 5 days ahead from Monday:\nMonday + 5 days = Saturday.`;
      break;
    }

    case 'syllogism': {
      subtopic = 'Universal Affirmative';
      questionText = `Statements:\n1. All cats are animals.\n2. All animals need water.\nConclusions:\nI. All cats need water.\nII. Some animals are cats.`;
      correctVal = `Both I and II follow`;
      distractors = ['Only Conclusion I follows', 'Only Conclusion II follows', 'Neither follows'];
      explanation = `From statement 1 and 2, Cats ⊆ Animals ⊆ Need Water.\nConclusion I: Cats ⊆ Need Water holds true.\nConclusion II: Since Cats ⊆ Animals, at least some animals are cats holds true.\nHence, Both I and II logically follow.`;
      break;
    }

    default: {
      const codeWord = pickRandom(['LEMON', 'RIVER', 'SMART', 'CLOUD']);
      questionText = `In a certain code language, if 'APPLE' is coded as 'BQQMF' (+1 to each letter), how is '${codeWord}' coded in that same system?`;
      const shifted = codeWord.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 1)).join('');
      correctVal = shifted;
      distractors = [
        codeWord.split('').map(c => String.fromCharCode(c.charCodeAt(0) - 1)).join(''),
        codeWord.slice(1) + codeWord[0],
        shifted.slice(0, -1) + 'Z'
      ];
      explanation = `Pattern: Each letter is replaced by the immediate next letter in the English alphabet (+1 positional shift).\nTherefore, ${codeWord} becomes ${shifted}.`;
      break;
    }
  }

  const { options, correctIndex } = shuffleOptions(correctVal, distractors);

  return {
    id,
    topicId,
    topicName: topic.name,
    category: 'logical',
    subtopic,
    difficulty,
    questionText,
    options,
    correctOption: correctIndex,
    explanation,
    tags: [topic.name, difficulty, subtopic],
    status: 'active',
    createdAt: now,
    updatedAt: now
  };
}

// Map of procedural question builders for Verbal Ability topics
export function generateVerbalQuestion(topicId: string, difficulty: DifficultyLevel, indexSeed: number): Question | null {
  const topic = TOPIC_BY_ID.get(topicId);
  if (!topic || topic.category !== 'verbal') return null;

  const id = `q-${topicId}-${difficulty.toLowerCase()}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  let questionText = '';
  let correctVal = '';
  let distractors: string[] = [];
  let explanation = '';
  let subtopic = topic.subtopics[0] || 'Verbal Reasoning';

  switch (topicId) {
    case 'synonyms': {
      subtopic = 'Academic Word List';
      const items = [
        { word: 'CANDID', syn: 'Frank', dist: ['Secretive', 'Deceptive', 'Hesitant'], def: 'Candid means truthful and straightforward; frank.' },
        { word: 'METICULOUS', syn: 'Thorough', dist: ['Careless', 'Hasty', 'Vague'], def: 'Meticulous means showing great attention to detail; very careful and precise.' },
        { word: 'EPHEMERAL', syn: 'Transient', dist: ['Eternal', 'Permanent', 'Enduring'], def: 'Ephemeral means lasting for a very short time; transient.' },
        { word: 'LACONIC', syn: 'Concise', dist: ['Verbose', 'Loquacious', 'Lengthy'], def: 'Laconic means using very few words; concise.' },
        { word: 'PRAGMATIC', syn: 'Practical', dist: ['Idealistic', 'Impractical', 'Theoretical'], def: 'Pragmatic means dealing with things sensibly and realistically based on practical rather than theoretical considerations.' }
      ];
      const item = pickRandom(items);
      questionText = `Choose the word that is most nearly similar in meaning to:\n${item.word}`;
      correctVal = item.syn;
      distractors = item.dist;
      explanation = `Definition: ${item.def}\nTherefore, the closest synonym is "${item.syn}".`;
      break;
    }

    case 'antonyms': {
      subtopic = 'Polar Opposites';
      const items = [
        { word: 'METICULOUS', ant: 'Careless', dist: ['Diligent', 'Detailed', 'Precise'], def: 'Meticulous means very careful and precise. The opposite is Careless.' },
        { word: 'OBSOLETE', ant: 'Contemporary', dist: ['Outdated', 'Antique', 'Ancient'], def: 'Obsolete means no longer produced or used; out of date. The opposite is Contemporary (modern).' },
        { word: 'ALTRUISTIC', ant: 'Selfish', dist: ['Generous', 'Benevolent', 'Philanthropic'], def: 'Altruistic means showing selfless concern for the well-being of others. The direct antonym is Selfish.' },
        { word: 'AFFLUENT', ant: 'Destitute', dist: ['Wealthy', 'Opulent', 'Prosperous'], def: 'Affluent means having a great deal of money; wealthy. The opposite is Destitute (extremely poor).' }
      ];
      const item = pickRandom(items);
      questionText = `Choose the word that is most nearly opposite in meaning to:\n${item.word}`;
      correctVal = item.ant;
      distractors = item.dist;
      explanation = `Explanation: ${item.def}\nHence, the correct antonym is "${item.ant}".`;
      break;
    }

    case 'one-word-substitution': {
      subtopic = 'Person Types & Occupations';
      const items = [
        { def: 'A person who loves and collects books', word: 'Bibliophile', dist: ['Philatelist', 'Numismatist', 'Polyglot'] },
        { def: 'One who does not believe in the existence of God', word: 'Atheist', dist: ['Agnostic', 'Theist', 'Fanatic'] },
        { def: 'A person who speaks many languages', word: 'Polyglot', dist: ['Linguist', 'Orator', 'Philologist'] },
        { def: 'An extreme fear of confined or enclosed spaces', word: 'Claustrophobia', dist: ['Acrophobia', 'Hydrophobia', 'Agoraphobia'] }
      ];
      const item = pickRandom(items);
      questionText = `Select the single word that best substitutes the given phrase:\n"${item.def}"`;
      correctVal = item.word;
      distractors = item.dist;
      explanation = `"${item.word}" specifically denotes ${item.def.toLowerCase()}.\n(Note: A Philatelist collects stamps; a Numismatist collects coins).`;
      break;
    }

    case 'error-detection': {
      subtopic = 'Subject-Verb Agreement';
      questionText = `Identify the part of the sentence containing an error:\n(A) Neither the principal / (B) nor the teachers / (C) was present at / (D) the annual meeting.`;
      correctVal = '(C) was present at';
      distractors = ['(A) Neither the principal', '(B) nor the teachers', '(D) the annual meeting'];
      explanation = `Grammar Rule: When two subjects are connected by 'neither... nor', the verb agrees with the subject closest to it.\nHere, the closest subject is 'the teachers' (plural), so the verb should be plural 'were present', not 'was present'.`;
      break;
    }

    case 'active-and-passive-voice': {
      subtopic = 'Tense Transformations';
      questionText = `Convert the following active sentence into passive voice:\n"The chef prepared a delectable five-course meal."`;
      correctVal = 'A delectable five-course meal was prepared by the chef.';
      distractors = [
        'A delectable five-course meal is prepared by the chef.',
        'A delectable five-course meal has been prepared by the chef.',
        'A delectable five-course meal had prepared by the chef.'
      ];
      explanation = `Rule for Simple Past Active to Passive:\nActive: Subject + V2 + Object\nPassive: Object + was/were + V3 + by + Subject.\n"prepared" (past) becomes "was prepared".`;
      break;
    }

    default: {
      questionText = `Select the most appropriate word to fill in the blank:\n"Despite facing overwhelming odds, the team displayed remarkable ________ and achieved victory."`;
      correctVal = 'resilience';
      distractors = ['reluctance', 'complacency', 'apathy'];
      explanation = `'Resilience' means the capacity to recover quickly from difficulties. In the context of "despite facing overwhelming odds", resilience provides the logically correct positive attribute.`;
      break;
    }
  }

  const { options, correctIndex } = shuffleOptions(correctVal, distractors);

  return {
    id,
    topicId,
    topicName: topic.name,
    category: 'verbal',
    subtopic,
    difficulty,
    questionText,
    options,
    correctOption: correctIndex,
    explanation,
    tags: [topic.name, difficulty, subtopic],
    status: 'active',
    createdAt: now,
    updatedAt: now
  };
}

// Master generator dispatching by topic category
export function generateQuestionForTopic(topicId: string, difficulty: DifficultyLevel = 'Medium', index: number = 0): Question | null {
  const topic = TOPIC_BY_ID.get(topicId);
  if (!topic) return null;
  if (topic.category === 'quantitative') {
    return generateQuantQuestion(topicId, difficulty, index);
  } else if (topic.category === 'logical') {
    return generateLogicalQuestion(topicId, difficulty, index);
  } else {
    return generateVerbalQuestion(topicId, difficulty, index);
  }
}
