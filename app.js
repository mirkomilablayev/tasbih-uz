(() => {
  "use strict";

  const DHIKRS = [
    { id: "subhanallah", name: "Subhanalloh", arabic: "سُبْحَانَ ٱللَّٰهِ", translit: "Subhanalloh", meaning: "Alloh pokdir" },
    { id: "alhamdulillah", name: "Alhamdulillah", arabic: "ٱلْحَمْدُ لِلَّٰهِ", translit: "Alhamdulillah", meaning: "Allohga hamd bo'lsin" },
    { id: "allahuakbar", name: "Allohu Akbar", arabic: "ٱللَّٰهُ أَكْبَرُ", translit: "Allohu Akbar", meaning: "Alloh buyukdir" },
    { id: "lailaha", name: "La ilaha illalloh", arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ", translit: "La ilaha illalloh", meaning: "Allohdan o'zga iloh yo'q" },
    { id: "astaghfirullah", name: "Astag'firulloh", arabic: "أَسْتَغْفِرُ ٱللَّٰهَ", translit: "Astag'firulloh", meaning: "Allohdan mag'firat so'rayman" },
    { id: "salawat", name: "Salavot", arabic: "ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ", translit: "Allohumma solli 'ala Muhammad", meaning: "Allohim, Muhammadga salovat yo'lla" },
  ];

  const STORAGE_KEY = "tasbih.uz:v1";
  const RING_LEN = 2 * Math.PI * 90;
  const BEAD_STEP = 36; // bead width (28) + gap (8)

  const defaultState = () => ({
    current: DHIKRS[0].id,
    target: 33,
    vibrate: true,
    sound: true,
    total: 0,
    counts: Object.fromEntries(DHIKRS.map((d) => [d.id, 0])),
  });

  // ---------- Persistence ----------
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === "object") {
        const base = defaultState();
        return { ...base, ...saved, counts: { ...base.counts, ...(saved.counts || {}) } };
      }
    } catch (_) { /* storage unavailable or corrupt */ }
    return defaultState();
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  const state = load();
  if (!DHIKRS.some((d) => d.id === state.current)) state.current = DHIKRS[0].id;

  // ---------- Elements ----------
  const $ = (id) => document.getElementById(id);
  const el = {
    zone: $("tapZone"), list: $("dhikrList"), arabic: $("arabic"), translit: $("translit"),
    meaning: $("meaning"), text: document.querySelector(".dhikr-text"), counter: $("counterBtn"),
    ring: $("ringFg"), count: $("count"), targetLabel: $("targetLabel"), rounds: $("rounds"),
    total: $("totalCount"), targets: $("targets"), vibrate: $("vibrateBtn"), sound: $("soundBtn"),
    reset: $("resetBtn"), modal: $("modal"), resetCurrent: $("resetCurrent"), resetAll: $("resetAll"),
    cancel: $("cancelReset"), toast: $("toast"), track: $("beadTrack"), stars: $("stars"),
    about: $("about"), infoBtn: $("infoBtn"), closeAbout: $("closeAbout"),
  };

  // Google Analytics event (no-op until GA is configured in index.html)
  const track = (name, params) => window.gtag && window.gtag("event", name, params);
  el.ring.style.strokeDasharray = RING_LEN;

  // ---------- Rendering ----------
  const dhikr = () => DHIKRS.find((d) => d.id === state.current);

  function renderList() {
    el.list.innerHTML = "";
    DHIKRS.forEach((d) => {
      const b = document.createElement("button");
      b.className = "chip" + (d.id === state.current ? " active" : "");
      b.textContent = d.name;
      b.onclick = () => selectDhikr(d.id, b);
      el.list.appendChild(b);
    });
  }

  function renderText() {
    const d = dhikr();
    el.arabic.textContent = d.arabic;
    el.translit.textContent = d.translit;
    el.meaning.textContent = d.meaning;
    restartAnim(el.text, "swap");
  }

  function renderCounter() {
    const c = state.counts[state.current] || 0;
    const t = state.target;
    el.count.textContent = c;
    el.total.textContent = state.total.toLocaleString("uz");
    if (t > 0) {
      const inRound = c % t;
      // Show a full ring right when a round completes
      const progress = c > 0 && inRound === 0 ? 1 : inRound / t;
      el.ring.style.strokeDashoffset = RING_LEN * (1 - progress);
      el.targetLabel.textContent = "/ " + t;
      el.rounds.textContent = Math.floor(c / t) + " marta";
      el.rounds.style.visibility = "visible";
    } else {
      el.ring.style.strokeDashoffset = RING_LEN * (1 - (c % 100) / 100);
      el.targetLabel.textContent = "cheksiz";
      el.rounds.style.visibility = "hidden";
    }
    [...el.targets.children].forEach((b) =>
      b.classList.toggle("active", Number(b.dataset.target) === t)
    );
    el.vibrate.classList.toggle("off", !state.vibrate);
    el.sound.classList.toggle("off", !state.sound);
  }

  function restartAnim(node, cls) {
    node.classList.remove(cls);
    void node.offsetWidth; // reflow so the animation restarts
    node.classList.add(cls);
  }

  // ---------- Beads ----------
  let beadOffset = 0;
  function buildBeads() {
    el.track.innerHTML = "<i></i>".repeat(40);
    moveBeads(false);
  }
  function moveBeads(animate = true) {
    el.track.style.transition = animate ? "" : "none";
    el.track.style.transform = `translateX(${-14 - (beadOffset + 10) * BEAD_STEP}px)`;
  }

  // ---------- Sound ----------
  let audio;
  function tone(freq, dur, vol = 0.08, type = "sine") {
    if (!state.sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
      o.connect(g).connect(audio.destination);
      o.start();
      o.stop(audio.currentTime + dur);
    } catch (_) {}
  }
  const vibrate = (p) => state.vibrate && navigator.vibrate && navigator.vibrate(p);

  // ---------- Effects ----------
  function spawn(cls, x, y, text) {
    const n = document.createElement("div");
    n.className = cls;
    n.style.left = x + "px";
    n.style.top = y + "px";
    if (text) n.textContent = text;
    document.body.appendChild(n);
    n.addEventListener("animationend", () => n.remove());
    return n;
  }

  function burst() {
    const r = el.counter.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const dist = r.width * 0.55 + Math.random() * 90;
      const p = spawn("particle", cx, cy);
      p.style.setProperty("--dx", Math.cos(a) * dist + "px");
      p.style.setProperty("--dy", Math.sin(a) * dist + "px");
      p.style.animationDelay = Math.random() * 0.1 + "s";
    }
  }

  let toastTimer;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove("show"), 2000);
  }

  // ---------- Actions ----------
  function increment(x, y) {
    const c = (state.counts[state.current] || 0) + 1;
    state.counts[state.current] = c;
    state.total += 1;
    save();

    renderCounter();
    restartAnim(el.count, "bump");
    restartAnim(el.counter, "pulse");
    if (beadOffset >= 10) {
      // Beads are identical, so jump back silently to keep the track finite
      beadOffset = 0;
      moveBeads(false);
      void el.track.offsetWidth;
    }
    beadOffset++;
    moveBeads();

    if (x == null) {
      const r = el.counter.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }
    spawn("ripple", x, y);
    spawn("plus", x, y, "+1");

    if (state.target > 0 && c % state.target === 0) {
      restartAnim(el.counter, "done");
      burst();
      vibrate([60, 60, 180]);
      tone(660, 0.25, 0.1);
      setTimeout(() => tone(990, 0.5, 0.1), 180);
      toast(`✨ ${state.target} ta zikr tugallandi!`);
      track("dhikr_round_complete", { dhikr: state.current, target: state.target });
    } else {
      vibrate(15);
      tone(520, 0.08, 0.05, "triangle");
    }
  }

  function selectDhikr(id, btn) {
    if (id === state.current) return;
    state.current = id;
    save();
    [...el.list.children].forEach((c) => c.classList.toggle("active", c === btn));
    btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    renderText();
    renderCounter();
  }

  function openModal(open, modal = el.modal) {
    modal.classList.toggle("open", open);
    modal.setAttribute("aria-hidden", String(!open));
  }
  const anyModalOpen = () => document.querySelector(".modal.open");

  function doReset(all) {
    if (all) {
      Object.keys(state.counts).forEach((k) => (state.counts[k] = 0));
      state.total = 0;
    } else {
      state.counts[state.current] = 0;
    }
    save();
    openModal(false);
    restartAnim(el.reset, "spin");
    restartAnim(el.count, "bump");
    renderCounter();
    vibrate(40);
    toast(all ? "Barcha natijalar tozalandi" : "Joriy zikr nolga tushirildi");
  }

  // ---------- Events ----------
  // Tap anywhere on the page (except controls) to count
  el.zone.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    if (e.target.closest("[data-no-count]")) return;
    if (e.target.closest(".counter")) el.counter.classList.add("press");
    increment(e.clientX, e.clientY);
  });
  const release = () => el.counter.classList.remove("press");
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  // Keep the counter button from also firing on keyboard "click"
  el.counter.addEventListener("click", (e) => e.preventDefault());

  document.addEventListener("keydown", (e) => {
    const open = anyModalOpen();
    if (open) {
      if (e.key === "Escape") openModal(false, open);
      return;
    }
    if (e.target.closest("[data-no-count]")) return;
    if ((e.code === "Space" || e.key === "Enter") && !e.repeat) {
      e.preventDefault();
      increment();
    }
  });

  el.targets.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    state.target = Number(b.dataset.target);
    save();
    renderCounter();
  });
  el.vibrate.onclick = () => {
    state.vibrate = !state.vibrate;
    save();
    renderCounter();
    toast(state.vibrate ? "Tebranish yoqildi" : "Tebranish o'chirildi");
  };
  el.sound.onclick = () => {
    state.sound = !state.sound;
    save();
    renderCounter();
    toast(state.sound ? "Ovoz yoqildi" : "Ovoz o'chirildi");
  };
  el.reset.onclick = () => openModal(true);
  el.cancel.onclick = () => openModal(false);
  el.resetCurrent.onclick = () => doReset(false);
  el.resetAll.onclick = () => doReset(true);
  el.modal.addEventListener("click", (e) => { if (e.target === el.modal) openModal(false); });
  el.infoBtn.onclick = () => { openModal(true, el.about); track("about_open"); };
  el.closeAbout.onclick = () => openModal(false, el.about);
  el.about.addEventListener("click", (e) => { if (e.target === el.about) openModal(false, el.about); });
  $("year").textContent = new Date().getFullYear();

  // ---------- Stars ----------
  for (let i = 0; i < 40; i++) {
    const s = document.createElement("i");
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 45 + "%";
    s.style.animationDelay = Math.random() * 4 + "s";
    s.style.animationDuration = 3 + Math.random() * 3 + "s";
    el.stars.appendChild(s);
  }

  // ---------- Init ----------
  renderList();
  renderText();
  renderCounter();
  buildBeads();
})();
