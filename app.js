// ============================================================
// دعوة محمد و طيبة — المنطق (صفحة سكرول واحدة متصلة)
// ============================================================
(function () {
  "use strict";

  var CFG = window.WEDDING_CONFIG || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------------
  // تعبئة النصوص من config.js — بلا أي تغيير بمحتواها
  // ---------------------------------------------------------
  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  setText("groom-name", CFG.groom);
  setText("bride-name", CFG.bride);
  setText("invite-groom", CFG.groom);
  setText("invite-bride", CFG.bride);
  setText("invite-date", CFG.weddingDateDisplay);
  setText("invite-time", CFG.weddingTimeDisplay);
  setText("invite-date-2", CFG.weddingDateDisplay);
  setText("invite-time-2", CFG.weddingTimeDisplay);
  setText("venue-name", CFG.venueName);
  document.title = "دعوة زفاف " + CFG.groom + " و " + CFG.bride;

  // سطر العنوان التفصيلي يظهر فقط إذا كان موجوداً بـ config.js
  (function venueAddr() {
    var el = document.getElementById("venue-addr");
    if (!el) return;
    if (CFG.venueAddress && CFG.venueAddress.trim()) {
      el.textContent = CFG.venueAddress;
    } else {
      el.remove();
    }
  })();

  // اسم الضيف من الرابط ?guest=
  (function guestWelcome() {
    var params = new URLSearchParams(window.location.search);
    var guest = params.get(CFG.guestParam || "guest");
    if (guest) {
      var el = document.getElementById("guest-welcome");
      var nameInput = document.getElementById("rsvp-name");
      var clean = decodeURIComponent(guest).replace(/[<>]/g, "");
      if (el) {
        el.textContent = "أهلاً بك، " + clean;
        el.classList.remove("is-hidden");
      }
      if (nameInput) nameInput.value = clean;
    }
  })();

  // ---------------------------------------------------------
  // ترقيم عناصر كل قسم لأجل الظهور التدريجي المتتابع (--i)
  // ---------------------------------------------------------
  document.querySelectorAll(".screen__inner").forEach(function (inner) {
    Array.prototype.forEach.call(inner.children, function (child, i) {
      child.style.setProperty("--i", i);
    });
  });

  // ---------------------------------------------------------
  // ظهور تدريجي عند التمرير — كل قسم يظهر لحاله أول ما يوصله
  // المستخدم بالتمرير، بلا أي تنقّل بالنقر
  // ---------------------------------------------------------
  (function scrollReveal() {
    var inners = Array.prototype.slice.call(document.querySelectorAll(".screen__inner"));
    if (!("IntersectionObserver" in window) || reduceMotion) {
      inners.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
    inners.forEach(function (el) { io.observe(el); });
  })();

  // ---------------------------------------------------------
  // فتح الدعوة — يحرّر التمرير ويسمح بمطالعة بقية الدعوة بالسكرول
  // العادي، بلا أي "شاشات" أو أزرار تنقّل
  // ---------------------------------------------------------
  var openBtn = document.getElementById("open-btn");
  var coverInner = document.getElementById("cover");
  var scrollCue = document.getElementById("scroll-cue");

  openBtn.addEventListener("click", function () {
    coverInner.classList.add("opened");
    openBtn.classList.add("is-hidden");

    var delay = reduceMotion ? 100 : 700;
    window.setTimeout(function () {
      document.documentElement.classList.remove("pre-open");
      scrollCue.classList.remove("is-hidden");
      window.setTimeout(function () { scrollCue.classList.add("is-hidden"); }, 6000);
    }, delay);
  });

  scrollCue.addEventListener("click", function () {
    var next = document.getElementById("s2");
    if (next) next.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });

  // ---------------------------------------------------------
  // الصوت — يحاول البدء تلقائياً فور تحميل الصفحة، وإذا منعه
  // المتصفح (كما تفعل أغلب المتصفحات بلا تفاعل من المستخدم) يبدأ
  // فوراً مع أول لمسة/نقرة/تمرير بأي مكان بالصفحة — بلا أي شاشة
  // أو زر منفصل "لتفعيل الصوت" يعطّل التصفح
  // ---------------------------------------------------------
  var musicToggle = document.getElementById("music-toggle");
  var audioEl = null, audioCtx = null, gainNode = null, sourceNode = null;
  var audioReady = false, musicPlaying = false;

  function updateMusicUI() {
    musicToggle.classList.toggle("is-playing", musicPlaying && !reduceMotion);
    musicToggle.classList.toggle("is-muted", !musicPlaying);
    musicToggle.setAttribute("aria-pressed", String(musicPlaying));
  }

  function setupAudioGraph() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
      sourceNode = audioCtx.createMediaElementSource(audioEl);
      gainNode = audioCtx.createGain();
      gainNode.gain.value = 0;
      sourceNode.connect(gainNode).connect(audioCtx.destination);
      gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 1.4);
    } catch (err) {
      // متصفح لا يدعم Web Audio — الصوت يعمل بمستوى عادي بلا تلاشي
    }
  }

  function prepareAudio() {
    if (audioReady || !CFG.songSrc) return;
    audioReady = true;
    audioEl = new Audio(CFG.songSrc);
    audioEl.loop = true;
    audioEl.crossOrigin = "anonymous";
    audioEl.addEventListener("error", function () {
      // لا يوجد ملف أغنية بعد — الموقع يعمل طبيعياً بلا صوت
      musicToggle.style.display = "none";
    });
  }

  function tryPlay() {
    if (!audioEl) return Promise.reject();
    return audioEl.play().then(function () {
      if (!audioCtx) setupAudioGraph();
      musicPlaying = true;
      updateMusicUI();
      scheduleLyricCue();
    });
  }

  function attemptAutoStart() {
    prepareAudio();
    if (!audioEl) return;
    tryPlay().catch(function () {
      // منعه المتصفح — يبدأ تلقائياً مع أول تفاعل من الضيف، أي تفاعل
      var kick = function () { tryPlay().catch(function () {}); };
      ["pointerdown", "touchstart", "keydown", "wheel", "scroll"].forEach(function (ev) {
        document.addEventListener(ev, kick, { once: true, passive: true });
      });
    });
  }

  musicToggle.addEventListener("click", function () {
    if (!audioEl) { attemptAutoStart(); return; }
    if (musicPlaying) {
      audioEl.pause();
      musicPlaying = false;
      updateMusicUI();
    } else {
      tryPlay().catch(function () {});
    }
  });

  window.addEventListener("DOMContentLoaded", attemptAutoStart);
  if (document.readyState === "interactive" || document.readyState === "complete") {
    attemptAutoStart();
  }

  // لمسة زخرفية عند كلمة "قرة عيون محمد" — وميض ذهبي خفيف بغض النظر عن موضع التمرير
  var cueScheduled = false;
  function scheduleLyricCue() {
    if (cueScheduled) return;
    cueScheduled = true;
    var cue = Number(CFG.songCueSeconds) || 0;
    if (!cue || reduceMotion) return;
    window.setTimeout(function () {
      var flash = document.createElement("div");
      flash.style.cssText = "position:fixed;inset:0;z-index:60;pointer-events:none;" +
        "background:radial-gradient(circle at 50% 40%, rgba(184,148,79,.35), transparent 60%);" +
        "opacity:0;transition:opacity 1.1s ease;";
      document.body.appendChild(flash);
      requestAnimationFrame(function () { flash.style.opacity = "1"; });
      window.setTimeout(function () {
        flash.style.opacity = "0";
        window.setTimeout(function () { flash.remove(); }, 1200);
      }, 900);
    }, cue * 1000);
  }

  // ---------------------------------------------------------
  // تفسير موعد الزفاف كتوقيت بغداد (UTC+3، بلا توقيت صيفي) بصرف
  // النظر عن المنطقة الزمنية لجهاز الضيف — يمنع خطأ العدّاد لضيوف
  // خارج العراق
  // ---------------------------------------------------------
  function parseBaghdadWallClock(iso) {
    var m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    return { y: +m[1], mo: +m[2] - 1, d: +m[3], h: +m[4], mi: +m[5], s: +m[6] };
  }
  var WC = parseBaghdadWallClock(CFG.weddingDateISO);
  var EVENT_UTC_MS = Date.UTC(WC.y, WC.mo, WC.d, WC.h, WC.mi, WC.s) - 3 * 3600000;

  // ---------------------------------------------------------
  // العدّاد التنازلي — حلقة SVG بتدرّج ذهبي
  // ---------------------------------------------------------
  (function countdown() {
    var target = EVENT_UTC_MS;
    var totalSpanForRing = 90 * 24 * 60 * 60 * 1000; // ٩٠ يوماً كمرجع بصري للحلقة
    var ring = document.getElementById("cd-progress-circle");
    var RADIUS = 60;
    var CIRC = 2 * Math.PI * RADIUS;
    if (ring) ring.style.strokeDasharray = CIRC;

    function tick() {
      var now = Date.now();
      var diff = Math.max(0, target - now);
      var days = Math.floor(diff / 86400000);
      var hours = Math.floor((diff % 86400000) / 3600000);
      var mins = Math.floor((diff % 3600000) / 60000);
      var secs = Math.floor((diff % 60000) / 1000);

      setText("cd-days", String(days));
      setText("cd-h", String(hours).padStart(2, "0"));
      setText("cd-m", String(mins).padStart(2, "0"));
      setText("cd-s", String(secs).padStart(2, "0"));

      var pct = Math.max(0, Math.min(100, 100 - (diff / totalSpanForRing) * 100));
      if (ring) ring.style.strokeDashoffset = CIRC - (pct / 100) * CIRC;
    }
    tick();
    window.setInterval(tick, 1000);
  })();

  // حفظ الموعد — قائمة تقويم
  var calMenu = document.getElementById("calendar-menu");
  document.getElementById("save-date-btn").addEventListener("click", function () {
    calMenu.classList.toggle("is-hidden");
  });

  function pad(n) { return String(n).padStart(2, "0"); }

  function fmtUTCms(ms) {
    var d = new Date(ms);
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) +
      "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + "00Z";
  }
  function fmtFloating(y, mo, d, h, mi) {
    return y + pad(mo + 1) + pad(d) + "T" + pad(h) + pad(mi) + "00";
  }

  (function buildCalendarLinks() {
    var gStart = fmtUTCms(EVENT_UTC_MS);
    var gEnd = fmtUTCms(EVENT_UTC_MS + 3 * 3600000);
    var text = encodeURIComponent("حفل زفاف " + CFG.groom + " و " + CFG.bride);
    var details = encodeURIComponent("يسعدنا حضوركم حفل زفافنا");
    var loc = encodeURIComponent(CFG.venueName + (CFG.venueAddress ? "، " + CFG.venueAddress : ""));
    document.getElementById("google-cal-link").href =
      "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + text +
      "&dates=" + gStart + "/" + gEnd + "&details=" + details + "&location=" + loc;

    document.getElementById("ics-download").addEventListener("click", function () {
      var startStr = fmtFloating(WC.y, WC.mo, WC.d, WC.h, WC.mi);
      var endParts = new Date(Date.UTC(WC.y, WC.mo, WC.d, WC.h, WC.mi, WC.s) + 3 * 3600000);
      var endStr = fmtFloating(endParts.getUTCFullYear(), endParts.getUTCMonth(), endParts.getUTCDate(), endParts.getUTCHours(), endParts.getUTCMinutes());
      var ics = [
        "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//hook//wedding//AR",
        "BEGIN:VEVENT",
        "UID:" + Date.now() + "@wedding",
        "DTSTART:" + startStr, "DTEND:" + endStr,
        "SUMMARY:حفل زفاف " + CFG.groom + " و " + CFG.bride,
        "LOCATION:" + (CFG.venueName + (CFG.venueAddress ? "، " + CFG.venueAddress : "")),
        "DESCRIPTION:يسعدنا حضوركم حفل زفافنا",
        "END:VEVENT", "END:VCALENDAR"
      ].join("\r\n");
      var blob = new Blob([ics], { type: "text/calendar" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "wedding-" + CFG.groom + "-" + CFG.bride + ".ics";
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  })();

  // ---------------------------------------------------------
  // المكان — زر الخريطة
  // ---------------------------------------------------------
  document.getElementById("map-btn").addEventListener("click", function () {
    var q = encodeURIComponent(CFG.venueMapQuery || CFG.venueName);
    window.open("https://www.google.com/maps/search/?api=1&query=" + q, "_blank");
  });

  // ---------------------------------------------------------
  // تأكيد الحضور
  // ---------------------------------------------------------
  var rsvpChoice = null;
  var choiceBtns = Array.prototype.slice.call(document.querySelectorAll(".rsvp-choice"));
  var rsvpSubmit = document.getElementById("rsvp-submit");
  var rsvpNote = document.getElementById("rsvp-note");

  choiceBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      rsvpChoice = btn.getAttribute("data-choice");
      choiceBtns.forEach(function (b) { b.classList.remove("selected"); });
      btn.classList.add("selected");
      rsvpSubmit.disabled = false;
      rsvpNote.textContent = "اضغط \"إرسال التأكيد\" لإتمام الرد";
    });
  });

  function showToast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    window.setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  (function checkExistingRSVP() {
    if (localStorage.getItem("wedding_rsvp_done")) {
      document.getElementById("rsvp-count").textContent = "لقد أكّدتم ردّكم مسبقاً — شكراً لكم";
    }
  })();

  document.getElementById("rsvp-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!rsvpChoice) return;
    var payload = {
      name: document.getElementById("rsvp-name").value.trim() || "بلا اسم",
      choice: rsvpChoice,
      companions: document.getElementById("rsvp-companions").value,
      message: document.getElementById("rsvp-message").value.trim(),
      time: new Date().toISOString()
    };

    if (CFG.rsvpEndpoint) {
      fetch(CFG.rsvpEndpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload)
      }).catch(function () { /* يُحفظ محلياً حتى لو فشل الإرسال */ });
    }
    localStorage.setItem("wedding_rsvp_done", "1");
    localStorage.setItem("wedding_rsvp_data", JSON.stringify(payload));

    showToast(rsvpChoice === "yes" ? "شكراً، وصلنا ردّكم ونترقّب حضوركم" : "شكراً لإخباركم، سنفتقدكم");
    document.getElementById("rsvp-count").textContent = "لقد أكّدتم ردّكم — شكراً لكم";
    rsvpSubmit.disabled = true;
  });

  // ---------------------------------------------------------
  // فوانيس الأمنيات
  // ---------------------------------------------------------
  var sky = document.getElementById("sky");

  (function seedStars() {
    for (var i = 0; i < 14; i++) {
      var s = document.createElement("div");
      s.className = "star";
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 55 + "%";
      s.style.opacity = (0.3 + Math.random() * 0.6).toFixed(2);
      sky.appendChild(s);
    }
  })();

  function addLantern(text, animate) {
    var l = document.createElement("div");
    l.className = "lantern" + (text ? " show-tag" : "");
    var leftPct = 12 + Math.random() * 76;
    l.style.left = leftPct + "%";
    l.style.setProperty("--drift", (Math.random() * 30 - 15) + "px");
    if (!animate) l.style.animationDelay = "-9s";
    l.innerHTML =
      (text ? '<div class="tag">' + text + "</div>" : "") +
      '<div class="body"></div><div class="flame"></div>';
    sky.appendChild(l);
    l.addEventListener("animationend", function () { l.remove(); });
  }

  (function restoreOwnWish() {
    var saved = localStorage.getItem("wedding_wish");
    if (saved) addLantern(saved, false);
  })();

  if (CFG.wishesEndpoint) {
    fetch(CFG.wishesEndpoint)
      .then(function (r) { return r.json(); })
      .then(function (list) {
        if (Array.isArray(list)) {
          list.slice(-12).forEach(function (w) {
            var txt = (w && (w.wish || w.text)) || "";
            if (txt) addLantern(String(txt).slice(0, 60), false);
          });
        }
      })
      .catch(function () {});
  }

  document.getElementById("wish-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var input = document.getElementById("wish-input");
    var text = input.value.trim();
    if (!text) return;
    addLantern(text, !reduceMotion);
    localStorage.setItem("wedding_wish", text);

    if (CFG.wishesEndpoint) {
      fetch(CFG.wishesEndpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ wish: text, time: new Date().toISOString() })
      }).catch(function () {});
    }
    input.value = "";
  });

  // ---------------------------------------------------------
  // طبقة زخرفية خافتة: بتلات تنجرف ببطء — بلا أي تأثير على الأداء
  // أو التفاعل (pointer-events معطّلة تماماً على الطبقة)
  // ---------------------------------------------------------
  (function ambient() {
    var canvas = document.getElementById("ambient");
    if (!canvas || reduceMotion) { if (canvas) canvas.remove(); return; }
    var ctx = canvas.getContext("2d");
    var petals = [];
    var count = window.innerWidth < 480 ? 9 : 14;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    function seed() {
      petals = [];
      for (var i = 0; i < count; i++) {
        petals.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: 2 + Math.random() * 2.4,
          vy: 0.15 + Math.random() * 0.25,
          vx: (Math.random() - 0.5) * 0.25,
          o: 0.15 + Math.random() * 0.25
        });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach(function (p) {
        p.y += p.vy; p.x += p.vx;
        if (p.y > canvas.height + 6) { p.y = -6; p.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.fillStyle = "rgba(184,148,79," + p.o + ")";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    resize(); seed(); draw();
    window.addEventListener("resize", function () { resize(); seed(); });
  })();

})();
