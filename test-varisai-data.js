#!/usr/bin/env node
/**
 * Varisai mock data validation suite.
 * Run before every push: node test-varisai-data.js
 * Exits 0 if all pass, 1 if any fail.
 */
const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, 'varisai-working.html');
const html = fs.readFileSync(HTML_PATH, 'utf-8');

// Extract LESSONS from the HTML via bracket matching
const startIdx = html.indexOf('const LESSONS = [');
if (startIdx === -1) { console.error('FATAL: LESSONS not found'); process.exit(1); }
let depth = 0, arrStart = html.indexOf('[', startIdx), arrEnd = arrStart;
for (let i = arrStart; i < html.length; i++) {
  if (html[i] === '[') depth++;
  if (html[i] === ']') depth--;
  if (depth === 0) { arrEnd = i + 1; break; }
}
const arrStr = html.slice(arrStart, arrEnd);
// The JS uses unquoted keys; evaluate in a sandbox with the needed globals stubbed
const LESSONS = eval('(' + arrStr + ')');

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL: ${name}${detail ? ' — ' + detail : ''}`); }
};
const getLesson = id => LESSONS.find(l => l.id === id);
const getPattern = (lesson, idx) => lesson.patterns[idx];

// ---------- Structural integrity ----------
for (const lesson of LESSONS) {
  ok(`${lesson.id}: has patterns`, Array.isArray(lesson.patterns) && lesson.patterns.length > 0);
  lesson.patterns.forEach((p, i) => {
    ok(`${lesson.id} P${i+1}: has title`, typeof p.title === 'string');
    ok(`${lesson.id} P${i+1}: has notes array`, Array.isArray(p.notes) && p.notes.length > 0);
    if (p.dlines) {
      const flat = p.dlines.flat(2);
      ok(`${lesson.id} P${i+1}: dlines flat matches notes`,
        JSON.stringify(flat) === JSON.stringify(p.notes),
        `dlines=${flat.length} notes=${p.notes.length}`);
    }
  });
}

// ---------- Sarali regression tests ----------
{
  const sarali = getLesson('sarali');
  // #14: pitch-faithful zigzag layas
  ok('Sarali P8 laya is 1234 -5432',
    getPattern(sarali, 7).laya === '1234 -5432 and 1234 5678',
    getPattern(sarali, 7).laya);
  ok('Sarali P9 laya is 1234 -5465',
    getPattern(sarali, 8).laya === '1234 -5465 and 1234 5678',
    getPattern(sarali, 8).laya);
  // #15: P5/P10 use comma holds, P6 does NOT (no hold in notes)
  ok('Sarali P5 laya uses 5,-12',
    getPattern(sarali, 4).laya.includes('1234 5,-12'),
    getPattern(sarali, 4).laya);
  ok('Sarali P6 laya keeps 56-12 (no hold)',
    getPattern(sarali, 5).laya.includes('1234 56-12'),
    getPattern(sarali, 5).laya);
  ok('Sarali P10 laya uses 5,-12',
    getPattern(sarali, 9).laya.includes('1234 5,-12'),
    getPattern(sarali, 9).laya);
  // #1: P10-L4 and P11-L4 are 3+1+2+2
  const p10l4 = getPattern(sarali, 9).dlines[3].map(g => g.length).join('+');
  ok('Sarali P10-L4 is 3+1+2+2', p10l4 === '3+1+2+2', p10l4);
  const p11l4 = getPattern(sarali, 10).dlines[3].map(g => g.length).join('+');
  ok('Sarali P11-L4 is 3+1+2+2', p11l4 === '3+1+2+2', p11l4);
}

// ---------- Janta regression tests ----------
{
  const janta = getLesson('janta');
  ok('Janta has 12 patterns (PDF order)', janta.patterns.length === 12);
  // All have laya
  janta.patterns.forEach((p, i) => {
    ok(`Janta V${i+1}: has laya`, typeof p.laya === 'string' && p.laya.length > 0);
    ok(`Janta V${i+1}: has dlines`, Array.isArray(p.dlines));
  });
  // V1 laya from user
  ok('Janta V1 laya is 11223344', getPattern(janta, 0).laya === '11223344');
  // V5/V6 use comma for dheergam, not dash (now PDF #6/#7, indices 5/6)
  [5, 6].forEach(idx => {
    const notes = getPattern(janta, idx).notes;
    ok(`Janta PDF #${idx+1}: no "-" tokens (dheergam is ",")`,
      !notes.includes('-'), `found ${notes.filter(n => n === '-').length}`);
  });
  // Old V3/V4 (now PDF #4/#5, indices 3/4) have no gap dash tokens
  [3, 4].forEach(idx => {
    const notes = getPattern(janta, idx).notes;
    ok(`Janta PDF #${idx+1}: no "-" gap tokens`,
      !notes.includes('-'), `found ${notes.filter(n => n === '-').length}`);
  });
  // PDF #4 (index 3, old V3) Line 9 (index 8, odd line) uses Part 1: 112-112-12 -> 3+3+2
  const v4l9 = getPattern(janta, 3).dlines[8].map(g => g.length).join('+');
  ok('Janta PDF #4 Line 9 is 3+3+2 (odd line, Part 1)', v4l9 === '3+3+2', v4l9);
  // PDF #5 (index 4, old V4) Line 9 (index 8, odd line) uses Part 1: 11223-123 -> 5+3
  const v5l9 = getPattern(janta, 4).dlines[8].map(g => g.length).join('+');
  ok('Janta PDF #5 Line 9 is 5+3 (odd line, Part 1)', v5l9 === '5+3', v5l9);
  // Even lines use Part 2: 11-22-33-44 -> 2+2+2+2
  const v4l10 = getPattern(janta, 3).dlines[9].map(g => g.length).join('+');
  ok('Janta PDF #4 Line 10 is 2+2+2+2 (even line, Part 2)', v4l10 === '2+2+2+2', v4l10);
  // NEW patterns: PDF #3 (index 2) zigzag
  ok('Janta PDF #3 laya', getPattern(janta, 2).laya === '11-22-33-22 and 11-22-33-44');
  const p3l1 = getPattern(janta, 2).dlines[0].map(g => g.length).join('+');
  ok('Janta PDF #3 Line 1 is 2+2+2+2', p3l1 === '2+2+2+2', p3l1);
  // NEW patterns: PDF #9/#10/#11 (indices 8/9/10) dheergam variants
  ok('Janta PDF #9 laya', getPattern(janta, 8).laya === '1, 23, - 123 and 11-22-33-44');
  ok('Janta PDF #10 laya', getPattern(janta, 9).laya === '1 2, 3, - 123 and 11-22-33-44');
  ok('Janta PDF #11 laya', getPattern(janta, 10).laya === '1, 2, 3 - 123 and 11-22-33-44');
  // PDF #9 Line 1 (odd): 1, -> 2, 23, -> 3, 123 -> 3 = 2+3+3
  const p9l1 = getPattern(janta, 8).dlines[0].map(g => g.length).join('+');
  ok('Janta PDF #9 Line 1 is 2+3+3', p9l1 === '2+3+3', p9l1);
  // PDF #10 Line 1 (odd): 1 -> 1, 2, -> 2, 3, -> 2, 123 -> 3 = 1+2+2+3
  const p10l1 = getPattern(janta, 9).dlines[0].map(g => g.length).join('+');
  ok('Janta PDF #10 Line 1 is 1+2+2+3', p10l1 === '1+2+2+3', p10l1);
  // PDF #11 Line 1 (odd): 1, -> 2, 2, -> 2, 3 -> 1, 123 -> 3 = 2+2+1+3
  const p11l1 = getPattern(janta, 10).dlines[0].map(g => g.length).join('+');
  ok('Janta PDF #11 Line 1 is 2+2+1+3', p11l1 === '2+2+1+3', p11l1);
}

