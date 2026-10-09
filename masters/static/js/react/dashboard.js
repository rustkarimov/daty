import { j as jsxRuntimeExports, r as reactExports, c as client } from "./chunk-react.js";
import { B as BreaksEditor } from "./chunk-BreaksEditor.js";
import { u as useModal } from "./chunk-useModal.js";
import { M as ModalProvider } from "./chunk-modals.js";
import "./chunk-vendor.js";
const calendar = "_calendar_1mdni_11";
const nav = "_nav_1mdni_29";
const navBtn = "_navBtn_1mdni_47";
const navTitle = "_navTitle_1mdni_107";
const weekdays = "_weekdays_1mdni_133";
const weekday = "_weekday_1mdni_133";
const dates = "_dates_1mdni_169";
const dateCell = "_dateCell_1mdni_191";
const empty = "_empty_1mdni_217";
const working = "_working_1mdni_231";
const nonWorking = "_nonWorking_1mdni_241";
const past = "_past_1mdni_255";
const today = "_today_1mdni_265";
const dateNumber = "_dateNumber_1mdni_277";
const dateTime = "_dateTime_1mdni_289";
const icons = "_icons_1mdni_311";
const bookingBadge = "_bookingBadge_1mdni_333";
const breakBadge = "_breakBadge_1mdni_363";
const loading$3 = "_loading_1mdni_415";
const styles$4 = {
  calendar,
  nav,
  navBtn,
  navTitle,
  weekdays,
  weekday,
  dates,
  dateCell,
  empty,
  working,
  nonWorking,
  past,
  today,
  dateNumber,
  dateTime,
  icons,
  bookingBadge,
  breakBadge,
  loading: loading$3
};
function DayCell({ day, dateStr, status, bookingCount, hasBreaks, isToday, isPast, onClick }) {
  const workingClass = (status == null ? void 0 : status.workingClass) || "";
  const statusText = (status == null ? void 0 : status.statusText) || "";
  const showIcons = !isPast;
  const className = [
    styles$4.dateCell,
    workingClass === "working" ? styles$4.working : "",
    workingClass === "non-working" ? styles$4.nonWorking : "",
    isPast ? styles$4.past : "",
    isToday ? styles$4.today : ""
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className, onClick: () => onClick(dateStr), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$4.dateNumber, children: day }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$4.dateTime, children: statusText }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.icons, children: [
      showIcons && bookingCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$4.bookingBadge, children: bookingCount }),
      showIcons && hasBreaks && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$4.breakBadge, title: "В этот день есть перерывы", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "svg",
        {
          width: "10",
          height: "10",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2.5",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "12 6 12 12 16 14" })
          ]
        }
      ) })
    ] })
  ] });
}
function MonthGrid({ year, month, calendarData, countsData, onDayClick }) {
  var _a;
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const today2 = /* @__PURE__ */ new Date();
  today2.setHours(0, 0, 0, 0);
  const adjustedStartWeekday = startWeekday === 0 ? 6 : startWeekday - 1;
  const emptyCells = [];
  for (let i = 0; i < adjustedStartWeekday; i++) {
    emptyCells.push(/* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${styles$4.dateCell} ${styles$4.empty}` }, `empty-${i}`));
  }
  function getDayStatus(day) {
    var _a2, _b, _c, _d, _e;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const currentDate = new Date(year, month, day);
    const dayOfWeek = currentDate.getDay();
    const dayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const extraDay = (_a2 = calendarData == null ? void 0 : calendarData.extra_days) == null ? void 0 : _a2[dateStr];
    const schedule = (_b = calendarData == null ? void 0 : calendarData.schedules) == null ? void 0 : _b[dayIdx];
    const isDayOff = (_c = calendarData == null ? void 0 : calendarData.days_off) == null ? void 0 : _c.includes(dateStr);
    let workingClass = "";
    let statusText = "";
    let hasBreaks = false;
    if (isDayOff) {
      workingClass = "non-working";
    } else if (extraDay) {
      workingClass = "working";
      statusText = `${extraDay.start} - ${extraDay.end}`;
      if (((_d = extraDay.breaks) == null ? void 0 : _d.length) > 0) hasBreaks = true;
    } else if (schedule) {
      workingClass = "working";
      statusText = `${schedule.start} - ${schedule.end}`;
      if (((_e = schedule.breaks) == null ? void 0 : _e.length) > 0) hasBreaks = true;
    } else {
      workingClass = "non-working";
    }
    return { workingClass, statusText, hasBreaks };
  }
  const dayCells = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const currentDate = new Date(year, month, d);
    const isPast = currentDate < today2;
    const isToday = currentDate.toDateString() === today2.toDateString();
    const status = getDayStatus(d);
    const bookingCount = ((_a = countsData == null ? void 0 : countsData.counts) == null ? void 0 : _a[dateStr]) || 0;
    dayCells.push(
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        DayCell,
        {
          day: d,
          dateStr,
          status,
          bookingCount,
          hasBreaks: status.hasBreaks,
          isToday,
          isPast,
          onClick: onDayClick
        },
        dateStr
      )
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$4.weekdays, children: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$4.weekday, children: d }, d)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.dates, children: [
      emptyCells,
      dayCells
    ] })
  ] });
}
async function loadMasterCategories(masterSlug) {
  const r = await fetch(`/api/master/${masterSlug}/categories/`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function loadAvailableDates(masterSlug, totalDuration) {
  const r = await fetch(`/api/${masterSlug}/dates/?total_duration=${totalDuration}&limit=60`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function createMultipleBookings(masterSlug, data) {
  const r = await fetch(`/api/${masterSlug}/book-multiple/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie$4("csrftoken")
    },
    body: JSON.stringify(data)
  });
  return r.json();
}
function getCookie$4(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
async function loadDayStatus(date) {
  const r = await fetch(`/api/day-status/?date=${date}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function loadBookingsByDate(date) {
  const r = await fetch(`/api/bookings/by-date/?date=${date}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function makeDayOff(date) {
  const r = await fetch("/api/days-off/add/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie$3("csrftoken")
    },
    body: JSON.stringify({ date, reason: "Выходной" })
  });
  return r.json();
}
async function makeDayWorking(date) {
  const r = await fetch("/api/extra-days/add/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie$3("csrftoken")
    },
    body: JSON.stringify({
      date,
      start_time: "09:00",
      end_time: "18:00",
      breaks: []
    })
  });
  return r.json();
}
function getCookie$3(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
async function deleteBooking(bookingId) {
  const r = await fetch(`/api/booking/${bookingId}/delete/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie$3("csrftoken")
    }
  });
  return r.json();
}
async function loadBookingForEdit(bookingId) {
  const r = await fetch(`/api/booking/${bookingId}/get/`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function updateBooking(bookingId, data) {
  const r = await fetch(`/api/booking/${bookingId}/update/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie$3("csrftoken")
    },
    body: JSON.stringify(data)
  });
  return r.json();
}
function phoneMask(value) {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits[0] !== "7" && digits[0] !== "8") {
    digits = "7" + digits;
  }
  if (digits[0] === "8") {
    digits = "7" + digits.slice(1);
  }
  if (digits.length > 11) digits = digits.slice(0, 11);
  let formatted = digits[0];
  if (digits.length > 1) formatted += " " + digits.slice(1, 4);
  if (digits.length > 4) formatted += " " + digits.slice(4, 7);
  if (digits.length > 7) formatted += "-" + digits.slice(7, 9);
  if (digits.length > 9) formatted += "-" + digits.slice(9, 11);
  return formatted;
}
const backdrop$2 = "_backdrop_yrfp6_13";
const modal$2 = "_modal_yrfp6_39";
const header$2 = "_header_yrfp6_69";
const title$3 = "_title_yrfp6_89";
const closeBtn$2 = "_closeBtn_yrfp6_109";
const body$2 = "_body_yrfp6_145";
const loading$2 = "_loading_yrfp6_159";
const sectionLabel = "_sectionLabel_yrfp6_171";
const sectionLabelTop = "_sectionLabelTop_yrfp6_187";
const categoryLabel = "_categoryLabel_yrfp6_197";
const grid = "_grid_yrfp6_215";
const serviceCard = "_serviceCard_yrfp6_231";
const serviceCardSelected = "_serviceCardSelected_yrfp6_263";
const serviceCloseBtn = "_serviceCloseBtn_yrfp6_275";
const serviceCardHeader = "_serviceCardHeader_yrfp6_333";
const serviceCardName = "_serviceCardName_yrfp6_347";
const serviceCardPrice = "_serviceCardPrice_yrfp6_359";
const serviceCardMeta = "_serviceCardMeta_yrfp6_373";
const dateGrid = "_dateGrid_yrfp6_387";
const dateCard = "_dateCard_yrfp6_405";
const dateCardSelected = "_dateCardSelected_yrfp6_437";
const dateCardWeekday = "_dateCardWeekday_yrfp6_447";
const dateCardDay = "_dateCardDay_yrfp6_459";
const slotGrid = "_slotGrid_yrfp6_475";
const slotCard = "_slotCard_yrfp6_495";
const slotCardSelected = "_slotCardSelected_yrfp6_533";
const emptyText = "_emptyText_yrfp6_545";
const summaryBox = "_summaryBox_yrfp6_559";
const summaryTitle = "_summaryTitle_yrfp6_575";
const summaryRow = "_summaryRow_yrfp6_597";
const summaryRowMeta = "_summaryRowMeta_yrfp6_623";
const summaryTotal = "_summaryTotal_yrfp6_633";
const summaryTotalValue = "_summaryTotalValue_yrfp6_655";
const summaryMeta = "_summaryMeta_yrfp6_663";
const summaryMetaItem = "_summaryMetaItem_yrfp6_679";
const formInput = "_formInput_yrfp6_693";
const formTextarea = "_formTextarea_yrfp6_695";
const footer$2 = "_footer_yrfp6_775";
const btnSecondary$2 = "_btnSecondary_yrfp6_795";
const btnPink$1 = "_btnPink_yrfp6_839";
const shared = {
  backdrop: backdrop$2,
  modal: modal$2,
  header: header$2,
  title: title$3,
  closeBtn: closeBtn$2,
  body: body$2,
  loading: loading$2,
  sectionLabel,
  sectionLabelTop,
  categoryLabel,
  grid,
  serviceCard,
  serviceCardSelected,
  serviceCloseBtn,
  serviceCardHeader,
  serviceCardName,
  serviceCardPrice,
  serviceCardMeta,
  dateGrid,
  dateCard,
  dateCardSelected,
  dateCardWeekday,
  dateCardDay,
  slotGrid,
  slotCard,
  slotCardSelected,
  emptyText,
  summaryBox,
  summaryTitle,
  summaryRow,
  summaryRowMeta,
  summaryTotal,
  summaryTotalValue,
  summaryMeta,
  summaryMetaItem,
  formInput,
  formTextarea,
  footer: footer$2,
  btnSecondary: btnSecondary$2,
  btnPink: btnPink$1
};
const MONTH_NAMES$3 = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря"
];
const WEEKDAY_NAMES$2 = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота"
];
function formatDate$1(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const dObj = new Date(y, m - 1, d);
  return `${dObj.getDate()} ${MONTH_NAMES$3[dObj.getMonth()]} (${WEEKDAY_NAMES$2[dObj.getDay()]})`;
}
function EditBookingModal({ bookingId, masterSlug, onClose, onSaved }) {
  const [form, setForm] = reactExports.useState(null);
  const [categories, setCategories] = reactExports.useState([]);
  const [uncategorized, setUncategorized] = reactExports.useState([]);
  const [selectedService, setSelectedService] = reactExports.useState(null);
  const [availableDates, setAvailableDates] = reactExports.useState([]);
  const [availableSlots, setAvailableSlots] = reactExports.useState([]);
  const [selectedDate, setSelectedDate] = reactExports.useState("");
  const [selectedTime, setSelectedTime] = reactExports.useState("");
  const [clientName, setClientName] = reactExports.useState("");
  const [clientPhone, setClientPhone] = reactExports.useState("");
  const [comment, setComment] = reactExports.useState("");
  const [loading2, setLoading] = reactExports.useState(true);
  const [loadingDates, setLoadingDates] = reactExports.useState(false);
  const [loadingSlots, setLoadingSlots] = reactExports.useState(false);
  const [saving, setSaving] = reactExports.useState(false);
  const { showAlert } = useModal();
  const slotsRef = reactExports.useRef(null);
  const summaryRef = reactExports.useRef(null);
  const datesRef = reactExports.useRef(null);
  const bodyRef = reactExports.useRef(null);
  const shouldScrollToDates = reactExports.useRef(false);
  reactExports.useEffect(() => {
    setLoading(true);
    loadBookingForEdit(bookingId).then((data) => {
      setForm(data);
      setSelectedDate(data.date);
      setSelectedTime(data.time);
      setClientName(data.client_name || "");
      setClientPhone(data.client_phone ? phoneMask(data.client_phone) : "");
      setComment(data.comment || "");
      setLoading(false);
    }).catch((error) => {
      console.error("Ошибка загрузки записи:", error);
      setLoading(false);
    });
  }, [bookingId]);
  reactExports.useEffect(() => {
    loadMasterCategories(masterSlug).then((data) => {
      setCategories(data.categories || []);
      setUncategorized(data.uncategorized || []);
    }).catch((error) => {
      console.error("Ошибка загрузки услуг:", error);
    });
  }, [masterSlug]);
  reactExports.useEffect(() => {
    if (!form || categories.length === 0) return;
    if (selectedService) return;
    const allServices = [
      ...categories.flatMap((c) => c.services.map((s) => ({ ...s, category_name: c.name }))),
      ...uncategorized.map((s) => ({ ...s, category_name: null }))
    ];
    const found = allServices.find((s) => s.id === form.service_id);
    if (found) setSelectedService(found);
  }, [form, categories, uncategorized, selectedService]);
  reactExports.useEffect(() => {
    if (!selectedService) return;
    setLoadingDates(true);
    loadAvailableDates(masterSlug, selectedService.duration).then((data) => {
      setAvailableDates(data.dates || []);
      setLoadingDates(false);
    }).catch((error) => {
      console.error("Ошибка загрузки дат:", error);
      setLoadingDates(false);
    });
  }, [selectedService, masterSlug]);
  reactExports.useEffect(() => {
    if (!shouldScrollToDates.current) return;
    if (loadingDates) return;
    if (availableDates.length === 0) return;
    if (!datesRef.current || !bodyRef.current) return;
    shouldScrollToDates.current = false;
    const bodyEl = bodyRef.current;
    const datesEl = datesRef.current;
    const targetTop = datesEl.offsetTop - bodyEl.offsetTop - 8;
    bodyEl.scrollTo({ top: targetTop, behavior: "smooth" });
  }, [availableDates, loadingDates]);
  reactExports.useEffect(() => {
    if (!selectedService || !selectedDate) return;
    setLoadingSlots(true);
    fetch(`/api/${masterSlug}/slots/?total_duration=${selectedService.duration}&date=${selectedDate}&exclude_booking_id=${bookingId}&original_booking_id=${bookingId}`).then((r) => r.json()).then((data) => {
      setAvailableSlots(data.slots || []);
      setLoadingSlots(false);
    }).catch((error) => {
      console.error("Ошибка загрузки слотов:", error);
      setLoadingSlots(false);
    });
  }, [selectedDate, selectedService, masterSlug, bookingId]);
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
  function selectService(service) {
    setSelectedService(service);
    setSelectedDate("");
    setSelectedTime("");
    shouldScrollToDates.current = true;
  }
  function handleDateClick(date) {
    setSelectedDate(date);
    setSelectedTime("");
    setTimeout(() => {
      if (slotsRef.current) {
        slotsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);
  }
  function handleTimeClick(time) {
    setSelectedTime(time);
    setTimeout(() => {
      if (summaryRef.current) {
        summaryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);
  }
  function isServiceSelected(serviceId) {
    return (selectedService == null ? void 0 : selectedService.id) === serviceId;
  }
  async function handleSave() {
    if (!selectedService) {
      showAlert("Выберите услугу", "warning");
      return;
    }
    if (!selectedDate) {
      showAlert("Выберите дату", "warning");
      return;
    }
    if (!selectedTime) {
      showAlert("Выберите время", "warning");
      return;
    }
    if (!clientName.trim()) {
      showAlert("Введите имя клиента", "warning");
      return;
    }
    const phoneCleaned = clientPhone.replace(/\D/g, "");
    if (phoneCleaned.length !== 11) {
      showAlert("Телефон должен содержать 11 цифр", "warning");
      return;
    }
    setSaving(true);
    try {
      const data = await updateBooking(bookingId, {
        service_id: selectedService.id,
        client_name: clientName.trim(),
        client_phone: phoneCleaned,
        date: selectedDate,
        time: selectedTime,
        comment: comment.trim(),
        status: form.status || "confirmed"
      });
      if (data.success) {
        if (onSaved) onSaved();
        onClose();
      } else {
        showAlert(data.error || "Ошибка сохранения", "error");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      showAlert("Ошибка соединения", "error");
    } finally {
      setSaving(false);
    }
  }
  function renderServiceCard(s, categoryName) {
    const selected = isServiceSelected(s.id);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `${shared.serviceCard} ${selected ? shared.serviceCardSelected : ""}`,
        onClick: () => selectService({ ...s, category_name: categoryName }),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.serviceCardHeader, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.serviceCardName, children: s.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: shared.serviceCardPrice, children: [
              s.price,
              " ₽"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.serviceCardMeta, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "far fa-clock me-1" }),
            s.duration,
            " мин"
          ] })
        ]
      },
      s.id
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.backdrop, onClick: handleBackdropClick, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.modal, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.header, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h5", { className: shared.title, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-edit", style: { color: "var(--primary)" } }),
        "Редактирование записи"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: shared.closeBtn,
          onClick: onClose,
          "aria-label": "Закрыть",
          children: "✕"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.body, ref: bodyRef, children: loading2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-border", style: { color: "#4053d3" } }) }) : !form ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-danger", children: "Не удалось загрузить данные" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: shared.sectionLabel, children: "Услуга" }),
      categories.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "12px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.categoryLabel, children: cat.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.grid, children: cat.services.map((s) => renderServiceCard(s, cat.name)) })
      ] }, cat.id)),
      uncategorized.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "12px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.categoryLabel, children: "Без категории" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.grid, children: uncategorized.map((s) => renderServiceCard(s, null)) })
      ] }),
      selectedService && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: `${shared.sectionLabel} ${shared.sectionLabelTop}`, children: "Дата и время" }),
        loadingDates ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-border spinner-border-sm", style: { color: "#4053d3" } }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.dateGrid, ref: datesRef, children: availableDates.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: `${shared.dateCard} ${selectedDate === d.date ? shared.dateCardSelected : ""}`,
            onClick: () => handleDateClick(d.date),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.dateCardWeekday, children: d.day_of_week }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.dateCardDay, children: d.display })
            ]
          },
          d.date
        )) }),
        selectedDate && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: slotsRef, children: loadingSlots ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-border spinner-border-sm", style: { color: "#4053d3" } }) }) : availableSlots.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: shared.emptyText, children: "Нет свободных слотов" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.slotGrid, children: availableSlots.map((slot) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: `${shared.slotCard} ${selectedTime === slot.start ? shared.slotCardSelected : ""}`,
            onClick: () => handleTimeClick(slot.start),
            children: slot.start
          },
          slot.start
        )) }) })
      ] }),
      selectedTime && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.summaryBox, ref: summaryRef, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.summaryTitle, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-list" }),
            "Услуга"
          ] }),
          selectedService && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.summaryRow, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: selectedService.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: shared.summaryRowMeta, children: [
              selectedService.duration,
              " мин · ",
              selectedService.price,
              " ₽"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.summaryMeta, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: shared.summaryMetaItem, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "far fa-calendar-alt" }),
              formatDate$1(selectedDate)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: shared.summaryMetaItem, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "far fa-clock" }),
              selectedTime
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: shared.sectionLabel, children: "Данные клиента" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            className: shared.formInput,
            placeholder: "Имя клиента",
            value: clientName,
            onChange: (e) => setClientName(e.target.value)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "tel",
            className: shared.formInput,
            placeholder: "7 999 123-45-67",
            value: clientPhone,
            onChange: (e) => setClientPhone(phoneMask(e.target.value))
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            className: shared.formTextarea,
            rows: "2",
            placeholder: "Комментарий (необязательно)",
            value: comment,
            onChange: (e) => setComment(e.target.value)
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.footer, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: shared.btnSecondary,
          onClick: onClose,
          disabled: saving,
          children: "Отмена"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: shared.btnPink,
          onClick: handleSave,
          disabled: saving || !selectedService || !selectedTime || !clientName,
          children: saving ? "Сохранение..." : "Сохранить"
        }
      )
    ] })
  ] }) });
}
const MONTH_NAMES$2 = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря"
];
const WEEKDAY_NAMES$1 = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота"
];
function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const dObj = new Date(y, m - 1, d);
  return `${dObj.getDate()} ${MONTH_NAMES$2[dObj.getMonth()]} (${WEEKDAY_NAMES$1[dObj.getDay()]})`;
}
function AddBookingModal({ masterSlug, defaultDate, onClose, onCreated }) {
  const [categories, setCategories] = reactExports.useState([]);
  const [uncategorized, setUncategorized] = reactExports.useState([]);
  const [selectedServices, setSelectedServices] = reactExports.useState([]);
  const [availableDates, setAvailableDates] = reactExports.useState([]);
  const [availableSlots, setAvailableSlots] = reactExports.useState([]);
  const [selectedDate, setSelectedDate] = reactExports.useState(defaultDate || "");
  const [selectedTime, setSelectedTime] = reactExports.useState("");
  const [clientName, setClientName] = reactExports.useState("");
  const [clientPhone, setClientPhone] = reactExports.useState("");
  const [comment, setComment] = reactExports.useState("");
  const [loading2, setLoading] = reactExports.useState(true);
  const [loadingDates, setLoadingDates] = reactExports.useState(false);
  const [loadingSlots, setLoadingSlots] = reactExports.useState(false);
  const [saving, setSaving] = reactExports.useState(false);
  const { showAlert } = useModal();
  const slotsRef = reactExports.useRef(null);
  const summaryRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    loadMasterCategories(masterSlug).then((data) => {
      setCategories(data.categories || []);
      setUncategorized(data.uncategorized || []);
      setLoading(false);
    }).catch((error) => {
      console.error("Ошибка загрузки услуг:", error);
      setLoading(false);
    });
  }, [masterSlug]);
  reactExports.useEffect(() => {
    if (selectedServices.length === 0) {
      setAvailableDates([]);
      setAvailableSlots([]);
      return;
    }
    const totalDuration2 = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    setLoadingDates(true);
    loadAvailableDates(masterSlug, totalDuration2).then((data) => {
      setAvailableDates(data.dates || []);
      setLoadingDates(false);
    }).catch((error) => {
      console.error("Ошибка загрузки дат:", error);
      setLoadingDates(false);
    });
  }, [selectedServices, masterSlug]);
  reactExports.useEffect(() => {
    if (selectedServices.length === 0 || !selectedDate) {
      setAvailableSlots([]);
      return;
    }
    const totalDuration2 = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    setLoadingSlots(true);
    fetch(`/api/${masterSlug}/slots/?total_duration=${totalDuration2}&date=${selectedDate}`).then((r) => r.json()).then((data) => {
      setAvailableSlots(data.slots || []);
      setLoadingSlots(false);
      setSelectedTime("");
    }).catch((error) => {
      console.error("Ошибка загрузки слотов:", error);
      setLoadingSlots(false);
    });
  }, [selectedDate, selectedServices, masterSlug]);
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }
  function toggleService(service) {
    const exists = selectedServices.find((s) => s.id === service.id);
    if (exists) {
      const newList = selectedServices.filter((s) => s.id !== service.id);
      setSelectedServices(newList);
      setSelectedDate(defaultDate || "");
      setSelectedTime("");
    } else {
      if (selectedServices.length >= 3) {
        showAlert("Можно выбрать не более 3 услуг", "warning");
        return;
      }
      const newList = [...selectedServices, service];
      setSelectedServices(newList);
      setSelectedDate(defaultDate || "");
      setSelectedTime("");
    }
  }
  function handleDateClick(date) {
    setSelectedDate(date);
    setSelectedTime("");
    setTimeout(() => {
      if (slotsRef.current) {
        slotsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);
  }
  function handleTimeClick(time) {
    setSelectedTime(time);
    setTimeout(() => {
      if (summaryRef.current) {
        summaryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);
  }
  function isSelected(serviceId) {
    return selectedServices.some((s) => s.id === serviceId);
  }
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  async function handleSave() {
    if (selectedServices.length === 0) {
      showAlert("Выберите хотя бы одну услугу", "warning");
      return;
    }
    if (!selectedDate) {
      showAlert("Выберите дату", "warning");
      return;
    }
    if (!selectedTime) {
      showAlert("Выберите время", "warning");
      return;
    }
    if (!clientName.trim()) {
      showAlert("Введите имя клиента", "warning");
      return;
    }
    const phoneCleaned = clientPhone.replace(/\D/g, "");
    if (phoneCleaned.length !== 11) {
      showAlert("Телефон должен содержать 11 цифр", "warning");
      return;
    }
    setSaving(true);
    try {
      const data = await createMultipleBookings(masterSlug, {
        services: selectedServices.map((s) => s.id),
        client_name: clientName.trim(),
        client_phone: phoneCleaned,
        date: selectedDate,
        start_time: selectedTime,
        comment: comment.trim(),
        created_by: "master"
      });
      if (data.success) {
        if (onCreated) onCreated();
        onClose();
      } else {
        showAlert(data.error || "Ошибка создания записи", "error");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      showAlert("Ошибка соединения", "error");
    } finally {
      setSaving(false);
    }
  }
  function renderServiceCard(s, categoryName) {
    const selected = isSelected(s.id);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: `${shared.serviceCard} ${selected ? shared.serviceCardSelected : ""}`,
        onClick: () => toggleService({ ...s, category_name: categoryName }),
        children: [
          selected && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: shared.serviceCloseBtn,
              onClick: (e) => {
                e.stopPropagation();
                toggleService({ ...s, category_name: categoryName });
              },
              "aria-label": "Убрать услугу",
              children: "✕"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.serviceCardHeader, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.serviceCardName, children: s.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: shared.serviceCardPrice, children: [
              s.price,
              " ₽"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.serviceCardMeta, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "far fa-clock me-1" }),
            s.duration,
            " мин"
          ] })
        ]
      },
      s.id
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.backdrop, onClick: handleBackdropClick, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.modal, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.header, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h5", { className: shared.title, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-plus", style: { color: "var(--primary)" } }),
        "Добавить запись"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: shared.closeBtn,
          onClick: onClose,
          "aria-label": "Закрыть",
          children: "✕"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.body, children: loading2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-border", style: { color: "#4053d3" } }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: shared.sectionLabel, children: "Шаг 1: Выберите услуги (до 3)" }),
      categories.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "12px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.categoryLabel, children: cat.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.grid, children: cat.services.map((s) => renderServiceCard(s, cat.name)) })
      ] }, cat.id)),
      uncategorized.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "12px" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.categoryLabel, children: "Без категории" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.grid, children: uncategorized.map((s) => renderServiceCard(s, null)) })
      ] }),
      selectedServices.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: `${shared.sectionLabel} ${shared.sectionLabelTop}`, children: "Шаг 2: Дата и время" }),
        loadingDates ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-border spinner-border-sm", style: { color: "#4053d3" } }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.dateGrid, children: availableDates.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: `${shared.dateCard} ${selectedDate === d.date ? shared.dateCardSelected : ""}`,
            onClick: () => handleDateClick(d.date),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.dateCardWeekday, children: d.day_of_week }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.dateCardDay, children: d.display })
            ]
          },
          d.date
        )) }),
        selectedDate && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: slotsRef, children: loadingSlots ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-border spinner-border-sm", style: { color: "#4053d3" } }) }) : availableSlots.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: shared.emptyText, children: "Нет свободных слотов" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shared.slotGrid, children: availableSlots.map((slot) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: `${shared.slotCard} ${selectedTime === slot.start ? shared.slotCardSelected : ""}`,
            onClick: () => handleTimeClick(slot.start),
            children: slot.start
          },
          slot.start
        )) }) })
      ] }),
      selectedTime && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.summaryBox, ref: summaryRef, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.summaryTitle, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-list" }),
            "Выбранные услуги"
          ] }),
          selectedServices.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.summaryRow, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: s.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: shared.summaryRowMeta, children: [
              s.duration,
              " мин · ",
              s.price,
              " ₽"
            ] })
          ] }, s.id)),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.summaryTotal, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Итого" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: shared.summaryTotalValue, children: [
              totalDuration,
              " мин · ",
              totalPrice,
              " ₽"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.summaryMeta, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: shared.summaryMetaItem, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "far fa-calendar-alt" }),
              formatDate(selectedDate)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: shared.summaryMetaItem, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "far fa-clock" }),
              selectedTime
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: shared.sectionLabel, children: "Шаг 3: Данные клиента" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            className: shared.formInput,
            placeholder: "Имя клиента",
            value: clientName,
            onChange: (e) => setClientName(e.target.value)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "tel",
            className: shared.formInput,
            placeholder: "7 999 123-45-67",
            value: clientPhone,
            onChange: (e) => setClientPhone(phoneMask(e.target.value))
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            className: shared.formTextarea,
            rows: "2",
            placeholder: "Комментарий (необязательно)",
            value: comment,
            onChange: (e) => setComment(e.target.value)
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shared.footer, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: shared.btnSecondary,
          onClick: onClose,
          disabled: saving,
          children: "Отмена"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: shared.btnPink,
          onClick: handleSave,
          disabled: saving || selectedServices.length === 0 || !selectedTime || !clientName,
          children: saving ? "Сохранение..." : "Создать запись"
        }
      )
    ] })
  ] }) });
}
const backdrop$1 = "_backdrop_iwppj_11";
const modal$1 = "_modal_iwppj_37";
const header$1 = "_header_iwppj_67";
const title$2 = "_title_iwppj_87";
const closeBtn$1 = "_closeBtn_iwppj_107";
const body$1 = "_body_iwppj_143";
const loading$1 = "_loading_iwppj_157";
const dayInfo = "_dayInfo_iwppj_169";
const dayInfoOff = "_dayInfoOff_iwppj_185";
const dayInfoWork = "_dayInfoWork_iwppj_199";
const dayInfoLabel = "_dayInfoLabel_iwppj_223";
const dayInfoValue = "_dayInfoValue_iwppj_233";
const hoursInput = "_hoursInput_iwppj_263";
const hoursSeparator = "_hoursSeparator_iwppj_295";
const iconBtn$1 = "_iconBtn_iwppj_305";
const iconBtnSuccess = "_iconBtnSuccess_iwppj_347";
const iconBtnSecondary = "_iconBtnSecondary_iwppj_365";
const breaksBlock = "_breaksBlock_iwppj_385";
const actions = "_actions_iwppj_395";
const btnSoftBlue = "_btnSoftBlue_iwppj_409";
const btnSuccess = "_btnSuccess_iwppj_449";
const btnPink = "_btnPink_iwppj_489";
const divider$1 = "_divider_iwppj_529";
const bookingsTitle = "_bookingsTitle_iwppj_543";
const emptyState$1 = "_emptyState_iwppj_565";
const tableWrapper$1 = "_tableWrapper_iwppj_579";
const table$1 = "_table_iwppj_579";
const actionsCell$1 = "_actionsCell_iwppj_645";
const actionIcons = "_actionIcons_iwppj_653";
const actionIconBtn = "_actionIconBtn_iwppj_665";
const actionIconBtnDelete = "_actionIconBtnDelete_iwppj_707";
const footer$1 = "_footer_iwppj_719";
const btnSecondary$1 = "_btnSecondary_iwppj_739";
const styles$3 = {
  backdrop: backdrop$1,
  modal: modal$1,
  header: header$1,
  title: title$2,
  closeBtn: closeBtn$1,
  body: body$1,
  loading: loading$1,
  dayInfo,
  dayInfoOff,
  dayInfoWork,
  dayInfoLabel,
  dayInfoValue,
  hoursInput,
  hoursSeparator,
  iconBtn: iconBtn$1,
  iconBtnSuccess,
  iconBtnSecondary,
  breaksBlock,
  actions,
  btnSoftBlue,
  btnSuccess,
  btnPink,
  divider: divider$1,
  bookingsTitle,
  emptyState: emptyState$1,
  tableWrapper: tableWrapper$1,
  table: table$1,
  actionsCell: actionsCell$1,
  actionIcons,
  actionIconBtn,
  actionIconBtnDelete,
  footer: footer$1,
  btnSecondary: btnSecondary$1
};
const MONTH_NAMES$1 = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря"
];
const WEEKDAY_NAMES = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота"
];
function DayModal({ dateStr, masterSlug, onClose, onDataChanged }) {
  const [dayData, setDayData] = reactExports.useState(null);
  const [bookings, setBookings] = reactExports.useState([]);
  const [breaks, setBreaks] = reactExports.useState([]);
  const [loading2, setLoading] = reactExports.useState(true);
  const [editingBookingId, setEditingBookingId] = reactExports.useState(null);
  const [showAddBooking, setShowAddBooking] = reactExports.useState(false);
  const [editingHours, setEditingHours] = reactExports.useState(false);
  const [editHours, setEditHours] = reactExports.useState({ start: "", end: "" });
  const { showAlert, showConfirm } = useModal();
  const dateObj = new Date(dateStr);
  const dateTitle = `${dateObj.getDate()} ${MONTH_NAMES$1[dateObj.getMonth()]} (${WEEKDAY_NAMES[dateObj.getDay()]})`;
  reactExports.useEffect(() => {
    setLoading(true);
    Promise.all([loadDayStatus(dateStr), loadBookingsByDate(dateStr)]).then(([status, bookingsData]) => {
      setDayData(status);
      setBookings(bookingsData.bookings || []);
      setBreaks(status.breaks || []);
      setLoading(false);
    }).catch((error) => {
      console.error("Ошибка загрузки дня:", error);
      setLoading(false);
    });
  }, [dateStr]);
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
  async function handleMakeDayOff() {
    const ok = await showConfirm("Сделать этот день выходным?");
    if (!ok) return;
    makeDayOff(dateStr).then((data) => {
      if (data.success) {
        if (onDataChanged) onDataChanged("День сделан выходным");
        onClose();
      } else {
        showAlert(data.error || "Ошибка", "error");
      }
    }).catch((error) => {
      console.error("Ошибка:", error);
      showAlert("Ошибка соединения", "error");
    });
  }
  async function handleMakeDayWorking() {
    const ok = await showConfirm("Сделать этот день рабочим? Будут установлены часы 09:00-18:00.");
    if (!ok) return;
    makeDayWorking(dateStr).then((data) => {
      if (data.success) {
        if (onDataChanged) onDataChanged("День сделан рабочим");
        onClose();
      } else {
        showAlert(data.error || "Ошибка", "error");
      }
    }).catch((error) => {
      console.error("Ошибка:", error);
      showAlert("Ошибка соединения", "error");
    });
  }
  async function saveBreaks(newBreaks) {
    const workStart = (dayData == null ? void 0 : dayData.extra_start) || (dayData == null ? void 0 : dayData.schedule_start) || "09:00";
    const workEnd = (dayData == null ? void 0 : dayData.extra_end) || (dayData == null ? void 0 : dayData.schedule_end) || "18:00";
    try {
      const r = await fetch("/api/extra-days/add/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie$2("csrftoken")
        },
        body: JSON.stringify({
          date: dateStr,
          start_time: workStart,
          end_time: workEnd,
          breaks: newBreaks.filter((b) => b.start && b.end)
        })
      });
      const data = await r.json();
      if (!data.success) {
        showAlert(data.error || "Ошибка сохранения", "error");
      } else {
        setBreaks(newBreaks.filter((b) => b.start && b.end));
        if (onDataChanged) onDataChanged();
      }
    } catch (error) {
      console.error("Ошибка:", error);
      showAlert("Ошибка соединения", "error");
    }
  }
  async function handleDeleteBooking(bookingId, clientName, time) {
    const ok = await showConfirm(
      `Удалить запись клиента "${clientName}" на ${time}?`,
      { type: "danger" }
    );
    if (!ok) return;
    try {
      const data = await deleteBooking(bookingId);
      if (data.success) {
        const bookingsData = await loadBookingsByDate(dateStr);
        setBookings(bookingsData.bookings || []);
        if (onDataChanged) onDataChanged("Запись удалена");
      } else {
        showAlert(data.error || "Ошибка удаления", "error");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      showAlert("Ошибка соединения", "error");
    }
  }
  function handleEditBooking(bookingId) {
    setEditingBookingId(bookingId);
  }
  function handleCloseEditModal() {
    setEditingBookingId(null);
  }
  async function handleSavedEdit() {
    try {
      const bookingsData = await loadBookingsByDate(dateStr);
      setBookings(bookingsData.bookings || []);
      if (onDataChanged) onDataChanged("Запись обновлена");
    } catch (error) {
      console.error("Ошибка перезагрузки записей:", error);
    }
  }
  function handleOpenAddBooking() {
    setShowAddBooking(true);
  }
  function handleCloseAddBooking() {
    setShowAddBooking(false);
  }
  async function handleBookingCreated() {
    try {
      const bookingsData = await loadBookingsByDate(dateStr);
      setBookings(bookingsData.bookings || []);
      if (onDataChanged) onDataChanged("Запись добавлена");
    } catch (error) {
      console.error("Ошибка перезагрузки записей:", error);
    }
  }
  function startEditingHours() {
    const start = (dayData == null ? void 0 : dayData.extra_start) || (dayData == null ? void 0 : dayData.schedule_start) || "09:00";
    const end = (dayData == null ? void 0 : dayData.extra_end) || (dayData == null ? void 0 : dayData.schedule_end) || "18:00";
    setEditHours({ start, end });
    setEditingHours(true);
  }
  function cancelEditingHours() {
    setEditingHours(false);
  }
  async function saveHours() {
    if (!editHours.start || !editHours.end) {
      showAlert("Заполните начало и конец работы", "warning");
      return;
    }
    if (editHours.start >= editHours.end) {
      showAlert("Начало не может быть позже окончания", "warning");
      return;
    }
    try {
      const r = await fetch("/api/extra-days/add/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie$2("csrftoken")
        },
        body: JSON.stringify({
          date: dateStr,
          start_time: editHours.start,
          end_time: editHours.end,
          breaks: breaks.filter((b) => b.start && b.end)
        })
      });
      const data = await r.json();
      if (!data.success) {
        showAlert(data.error || "Ошибка сохранения", "error");
      } else {
        setEditingHours(false);
        const status = await loadDayStatus(dateStr);
        setDayData(status);
        setBreaks(status.breaks || []);
        if (onDataChanged) onDataChanged();
      }
    } catch (error) {
      console.error("Ошибка:", error);
      showAlert("Ошибка соединения", "error");
    }
  }
  const isDayOff = (dayData == null ? void 0 : dayData.is_day_off) || !((dayData == null ? void 0 : dayData.has_schedule) || (dayData == null ? void 0 : dayData.is_extra));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.backdrop, onClick: handleBackdropClick, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.modal, onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.header, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h5", { className: styles$3.title, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "far fa-calendar-alt", style: { color: "var(--primary)" } }),
          dateTitle
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: styles$3.closeBtn,
            onClick: onClose,
            "aria-label": "Закрыть",
            children: "✕"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.body, children: loading2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-border", style: { color: "#4053d3" } }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.dayInfo, children: isDayOff ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.dayInfoOff, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-bed" }),
          "Выходной день"
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.dayInfoWork, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.dayInfoLabel, children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Работаю:" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.dayInfoValue, children: editingHours ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "time",
                className: styles$3.hoursInput,
                value: editHours.start,
                onChange: (e) => setEditHours({ ...editHours, start: e.target.value })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$3.hoursSeparator, children: "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "time",
                className: styles$3.hoursInput,
                value: editHours.end,
                onChange: (e) => setEditHours({ ...editHours, end: e.target.value })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: `${styles$3.iconBtn} ${styles$3.iconBtnSuccess}`, onClick: saveHours, title: "Сохранить", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-check" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: `${styles$3.iconBtn} ${styles$3.iconBtnSecondary}`, onClick: cancelEditingHours, title: "Отмена", children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-times" }) })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            (dayData == null ? void 0 : dayData.extra_start) || (dayData == null ? void 0 : dayData.schedule_start),
            " -",
            " ",
            (dayData == null ? void 0 : dayData.extra_end) || (dayData == null ? void 0 : dayData.schedule_end),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: styles$3.iconBtn, onClick: startEditingHours, children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-edit" }) })
          ] }) })
        ] }) }),
        !isDayOff && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.breaksBlock, children: /* @__PURE__ */ jsxRuntimeExports.jsx(BreaksEditor, { breaks, onChange: saveBreaks }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.actions, children: [
          isDayOff ? /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: styles$3.btnSuccess, onClick: handleMakeDayWorking, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-calendar-check" }),
            "Сделать рабочим днём"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: styles$3.btnSoftBlue, onClick: handleMakeDayOff, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-calendar-times" }),
            "Сделать выходным"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: styles$3.btnPink, onClick: handleOpenAddBooking, children: "Добавить запись" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("hr", { className: styles$3.divider }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h6", { className: styles$3.bookingsTitle, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-list" }),
          "Записи на этот день (",
          bookings.length,
          ")"
        ] }),
        bookings.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$3.emptyState, children: "Нет записей" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.tableWrapper, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: styles$3.table, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Время" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Клиент" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Услуга" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Телефон" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Действия" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: bookings.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: b.time }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: b.client_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { children: [
              b.category_name ? `${b.category_name}. ` : "",
              b.service_name
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: b.phone || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: styles$3.actionsCell, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.actionIcons, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: styles$3.actionIconBtn,
                  onClick: () => handleEditBooking(b.id),
                  title: "Редактировать",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-edit" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: `${styles$3.actionIconBtn} ${styles$3.actionIconBtnDelete}`,
                  onClick: () => handleDeleteBooking(b.id, b.client_name, b.time),
                  title: "Удалить",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-trash" })
                }
              )
            ] }) })
          ] }, b.id)) })
        ] }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.footer, children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: styles$3.btnSecondary, onClick: onClose, children: "Закрыть" }) })
    ] }) }),
    editingBookingId && /* @__PURE__ */ jsxRuntimeExports.jsx(
      EditBookingModal,
      {
        bookingId: editingBookingId,
        masterSlug,
        onClose: handleCloseEditModal,
        onSaved: handleSavedEdit
      }
    ),
    showAddBooking && /* @__PURE__ */ jsxRuntimeExports.jsx(
      AddBookingModal,
      {
        masterSlug,
        defaultDate: dateStr,
        onClose: handleCloseAddBooking,
        onCreated: handleBookingCreated
      }
    )
  ] });
}
function getCookie$2(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
async function loadCalendar() {
  const r = await fetch("/api/schedule/calendar/");
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function loadCounts() {
  const r = await fetch("/api/bookings/counts/");
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь"
];
function Calendar({ masterSlug, onExternalChange }) {
  const [currentDate, setCurrentDate] = reactExports.useState(/* @__PURE__ */ new Date());
  const [calendarData, setCalendarData] = reactExports.useState(null);
  const [countsData, setCountsData] = reactExports.useState(null);
  const [loading2, setLoading] = reactExports.useState(true);
  const [selectedDate, setSelectedDate] = reactExports.useState(null);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const reloadData = reactExports.useCallback(() => {
    setLoading(true);
    Promise.all([loadCalendar(), loadCounts()]).then(([calendar2, counts]) => {
      setCalendarData(calendar2);
      setCountsData(counts);
      setLoading(false);
    }).catch((error) => {
      console.error("Ошибка загрузки календаря:", error);
      setLoading(false);
    });
  }, []);
  reactExports.useEffect(() => {
    reloadData();
  }, [reloadData]);
  function changeMonth(delta) {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }
  function handleDayClick(dateStr) {
    setSelectedDate(dateStr);
  }
  function handleCloseModal() {
    setSelectedDate(null);
  }
  function handleDataChanged(message) {
    reloadData();
    if (onExternalChange) onExternalChange(message);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.calendar, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.nav, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: styles$4.navBtn, onClick: () => changeMonth(-1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "svg",
        {
          width: "20",
          height: "20",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2.5",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "15 18 9 12 15 6" })
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$4.navTitle, children: [
        MONTH_NAMES[month],
        " ",
        year
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: styles$4.navBtn, onClick: () => changeMonth(1), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "svg",
        {
          width: "20",
          height: "20",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2.5",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "9 6 15 12 9 18" })
        }
      ) })
    ] }),
    loading2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$4.loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-border", style: { color: "#4053d3" } }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      MonthGrid,
      {
        year,
        month,
        calendarData,
        countsData,
        onDayClick: handleDayClick
      }
    ),
    selectedDate && /* @__PURE__ */ jsxRuntimeExports.jsx(
      DayModal,
      {
        dateStr: selectedDate,
        masterSlug,
        onClose: handleCloseModal,
        onDataChanged: handleDataChanged
      }
    )
  ] });
}
async function loadBookings(page = 1, limit = 3) {
  const r = await fetch(`/api/bookings/?page=${page}&limit=${limit}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function confirmBooking(bookingId) {
  const r = await fetch(`/api/booking/${bookingId}/confirm/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie$1("csrftoken")
    }
  });
  return r.json();
}
async function unconfirmBooking(bookingId) {
  const r = await fetch(`/api/booking/${bookingId}/unconfirm/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie$1("csrftoken")
    }
  });
  return r.json();
}
function getCookie$1(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
async function loadBookingDetails(bookingId) {
  const r = await fetch(`/api/booking/${bookingId}/details/`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
const backdrop = "_backdrop_1pc6d_9";
const modal = "_modal_1pc6d_33";
const header = "_header_1pc6d_61";
const title$1 = "_title_1pc6d_81";
const closeBtn = "_closeBtn_1pc6d_101";
const body = "_body_1pc6d_135";
const loading = "_loading_1pc6d_147";
const section = "_section_1pc6d_159";
const sectionTitle = "_sectionTitle_1pc6d_175";
const sectionValue = "_sectionValue_1pc6d_203";
const servicesList = "_servicesList_1pc6d_221";
const serviceItem = "_serviceItem_1pc6d_233";
const category = "_category_1pc6d_251";
const historyBox = "_historyBox_1pc6d_263";
const historyItem = "_historyItem_1pc6d_275";
const historyDate = "_historyDate_1pc6d_303";
const historyTime = "_historyTime_1pc6d_313";
const historyService = "_historyService_1pc6d_323";
const divider = "_divider_1pc6d_345";
const footer = "_footer_1pc6d_359";
const btnSecondary = "_btnSecondary_1pc6d_379";
const styles$2 = {
  backdrop,
  modal,
  header,
  title: title$1,
  closeBtn,
  body,
  loading,
  section,
  sectionTitle,
  sectionValue,
  servicesList,
  serviceItem,
  category,
  historyBox,
  historyItem,
  historyDate,
  historyTime,
  historyService,
  divider,
  footer,
  btnSecondary
};
function BookingDetailsModal({ bookingId, onClose }) {
  var _a, _b, _c, _d;
  const [data, setData] = reactExports.useState(null);
  const [loading2, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    setLoading(true);
    loadBookingDetails(bookingId).then((d) => {
      setData(d);
      setLoading(false);
    }).catch((error) => {
      console.error("Ошибка загрузки деталей:", error);
      setLoading(false);
    });
  }, [bookingId]);
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.backdrop, onClick: handleBackdropClick, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.modal, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.header, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { className: styles$2.title, children: "Подробности записи" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: styles$2.closeBtn,
          onClick: onClose,
          "aria-label": "Закрыть",
          children: "✕"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.body, children: loading2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-border", style: { color: "#4053d3" } }) }) : !(data == null ? void 0 : data.success) ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-danger", children: "Не удалось загрузить данные" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.section, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.sectionTitle, children: "Клиент" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$2.sectionValue, children: data.client_name })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.section, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.sectionTitle, children: "Телефон" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$2.sectionValue, children: data.client_phone_formatted || data.client_phone })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.section, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.sectionTitle, children: "Дата" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$2.sectionValue, children: data.date })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.section, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.sectionTitle, children: "Время" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$2.sectionValue, children: data.time || "—" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.section, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.sectionTitle, children: [
          "Услуги (",
          data.total_services,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.servicesList, children: (_a = data.services) == null ? void 0 : _a.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.serviceItem, children: [
          s.category_name && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$2.category, children: [
            s.category_name,
            ": "
          ] }),
          s.name
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.section, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.sectionTitle, children: "Комментарий" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$2.sectionValue, children: data.comment || "—" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("hr", { className: styles$2.divider }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.section, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.sectionTitle, children: [
          "История визитов (",
          ((_b = data.client_stats) == null ? void 0 : _b.total_visits) || 0,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.historyBox, children: ((_d = (_c = data.client_stats) == null ? void 0 : _c.visits) == null ? void 0 : _d.length) > 0 ? data.client_stats.visits.map((v, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.historyItem, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.historyDate, children: v.date }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.historyTime, children: v.time }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$2.historyService, children: [
            v.category ? `${v.category}: ` : "",
            v.service
          ] })
        ] }, i)) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$2.sectionValue, children: "Нет других записей" }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.footer, children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: styles$2.btnSecondary, onClick: onClose, children: "Закрыть" }) })
  ] }) });
}
const card$1 = "_card_q42oh_11";
const cardInner = "_cardInner_q42oh_29";
const cardHeader = "_cardHeader_q42oh_41";
const cardBody$1 = "_cardBody_q42oh_75";
const loadingState = "_loadingState_q42oh_85";
const emptyState = "_emptyState_q42oh_87";
const tableWrapper = "_tableWrapper_q42oh_101";
const table = "_table_q42oh_101";
const actionsCell = "_actionsCell_q42oh_173";
const allButtonsRow = "_allButtonsRow_q42oh_181";
const iconBtn = "_iconBtn_q42oh_197";
const iconBtnDelete = "_iconBtnDelete_q42oh_239";
const contactWrapper = "_contactWrapper_q42oh_251";
const contactBtn = "_contactBtn_q42oh_263";
const contactMenu = "_contactMenu_q42oh_315";
const maxIcon = "_maxIcon_q42oh_391";
const confirmBtn = "_confirmBtn_q42oh_421";
const confirmed = "_confirmed_q42oh_461";
const cardFooter = "_cardFooter_q42oh_479";
const loadMoreBtn = "_loadMoreBtn_q42oh_497";
const footerInfoRow = "_footerInfoRow_q42oh_541";
const footerLeft = "_footerLeft_q42oh_559";
const footerRight = "_footerRight_q42oh_561";
const totalLabel = "_totalLabel_q42oh_573";
const totalNumber = "_totalNumber_q42oh_585";
const limitLabel = "_limitLabel_q42oh_609";
const limitSelect = "_limitSelect_q42oh_623";
const styles$1 = {
  card: card$1,
  cardInner,
  cardHeader,
  cardBody: cardBody$1,
  loadingState,
  emptyState,
  tableWrapper,
  table,
  actionsCell,
  allButtonsRow,
  iconBtn,
  iconBtnDelete,
  contactWrapper,
  contactBtn,
  contactMenu,
  maxIcon,
  confirmBtn,
  confirmed,
  cardFooter,
  loadMoreBtn,
  footerInfoRow,
  footerLeft,
  footerRight,
  totalLabel,
  totalNumber,
  limitLabel,
  limitSelect
};
function UpcomingBookings({ masterSlug, masterMaxLink, onEdit, onDataChanged }) {
  const [bookings, setBookings] = reactExports.useState([]);
  const [total, setTotal] = reactExports.useState(0);
  const [page, setPage] = reactExports.useState(1);
  const [limit, setLimit] = reactExports.useState(3);
  const [loading2, setLoading] = reactExports.useState(true);
  const [hasMore, setHasMore] = reactExports.useState(false);
  const [detailsBookingId, setDetailsBookingId] = reactExports.useState(null);
  const [contactMenuId, setContactMenuId] = reactExports.useState(null);
  const { showAlert, showConfirm } = useModal();
  reactExports.useEffect(() => {
    loadData(1, false);
  }, [limit]);
  async function loadData(p, append) {
    setLoading(true);
    try {
      const data = await loadBookings(p, limit);
      if (append) {
        setBookings((prev) => [...prev, ...data.bookings || []]);
      } else {
        setBookings(data.bookings || []);
      }
      setTotal(data.total || 0);
      setPage(p);
      setHasMore(!!data.has_more);
    } catch (error) {
      console.error("Ошибка загрузки записей:", error);
    } finally {
      setLoading(false);
    }
  }
  function handleLimitChange(newLimit) {
    setLimit(newLimit);
  }
  function handleLoadMore() {
    loadData(page + 1, true);
  }
  async function handleToggleConfirm(booking) {
    try {
      const fn = booking.confirmed_by_master ? unconfirmBooking : confirmBooking;
      const data = await fn(booking.id);
      if (data.success) {
        setBookings((prev) => prev.map(
          (b) => b.id === booking.id ? { ...b, confirmed_by_master: !b.confirmed_by_master } : b
        ));
        const msg = booking.confirmed_by_master ? "Подтверждение снято" : "Запись подтверждена";
        if (onDataChanged) onDataChanged(msg);
      } else {
        showAlert(data.error || "Ошибка", "error");
      }
    } catch (error) {
      console.error(error);
      showAlert("Ошибка соединения", "error");
    }
  }
  async function handleDelete(booking) {
    const ok = await showConfirm(
      `Удалить запись клиента "${booking.client_name}" на ${booking.time}?`,
      { type: "danger" }
    );
    if (!ok) return;
    try {
      const data = await deleteBooking(booking.id);
      if (data.success) {
        setBookings((prev) => prev.filter((b) => b.id !== booking.id));
        setTotal((prev) => prev - 1);
        if (onDataChanged) onDataChanged("Запись удалена");
      } else {
        showAlert(data.error || "Ошибка удаления", "error");
      }
    } catch (error) {
      console.error(error);
      showAlert("Ошибка соединения", "error");
    }
  }
  reactExports.useEffect(() => {
    function handleClickOutside() {
      setContactMenuId(null);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  function cleanPhone(phone) {
    return (phone || "").replace(/\D/g, "");
  }
  function callClient(phone) {
    window.location.href = `tel:+${cleanPhone(phone)}`;
  }
  function sendSms(phone) {
    window.location.href = `sms:+${cleanPhone(phone)}`;
  }
  function openWhatsApp(phone) {
    window.open(`https://wa.me/${cleanPhone(phone)}`, "_blank");
  }
  function openTelegram(phone) {
    const clean = cleanPhone(phone);
    const tgLink = `tg://resolve?phone=${clean}`;
    window.location.href = tgLink;
    setTimeout(() => {
      if (document.hasFocus()) {
        showAlert("💬 Telegram не установлен или не открылся.\nСвяжитесь с клиентом по телефону.", "info");
      }
    }, 2e3);
  }
  function openMax() {
    if (!masterMaxLink) {
      showAlert("⚠️ Ссылка на MAX не настроена.\nДобавьте её в настройках профиля.", "warning");
      return;
    }
    window.open(masterMaxLink, "_blank");
  }
  function toggleContactMenu(e, bookingId) {
    e.stopPropagation();
    setContactMenuId((prev) => prev === bookingId ? null : bookingId);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.card, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.cardInner, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.cardHeader, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h5", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-clock", style: { color: "var(--primary)" } }),
        "Ближайшие записи"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.cardBody, children: loading2 && bookings.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.loadingState, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-border", style: { color: "#4053d3" } }) }) : bookings.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$1.emptyState, children: "Нет предстоящих записей" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.tableWrapper, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: styles$1.table, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Дата" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Время" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Клиент" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Услуги" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", {})
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: bookings.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "tr",
          {
            style: contactMenuId === b.id ? { position: "relative", zIndex: 100 } : void 0,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: b.date }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: b.time }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: b.client_name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: b.service_name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: styles$1.actionsCell, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.allButtonsRow, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    className: styles$1.iconBtn,
                    onClick: () => setDetailsBookingId(b.id),
                    title: "Подробности",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-info-circle" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    className: styles$1.iconBtn,
                    onClick: () => onEdit(b.id),
                    title: "Редактировать",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-edit" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    className: `${styles$1.iconBtn} ${styles$1.iconBtnDelete}`,
                    onClick: () => handleDelete(b),
                    title: "Удалить",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-trash" })
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.contactWrapper, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      className: styles$1.contactBtn,
                      onClick: (e) => toggleContactMenu(e, b.id),
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-phone-alt" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Связаться" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-chevron-down" })
                      ]
                    }
                  ),
                  contactMenuId === b.id && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.contactMenu, onClick: (e) => e.stopPropagation(), children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => callClient(b.phone), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-phone" }),
                      " Позвонить"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => sendSms(b.phone), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-sms" }),
                      " SMS"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => openTelegram(b.phone), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fab fa-telegram-plane" }),
                      " Telegram"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => openWhatsApp(b.phone), children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fab fa-whatsapp" }),
                      " WhatsApp"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: openMax, disabled: !masterMaxLink, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$1.maxIcon, children: "M" }),
                      " MAX"
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    className: `${styles$1.confirmBtn} ${b.confirmed_by_master ? styles$1.confirmed : ""}`,
                    onClick: () => handleToggleConfirm(b),
                    title: b.confirmed_by_master ? "Подтверждено" : "Подтвердить",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${b.confirmed_by_master ? "fa-check-circle" : "fa-circle"}` })
                  }
                )
              ] }) })
            ]
          },
          b.id
        )) })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.cardFooter, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: styles$1.loadMoreBtn,
            style: { display: hasMore ? "flex" : "none" },
            onClick: handleLoadMore,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-chevron-down" }),
              "Показать еще"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.footerInfoRow, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.footerRight, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$1.totalLabel, children: "Всего записей" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$1.totalNumber, children: total })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.footerLeft, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$1.limitLabel, children: "Показывать:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                className: styles$1.limitSelect,
                value: limit,
                onChange: (e) => handleLimitChange(parseInt(e.target.value)),
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "3", children: "3" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "5", children: "5" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "10", children: "10" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "15", children: "15" })
                ]
              }
            )
          ] })
        ] })
      ] })
    ] }),
    detailsBookingId && /* @__PURE__ */ jsxRuntimeExports.jsx(
      BookingDetailsModal,
      {
        bookingId: detailsBookingId,
        onClose: () => setDetailsBookingId(null)
      }
    )
  ] });
}
function Dashboard({ masterSlug, masterMaxLink }) {
  const [editingBookingId, setEditingBookingId] = reactExports.useState(null);
  const [refreshKey, setRefreshKey] = reactExports.useState(0);
  const { showAlert } = useModal();
  function handleEditBooking(bookingId) {
    setEditingBookingId(bookingId);
  }
  function handleCloseEdit() {
    setEditingBookingId(null);
  }
  function handleDataChanged(message, type = "success") {
    setRefreshKey((prev) => prev + 1);
    if (message) {
      showAlert(message, type);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      UpcomingBookings,
      {
        masterSlug,
        masterMaxLink,
        onEdit: handleEditBooking,
        onDataChanged: handleDataChanged
      },
      `upcoming-${refreshKey}`
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card-inner", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "card-body", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Calendar,
      {
        masterSlug,
        onExternalChange: handleDataChanged
      },
      `calendar-${refreshKey}`
    ) }) }) }),
    editingBookingId && /* @__PURE__ */ jsxRuntimeExports.jsx(
      EditBookingModal,
      {
        bookingId: editingBookingId,
        masterSlug,
        onClose: handleCloseEdit,
        onSaved: () => handleDataChanged("Запись обновлена")
      }
    )
  ] });
}
async function getVapidPublicKey() {
  const r = await fetch("/api/push/vapid-key/");
  return r.json();
}
async function saveSubscription(subscription) {
  const r = await fetch("/api/push/subscribe/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken")
    },
    body: JSON.stringify(subscription)
  });
  return r.json();
}
async function removeSubscription(endpoint) {
  const r = await fetch("/api/push/unsubscribe/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken")
    },
    body: JSON.stringify({ endpoint })
  });
  return r.json();
}
async function checkSubscription(endpoint) {
  const r = await fetch("/api/push/check/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken")
    },
    body: JSON.stringify({ endpoint })
  });
  return r.json();
}
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}
function isIOSWithoutPWA() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  return isIOS && !isStandalone;
}
async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error("Браузер не поддерживает push-уведомления");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Разрешение на уведомления отклонено");
  }
  const registration = await navigator.serviceWorker.ready;
  const vapidData = await getVapidPublicKey();
  if (!vapidData.success) {
    throw new Error("Не удалось получить VAPID-ключ");
  }
  const vapidPublicKey = vapidData.data.publicKey;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });
  const subData = subscription.toJSON();
  const result = await saveSubscription({
    endpoint: subData.endpoint,
    keys: subData.keys
  });
  if (!result.success) {
    throw new Error(result.error || "Ошибка сохранения подписки");
  }
  return true;
}
async function unsubscribeFromPush() {
  if (!isPushSupported()) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await removeSubscription(endpoint);
    return true;
  }
  return false;
}
async function checkPushSubscription() {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;
    const data = await checkSubscription(subscription.endpoint);
    if (!data.success || !data.data || data.data.exists !== true) {
      try {
        await subscription.unsubscribe();
      } catch (e) {
        console.warn("Не удалось удалить старую подписку:", e);
      }
      return false;
    }
    return true;
  } catch (error) {
    console.error("Ошибка проверки подписки:", error);
    return false;
  }
}
const card = "_card_59vvh_11";
const cardBody = "_cardBody_59vvh_29";
const row = "_row_59vvh_39";
const title = "_title_59vvh_55";
const subtitle = "_subtitle_59vvh_81";
const btnEnable = "_btnEnable_59vvh_95";
const btnDisable = "_btnDisable_59vvh_97";
const hints = "_hints_59vvh_181";
const hint = "_hint_59vvh_181";
const hintError = "_hintError_59vvh_221";
const styles = {
  card,
  cardBody,
  row,
  title,
  subtitle,
  btnEnable,
  btnDisable,
  hints,
  hint,
  hintError
};
function PushSettings() {
  const [subscribed, setSubscribed] = reactExports.useState(false);
  const [loading2, setLoading] = reactExports.useState(true);
  const [busy, setBusy] = reactExports.useState(false);
  const supported = isPushSupported();
  const iosHint = isIOSWithoutPWA();
  reactExports.useEffect(() => {
    if (!supported || iosHint) {
      setLoading(false);
      return;
    }
    checkPushSubscription().then((result) => {
      setSubscribed(result);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [supported, iosHint]);
  async function handleEnable() {
    setBusy(true);
    try {
      await subscribeToPush();
      setSubscribed(true);
    } catch (error) {
      alert(error.message || "Ошибка подписки");
    } finally {
      setBusy(false);
    }
  }
  async function handleDisable() {
    setBusy(true);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
    } catch (error) {
      alert(error.message || "Ошибка отписки");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.card, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.cardBody, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.row, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { className: styles.title, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-bell" }),
          "Push-уведомления"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.subtitle, children: "Получать уведомления о новых записях" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: supported && !iosHint && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: subscribed ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: styles.btnDisable,
          onClick: handleDisable,
          disabled: busy || loading2,
          children: busy ? "Отключение..." : "Отключить"
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: styles.btnEnable,
          onClick: handleEnable,
          disabled: busy || loading2,
          children: busy ? "Включение..." : "Включить"
        }
      ) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.hints, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.hint, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-info-circle" }),
        "Уведомления приходят, даже если приложение закрыто."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.hint, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-lock" }),
        "Только о ваших записях. Без рекламы."
      ] }),
      iosHint && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.hint, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-mobile-alt" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "На iPhone:" }),
          " откройте сайт в Safari → «Поделиться» → «На экран Домой» → включите там."
        ] })
      ] }),
      !supported && !iosHint && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${styles.hint} ${styles.hintError}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-exclamation-triangle" }),
        "Ваш браузер не поддерживает уведомления."
      ] })
    ] })
  ] }) });
}
const dashboardEl = document.getElementById("react-dashboard");
if (dashboardEl) {
  const masterSlug = dashboardEl.dataset.masterSlug || "";
  const masterMaxLink = dashboardEl.dataset.masterMaxLink || "";
  client.createRoot(dashboardEl).render(
    /* @__PURE__ */ jsxRuntimeExports.jsx(ModalProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Dashboard, { masterSlug, masterMaxLink }) })
  );
}
const pushEl = document.getElementById("react-push-settings");
if (pushEl) {
  client.createRoot(pushEl).render(
    /* @__PURE__ */ jsxRuntimeExports.jsx(ModalProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(PushSettings, {}) })
  );
}
