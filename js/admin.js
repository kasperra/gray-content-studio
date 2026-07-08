/* Gray Content Studio — Admin panel logic */

(function () {
  "use strict";

  /* ============ CHANGE YOUR PASSCODE HERE ============ */
  const PASSCODE = "graystudio2026";
  /* =================================================== */

  const LS_AUTH = "gcs_admin_unlocked";
  const LS_OVERRIDES = "gcs_price_overrides";
  const LS_PROPOSALS = "gcs_proposals";

  const $ = (id) => document.getElementById(id);

  /* ---------- Passcode gate ---------- */

  const gate = $("gate");
  const panel = $("panel");
  const lockBtn = $("lock-btn");

  function unlock() {
    gate.hidden = true;
    panel.hidden = false;
    lockBtn.hidden = false;
    sessionStorage.setItem(LS_AUTH, "1");
    renderAll();
  }

  function tryUnlock() {
    if ($("gate-input").value === PASSCODE) {
      $("gate-error").textContent = "";
      unlock();
    } else {
      $("gate-error").textContent = "Incorrect passcode.";
    }
  }

  $("gate-btn").addEventListener("click", tryUnlock);
  $("gate-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryUnlock();
  });
  lockBtn.addEventListener("click", () => {
    sessionStorage.removeItem(LS_AUTH);
    location.reload();
  });

  /* ---------- Price overrides ---------- */

  let overrides = {};
  try {
    overrides = JSON.parse(localStorage.getItem(LS_OVERRIDES) || "{}");
  } catch (e) {
    overrides = {};
  }

  function priceOf(svc) {
    return overrides[svc.id] != null ? overrides[svc.id] : svc.price;
  }

  /* ---------- State ---------- */

  let qty = {}; // serviceId -> quantity (selected if > 0 entry exists with checkbox)
  let checked = {}; // serviceId -> bool
  let editingId = null; // proposal id being edited

  /* ---------- Calculator rendering ---------- */

  function renderCategories() {
    const editRates = $("edit-rates").checked;
    const wrap = $("categories");
    const openStates = {};
    wrap.querySelectorAll(".cat").forEach((el) => {
      openStates[el.dataset.cat] = el.classList.contains("open");
    });
    wrap.innerHTML = "";

    PRICING_CATEGORIES.forEach((cat) => {
      const selCount = cat.services.filter((s) => checked[s.id]).length;
      const catEl = document.createElement("div");
      catEl.className = "cat" + (openStates[cat.id] || selCount > 0 && openStates[cat.id] !== false ? " open" : "");
      if (openStates[cat.id] === undefined && selCount > 0) catEl.classList.add("open");
      catEl.dataset.cat = cat.id;

      const head = document.createElement("button");
      head.className = "cat-head";
      head.type = "button";
      head.innerHTML =
        "<span>" + cat.name + "</span>" +
        '<span class="cat-meta">' +
        (selCount ? '<span class="cat-count">' + selCount + " selected</span>" : "") +
        '<span class="chev">▾</span></span>';
      head.addEventListener("click", () => catEl.classList.toggle("open"));
      catEl.appendChild(head);

      const body = document.createElement("div");
      body.className = "cat-body";

      cat.services.forEach((svc) => {
        const row = document.createElement("div");
        row.className = "svc" + (checked[svc.id] ? " selected" : "");

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!checked[svc.id];
        cb.addEventListener("change", () => {
          checked[svc.id] = cb.checked;
          if (cb.checked && !(qty[svc.id] > 0)) qty[svc.id] = 1;
          renderCategories();
          recalc();
        });
        row.appendChild(cb);

        const name = document.createElement("div");
        name.className = "svc-name";
        name.innerHTML = svc.name + '<span class="svc-unit">per ' + svc.unit + "</span>";
        row.appendChild(name);

        const price = document.createElement("div");
        price.className = "svc-price";
        if (editRates) {
          const pin = document.createElement("input");
          pin.type = "number";
          pin.min = "0";
          pin.step = "0.01";
          pin.value = priceOf(svc);
          pin.addEventListener("change", () => {
            const v = parseFloat(pin.value);
            if (!isNaN(v) && v >= 0) {
              if (v === svc.price) delete overrides[svc.id];
              else overrides[svc.id] = v;
              localStorage.setItem(LS_OVERRIDES, JSON.stringify(overrides));
              recalc();
            }
          });
          price.appendChild(pin);
        } else {
          price.textContent = money(priceOf(svc));
          if (overrides[svc.id] != null) price.style.color = "var(--accent)";
        }
        row.appendChild(price);

        const qtyWrap = document.createElement("div");
        qtyWrap.className = "svc-qty";
        const qin = document.createElement("input");
        qin.type = "number";
        qin.min = "0";
        qin.step = "1";
        qin.value = qty[svc.id] || 0;
        qin.addEventListener("input", () => {
          const v = parseFloat(qin.value);
          qty[svc.id] = isNaN(v) || v < 0 ? 0 : v;
          if (qty[svc.id] > 0 && !checked[svc.id]) {
            checked[svc.id] = true;
            cb.checked = true;
            row.classList.add("selected");
          }
          recalc();
          updateRowTotal();
        });
        qtyWrap.appendChild(qin);
        row.appendChild(qtyWrap);

        const tot = document.createElement("div");
        tot.className = "svc-total";
        function updateRowTotal() {
          tot.textContent = checked[svc.id] ? money(priceOf(svc) * (qty[svc.id] || 0)) : "—";
        }
        updateRowTotal();
        row.appendChild(tot);

        body.appendChild(row);
      });

      catEl.appendChild(body);
      wrap.appendChild(catEl);
    });
  }

  /* ---------- Totals ---------- */

  function currentLineItems() {
    const items = [];
    PRICING_CATEGORIES.forEach((cat) => {
      cat.services.forEach((svc) => {
        if (checked[svc.id] && qty[svc.id] > 0) {
          items.push({
            id: svc.id,
            name: svc.name,
            unit: svc.unit,
            price: priceOf(svc),
            qty: qty[svc.id],
            total: priceOf(svc) * qty[svc.id],
            category: cat.name,
          });
        }
      });
    });
    return items;
  }

  function computeTotals() {
    const items = currentLineItems();
    const subtotal = items.reduce((s, i) => s + i.total, 0);

    const rushId = $("m-rush").value;
    const rush = RUSH_OPTIONS.find((r) => r.id === rushId) || RUSH_OPTIONS[0];
    const rushAmt = subtotal * (rush.pct / 100);

    const miles = parseFloat($("m-miles").value) || 0;
    const travelAmt = Math.max(0, miles - TRAVEL_FREE_MILES) * TRAVEL_RATE;

    const dType = $("d-type").value;
    const dVal = parseFloat($("d-value").value) || 0;
    let discountAmt = 0;
    const preDiscount = subtotal + rushAmt + travelAmt;
    if (dType === "pct") discountAmt = preDiscount * (Math.min(dVal, 100) / 100);
    else if (dType === "flat") discountAmt = Math.min(dVal, preDiscount);

    const total = preDiscount - discountAmt;
    const depPct = Math.min(Math.max(parseFloat($("dep-pct").value) || 0, 0), 100);
    const deposit = total * (depPct / 100);

    return { items, subtotal, rush, rushAmt, miles, travelAmt, dType, dVal, discountAmt, total, depPct, deposit, balance: total - deposit };
  }

  function recalc() {
    const t = computeTotals();
    $("t-subtotal").textContent = money(t.subtotal);

    $("t-rush-row").hidden = t.rush.pct === 0;
    $("t-rush-label").textContent = t.rush.name + " (+" + t.rush.pct + "%)";
    $("t-rush").textContent = money(t.rushAmt);

    $("t-travel-row").hidden = t.travelAmt === 0;
    $("t-travel").textContent = money(t.travelAmt);

    $("t-discount-row").hidden = t.discountAmt === 0;
    $("t-discount").textContent = "−" + money(t.discountAmt);

    $("t-total").textContent = money(t.total);
    $("t-deposit").textContent = money(t.deposit) + " (" + t.depPct + "%)";
    $("t-balance").textContent = money(t.balance);
  }

  ["m-rush", "m-miles", "d-type", "d-value", "dep-pct"].forEach((id) =>
    $(id).addEventListener("input", recalc)
  );
  $("edit-rates").addEventListener("change", () => {
    renderCategories();
    recalc();
  });

  /* ---------- Proposals (localStorage) ---------- */

  function loadProposals() {
    try {
      return JSON.parse(localStorage.getItem(LS_PROPOSALS) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveProposals(list) {
    localStorage.setItem(LS_PROPOSALS, JSON.stringify(list));
  }

  function proposalPayload() {
    const t = computeTotals();
    return {
      client: $("c-name").value.trim(),
      company: $("c-company").value.trim(),
      email: $("c-email").value.trim(),
      title: $("c-title").value.trim(),
      notes: $("c-notes").value.trim(),
      valid: $("c-valid").value,
      items: t.items,
      subtotal: t.subtotal,
      rushId: t.rush.id,
      rushName: t.rush.name,
      rushPct: t.rush.pct,
      rushAmt: t.rushAmt,
      miles: t.miles,
      travelAmt: t.travelAmt,
      discountType: t.dType,
      discountValue: t.dVal,
      discountAmt: t.discountAmt,
      total: t.total,
      depositPct: t.depPct,
      deposit: t.deposit,
      balance: t.balance,
      created: new Date().toISOString().slice(0, 10),
    };
  }

  function encodeProposal(p) {
    const json = JSON.stringify(p);
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function proposalLink(p) {
    return location.origin + location.pathname.replace(/admin\.html$/, "proposal.html") + "#" + encodeProposal(p);
  }

  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  $("save-btn").addEventListener("click", () => {
    const p = proposalPayload();
    if (!p.client && !p.title) {
      toast("Add a client name or project title first.");
      return;
    }
    if (!p.items.length) {
      toast("Select at least one service.");
      return;
    }
    const list = loadProposals();
    if (editingId) {
      const idx = list.findIndex((x) => x.id === editingId);
      if (idx >= 0) {
        list[idx] = Object.assign({}, list[idx], p, { id: editingId });
        saveProposals(list);
        toast("Proposal updated.");
        renderHistory();
        renderStats();
        return;
      }
    }
    const id = "p" + Date.now().toString(36);
    list.unshift(Object.assign({ id, status: "draft" }, p));
    saveProposals(list);
    editingId = id;
    updateEditNote();
    toast("Proposal saved as draft.");
    renderHistory();
    renderStats();
  });

  $("link-btn").addEventListener("click", () => {
    const p = proposalPayload();
    if (!p.items.length) {
      toast("Select at least one service first.");
      return;
    }
    const link = proposalLink(p);
    navigator.clipboard
      .writeText(link)
      .then(() => toast("Client link copied to clipboard."))
      .catch(() => {
        prompt("Copy this proposal link:", link);
      });
  });

  $("preview-btn").addEventListener("click", () => {
    const p = proposalPayload();
    if (!p.items.length) {
      toast("Select at least one service first.");
      return;
    }
    window.open(proposalLink(p), "_blank");
  });

  $("clear-btn").addEventListener("click", () => {
    qty = {};
    checked = {};
    editingId = null;
    ["c-name", "c-company", "c-email", "c-title", "c-notes", "c-valid"].forEach((id) => ($(id).value = ""));
    $("m-rush").value = "none";
    $("m-miles").value = 0;
    $("d-type").value = "none";
    $("d-value").value = 0;
    $("dep-pct").value = DEFAULT_DEPOSIT_PCT;
    updateEditNote();
    renderCategories();
    recalc();
  });

  function updateEditNote() {
    const note = $("edit-id-note");
    if (editingId) {
      note.hidden = false;
      note.textContent = "Editing saved proposal — Save updates it.";
    } else {
      note.hidden = true;
    }
  }

  /* ---------- History ---------- */

  const STATUS_CYCLE = { draft: "sent", sent: "accepted", accepted: "draft" };

  function renderHistory() {
    const list = loadProposals();
    const wrap = $("history");
    if (!list.length) {
      wrap.innerHTML = '<p class="empty-note">No saved proposals yet — build an estimate and hit Save.</p>';
      return;
    }
    const rows = list
      .map((p) => {
        const label = (p.client || "Untitled") + (p.title ? " — " + p.title : "");
        return (
          "<tr>" +
          '<td>' + escapeHtml(label) + "</td>" +
          '<td class="h-date">' + (p.created || "") + "</td>" +
          '<td class="h-total">' + money(p.total || 0) + "</td>" +
          '<td><button class="status-chip ' + p.status + '" data-act="status" data-id="' + p.id + '">' + p.status + "</button></td>" +
          '<td><div class="row-actions">' +
          '<button class="icon-btn" data-act="open" data-id="' + p.id + '">Open</button>' +
          '<button class="icon-btn" data-act="copy" data-id="' + p.id + '">Link</button>' +
          '<button class="icon-btn" data-act="dup" data-id="' + p.id + '">Duplicate</button>' +
          '<button class="icon-btn danger" data-act="del" data-id="' + p.id + '">Delete</button>' +
          "</div></td>" +
          "</tr>"
        );
      })
      .join("");
    wrap.innerHTML =
      '<table class="history-table"><thead><tr><th>Client / Project</th><th class="h-date">Date</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>' +
      rows +
      "</tbody></table>";

    wrap.querySelectorAll("button[data-act]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const act = btn.dataset.act;
        const list = loadProposals();
        const p = list.find((x) => x.id === id);
        if (!p) return;

        if (act === "status") {
          p.status = STATUS_CYCLE[p.status] || "draft";
          saveProposals(list);
          renderHistory();
          renderStats();
        } else if (act === "open") {
          loadIntoForm(p);
          editingId = id;
          updateEditNote();
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (act === "copy") {
          const link = proposalLink(p);
          navigator.clipboard
            .writeText(link)
            .then(() => toast("Client link copied."))
            .catch(() => prompt("Copy this proposal link:", link));
        } else if (act === "dup") {
          const copy = Object.assign({}, p, {
            id: "p" + Date.now().toString(36),
            status: "draft",
            created: new Date().toISOString().slice(0, 10),
          });
          list.unshift(copy);
          saveProposals(list);
          renderHistory();
          renderStats();
          toast("Proposal duplicated.");
        } else if (act === "del") {
          if (!confirm("Delete this proposal? This can't be undone.")) return;
          saveProposals(list.filter((x) => x.id !== id));
          if (editingId === id) {
            editingId = null;
            updateEditNote();
          }
          renderHistory();
          renderStats();
        }
      });
    });
  }

  function loadIntoForm(p) {
    qty = {};
    checked = {};
    (p.items || []).forEach((i) => {
      checked[i.id] = true;
      qty[i.id] = i.qty;
    });
    $("c-name").value = p.client || "";
    $("c-company").value = p.company || "";
    $("c-email").value = p.email || "";
    $("c-title").value = p.title || "";
    $("c-notes").value = p.notes || "";
    $("c-valid").value = p.valid || "";
    $("m-rush").value = p.rushId || "none";
    $("m-miles").value = p.miles || 0;
    $("d-type").value = p.discountType || "none";
    $("d-value").value = p.discountValue || 0;
    $("dep-pct").value = p.depositPct != null ? p.depositPct : DEFAULT_DEPOSIT_PCT;
    renderCategories();
    recalc();
  }

  function renderStats() {
    const list = loadProposals();
    $("stat-drafts").textContent = list.filter((p) => p.status === "draft").length;
    $("stat-sent").textContent = list.filter((p) => p.status === "sent").length;
    const acceptedTotal = list.filter((p) => p.status === "accepted").reduce((s, p) => s + (p.total || 0), 0);
    $("stat-value").textContent = "$" + Math.round(acceptedTotal).toLocaleString("en-US");
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- Init ---------- */

  function renderAll() {
    renderCategories();
    recalc();
    renderHistory();
    renderStats();
  }

  if (sessionStorage.getItem(LS_AUTH) === "1") {
    unlock();
  }
})();