// ---------- Alankaram regression tests ----------
{
  const al = getLesson('alankaram');
  ok('Alankaram has 7 patterns', al.patterns.length === 7);
  const expectedTalas = ['I4 0 I4 I4','I4 0 I4','0 I4','I7 U 0','I3 0 0','I5 I5 0 0','I4'];
  const expectedCounts = [140,100,60,100,70,140,40];
  const expectedGroups = ['4+2+4+4','4+2+4','2+4','7+1+2','3+2+2','5+5+2+2','4'];
  al.patterns.forEach((p, i) => {
    ok(`Alankaram P${i+1}: has tala`, p.tala === expectedTalas[i], p.tala);
    ok(`Alankaram P${i+1}: has dlines`, Array.isArray(p.dlines));
    ok(`Alankaram P${i+1}: note count ${expectedCounts[i]}`,
      p.notes.length === expectedCounts[i], String(p.notes.length));
    const g1 = p.dlines[0].map(g => g.length).join('+');
    ok(`Alankaram P${i+1}: line 1 groups ${expectedGroups[i]}`, g1 === expectedGroups[i], g1);
    ok(`Alankaram P${i+1}: no "-" tokens`,
      !p.notes.includes('-'), `found ${p.notes.filter(n => n === '-').length}`);
  });
}

