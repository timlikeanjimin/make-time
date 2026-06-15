/* ⚓ 메이크타임 웹앱 — 하루에 단 하나의 하이라이트
 * 책 <메이크 타임>(제이크 냅·존 제라츠키)의 전술을 담은 개인용 시간관리 PWA.
 * 데이터는 localStorage. 단 하나의 규칙: 가장 중요한 일을 해낸 하루는 성공. */

"use strict";

const KEY = "maketime-v1";

// ---------- 색·메시지 ----------
const MSG = {
  empty: ["오늘의 닻을 내려볼까요?", "단 하나, 가장 중요한 일은?", "하루를 디폴트에 맡기지 마세요"],
  focus: ["폭풍우 속에서도 닻은 단단해요", "인피니티 풀은 나중에, 지금은 이것만", "지금이 가장 에너지 높은 시간"],
  overdue: ["마감은 지났지만, 끝내면 승리예요", "아직 안 끝났어요. 한 번 더!"],
  done: ["오늘 하루는 이미 성공입니다", "해냈다! 나머지는 보너스", "충만한 하루, 적립 완료"],
  celebrate: [
    "바로 그거예요. 가장 중요한 일을 해낸 하루는 성공입니다.",
    "폭풍우 속에서도 배가 떠내려가지 않았네요. ⚓",
    "비지 밴드왜건에서 뛰어내려 진짜 일을 해냈습니다.",
  ],
};

