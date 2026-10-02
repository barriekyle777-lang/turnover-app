const KEY = "turnover_v1";

const defaultState = {
  target: 1200000,
  rate: 0.5,
  workdays: 6,
  sales: []
};

let state = load();

function $(id) {
  return document.getElementById(id);
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      ...defaultState,
      ...saved
    };
  } catch {
    return {
      ...defaultState
    };
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
  render();
}

function money(value) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function currentSales() {
  const month = monthKey();

  return state.sales.filter(
    sale => sale.date.slice(0, 7) === month
  );
}

function workdaysRemaining() {
  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth();

  let count = 0;

  for (
    let date = new Date(year, month, now.getDate());
    date.getMonth() === month;
    date.setDate(date.getDate() + 1)
  ) {
    if (date.getDay() !== 0) {
      count++;
    }
  }

  return count;
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]
  );
}

function render() {
  const sales = currentSales();

  const total = sales.reduce(
    (sum, sale) => sum + Number(sale.amount),
    0
  );

  const commission =
    total * Number(state.rate) / 100;

  const remaining =
    Math.max(0, Number(state.target) - total);

  const percentage =
    state.target > 0
      ? Math.min(100, (total / state.target) * 100)
      : 0;

  $("monthName").textContent =
    new Date().toLocaleDateString("en-ZA", {
      month: "long",
      year: "numeric"
    });

  $("targetLabel").textContent =
    money(state.target);

  $("turnover").textContent =
    money(total);

  $("commission").textContent =
    money(commission);

  $("remaining").textContent =
    money(remaining);

  $("progressBar").style.width =
    percentage + "%";

  const today = todayString();

  const todaySales = sales.filter(
    sale => sale.date === today
  );

  const todayTotal = todaySales.reduce(
    (sum, sale) => sum + Number(sale.amount),
    0
  );

  $("todaySales").textContent =
    money(todayTotal);

  $("todayCount").textContent =
    todaySales.length +
    (todaySales.length === 1 ? " sale" : " sales");

  const daysLeft = workdaysRemaining();

  const dailyTarget =
    daysLeft > 0
      ? remaining / daysLeft
      : remaining;

  $("dailyTarget").textContent =
    money(dailyTarget);

  $("daysLeft").textContent =
    daysLeft +
    (daysLeft === 1
      ? " workday left"
      : " workdays left");

  const list = $("salesList");

  list.innerHTML = "";

  if (sales.length === 0) {
    list.innerHTML = `
      <div class="muted" style="padding:16px 0">
        No sales yet. Add your first sale above.
      </div>
    `;

    return;
  }

  sales
    .slice()
    .sort((a, b) =>
      b.date.localeCompare(a.date) ||
      b.id - a.id
    )
    .slice(0, 20)
    .forEach(sale => {

      const amount = Number(sale.amount);

      const saleCommission =
        amount * Number(state.rate) / 100;

      const dateText =
        new Date(
          sale.date + "T12:00:00"
        ).toLocaleDateString("en-ZA", {
          day: "2-digit",
          month: "short"
        });

      const element =
        document.createElement("div");

      element.className = "sale";

      element.innerHTML = `
        <div>
          <div class="sale-name">
            ${escapeHtml(sale.customer)}
          </div>

          <div class="sale-meta">
            ${dateText}
            ${sale.notes
              ? " · " + escapeHtml(sale.notes)
              : ""}
          </div>
        </div>

        <div class="sale-amount">
          ${money(amount)}

          <div class="sale-meta">
            ${money(saleCommission)}
          </div>
        </div>
      `;

      list.appendChild(element);
    });
}


/* ADD SALE */

$("addSaleBtn").onclick = () => {

  $("saleForm").reset();

  $("saleDate").value =
    todayString();

  $("saleDialog").showModal();
};


$("closeSale").onclick = () => {
  $("saleDialog").close();
};


$("saleForm").onsubmit = event => {

  event.preventDefault();

  const sale = {
    id: Date.now(),

    date: $("saleDate").value,

    customer:
      $("customer").value.trim(),

    amount:
      Number($("amount").value),

    notes:
      $("notes").value.trim()
  };

  if (
    !sale.customer ||
    !sale.amount ||
    sale.amount <= 0
  ) {
    return;
  }

  state.sales.push(sale);

  save();

  $("saleDialog").close();

  $("saleForm").reset();
};


/* SETTINGS */

$("settingsBtn").onclick = () => {

  $("targetInput").value =
    state.target;

  $("rateInput").value =
    state.rate;

  $("workdaysInput").value =
    state.workdays;

  $("settingsDialog").showModal();
};


$("closeSettings").onclick = () => {
  $("settingsDialog").close();
};


$("settingsForm").onsubmit = event => {

  event.preventDefault();

  state.target =
    Number($("targetInput").value) || 0;

  state.rate =
    Number($("rateInput").value) || 0;

  state.workdays =
    Number($("workdaysInput").value) || 6;

  save();

  $("settingsDialog").close();
};


/* CLEAR SALES */

$("clearBtn").onclick = () => {

  const confirmed =
    confirm(
      "Delete all saved sales on this device?"
    );

  if (confirmed) {

    state.sales = [];

    save();
  }
};


/* START APP */

render();