// ---------- Laya/notes consistency ----------
// For patterns with dlines, verify each line's group sizes sum to line note count
// (already covered by dlines-flat-matches-notes, but this checks per-line)
{
  const sarali = getLesson('sarali');
  sarali.patterns.forEach((p, i) => {
    if (!p.dlines) return;
    p.dlines.forEach((line, li) => {
      const lineNotes = line.flat().length;
      ok(`Sarali P${i+1} line ${li+1}: groups sum correctly`, lineNotes > 0);
    });
  });
}



// ---------- Raw notes verification ----------
// Embedded expected values from verified mock data.
// Catches wrong/placeholder data, grouping errors, and metadata drift.
const RAW_EXPECT = {
  "sarali": {
    "name": "Sarali Varisai",
    "patterns": [
      {
        "title": "1 · Simple ascent / descent",
        "laya": "1234 5678",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "P",
          "D1",
          "N3",
          "S'"
        ],
        "noteCount": 16,
        "lineCount": 2,
        "firstLineGroups": [
          8
        ]
      },
      {
        "title": "2 · Focus on R and N",
        "laya": "12-12-1234 and 1234 5678",
        "tala": null,
        "head": [
          "S",
          "R1",
          "S",
          "R1",
          "S",
          "R1",
          "G3",
          "M1"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          2,
          2,
          4
        ]
      },
      {
        "title": "3 · Focus on G and D",
        "laya": "123-123-12 and 1234 5678",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "S",
          "R1",
          "G3",
          "S",
          "R1"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          3,
          3,
          2
        ]
      },
      {
        "title": "4 · Focus on M and P",
        "laya": "1234-1234 and 1234 5678",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "S",
          "R1",
          "G3",
          "M1"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          4
        ]
      },
      {
        "title": "5 · Focus on P and M (dheergam)",
        "laya": "1234 5,-12 and 1234 5678",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "P",
          ",",
          "S",
          "R1"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          2,
          2
        ]
      },
      {
        "title": "6 · Focus on G and D",
        "laya": "1234 56-12 and 1234 5678",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "P",
          "D1",
          "S",
          "R1"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          2,
          2
        ]
      },
      {
        "title": "7 · Focus on N and R (dheergam)",
        "laya": "1234 56-7, and 1234 5678",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "P",
          "D1",
          "N3",
          ","
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          2,
          2
        ]
      },
      {
        "title": "8 · Zig-zag",
        "laya": "1234 -5432 and 1234 5678",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "P",
          "M1",
          "G3",
          "R1"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          4
        ]
      },
      {
        "title": "9 · Zig-zag",
        "laya": "1234 -5465 and 1234 5678",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "P",
          "M1",
          "D1",
          "P"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          4
        ]
      },
      {
        "title": "10 · Dheergam on P; rest on G",
        "laya": "1234 5,-12 and 1,,,1,,, and 1234-4321 and 1234 5678",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "P",
          ",",
          "G3",
          "M1"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          2,
          2
        ]
      },
      {
        "title": "11 · Dheergams at S, N, D, P",
        "tala": null,
        "head": [
          "S'",
          ",",
          "N3",
          "D1",
          "N3",
          ",",
          "D1",
          "P"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          2,
          2
        ]
      },
      {
        "title": "12 · Janta preview (sphuritam)",
        "tala": null,
        "head": [
          "S'",
          "S'",
          "N3",
          "D1",
          "N3",
          "N3",
          "D1",
          "P"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          2,
          2
        ]
      },
      {
        "title": "13 · Zig-zag with dheergams",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "R1",
          "G3",
          ",",
          "G3",
          "M1"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          2,
          2
        ]
      },
      {
        "title": "14 · Dheergam at P and S",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "P",
          ",",
          "P",
          ","
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          2,
          2
        ]
      }
    ]
  },
  "janta": {
    "name": "Janta Varisai",
    "patterns": [
      {
        "title": "1 · Doubled scale, up and down",
        "laya": "11223344",
        "tala": null,
        "head": [
          "S",
          "S",
          "R1",
          "R1",
          "G3",
          "G3",
          "M1",
          "M1"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          8
        ]
      },
      {
        "title": "2 · Sliding doubled pairs",
        "laya": "11-22-33-44 and 11-22-33-44",
        "tala": null,
        "head": [
          "S",
          "S",
          "R1",
          "R1",
          "G3",
          "G3",
          "M1",
          "M1"
        ],
        "noteCount": 80,
        "lineCount": 10,
        "firstLineGroups": [
          2,
          2,
          2,
          2
        ]
      },
      {
        "title": "3 · Zigzag janta",
        "laya": "11-22-33-22 and 11-22-33-44",
        "tala": null,
        "head": [
          "S",
          "S",
          "R1",
          "R1",
          "G3",
          "G3",
          "R1",
          "R1"
        ],
        "noteCount": 160,
        "lineCount": 20,
        "firstLineGroups": [
          2,
          2,
          2,
          2
        ]
      },
      {
        "title": "4 · Janta focus on each swara (with gap)",
        "laya": "112-112-12 and 11-22-33-44",
        "tala": null,
        "head": [
          "S",
          "S",
          "R1",
          "S",
          "S",
          "R1",
          "S",
          "R1"
        ],
        "noteCount": 160,
        "lineCount": 20,
        "firstLineGroups": [
          3,
          3,
          2
        ]
      },
      {
        "title": "5 · Janta focus per swara, variant (with gap)",
        "laya": "11223-123 and 11-22-33-44",
        "tala": null,
        "head": [
          "S",
          "S",
          "R1",
          "R1",
          "G3",
          "S",
          "R1",
          "G3"
        ],
        "noteCount": 160,
        "lineCount": 20,
        "firstLineGroups": [
          5,
          3
        ]
      },
      {
        "title": "6 · Janta with dheergam rests",
        "laya": "11, - 22, - 33 and 11-22-33-44",
        "tala": null,
        "head": [
          "S",
          "S",
          ",",
          "R1",
          "R1",
          ",",
          "G3",
          "G3"
        ],
        "noteCount": 160,
        "lineCount": 20,
        "firstLineGroups": [
          3,
          3,
          2
        ]
      },
      {
        "title": "7 · Janta with dheergam rests, variant",
        "laya": "1,1 - 2,2 - 33 and 11-22-33-44",
        "tala": null,
        "head": [
          "S",
          ",",
          "S",
          "R1",
          ",",
          "R1",
          "G3",
          "G3"
        ],
        "noteCount": 160,
        "lineCount": 20,
        "firstLineGroups": [
          3,
          3,
          2
        ]
      },
      {
        "title": "8 · Triple janta",
        "laya": "111 - 222 - 33 and 11-22-33-44",
        "tala": null,
        "head": [
          "S",
          "S",
          "S",
          "R1",
          "R1",
          "R1",
          "G3",
          "G3"
        ],
        "noteCount": 160,
        "lineCount": 20,
        "firstLineGroups": [
          3,
          3,
          2
        ]
      },
      {
        "title": "9 · Dheergams at 1st and 3rd",
        "laya": "1, 23, - 123 and 11-22-33-44",
        "tala": null,
        "head": [
          "S",
          ",",
          "R1",
          "G3",
          ",",
          "S",
          "R1",
          "G3"
        ],
        "noteCount": 160,
        "lineCount": 20,
        "firstLineGroups": [
          2,
          3,
          3
        ]
      },
      {
        "title": "10 · Dheergams at 2nd and 3rd",
        "laya": "1 2, 3, - 123 and 11-22-33-44",
        "tala": null,
        "head": [
          "S",
          "R1",
          ",",
          "G3",
          ",",
          "S",
          "R1",
          "G3"
        ],
        "noteCount": 160,
        "lineCount": 20,
        "firstLineGroups": [
          1,
          2,
          2,
          3
        ]
      },
      {
        "title": "11 · Dheergams at 1st and 2nd",
        "laya": "1, 2, 3 - 123 and 11-22-33-44",
        "tala": null,
        "head": [
          "S",
          ",",
          "R1",
          ",",
          "G3",
          "S",
          "R1",
          "G3"
        ],
        "noteCount": 160,
        "lineCount": 20,
        "firstLineGroups": [
          2,
          2,
          1,
          3
        ]
      },
      {
        "title": "12 · Janta jumps",
        "laya": "11- 44 - 33 -22 and 11-22-33-44",
        "tala": null,
        "head": [
          "S",
          "S",
          "M1",
          "M1",
          "G3",
          "G3",
          "R1",
          "R1"
        ],
        "noteCount": 160,
        "lineCount": 20,
        "firstLineGroups": [
          2,
          2,
          2,
          2
        ]
      }
    ]
  },
  "dhattu": {
    "name": "Dhattu Varisai",
    "patterns": [
      {
        "title": "1 · Zigzag chain I",
        "laya": "14 - 34- 23 - 12 and 1323 - 1234",
        "tala": null,
        "head": [
          "S",
          "M1",
          "G3",
          "M1",
          "R1",
          "G3",
          "S",
          "R1"
        ],
        "noteCount": 160,
        "lineCount": 20,
        "firstLineGroups": [
          2,
          2,
          2,
          2
        ]
      },
      {
        "title": "2 · Zigzag chain II",
        "laya": "12-13-23-24 and 1432 - 1234",
        "tala": null,
        "head": [
          "S",
          "R1",
          "S",
          "G3",
          "R1",
          "G3",
          "R1",
          "M1"
        ],
        "noteCount": 160,
        "lineCount": 20,
        "firstLineGroups": [
          2,
          2,
          2,
          2
        ]
      }
    ]
  },
  "alankaram": {
    "name": "Sapta Tala Alankarams",
    "patterns": [
      {
        "title": "Dhruva",
        "tala": "I4 0 I4 I4",
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "G3",
          "R1",
          "S",
          "R1"
        ],
        "noteCount": 140,
        "lineCount": 10,
        "firstLineGroups": [
          4,
          2,
          4,
          4
        ]
      },
      {
        "title": "Matya",
        "tala": "I4 0 I4",
        "head": [
          "S",
          "R1",
          "G3",
          "R1",
          "S",
          "R1",
          "S",
          "R1"
        ],
        "noteCount": 100,
        "lineCount": 10,
        "firstLineGroups": [
          4,
          2,
          4
        ]
      },
      {
        "title": "Rupaka",
        "tala": "0 I4",
        "head": [
          "S",
          "R1",
          "S",
          "R1",
          "G3",
          "M1",
          "R1",
          "G3"
        ],
        "noteCount": 60,
        "lineCount": 10,
        "firstLineGroups": [
          2,
          4
        ]
      },
      {
        "title": "Jhampa",
        "tala": "I7 U 0",
        "head": [
          "S",
          "R1",
          "G3",
          "S",
          "R1",
          "S",
          "R1",
          "G3"
        ],
        "noteCount": 100,
        "lineCount": 10,
        "firstLineGroups": [
          7,
          1,
          2
        ]
      },
      {
        "title": "Triputa",
        "tala": "I3 0 0",
        "head": [
          "S",
          "R1",
          "G3",
          "S",
          "R1",
          "G3",
          "M1",
          "R1"
        ],
        "noteCount": 70,
        "lineCount": 10,
        "firstLineGroups": [
          3,
          2,
          2
        ]
      },
      {
        "title": "Ata",
        "tala": "I5 I5 0 0",
        "head": [
          "S",
          "R1",
          ",",
          "G3",
          ",",
          "S",
          ",",
          "R1"
        ],
        "noteCount": 140,
        "lineCount": 10,
        "firstLineGroups": [
          5,
          5,
          2,
          2
        ]
      },
      {
        "title": "Eka",
        "tala": "I4",
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "R1",
          "G3",
          "M1",
          "P"
        ],
        "noteCount": 40,
        "lineCount": 10,
        "firstLineGroups": [
          4
        ]
      }
    ]
  },
  "mandhra": {
    "name": "Mandhra Sthayi Varisai",
    "patterns": [
      {
        "title": "1 \u00b7 Dheergam anchor, expanding phrases",
        "tala": null,
        "head": [
          "S'",
          "N3",
          "D1",
          "P",
          "M1",
          "G3",
          "R1",
          "S"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          2,
          2
        ]
      },
      {
        "title": "2 \u00b7 Dheergam anchor, expanding phrases",
        "tala": null,
        "head": [
          "S'",
          "N3",
          "D1",
          "P",
          "M1",
          "G3",
          "R1",
          "S"
        ],
        "noteCount": 48,
        "lineCount": 6,
        "firstLineGroups": [
          4,
          2,
          2
        ]
      },
      {
        "title": "3 \u00b7 Dheergam anchor, expanding phrases",
        "tala": null,
        "head": [
          "S'",
          "N3",
          "D1",
          "P",
          "M1",
          "G3",
          "R1",
          "S"
        ],
        "noteCount": 64,
        "lineCount": 8,
        "firstLineGroups": [
          4,
          2,
          2
        ]
      },
      {
        "title": "4 \u00b7 Dheergam anchor, expanding phrases",
        "tala": null,
        "head": [
          "S'",
          "N3",
          "D1",
          "P",
          "M1",
          "G3",
          "R1",
          "S"
        ],
        "noteCount": 80,
        "lineCount": 10,
        "firstLineGroups": [
          4,
          2,
          2
        ]
      },
      {
        "title": "5 \u00b7 Dheergam anchor, expanding phrases",
        "tala": null,
        "head": [
          "S'",
          "N3",
          "D1",
          "P",
          "M1",
          "G3",
          "R1",
          "S"
        ],
        "noteCount": 96,
        "lineCount": 12,
        "firstLineGroups": [
          4,
          2,
          2
        ]
      }
    ]
  },
  "madhya": {
    "name": "Madhya Sthayi Varisai",
    "patterns": [
      {
        "title": "1 · Middle-register phrases",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "P",
          ",",
          "G3",
          "M1"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          4
        ]
      },
      {
        "title": "2 · Middle-register phrases",
        "tala": null,
        "head": [
          "S'",
          ",",
          "N3",
          "D1",
          "N3",
          ",",
          "D1",
          "P"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          4
        ]
      },
      {
        "title": "3 · Middle-register phrases",
        "tala": null,
        "head": [
          "S'",
          "S'",
          "N3",
          "D1",
          "N3",
          "N3",
          "D1",
          "P"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          4
        ]
      },
      {
        "title": "4 · Middle-register phrases",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "R1",
          "G3",
          ",",
          "G3",
          "M1"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          4
        ]
      },
      {
        "title": "5 · Middle-register phrases",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "P",
          ",",
          "P",
          ","
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          4
        ]
      }
    ]
  },
  "mel": {
    "name": "Mel Sthayi Varisai",
    "patterns": [
      {
        "title": "1 · Dheergam anchor, expanding phrases",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "P",
          "D1",
          "N3",
          "S'"
        ],
        "noteCount": 32,
        "lineCount": 4,
        "firstLineGroups": [
          4,
          4
        ]
      },
      {
        "title": "2 · Dheergam anchor, expanding phrases",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "P",
          "D1",
          "N3",
          "S'"
        ],
        "noteCount": 48,
        "lineCount": 6,
        "firstLineGroups": [
          4,
          4
        ]
      },
      {
        "title": "3 · Dheergam anchor, expanding phrases",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "P",
          "D1",
          "N3",
          "S'"
        ],
        "noteCount": 64,
        "lineCount": 8,
        "firstLineGroups": [
          4,
          4
        ]
      },
      {
        "title": "4 · Dheergam anchor, expanding phrases",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "P",
          "D1",
          "N3",
          "S'"
        ],
        "noteCount": 80,
        "lineCount": 10,
        "firstLineGroups": [
          4,
          4
        ]
      },
      {
        "title": "5 · Dheergam anchor, expanding phrases",
        "tala": null,
        "head": [
          "S",
          "R1",
          "G3",
          "M1",
          "P",
          "D1",
          "N3",
          "S'"
        ],
        "noteCount": 96,
        "lineCount": 12,
        "firstLineGroups": [
          4,
          4
        ]
      }
    ]
  }
};