// ---------- 아이콘 (이모지 대신 커스텀 인라인 SVG, currentColor 상속) ----------
const ICONS = {
  anchor: '<circle cx="12" cy="5" r="2.5"/><path d="M12 7.5v13"/><path d="M7.5 10.5h9"/><path d="M5 13a7 7 0 0 0 14 0"/>',
  list: '<path d="M9 6h10"/><path d="M9 12h10"/><path d="M9 18h10"/><path d="M4.6 6h.01"/><path d="M4.6 12h.01"/><path d="M4.6 18h.01"/>',
  chart: '<path d="M4 20h16"/><path d="M7 20v-6"/><path d="M12 20V6"/><path d="M17 20v-9"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" fill="currentColor" stroke="none"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  trophy: '<path d="M7.5 4.5h9V8a4.5 4.5 0 0 1-9 0V4.5z"/><path d="M7.5 5.5H5A2.5 2.5 0 0 0 7.5 8"/><path d="M16.5 5.5H19A2.5 2.5 0 0 1 16.5 8"/><path d="M12 12.5v3"/><path d="M9 19.5h6l-.6-4.5h-4.8z"/>',
  pencil: '<path d="M16.5 4.5l3 3"/><path d="M4 20l1-4L16 5l3 3L8 19l-4 1z"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="currentColor" stroke="none"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 1.8"/>',
  flask: '<path d="M9.5 3.5h5"/><path d="M10.5 3.5v6l-4.5 7.8A1.6 1.6 0 0 0 7.4 19.8h9.2a1.6 1.6 0 0 0 1.4-2.5L13.5 9.5v-6"/><path d="M8 15h8"/>',
  arrow: '<path d="M5 12h13"/><path d="M12.5 6l6 6-6 6"/>',
  ring: '<circle cx="12" cy="12" r="7.5"/>',
};
function ic(name) {
  return `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}
function iconSpan(name) { return `<span class="ico">${ic(name)}</span>`; }
function applyStaticIcons() {
  document.querySelectorAll("[data-icon]").forEach((s) => { s.innerHTML = ic(s.dataset.icon); });
}

// ---------- 저장소 ----------
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (!d.days) d.days = {};
    return d;
  } catch (e) {
    return { days: {} };
  }
}
function save() {
  localStorage.setItem(KEY, JSON.stringify(data));
}
let data = load();

// ---------- 날짜 유틸 ----------
function todayKey(d) {
  d = d || new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function getToday() {
  const k = todayKey();
  if (!data.days[k]) data.days[k] = {};
  if (!data.days[k].todos) data.days[k].todos = [];
  return data.days[k];
}
function fmtDate() {
  const d = new Date();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}
function fmtTime(d) {
  let h = d.getHours();
  const ampm = h < 12 ? "오전" : "오후";
  let h12 = h % 12; if (h12 === 0) h12 = 12;
  return `${ampm} ${h12}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function remainText(dl) {
  const diff = dl.getTime() - Date.now();
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const span = h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  return diff >= 0 ? `${span} 남음` : `${span} 지남`;
}
function pick(arr) {
  const now = new Date();
  return arr[(now.getDate() + now.getMonth() * 31) % arr.length];
}

// ---------- 상태 ----------
function stateOf(t) {
  if (!t.highlight) return "empty";
  if (t.done) return "done";
  if (t.deadline && new Date(t.deadline) < new Date()) return "overdue";
  return "focus";
}
function calcStreak() {
  let streak = 0;
  const d = new Date();
  if (!(data.days[todayKey(d)] || {}).done) d.setDate(d.getDate() - 1);
  while ((data.days[todayKey(d)] || {}).done) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// ---------- DOM 헬퍼 ----------
const $ = (id) => document.getElementById(id);
const el = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
};

// ---------- 렌더 ----------
function render() {
  const t = getToday();
  const state = stateOf(t);
  const streak = calcStreak();
  document.body.dataset.state = state;

  $("date").textContent = fmtDate();
  const sEl = $("streak");
  if (streak >= 2) { sEl.hidden = false; sEl.innerHTML = `${iconSpan("flame")} ${streak}일`; }
  else sEl.hidden = true;

  // 히어로
  $("hero-label").innerHTML = state === "done"
    ? `${iconSpan("check")} 오늘의 하이라이트 완수`
    : "오늘의 하이라이트";
  $("hero-highlight").textContent = t.highlight || "오늘 단 하나,\n가장 중요한 일은?";
  $("hero-highlight").style.whiteSpace = t.highlight ? "normal" : "pre-line";

  renderStatus(t, state);

  // 액션 버튼
  const acts = $("hero-actions");
  acts.innerHTML = "";
  if (!t.highlight) {
    acts.appendChild(mkBtn("anchor", "하이라이트 정하기", "act-primary", openHighlight));
  } else if (!t.done) {
    acts.appendChild(mkBtn("check", "완수했어요!", "act-done", completeHighlight));
    acts.appendChild(mkBtn("pencil", "", "act-secondary", openHighlight));
  } else {
    acts.appendChild(mkBtn("trophy", "오늘 하루는 성공", "act-done", celebrate));
    acts.appendChild(mkBtn("pencil", "", "act-secondary", openHighlight));
  }

  renderTodos(t);
  renderDots();
}

function renderStatus(t, state) {
  const s = $("hero-status");
  s.classList.remove("live");
  if (state === "empty") { s.textContent = "탭해서 오늘의 하이라이트를 정하세요"; return; }
  if (state === "done") {
    const hour = new Date().getHours();
    s.innerHTML = `${iconSpan("check")} ` + (hour >= 21 && !t.reflection
      ? `완수 · 자기 전 1분, 돌아보기 ${iconSpan("moon")}`
      : `완수 — ${pick(MSG.done)}`);
    return;
  }
  if (t.deadline) {
    const dl = new Date(t.deadline);
    s.innerHTML = `${iconSpan("clock")} ${fmtTime(dl)}까지 · ${remainText(dl)}`;
    s.classList.add("live");
    return;
  }
  s.textContent = pick(MSG.focus);
}

function mkBtn(iconName, label, cls, fn) {
  const b = el("button", cls);
  b.innerHTML = (iconName ? iconSpan(iconName) : "") + (label ? `<span>${label}</span>` : "");
  b.addEventListener("click", fn);
  return b;
}

function renderTodos(t) {
  const list = $("todo-list");
  list.innerHTML = "";
  const undone = t.todos.filter((x) => !x.done).length;
  $("todos-count").textContent = t.todos.length ? `${t.todos.length - undone}/${t.todos.length}` : "";

  t.todos.forEach((td, i) => {
    const li = el("li", "todo-item" + (td.done ? " done" : ""));
    const chk = el("div", "todo-check", "✓");
    const txt = el("span", "todo-text", td.text);
    const del = el("button", "todo-del", "✕");
    del.setAttribute("aria-label", "삭제");
    li.append(chk, txt, del);
    li.addEventListener("click", (e) => {
      if (e.target === del) return;
      td.done = !td.done; save(); renderTodos(getToday());
    });
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      t.todos.splice(i, 1); save(); renderTodos(getToday());
    });
    list.appendChild(li);
  });
}

function renderDots() {
  const wrap = $("dots");
  wrap.innerHTML = "";
  const labels = ["일", "월", "화", "수", "목", "금", "토"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const e = data.days[todayKey(d)] || {};
    const isToday = i === 0;
    const col = el("div", "dot-col" + (isToday ? " is-today" : ""));
    let cls = "dot";
    if (e.done) cls += " done";
    else if (e.highlight) cls += " partial";
    if (isToday) cls += " today";
    const dot = el("div", cls);
    if (e.done) dot.innerHTML = ic("check");
    else if (e.highlight) dot.textContent = "·";
    col.appendChild(dot);
    col.appendChild(el("div", "dot-day", labels[d.getDay()]));
    wrap.appendChild(col);
  }
}

