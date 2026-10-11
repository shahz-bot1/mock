/* Swara Builder playground — shared core (raga data, audio, picker, helpers) */
"use strict";
const SB = (() => {
  const BUILD_VERSION = "2026.10.11-17";

  /* ---------- swara <-> pitch ---------- */
  const SEMI = { S:0, R1:1, R2:2, R3:2, G1:2, G2:3, G3:4, M1:5, M2:6,
                 P:7, D1:8, D2:9, D3:10, N1:9, N2:10, N3:11 };
  const CHROMATIC = ["S","R1","R2","R3","G1","G2","G3","M1","M2","P","D1","D2","D3","N1","N2","N3"];
  const SA_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

  /* Curated raga set (arohana / avarohana). Anchor-checked against standard lakshana. */
  const RAGAS = [
    { id:"mohanam",          name:"Mohanam",
      aro:["S","R2","G3","P","D2"],            ava:["S","D2","P","G3","R2"] },
    { id:"hamsadhvani",      name:"Hamsadhvani",
      aro:["S","R2","G3","P","N3"],            ava:["S","N3","P","G3","R2"] },
    { id:"shankarabharanam", name:"Shankarabharanam",
      aro:["S","R2","G3","M1","P","D2","N3"],  ava:["S","N3","D2","P","M1","G3","R2"] },
    { id:"kalyani",          name:"Kalyani",
      aro:["S","R2","G3","M2","P","D2","N3"],  ava:["S","N3","D2","P","M2","G3","R2"] },
    { id:"mayamalavagowla",  name:"Mayamalavagowla",
      aro:["S","R1","G3","M1","P","D1","N3"],  ava:["S","N3","D1","P","M1","G3","R1"] },
    { id:"hindolam",         name:"Hindolam",
      aro:["S","G2","M1","D1","N2"],           ava:["S","N2","D1","M1","G2"] },
    { id:"abhogi",           name:"Abhogi",
      aro:["S","R2","G2","M1","D2"],           ava:["S","D2","M1","G2","R2"] },
    { id:"bhairavi",         name:"Bhairavi",
      aro:["S","R2","G2","M1","P","D2","N2"],  ava:["S","N2","D1","P","M1","G2","R2"] },
    { id:"aanandabhairavi",  name:"Aananda Bhairavi",
      aro:["S","G2","R2","G2","M1","P","D2","P","N2"], ava:["S","N2","D2","P","M1","G2","R2"] },
  ]; // Aananda Bhairavi arohana/avarohana per srgm.info Geeta #11 (research 2026-10-11)
  const ragaById = id => RAGAS.find(r => r.id === id) || null;
  /* picker order: arohana order (dedup); full pitch set = union of aro+ava */
  const ragaPickerList = raga => {
    const seen = new Set(), out = [];
    raga.aro.forEach(s => { if (!seen.has(s)) { seen.add(s); out.push(s); } });
    return out;
  };

  /* slot model: {k:'empty'} | {k:'note', stack:[{st,oct}]} | {k:'hold'} | {k:'gap'} */
  const emptySlot = () => ({ k:"empty" });
  const shortLabel = st => st.replace(/[123]/g, "");
  const slotLabelHTML = slot => {
    if (slot.k === "hold") return ",";
    if (slot.k === "gap") return "–";
    if (slot.k !== "note" || !slot.stack.length) return "";
    return slot.stack.map(n => {
      if (n.hold) return `<span class="st">,</span>`;
      const cls = n.oct > 0 ? "oct-up" : n.oct < 0 ? "oct-dn" : "";
      const m = n.st.match(/^([A-Z])(\d?)$/);
      const inner = m ? m[1] + (m[2] ? "<sub>"+m[2]+"</sub>" : "") : n.st;
      return `<span class="st ${cls}">${inner}</span>`;
    }).join("");
  };

  /* ---------- audio ---------- */
  let actx = null;
  const activeNodes = [];
  function ensureAudio() {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
    return actx;
  }
  const FILE_NAMES = ["C","Cs","D","Ds","E","F","Fs","G","Gs","A","As","B"];
  const SAMPLE_FILES = ["C4","Cs4","D4","Ds4","E4","F4","G4","Gs4","A4","As4","B4","C5"].map(f => f + ".mp3");
  const sampleBufs = {};
  let samplesPromise = null;
  function ensureSamples(base) {
    ensureAudio();
    if (!samplesPromise) {
      samplesPromise = (async () => {
        await Promise.all(SAMPLE_FILES.map(async f => {
          const key = f;
          if (sampleBufs[key]) return;
          const res = await fetch(base + f);
          if (!res.ok) throw new Error("sample " + f);
          sampleBufs[key] = await actx.decodeAudioData(await res.arrayBuffer());
        }));
      })();
    }
    return samplesPromise;
  }
  /* nearest harmonium sample for a semitone offset above C4 */
  function sampleFor(semi) {
    const avail = [0,1,2,3,4,5,7,8,9,10,11,12]; // C4..C5 minus Fs4
    const baseSemi = ((semi % 12) + 12) % 12;
    const oct = 4 + Math.floor(semi / 12);
    let file = FILE_NAMES[baseSemi] + oct + ".mp3";
    let rate = 1;
    if (!avail.includes(semi) || file === "Fs4.mp3") {
      let best = avail[0], bestD = 99;
      avail.forEach(a => { const d = Math.abs(a - semi); if (d < bestD) { bestD = d; best = a; } });
      file = FILE_NAMES[best % 12] + (4 + Math.floor(best / 12)) + ".mp3";
      rate = Math.pow(2, (semi - best) / 12);
    }
    if (file === "Fs4.mp3") { file = "F4.mp3"; rate = Math.pow(2, 1 / 12); }
    return { file, rate };
  }
  function noteSemitone(st, oct, saOffset) {
    return SEMI[st] + oct * 12 + saOffset; // semitones above C4
  }
  function playNote(t, st, oct, saOffset, soundDur, vol) {
    const semi = noteSemitone(st, oct, saOffset);
    const { file, rate } = sampleFor(semi);
    const buf = sampleBufs[file];
    const v = vol == null ? 0.9 : vol;
    if (buf) {
      const src = actx.createBufferSource();
      src.buffer = buf; src.playbackRate.value = rate;
      // loop the sustain section so notes longer than the sample never go silent
      if (buf.duration && buf.duration > 1) {
        try {
          src.loop = true;
          src.loopStart = Math.min(0.5, buf.duration * 0.1);
          src.loopEnd = Math.max(src.loopStart + 0.2, buf.duration - 0.5);
        } catch (e) { /* ignore */ }
      }
      const g = actx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.02);
      g.gain.setValueAtTime(v, t + Math.max(0.02, soundDur - 0.1));
      g.gain.exponentialRampToValueAtTime(0.0001, t + soundDur + 0.12);
      src.connect(g); g.connect(actx.destination);
      src.start(t); src.stop(t + soundDur + 0.18);
      activeNodes.push(src);
      return true;
    }
    // synth fallback
    const f = 261.63 * Math.pow(2, semi / 12);
    const o = actx.createOscillator(); o.type = "triangle"; o.frequency.value = f;
    const g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.4, t + 0.03);
    g.gain.setValueAtTime(0.4, t + Math.max(0.03, soundDur - 0.08));
    g.gain.exponentialRampToValueAtTime(0.0001, t + soundDur + 0.1);
    o.connect(g); g.connect(actx.destination);
    o.start(t); o.stop(t + soundDur + 0.14);
    activeNodes.push(o);
    return false;
  }
  function stopAll() {
    activeNodes.forEach(n => { try { n.stop(); } catch (e) {} });
    activeNodes.length = 0;
  }

  /**
   * Play rows of 8-slot beats.
   * rows: array of {slots:[8 slots]}
   * opts: beatDur (s), saOffset, onSlot(row,slot,sub), onDone, loop
   * hold: extends previous sounding note through the beat; gap/empty: silence.
   * note stacks subdivide the beat equally; each sub-note rings a scaled legato tail.
   */
  function playRows(rows, opts) {
    ensureAudio();
    const { beatDur, saOffset } = opts;
    const t0 = actx.currentTime + 0.1;
    const timers = [];
    let slotIdx = 0, stopped = false;
    const flat = [];
    rows.forEach((row, r) => row.slots.forEach((s, i) => flat.push({ r, i, s })));
    const totalBeats = flat.length;

    // compute sounding events with hold-extension
    const events = []; // {beat, subs:[{st,oct}], soundBeats}
    let pending = null;
    const flushPending = () => { if (pending) { events.push(pending); pending = null; } };
    flat.forEach((f, b) => {
      const s = f.s;
      if (s.k === "hold") { if (pending) pending.soundBeats += 1; return; }
      flushPending();
      if (s.k === "note" && s.stack.length) {
        pending = { beat: b, subs: s.stack.slice(), soundBeats: 1, ref: f };
      }
      // gap/empty: silence, nothing pending
    });
    flushPending();

    events.forEach(ev => {
      const n = ev.subs.length;
      const subBeat = beatDur / n; // brigha: a stack subdivides its OWN beat
      // a hold inside the stack extends the preceding sub-note
      const units = [];
      ev.subs.forEach(sn => {
        if (sn.hold) { if (units.length) units[units.length - 1].shares += 1; }
        else units.push({ note: sn, shares: 1 });
      });
      if (!units.length) return; // all-hold stack: silence
      let t = t0 + ev.beat * beatDur;
      units.forEach((u, ui) => {
        // outer holds extend the LAST unit (dheergam extends the previous swara)
        let dur = u.shares * subBeat;
        if (ui === units.length - 1) dur += beatDur * (ev.soundBeats - 1);
        // scaled legato: tail grows with sub-note length, capped
        const ring = dur + Math.min(0.28, dur * 0.7);
        playNote(t, u.note.st, u.note.oct, saOffset, ring);
        t += u.shares * subBeat;
      });
    });
    // highlight timers (per beat, first sub only)
    flat.forEach((f, b) => {
      timers.push(setTimeout(() => {
        if (!stopped && opts.onSlot) opts.onSlot(f.r, f.i);
      }, 100 + b * beatDur * 1000));
    });
    const totalMs = 100 + totalBeats * beatDur * 1000;
    const doneTimer = setTimeout(() => {
      if (stopped) return;
      if (opts.loop && opts.keepPlaying && opts.keepPlaying()) {
        stopTimers();
        playRows(rows, opts);
      } else if (opts.onDone) opts.onDone();
    }, totalMs + 150);
    timers.push(doneTimer);
    function stopTimers() { timers.forEach(clearTimeout); }
    return {
      stop() { stopped = true; stopTimers(); stopAll(); if (opts.onClear) opts.onClear(); }
    };
  }

  /* ---------- picker (bottom sheet) ---------- */
  let pickerEl = null, veilEl = null;
  function ensurePickerDOM() {
    if (pickerEl) return;
    veilEl = document.createElement("div");
    veilEl.className = "sheet-veil";
    pickerEl = document.createElement("div");
    pickerEl.className = "sheet";
    document.body.appendChild(veilEl);
    document.body.appendChild(pickerEl);
    veilEl.onclick = closePicker;
  }
  function closePicker() {
    if (pickerEl) pickerEl.classList.remove("on");
    if (veilEl) veilEl.classList.remove("on");
  }
  /**
   * opts: {title, ragaId|null (null=chromatic), oct (default), showSpecials:true,
   *        stackMode:bool (shows the Stack toggle, off by default),
   *        prefill:[{st,oct}|{hold:true}] (initial stack selection, e.g. current
   *          value in edit mode),
   *        current: html shown under the title (e.g. current value in edit mode),
   *        duration:{value, options[]} + onDuration(v) (e.g. P3 chip length),
   *        onPick({kind:'swara',st,oct}|{kind:'hold'|'gap'|'clear'}|{kind:'stack',stack})}
   */
  function openPicker(opts) {
    ensurePickerDOM();
    const raga = opts.ragaId ? ragaById(opts.ragaId) : null;
    const list = raga ? ragaPickerList(raga) : CHROMATIC;
    let oct = opts.oct != null ? opts.oct : 0;
    let stackOn = !!opts.stackOn;
    let sel = (opts.prefill || []).map(n => n.hold ? { hold:true } : { st:n.st, oct:n.oct });
    let durVal = opts.duration ? opts.duration.value : null;
    const selLabel = n => n.hold ? "," : n.st + (n.oct > 0 ? "'" : n.oct < 0 ? "." : "");
    const durLbl = b => b === 1 ? "1" : b === 0.5 ? "½" : b === 0.25 ? "¼" : b + "";
    const render = () => {
      const sub = st => {
        const m = st.match(/^([A-Z])(\d?)$/);
        return m ? m[1] + (m[2] ? "<sub>"+m[2]+"</sub>" : "") : st;
      };
      const inSel = st => sel.some(x => !x.hold && x.st === st && x.oct === oct);
      pickerEl.innerHTML =
        `<h3>${opts.title || "Pick swara"}</h3>` +
        (opts.current ? `<div class="pkcur">${opts.current}</div>` : "") +
        `<div class="seg" id="pkOct">` +
          `<button data-o="-1" class="${oct===-1?"on":""}">low (˙S)</button>` +
          `<button data-o="0" class="${oct===0?"on":""}">middle</button>` +
          `<button data-o="1" class="${oct===1?"on":""}">high (S˙)</button>` +
        `</div>` +
        `<div class="pgrid">` +
          list.map(s => `<button class="pbtn${stackOn && inSel(s) ? " picked" : ""}" data-st="${s}">${sub(s)}</button>`).join("") +
        `</div>` +
        (opts.showSpecials === false ? "" :
        `<div class="prow">` +
          `<button class="pbtn" data-sp="hold">, hold</button>` +
          (opts.showSpecials === "hold" ? "" :
          `<button class="pbtn" data-sp="gap">– gap</button>` +
          `<button class="pbtn" data-sp="clear">✕ clear</button>`) +
        `</div>`) +
        (opts.duration ? `<div class="pkdur"><span>Length</span><div class="seg" id="pkDur">` +
          opts.duration.options.map(x =>
            `<button data-d="${x}" class="${x === durVal ? "on" : ""}">${durLbl(x)}</button>`).join("") +
          `</div></div>` : "") +
        (opts.stackMode ?
          `<div class="stackbar">` +
            `<button class="stacktgl${stackOn ? " on" : ""}" id="pkStackTgl">Stack ＋</button>` +
            (stackOn ?
              `<div id="pkSel">` +
                (sel.length ? sel.map((n, i) =>
                  `<button class="selchip" data-i="${i}">${selLabel(n)}<span class="x">×</span></button>`
                ).join("") : `<span class="ph">tap swaras…</span>`) +
              `</div>` +
              `<button class="donebtn2" id="pkDone" ${sel.length ? "" : "disabled"}>✅</button>`
            : "") +
          `</div>`
        : "") +
        `<div class="hint">${stackOn ? "tap several in order · tap a selected chip to remove · then ✓ Done"
          : (raga ? raga.name + " · tap a swara, or hold/gap/clear" : "Chromatic · all 16 sthanas")}</div>`;
      pickerEl.querySelectorAll("#pkOct button").forEach(b => b.onclick = () => {
        oct = +b.dataset.o; render();
      });
      pickerEl.querySelectorAll("#pkDur button").forEach(b => b.onclick = () => {
        durVal = parseFloat(b.dataset.d);
        if (opts.onDuration) opts.onDuration(durVal);
        render();
      });
      const tgl = pickerEl.querySelector("#pkStackTgl");
      if (tgl) tgl.onclick = () => { stackOn = !stackOn; render(); };
      pickerEl.querySelectorAll("[data-st]").forEach(b => b.onclick = () => {
        const st = b.dataset.st;
        if (stackOn) {
          const ix = sel.findIndex(x => !x.hold && x.st === st && x.oct === oct);
          if (ix >= 0) sel.splice(ix, 1); else sel.push({ st, oct });
          render();
        } else { closePicker(); opts.onPick({ kind:"swara", st, oct }); }
      });
      pickerEl.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => {
        if (stackOn && b.dataset.sp === "hold") { sel.push({ hold:true }); render(); return; }
        closePicker(); opts.onPick({ kind:b.dataset.sp });
      });
      pickerEl.querySelectorAll(".selchip").forEach(b => b.onclick = () => {
        sel.splice(+b.dataset.i, 1); render();
      });
      const done = pickerEl.querySelector("#pkDone");
      if (done) done.onclick = () => {
        if (!sel.length) return;
        closePicker(); opts.onPick({ kind:"stack", stack:sel.map(n => ({ ...n })) });
      };
    };
    render();
    pickerEl.classList.add("on");
    veilEl.classList.add("on");
  }

  /* ---------- misc ---------- */
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const load = (k, dflt) => {
    try { const v = localStorage.getItem(k); return v == null ? dflt : JSON.parse(v); }
    catch (e) { return dflt; }
  };
  function applyTheme(key) {
    const th = load(key, "dark");
    document.documentElement.dataset.theme = (th === "light" ? "light" : "dark");
  }
  function themeBtn(key) {
    const b = document.createElement("button");
    b.className = "tbtn"; b.textContent = "◐ Theme";
    b.onclick = () => {
      const cur = document.documentElement.dataset.theme === "light" ? "light" : "dark";
      const nxt = cur === "light" ? "dark" : "light";
      document.documentElement.dataset.theme = nxt; save(key, nxt);
    };
    return b;
  }
  function footer() {
    const d = document.createElement("div");
    d.className = "foot";
    d.innerHTML = `Swara Builder playground · mock repo · build ${BUILD_VERSION}<br>Adi tala only · experimental`;
    return d;
  }
  function ragaSelect(currentId, onChange) {
    const sel = document.createElement("select");
    sel.innerHTML = `<option value="">Chromatic (no raga)</option>` +
      RAGAS.map(r => `<option value="${r.id}"${r.id===currentId?" selected":""}>${r.name}</option>`).join("");
    sel.onchange = () => onChange(sel.value || null);
    return sel;
  }
  function saSelect(saOffset, onChange) {
    const sel = document.createElement("select");
    sel.innerHTML = SA_NAMES.map((n, i) =>
      `<option value="${i}"${i===saOffset?" selected":""}>Sa = ${n}</option>`).join("");
    sel.onchange = () => onChange(+sel.value);
    return sel;
  }

  return {
    BUILD_VERSION, SEMI, CHROMATIC, RAGAS, SA_NAMES,
    ragaById, ragaPickerList, emptySlot, slotLabelHTML, shortLabel,
    ensureAudio, ensureSamples, playNote, stopAll, playRows, sampleFor, noteSemitone,
    openPicker, closePicker, save, load, applyTheme, themeBtn, footer,
    ragaSelect, saSelect,
  };
})();