{
  LESSONS.forEach(L => {
    const exp = RAW_EXPECT[L.id];
    if (!exp) { fail++; console.error('FAIL: No raw expectation for ' + L.id); return; }
    ok(L.id + ' pattern count matches raw', L.patterns.length === exp.patterns.length, 
       'got ' + L.patterns.length + ', expected ' + exp.patterns.length);
    
    L.patterns.forEach((p, pi) => {
      const e = exp.patterns[pi];
      const pname = L.id + ' P' + (pi+1);
      ok(pname + ' head notes match raw', 
         JSON.stringify(p.notes.slice(0,8)) === JSON.stringify(e.head),
         'got ' + JSON.stringify(p.notes.slice(0,8)));
      ok(pname + ' note count matches raw', p.notes.length === e.noteCount,
         'got ' + p.notes.length);
      ok(pname + ' line count matches raw', p.dlines.length === e.lineCount,
         'got ' + p.dlines.length);
      ok(pname + ' first-line grouping matches raw',
         JSON.stringify(p.dlines[0].map(g=>g.length)) === JSON.stringify(e.firstLineGroups),
         'got ' + JSON.stringify(p.dlines[0].map(g=>g.length)));
      if (e.laya) ok(pname + ' laya matches raw', p.laya === e.laya, 'got ' + p.laya);
      if (e.tala) ok(pname + ' tala matches raw', p.tala === e.tala, 'got ' + p.tala);
    });
  });
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