// ---------- 하이라이트 ----------
function openHighlight() {
  const t = getToday();
  $("highlight-input").value = t.highlight || "";
  $("deadline-input").value = t.deadline ? toTimeInput(new Date(t.deadline)) : "";
  showModal("modal-highlight");
  setTimeout(() => $("highlight-input").focus(), 350);
}
function toTimeInput(d) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function saveHighlight() {
  const text = $("highlight-input").value.trim();
  if (!text) { toast("하이라이트를 입력해주세요"); return; }
  const t = getToday();
  const wasNew = !t.highlight;
  t.highlight = text;
  if (wasNew) t.done = false;

  const tv = $("deadline-input").value;
  if (tv) {
    const [h, m] = tv.split(":").map(Number);
    const dl = new Date();
    dl.setHours(h, m, 0, 0);
    t.deadline = dl.toISOString();
  } else {
    delete t.deadline;
  }
  save();
  closeModal();
  render();
  scheduleReminders();
  ensureNotifyPermission();
  toast(t.deadline ? `닻을 내렸습니다 ⚓ — ${fmtTime(new Date(t.deadline))}까지` : "닻을 내렸습니다 ⚓");
}

function completeHighlight() {
  const t = getToday();
  t.done = true;
  t.doneAt = new Date().toISOString();
  save();
  render();
  celebrate();
}
function celebrate() {
  const streak = calcStreak();
  let msg = pick(MSG.celebrate);
  if (streak >= 2) msg += `  ·  ${streak}일 연속!`;
  toast(msg, 3200);
  confetti();
}

// ---------- 돌아보기 ----------
let reflectDraft = { focus: 0, energy: 0 };
function openReflect() {
  const t = getToday();
  reflectDraft = {
    focus: (t.reflection && t.reflection.focus) || 0,
    energy: (t.reflection && t.reflection.energy) || 0,
  };
  $("reflect-note").value = (t.reflection && t.reflection.note) || "";
  buildStars("stars-focus", "focus");
  buildStars("stars-energy", "energy");
  showModal("modal-reflect");
}
function buildStars(containerId, kind) {
  const c = $(containerId);
  c.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const s = el("span", "star" + (i <= reflectDraft[kind] ? " on" : ""), "★");
    s.addEventListener("click", () => {
      reflectDraft[kind] = i;
      buildStars(containerId, kind);
    });
    c.appendChild(s);
  }
}
function saveReflect() {
  if (!reflectDraft.focus || !reflectDraft.energy) {
    toast("집중·에너지 별점을 매겨주세요");
    return;
  }
  const t = getToday();
  t.reflection = {
    focus: reflectDraft.focus,
    energy: reflectDraft.energy,
    note: $("reflect-note").value.trim(),
  };
  save();
  closeModal();
  render();
  toast("오늘 하루를 닫았습니다 🌙 잘 자요");
}

// ---------- 기록 ----------
function openHistory() {
  const keys = Object.keys(data.days).sort().reverse();
  const doneCount = keys.filter((k) => data.days[k].done).length;
  $("history-summary").textContent = keys.length
    ? `총 ${keys.length}일 중 ${doneCount}일 완수 · 🔥 현재 ${calcStreak()}일 연속`
    : "아직 기록이 없어요.";

  const list = $("history-list");
  list.innerHTML = "";
  if (!keys.length) {
    list.appendChild(el("div", "empty-row", "첫 하이라이트를 정하면 여기에 쌓여요."));
  }
  for (const k of keys) {
    const d = data.days[k];
    const row = el("div", "history-row");
    const mark = el("div", "history-mark");
    if (d.done) { mark.innerHTML = ic("check"); mark.style.color = "var(--green)"; }
    else if (d.highlight) { mark.innerHTML = ic("ring"); mark.style.color = "var(--faint)"; }
    else { mark.textContent = "–"; mark.style.color = "var(--faint)"; }
    row.appendChild(mark);
    const body = el("div", "history-body");
    body.appendChild(el("div", "history-date", k));
    const hl = el("div", "history-hl" + (d.highlight ? "" : " empty"), d.highlight || "(하이라이트 없음)");
    body.appendChild(hl);
    if (d.reflection) {
      const meta = el("div", "history-meta",
        `집중 ${"★".repeat(d.reflection.focus)} · 에너지 ${"★".repeat(d.reflection.energy)}` +
        (d.reflection.note ? `  ·  ${d.reflection.note}` : ""));
      body.appendChild(meta);
    }
    row.appendChild(body);
    list.appendChild(row);
  }
  showModal("modal-history");
}

// ---------- 모달 제어 ----------
let openModalId = null;
function showModal(id) {
  $(id).hidden = false;
  openModalId = id;
}
function closeModal() {
  if (openModalId) { $(openModalId).hidden = true; openModalId = null; }
}

