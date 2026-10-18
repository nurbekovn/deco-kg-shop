/* Голосовой помощник Deco_kg.
   Распознавание речи и синтез — встроенные в браузер (Web Speech API), без ключей и без оплаты.
   Поиск — локально по каталогу из products.js. */

(function () {
  "use strict";

  /* ---------- элементы ---------- */
  var orb = document.getElementById("orb");
  var statusEl = document.getElementById("status");
  var logEl = document.getElementById("log");
  var levelBar = document.querySelector("#level i");
  var typeIn = document.getElementById("typein");
  var typeSend = document.getElementById("typesend");

  document.getElementById("pcount").textContent = PRODUCTS.length;

  /* ---------- морфология и токены ---------- */
  var STOP = {};
  ("а в во и из или к ко на не ну о об от по с со у что это тут там мне нам нас тебе вам ты вы мы он она они бы же ли да нет еще для про при над под без до за сколько стоит стоят стоимость цена цены цену почем почому есть имеется наличие есле покажи покажите показать найди найти ищи искать хочу хотел нужен нужна нужно нужны надо дай дайте скажи скажите пожалуйста привет здравствуй здравствуйте бот помощник слушай алло очень какой какая какое какие который которые штук штука шт сом сомов сома рублей ваш ваша ваши твой мой один одна мм см")
    .split(" ").forEach(function (w) { STOP[w] = 1; });

  var ENDINGS = ["ами", "ями", "ого", "его", "ому", "ему", "ыми", "ими", "ах", "ях",
    "ов", "ев", "ей", "ой", "ую", "юю", "ая", "яя", "ое", "ее", "ые", "ие", "ом", "ем",
    "ий", "ый", "ью", "ья", "и", "ы", "а", "я", "о", "е", "у", "ю", "ь", "й"];

  function stem(w) {
    w = w.toLowerCase().replace(/ё/g, "е").replace(/[^а-яa-z0-9]/g, "");
    for (var i = 0; i < ENDINGS.length; i++) {
      var e = ENDINGS[i];
      if (w.length - e.length >= 4 && w.slice(-e.length) === e) return w.slice(0, -e.length);
    }
    return w;
  }

  /* keepAll=true для названий товаров: служебные слова не выбрасываем,
     иначе сбиваются позиции слов и «Пика для перфоратора» выглядит как «Перфоратор» */
  function tokens(s, keepAll) {
    var raw = String(s || "").toLowerCase().replace(/ё/g, "е")
      /* «60см» → «60 см», «125мм» → «125 мм» */
      .replace(/(\d)([а-яa-z])/g, "$1 $2")
      .replace(/([а-яa-z])(\d)/g, "$1 $2")
      .split(/[^а-яa-z0-9]+/);
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var w = raw[i];
      if (!w) continue;
      if (!keepAll && (w.length < 2 || STOP[w])) continue;
      out.push(stem(w));
    }
    return out;
  }

  /* длина общего префикса; для чисел — только точное совпадение */
  function common(a, b) {
    if (/^\d+$/.test(a) || /^\d+$/.test(b)) return a === b ? a.length + 4 : 0;
    var n = Math.min(a.length, b.length), i = 0;
    while (i < n && a.charCodeAt(i) === b.charCodeAt(i)) i++;
    return i;
  }

  /* ---------- индекс каталога ---------- */
  var CATNAME = {};
  CATEGORIES.forEach(function (c) { CATNAME[c.id] = c.name; });

  var IDX = PRODUCTS.map(function (p) {
    return {
      p: p,
      cat: CATNAME[p.categoryId] || "",
      toks: tokens(p.name, true),
      ctoks: tokens(CATNAME[p.categoryId] || "", true)
    };
  });

  /* head = совпадение попало в первые два слова названия: «Перфоратор …»
     важнее, чем «Пика для перфоратора» */
  function matchIn(qt, list) {
    var hits = 0, score = 0, head = 0;
    for (var i = 0; i < qt.length; i++) {
      var best = 0, bestAt = -1, bestLen = 0;
      for (var j = 0; j < list.length; j++) {
        var c = common(qt[i], list[j]);
        if (c > best) { best = c; bestAt = j; bestLen = list[j].length; }
      }
      /* совпадение должно покрывать большую часть короткого слова,
         иначе «бензопила» цепляет «бензиновый» */
      var need = Math.min(qt[i].length, bestLen) * 0.7;
      /* короткие слова («бур», «лом») ловим только точным совпадением */
      var full = best === qt[i].length && best === bestLen;
      if ((best >= 4 || full) && best >= need) {
        hits++; score += best;
        if (bestAt < 2) head++;
      }
    }
    return { hits: hits, score: score, head: head };
  }

  function search(q) {
    var qt = tokens(q);
    if (!qt.length) return [];
    var res = [], i, m;
    for (i = 0; i < IDX.length; i++) {
      m = matchIn(qt, IDX[i].toks);
      if (m.hits) res.push({ p: IDX[i].p, cat: IDX[i].cat, hits: m.hits, score: m.score, head: m.head });
    }
    if (!res.length) {
      for (i = 0; i < IDX.length; i++) {
        m = matchIn(qt, IDX[i].ctoks);
        if (m.hits) res.push({ p: IDX[i].p, cat: IDX[i].cat, hits: m.hits, score: m.score, head: m.head });
      }
    }
    if (!res.length) return [];
    res.sort(function (a, b) {
      return b.hits - a.hits || b.head - a.head || b.score - a.score || (a.p.price || 0) - (b.p.price || 0);
    });
    var topHits = res[0].hits;
    res = res.filter(function (r) { return r.hits === topHits; });
    var topHead = res[0].head;
    return res.filter(function (r) { return r.head === topHead; });
  }

  /* ---------- оформление ответа ---------- */
  function cleanName(n) {
    return String(n).replace(/\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/, function (m, g) {
      return /[а-яa-z]/.test(g) ? m : "";
    }).trim();
  }

  function money(v) {
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " сом";
  }

  function plural(n, a, b, c) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return a;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return b;
    return c;
  }

  /* делаем текст удобным для озвучки */
  function speechify(s) {
    return s
      .replace(/(\d)\s*[*xх⌀]\s*(\d)/g, "$1 на $2")
      .replace(/⌀/g, " диаметр ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function answer(q) {
    var t = String(q).trim();
    if (!t) return null;

    if (/^(привет|здравств|салам|ассалам|добрый|добр[ыо]|hi|hello)/i.test(t)) {
      return {
        say: "Здравствуйте! Я помощник магазина Деко кей джи. Спросите, сколько стоит нужный инструмент.",
        show: "Здравствуйте! Я помощник Deco_kg. Спросите, сколько стоит нужный инструмент."
      };
    }
    if (/(что ты|что умеешь|помо(щь|ги)|как польз)/i.test(t)) {
      return {
        say: "Я знаю все товары каталога. Спросите, например: сколько стоит перфоратор, или — есть ли генератор, или — самая дешёвая болгарка.",
        show: "Я знаю все товары каталога. Примеры: «сколько стоит перфоратор», «есть ли генератор», «самая дешёвая болгарка»."
      };
    }
    if (/сколько.*(товар|позици|наимен|всего)|каталог.*сколько/i.test(t)) {
      return {
        say: "В каталоге " + PRODUCTS.length + " " + plural(PRODUCTS.length, "товар", "товара", "товаров") +
             " в " + CATEGORIES.length + " " + plural(CATEGORIES.length, "категории", "категориях", "категориях") + ".",
        show: "В каталоге " + PRODUCTS.length + " товаров, " + CATEGORIES.length + " категорий."
      };
    }
    if (/^(спасибо|благодар|пока|до свидан|хватит|отлично|супер|молодец)/i.test(t)) {
      return { say: "Пожалуйста! Обращайтесь.", show: "Пожалуйста! Обращайтесь." };
    }

    var wantCheap = /дешев|дешёв|подешевле|недорог|бюджет|минимальн/i.test(t);
    var wantExp = /дорог|подороже|максимальн|мощн/i.test(t);

    var res = search(t);
    if (!res.length) {
      return {
        say: "Не нашёл такого в каталоге. Попробуйте назвать товар по-другому.",
        show: "Не нашёл такого в каталоге. Попробуйте назвать товар по-другому."
      };
    }

    var byPrice = res.slice().sort(function (a, b) { return (a.p.price || 0) - (b.p.price || 0); });

    if (res.length === 1 || wantCheap || wantExp) {
      var pick = wantExp ? byPrice[byPrice.length - 1] : byPrice[0];
      var nm = cleanName(pick.p.name);
      var tail = res.length > 1
        ? (wantExp ? " Это самый дорогой из " : " Это самый дешёвый из ") + res.length +
          " " + plural(res.length, "варианта", "вариантов", "вариантов") + "."
        : "";
      return {
        say: speechify(nm + " — " + money(pick.p.price) + "." + tail),
        show: nm + " — " + money(pick.p.price) + "\n" + pick.cat + tail
      };
    }

    var lo = byPrice[0], hi = byPrice[byPrice.length - 1];
    var lines0 = byPrice.slice(0, 5).map(function (r) {
      return "• " + cleanName(r.p.name) + " — " + money(r.p.price);
    });
    if (res.length > 5) lines0.push("…и ещё " + (res.length - 5));

    if (lo.p.price === hi.p.price) {
      return {
        say: speechify("Нашёл " + res.length + " " + plural(res.length, "вариант", "варианта", "вариантов") +
          ", все по " + money(lo.p.price) + ". Например, " + cleanName(lo.p.name) + "."),
        show: "Нашёл " + res.length + ", все по " + money(lo.p.price) + ":\n" + lines0.join("\n")
      };
    }

    var say = "Нашёл " + res.length + " " + plural(res.length, "вариант", "варианта", "вариантов") + ". " +
      "Дешевле всего — " + cleanName(lo.p.name) + " за " + money(lo.p.price) + ". " +
      "Дороже всего — " + cleanName(hi.p.name) + " за " + money(hi.p.price) + ". " +
      "Назовите точнее, и я скажу цену.";
    var lines = byPrice.slice(0, 5).map(function (r) {
      return "• " + cleanName(r.p.name) + " — " + money(r.p.price);
    });
    if (res.length > 5) lines.push("…и ещё " + (res.length - 5));
    return { say: speechify(say), show: "Нашёл " + res.length + ":\n" + lines.join("\n") };
  }

  /* ---------- вывод в лог ---------- */
  var interimEl = null;

  function addMsg(kind, text) {
    var d = document.createElement("div");
    d.className = "msg " + kind;
    d.textContent = text;
    logEl.appendChild(d);
    window.scrollTo(0, document.body.scrollHeight);
    return d;
  }

  function showInterim(text) {
    if (!text) { if (interimEl) { interimEl.remove(); interimEl = null; } return; }
    if (!interimEl) { interimEl = addMsg("me interim", text); }
    else { interimEl.textContent = text; }
  }

  /* ---------- синтез речи ---------- */
  var synth = window.speechSynthesis;
  var ruVoice = null, speaking = false, spoken = {};

  function pickVoice() {
    if (!synth) return;
    var vs = synth.getVoices() || [];
    ruVoice = vs.filter(function (v) { return /^ru/i.test(v.lang); })
      .sort(function (a, b) { return (b.localService ? 1 : 0) - (a.localService ? 1 : 0); })[0] || null;
  }
  if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }

  function stopSpeaking() {
    if (!synth) return;
    synth.cancel();
    speaking = false;
  }

  function speak(text) {
    if (!synth) { setState(active ? "listening" : "idle"); return; }
    synth.cancel();
    spoken = {};
    tokens(text).forEach(function (t) { spoken[t] = 1; });

    var chunks = text.match(/[^.!?]+[.!?]*/g) || [text];
    var merged = [], buf = "";
    chunks.forEach(function (c) {
      if ((buf + c).length > 180) { if (buf) merged.push(buf); buf = c; }
      else buf += c;
    });
    if (buf) merged.push(buf);

    speaking = true;
    setState("speaking");
    merged.forEach(function (part, i) {
      var u = new SpeechSynthesisUtterance(part.trim());
      u.lang = "ru-RU";
      if (ruVoice) u.voice = ruVoice;
      u.rate = 1.02;
      if (i === merged.length - 1) {
        u.onend = u.onerror = function () {
          speaking = false;
          setState(active ? "listening" : "idle");
        };
      }
      synth.speak(u);
    });
  }

  /* эхо: услышали собственный голос из колонок */
  function isEcho(txt) {
    var ts = tokens(txt);
    if (!ts.length) return false;
    var hit = 0;
    for (var i = 0; i < ts.length; i++) if (spoken[ts[i]]) hit++;
    return hit / ts.length >= 0.6;
  }

  /* ---------- состояние ---------- */
  var active = false;
  var LABEL = { idle: "Начать", listening: "Слушаю", thinking: "Думаю", speaking: "Говорю" };
  var TEXT = {
    idle: "Нажмите «Начать» и разрешите доступ к микрофону",
    listening: "Говорите — я слушаю. Можно перебивать.",
    thinking: "Ищу в каталоге…",
    speaking: "Отвечаю. Начните говорить, чтобы перебить."
  };

  function setState(s) {
    orb.className = s === "idle" ? "" : s;
    orb.textContent = LABEL[s];
    if (TEXT[s]) statusEl.textContent = TEXT[s];
  }

  function handle(text) {
    showInterim("");
    addMsg("me", text);
    setState("thinking");
    var r = answer(text);
    if (!r) { setState(active ? "listening" : "idle"); return; }
    addMsg("bot", r.show);
    speak(r.say);
  }
  window.__voiceAsk = handle;
  window.__voiceAnswer = answer;

  /* ---------- распознавание речи ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var rec = null, micStream = null, audioCtx = null, rafId = null;

  function startMeter(stream) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var src = audioCtx.createMediaStreamSource(stream);
      var an = audioCtx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      var buf = new Uint8Array(an.frequencyBinCount);
      (function loop() {
        an.getByteFrequencyData(buf);
        var sum = 0;
        for (var i = 0; i < buf.length; i++) sum += buf[i];
        var pct = Math.min(100, (sum / buf.length) * 2.2);
        levelBar.style.width = pct.toFixed(0) + "%";
        rafId = requestAnimationFrame(loop);
      })();
    } catch (e) { /* метр не критичен */ }
  }

  function stopMeter() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    levelBar.style.width = "0%";
    if (audioCtx) { try { audioCtx.close(); } catch (e) {} audioCtx = null; }
    if (micStream) { micStream.getTracks().forEach(function (t) { t.stop(); }); micStream = null; }
  }

  function buildRec() {
    var r = new SR();
    r.lang = "ru-RU";
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onresult = function (e) {
      var interim = "", final = "";
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += txt; else interim += txt;
      }
      var probe = (final || interim).trim();
      if (!probe) return;

      if (speaking) {
        if (isEcho(probe)) return;          // это наш собственный голос
        stopSpeaking();                      // перебивание
        setState("listening");
      }
      if (final.trim()) handle(final.trim());
      else showInterim(interim.trim());
    };

    r.onerror = function (e) {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        active = false;
        setState("idle");
        statusEl.innerHTML = '<span class="err">Доступ к микрофону запрещён. Разрешите его в настройках сайта и нажмите «Начать».</span>';
      } else if (e.error === "network") {
        statusEl.innerHTML = '<span class="err">Нет связи с сервисом распознавания. Проверьте интернет.</span>';
      }
    };

    r.onend = function () {
      if (active) setTimeout(function () { try { rec.start(); } catch (e) {} }, 250);
    };
    return r;
  }

  function start() {
    if (!SR) {
      statusEl.innerHTML = '<span class="err">Этот браузер не умеет распознавать речь. Откройте страницу в Chrome — или напишите вопрос текстом ниже.</span>';
      return;
    }
    active = true;
    setState("listening");
    statusEl.textContent = "Запрашиваю микрофон…";
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function (stream) {
        micStream = stream;
        startMeter(stream);
        rec = buildRec();
        try { rec.start(); } catch (e) {}
        setState("listening");
        if (!logEl.children.length) {
          addMsg("sys", "Микрофон включён. Для лучшего результата наденьте наушники.");
          speak("Слушаю. Спросите, сколько стоит нужный инструмент.");
        }
      })
      .catch(function () {
        active = false;
        setState("idle");
        statusEl.innerHTML = '<span class="err">Микрофон недоступен. Разрешите доступ — или напишите вопрос текстом ниже.</span>';
      });
  }

  function stop() {
    active = false;
    stopSpeaking();
    if (rec) { rec.onend = null; try { rec.stop(); } catch (e) {} rec = null; }
    stopMeter();
    showInterim("");
    setState("idle");
    statusEl.textContent = "Остановлено. Нажмите «Начать», чтобы продолжить.";
  }

  orb.addEventListener("click", function () { active ? stop() : start(); });

  /* ---------- текстовый ввод (работает и без микрофона) ---------- */
  function sendTyped() {
    var v = typeIn.value.trim();
    if (!v) return;
    typeIn.value = "";
    handle(v);
  }
  typeSend.addEventListener("click", sendTyped);
  typeIn.addEventListener("keydown", function (e) { if (e.key === "Enter") sendTyped(); });

  Array.prototype.forEach.call(document.querySelectorAll(".chip"), function (c) {
    c.addEventListener("click", function () { handle(c.textContent.trim()); });
  });

  if (!SR) {
    statusEl.innerHTML = '<span class="err">Распознавание речи доступно в Chrome и Edge.</span> Текстом можно спрашивать в любом браузере.';
  }
})();