// ---------- 토스트 ----------
let toastTimer = null;
function toast(msg, ms = 2000) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => (t.hidden = true), 300);
  }, ms);
}

// ---------- 색종이 (완수 축하) ----------
function confetti() {
  const colors = ["#FFB454", "#7CF7C4", "#fff", "#ffd9a0"];
  for (let i = 0; i < 28; i++) {
    const p = el("div");
    const size = 6 + Math.random() * 7;
    Object.assign(p.style, {
      position: "fixed", zIndex: 300, left: 50 + (Math.random() * 30 - 15) + "%", top: "40%",
      width: size + "px", height: size + "px", borderRadius: Math.random() > 0.5 ? "50%" : "2px",
      background: colors[i % colors.length], pointerEvents: "none",
    });
    document.body.appendChild(p);
    const dx = (Math.random() * 2 - 1) * 220;
    const dy = -(120 + Math.random() * 260);
    const rot = Math.random() * 720 - 360;
    const dur = 1400 + Math.random() * 600;
    const anim = p.animate(
      [
        { transform: "translate(0,0) rotate(0)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${dx * 1.3}px, ${dy + 420}px) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: dur, easing: "cubic-bezier(.2,.8,.3,1)" }
    );
    const cleanup = () => p.remove();
    anim.onfinish = cleanup;
    setTimeout(cleanup, dur + 300); // onfinish 누락 대비 보증 제거
  }
}

// ---------- 알림 (열려 있을 때 한정) ----------
function ensureNotifyPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}
function notify(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "icon-192.png" });
      return;
    }
  } catch (e) {}
  toast(`${title} — ${body}`, 4000);
}

let reminderTimers = [];
function scheduleReminders() {
  reminderTimers.forEach(clearTimeout);
  reminderTimers = [];
  const t = getToday();
  const now = Date.now();

  // 마감 알림
  if (t.deadline && !t.done) {
    const ms = new Date(t.deadline).getTime() - now;
    if (ms > 0 && ms < 24 * 3600000) {
      reminderTimers.push(setTimeout(() => {
        if (!getToday().done) notify("⚓ 마감 시각입니다", `"${t.highlight}" — 끝냈다면 완수를 눌러주세요!`);
        render();
      }, ms));
    }
  }
  // 21:30 돌아보기 알림
  const reflectAt = new Date(); reflectAt.setHours(21, 30, 0, 0);
  const rms = reflectAt.getTime() - now;
  if (rms > 0 && rms < 24 * 3600000) {
    reminderTimers.push(setTimeout(() => {
      if (!getToday().reflection) notify("🌙 1분 돌아보기", "오늘은 어땠나요? 실험일지를 쓰고 내일을 조정해요.");
    }, rms));
  }
}

// ---------- 설치 안내 (iOS Safari) ----------
function maybeShowInstallHint() {
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.navigator.standalone || window.matchMedia("(display-mode: standalone)").matches;
  if (isiOS && !standalone && !localStorage.getItem("mt-install-dismissed")) {
    $("ios-install").hidden = false;
  }
}

// ---------- 이벤트 바인딩 ----------
function bind() {
  $("save-highlight").addEventListener("click", saveHighlight);
  $("highlight-input").addEventListener("keydown", (e) => { if (e.key === "Enter") saveHighlight(); });
  $("save-reflect").addEventListener("click", saveReflect);
  $("open-reflect").addEventListener("click", openReflect);
  $("open-history").addEventListener("click", openHistory);

  $("todo-add").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = $("todo-input");
    const v = inp.value.trim();
    if (!v) return;
    getToday().todos.push({ text: v, done: false });
    save();
    inp.value = "";
    renderTodos(getToday());
  });

  // 모달 닫기 (배경 클릭 / 취소 버튼)
  document.querySelectorAll(".modal-overlay").forEach((ov) => {
    ov.addEventListener("click", (e) => { if (e.target === ov) closeModal(); });
  });
  document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeModal));

  $("ios-install-close").addEventListener("click", () => {
    $("ios-install").hidden = true;
    localStorage.setItem("mt-install-dismissed", "1");
  });
}

// ---------- 시작 ----------
bind();
applyStaticIcons();
render();
scheduleReminders();
maybeShowInstallHint();

// 카운트다운/날짜 갱신 (30초마다)
let currentDay = todayKey();
setInterval(() => {
  const t = getToday();
  renderStatus(t, stateOf(t));
  if (todayKey() !== currentDay) location.reload(); // 자정 넘김
}, 30000);

// 다시 보일 때 갱신
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) { data = load(); render(); }
});

// 서비스워커 등록
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
