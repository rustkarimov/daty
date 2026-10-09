import { j as jsxRuntimeExports, r as reactExports, c as client } from "./chunk-react.js";
import { u as useModal } from "./chunk-useModal.js";
import { B as BreaksEditor } from "./chunk-BreaksEditor.js";
import { M as ModalProvider } from "./chunk-modals.js";
import "./chunk-vendor.js";
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
async function request(url, options = {}) {
  const config = {
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
      ...options.headers || {}
    },
    ...options
  };
  const response = await fetch(url, config);
  return response.json();
}
function loadSchedules() {
  return request("/api/schedules/", { method: "GET" });
}
function addSchedule(data) {
  return request("/api/schedule/add/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
function editSchedule(id, data) {
  return request(`/api/schedule/${id}/edit/`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}
function deleteSchedule(id) {
  return request(`/api/schedule/${id}/delete/`, { method: "POST" });
}
function loadUpcomingExtraDays() {
  return request("/api/extra-days/upcoming/", { method: "GET" });
}
function loadPastExtraDays(page2 = 1, limit = 10) {
  return request(`/api/extra-days/past/?page=${page2}&limit=${limit}`, { method: "GET" });
}
function addExtraDay(data) {
  return request("/api/extra-days/add/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
function deleteExtraDay(id) {
  return request(`/api/extra-days/${id}/delete/`, { method: "POST" });
}
function loadDaysOff() {
  return request("/api/days-off/list/", { method: "GET" });
}
function addDayOff(data) {
  return request("/api/days-off/add/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
function deleteDayOff(id) {
  return request(`/api/days-off/${id}/delete/`, { method: "POST" });
}
const loading$2 = "_loading_y45t3_9";
const emptyState = "_emptyState_y45t3_19";
const emptyText$2 = "_emptyText_y45t3_27";
const emptyHint = "_emptyHint_y45t3_39";
const tableWrapper$2 = "_tableWrapper_y45t3_53";
const table$2 = "_table_y45t3_53";
const workTimeMobile = "_workTimeMobile_y45t3_117";
const workTimeDesktop = "_workTimeDesktop_y45t3_125";
const breakText$1 = "_breakText_y45t3_135";
const textMuted$1 = "_textMuted_y45t3_149";
const actionIcons$2 = "_actionIcons_y45t3_159";
const iconBtn$2 = "_iconBtn_y45t3_171";
const iconBtnDanger$2 = "_iconBtnDanger_y45t3_215";
const styles$6 = {
  loading: loading$2,
  emptyState,
  emptyText: emptyText$2,
  emptyHint,
  tableWrapper: tableWrapper$2,
  table: table$2,
  workTimeMobile,
  workTimeDesktop,
  breakText: breakText$1,
  textMuted: textMuted$1,
  actionIcons: actionIcons$2,
  iconBtn: iconBtn$2,
  iconBtnDanger: iconBtnDanger$2
};
function SchedulesList({
  schedules,
  loading: loading2,
  onEdit,
  onDataChanged
}) {
  const { showAlert, showConfirm } = useModal();
  async function handleDelete(schedule) {
    const ok = await showConfirm(
      `Удалить расписание для ${schedule.day_name}?`,
      { type: "danger" }
    );
    if (!ok) return;
    try {
      const data = await deleteSchedule(schedule.id);
      if (data.success) {
        onDataChanged();
      } else {
        showAlert(data.error || "Ошибка удаления", "error");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      showAlert("Ошибка соединения", "error");
    }
  }
  if (loading2) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$6.loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-border", style: { color: "var(--primary)" } }) });
  }
  if (schedules.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$6.emptyState, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$6.emptyText, children: "У вас пока нет настроенного расписания" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$6.emptyHint, children: "Добавьте рабочие дни, чтобы клиенты могли записываться" })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$6.tableWrapper, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: styles$6.table, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "День недели" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Начало" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Конец" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Перерывы" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Действия" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: schedules.map((schedule) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { "data-label": "day", children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: schedule.day_name }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { "data-label": "start", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$6.workTimeDesktop, children: schedule.start_time }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$6.workTimeMobile, children: [
          schedule.start_time,
          " - ",
          schedule.end_time
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { "data-label": "end", children: schedule.end_time }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { "data-label": "breaks", children: schedule.breaks && schedule.breaks.length > 0 ? schedule.breaks.map((b, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$6.breakText, children: [
        b.start,
        " - ",
        b.end
      ] }, i)) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$6.textMuted, children: "—" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { "data-label": "actions", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$6.actionIcons, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: styles$6.iconBtn,
            onClick: () => onEdit(schedule),
            title: "Изменить",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-edit" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: `${styles$6.iconBtn} ${styles$6.iconBtnDanger}`,
            onClick: () => handleDelete(schedule),
            title: "Удалить",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-trash" })
          }
        )
      ] }) })
    ] }, schedule.id)) })
  ] }) });
}
const loading$1 = "_loading_nav3n_9";
const emptyText$1 = "_emptyText_nav3n_19";
const subtitle = "_subtitle_nav3n_31";
const tableWrapper$1 = "_tableWrapper_nav3n_47";
const table$1 = "_table_nav3n_47";
const tableSmall = "_tableSmall_nav3n_111";
const breakText = "_breakText_nav3n_119";
const textMuted = "_textMuted_nav3n_133";
const actionIcons$1 = "_actionIcons_nav3n_143";
const iconBtn$1 = "_iconBtn_nav3n_155";
const iconBtnDanger$1 = "_iconBtnDanger_nav3n_199";
const pastDetails = "_pastDetails_nav3n_211";
const pastSummary = "_pastSummary_nav3n_219";
const pastContent = "_pastContent_nav3n_243";
const loadMoreWrapper = "_loadMoreWrapper_nav3n_251";
const btnOutline = "_btnOutline_nav3n_261";
const styles$5 = {
  loading: loading$1,
  emptyText: emptyText$1,
  subtitle,
  tableWrapper: tableWrapper$1,
  table: table$1,
  tableSmall,
  breakText,
  textMuted,
  actionIcons: actionIcons$1,
  iconBtn: iconBtn$1,
  iconBtnDanger: iconBtnDanger$1,
  pastDetails,
  pastSummary,
  pastContent,
  loadMoreWrapper,
  btnOutline
};
function ExtraDaysList({
  futureDays,
  pastDays,
  pastDaysHasMore,
  loading: loading2,
  onLoadMorePast,
  onDataChanged
}) {
  const [pastOpen, setPastOpen] = reactExports.useState(false);
  const { showAlert, showConfirm } = useModal();
  async function handleDelete(day) {
    const ok = await showConfirm(
      "Удалить этот дополнительный рабочий день?",
      { type: "danger" }
    );
    if (!ok) return;
    try {
      const data = await deleteExtraDay(day.id);
      if (data.success) {
        onDataChanged();
      } else {
        showAlert(data.error || "Ошибка удаления", "error");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      showAlert("Ошибка соединения", "error");
    }
  }
  if (loading2) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$5.loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-border", style: { color: "var(--primary)" } }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: futureDays.length === 0 && pastDays.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$5.emptyText, children: "Нет дополнительных рабочих дней" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    futureDays.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$5.subtitle, children: "Предстоящие:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$5.tableWrapper, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: styles$5.table, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Дата" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Время" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Перерывы" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Действия" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: futureDays.map((day) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { "data-label": "day", children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: day.date_display }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { "data-label": "start", children: [
            day.start_time,
            " - ",
            day.end_time
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { "data-label": "breaks", children: day.breaks && day.breaks.length > 0 ? day.breaks.map((b, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$5.breakText, children: [
            b.start,
            " - ",
            b.end
          ] }, i)) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$5.textMuted, children: "—" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { "data-label": "actions", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$5.actionIcons, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: `${styles$5.iconBtn} ${styles$5.iconBtnDanger}`,
              onClick: () => handleDelete(day),
              title: "Удалить",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-trash" })
            }
          ) }) })
        ] }, day.id)) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "details",
      {
        className: styles$5.pastDetails,
        open: pastOpen,
        onToggle: (e) => setPastOpen(e.target.open),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("summary", { className: styles$5.pastSummary, children: "Прошедшие" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$5.pastContent, children: pastDays.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$5.emptyText, children: "Нет прошедших дополнительных дней" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$5.tableWrapper, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: `${styles$5.table} ${styles$5.tableSmall}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Дата" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Время" })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: pastDays.map((day) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { "data-label": "", children: day.date_display }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { "data-label": "", children: [
                  day.start_time,
                  " - ",
                  day.end_time
                ] })
              ] }, day.id)) })
            ] }) }),
            pastDaysHasMore && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$5.loadMoreWrapper, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                className: styles$5.btnOutline,
                onClick: onLoadMorePast,
                children: "Загрузить ещё"
              }
            ) })
          ] }) })
        ]
      }
    )
  ] }) });
}
const loading = "_loading_i0ars_9";
const emptyText = "_emptyText_i0ars_19";
const tableWrapper = "_tableWrapper_i0ars_31";
const table = "_table_i0ars_31";
const actionIcons = "_actionIcons_i0ars_95";
const iconBtn = "_iconBtn_i0ars_107";
const iconBtnDanger = "_iconBtnDanger_i0ars_151";
const styles$4 = {
  loading,
  emptyText,
  tableWrapper,
  table,
  actionIcons,
  iconBtn,
  iconBtnDanger
};
function DaysOffList({ daysOff, loading: loading2, onDataChanged }) {
  const { showAlert, showConfirm } = useModal();
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const futureDays = daysOff.filter((d) => d.date >= today);
  async function handleDelete(day) {
    const ok = await showConfirm("Удалить этот выходной день?", { type: "danger" });
    if (!ok) return;
    try {
      const data = await deleteDayOff(day.id);
      if (data.success) {
        onDataChanged();
      } else {
        showAlert(data.error || "Ошибка удаления", "error");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      showAlert("Ошибка соединения", "error");
    }
  }
  if (loading2) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$4.loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-border", style: { color: "var(--primary)" } }) });
  }
  if (futureDays.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$4.emptyText, children: "Нет предстоящих выходных" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$4.tableWrapper, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: styles$4.table, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Дата" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Причина" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Действия" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: futureDays.map((day) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { "data-label": "date", children: /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: day.date_display }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { "data-label": "reason", children: day.reason || "—" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("td", { "data-label": "actions", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$4.actionIcons, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: `${styles$4.iconBtn} ${styles$4.iconBtnDanger}`,
          onClick: () => handleDelete(day),
          title: "Удалить",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-trash" })
        }
      ) }) })
    ] }, day.id)) })
  ] }) });
}
const backdrop$2 = "_backdrop_1dssh_9";
const modal$2 = "_modal_1dssh_33";
const header$2 = "_header_1dssh_61";
const title$2 = "_title_1dssh_79";
const closeBtn$2 = "_closeBtn_1dssh_107";
const body$2 = "_body_1dssh_141";
const formField$2 = "_formField_1dssh_155";
const formLabel$2 = "_formLabel_1dssh_163";
const formInput$2 = "_formInput_1dssh_179";
const formSelect = "_formSelect_1dssh_181";
const dayDisplay = "_dayDisplay_1dssh_219";
const row$1 = "_row_1dssh_237";
const btnPrimary$3 = "_btnPrimary_1dssh_263";
const btnSecondary$2 = "_btnSecondary_1dssh_315";
const footer$2 = "_footer_1dssh_365";
const styles$3 = {
  backdrop: backdrop$2,
  modal: modal$2,
  header: header$2,
  title: title$2,
  closeBtn: closeBtn$2,
  body: body$2,
  formField: formField$2,
  formLabel: formLabel$2,
  formInput: formInput$2,
  formSelect,
  dayDisplay,
  row: row$1,
  btnPrimary: btnPrimary$3,
  btnSecondary: btnSecondary$2,
  footer: footer$2
};
const DAYS = [
  { value: 0, label: "Понедельник" },
  { value: 1, label: "Вторник" },
  { value: 2, label: "Среда" },
  { value: 3, label: "Четверг" },
  { value: 4, label: "Пятница" },
  { value: 5, label: "Суббота" },
  { value: 6, label: "Воскресенье" }
];
function ScheduleModal({ mode = "add", schedule = null, onClose, onSaved }) {
  const [dayOfWeek, setDayOfWeek] = reactExports.useState("");
  const [startTime, setStartTime] = reactExports.useState("");
  const [endTime, setEndTime] = reactExports.useState("");
  const [breaks, setBreaks] = reactExports.useState([]);
  const [saving, setSaving] = reactExports.useState(false);
  const { showAlert } = useModal();
  reactExports.useEffect(() => {
    if (mode === "edit" && schedule) {
      setDayOfWeek(schedule.day_of_week);
      setStartTime(schedule.start_time);
      setEndTime(schedule.end_time);
      setBreaks(schedule.breaks || []);
    }
  }, [mode, schedule]);
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }
  async function handleSave(e) {
    e.preventDefault();
    if (dayOfWeek === "" || dayOfWeek === null || dayOfWeek === void 0) {
      showAlert("Выберите день недели", "warning");
      return;
    }
    if (!startTime || !endTime) {
      showAlert("Заполните время начала и окончания", "warning");
      return;
    }
    if (startTime >= endTime) {
      showAlert("Время начала не может быть позже времени окончания", "warning");
      return;
    }
    const validBreaks = breaks.filter((b) => b.start && b.end);
    for (const b of validBreaks) {
      if (b.start >= b.end) {
        showAlert(`Перерыв ${b.start}-${b.end}: время начала не может быть позже окончания`, "warning");
        return;
      }
      if (b.start < startTime || b.end > endTime) {
        showAlert(`Перерыв ${b.start}-${b.end} выходит за пределы рабочего дня (${startTime}-${endTime})`, "warning");
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        day_of_week: parseInt(dayOfWeek),
        start_time: startTime,
        end_time: endTime,
        breaks: validBreaks
      };
      const data = mode === "edit" ? await editSchedule(schedule.id, payload) : await addSchedule(payload);
      if (data.success) {
        onSaved();
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
  const titleIcon = mode === "edit" ? "fa-edit" : "fa-plus";
  const titleText = mode === "edit" ? "Редактировать расписание" : "Добавить рабочий день";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.backdrop, onClick: handleBackdropClick, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.modal, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.header, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h5", { className: styles$3.title, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${titleIcon}` }),
        titleText
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
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.body, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { id: "schedule-form", onSubmit: handleSave, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.formField, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$3.formLabel, children: "День недели" }),
        mode === "edit" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.dayDisplay, children: schedule == null ? void 0 : schedule.day_name }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            className: styles$3.formSelect,
            value: dayOfWeek,
            onChange: (e) => setDayOfWeek(e.target.value),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Выберите день" }),
              DAYS.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: d.value, children: d.label }, d.value))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.row, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.formField, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$3.formLabel, children: "Начало работы" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "time",
              className: styles$3.formInput,
              value: startTime,
              onChange: (e) => setStartTime(e.target.value),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.formField, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$3.formLabel, children: "Конец работы" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "time",
              className: styles$3.formInput,
              value: endTime,
              onChange: (e) => setEndTime(e.target.value),
              required: true
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BreaksEditor, { breaks, onChange: setBreaks })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.footer, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: styles$3.btnSecondary,
          onClick: onClose,
          disabled: saving,
          children: "Отмена"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "submit",
          form: "schedule-form",
          className: styles$3.btnPrimary,
          disabled: saving,
          children: saving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }),
            "Сохранение..."
          ] }) : "Сохранить"
        }
      )
    ] })
  ] }) });
}
const backdrop$1 = "_backdrop_xjzbf_9";
const modal$1 = "_modal_xjzbf_33";
const header$1 = "_header_xjzbf_61";
const title$1 = "_title_xjzbf_79";
const closeBtn$1 = "_closeBtn_xjzbf_107";
const body$1 = "_body_xjzbf_141";
const formField$1 = "_formField_xjzbf_153";
const formLabel$1 = "_formLabel_xjzbf_161";
const formInput$1 = "_formInput_xjzbf_177";
const row = "_row_xjzbf_213";
const btnPrimary$2 = "_btnPrimary_xjzbf_237";
const btnSecondary$1 = "_btnSecondary_xjzbf_289";
const footer$1 = "_footer_xjzbf_339";
const styles$2 = {
  backdrop: backdrop$1,
  modal: modal$1,
  header: header$1,
  title: title$1,
  closeBtn: closeBtn$1,
  body: body$1,
  formField: formField$1,
  formLabel: formLabel$1,
  formInput: formInput$1,
  row,
  btnPrimary: btnPrimary$2,
  btnSecondary: btnSecondary$1,
  footer: footer$1
};
function ExtraDayModal({ schedules = [], onClose, onSaved }) {
  const [date, setDate] = reactExports.useState("");
  const [startTime, setStartTime] = reactExports.useState("");
  const [endTime, setEndTime] = reactExports.useState("");
  const [breaks, setBreaks] = reactExports.useState([]);
  const [saving, setSaving] = reactExports.useState(false);
  const { showAlert, showConfirm } = useModal();
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }
  async function checkDayConflict(dateStr) {
    if (!dateStr) return true;
    const selectedDate = new Date(dateStr);
    const jsDay = selectedDate.getDay();
    const djangoDay = jsDay === 0 ? 6 : jsDay - 1;
    const matched = schedules.find((s) => s.day_of_week === djangoDay);
    if (!matched) return true;
    return await showConfirm(
      `Выбранный день (${matched.day_name}) уже есть в регулярном расписании.

Дополнительный рабочий день будет иметь приоритет над регулярным.

Продолжить?`,
      { type: "warning" }
    );
  }
  async function handleDateChange(e) {
    const newDate = e.target.value;
    if (!newDate) {
      setDate("");
      return;
    }
    const ok = await checkDayConflict(newDate);
    if (ok) {
      setDate(newDate);
    }
  }
  async function handleSave(e) {
    e.preventDefault();
    if (!date || !startTime || !endTime) {
      showAlert("Заполните все обязательные поля", "warning");
      return;
    }
    if (startTime >= endTime) {
      showAlert("Время начала не может быть позже времени окончания", "warning");
      return;
    }
    const validBreaks = breaks.filter((b) => b.start && b.end);
    for (const b of validBreaks) {
      if (b.start >= b.end) {
        showAlert(`Перерыв ${b.start}-${b.end}: время начала не может быть позже окончания`, "warning");
        return;
      }
      if (b.start < startTime || b.end > endTime) {
        showAlert(`Перерыв ${b.start}-${b.end} выходит за пределы рабочего дня (${startTime}-${endTime})`, "warning");
        return;
      }
    }
    for (let i = 0; i < validBreaks.length; i++) {
      for (let j = i + 1; j < validBreaks.length; j++) {
        if (validBreaks[i].start < validBreaks[j].end && validBreaks[j].start < validBreaks[i].end) {
          showAlert(
            `Перерывы ${validBreaks[i].start}-${validBreaks[i].end} и ${validBreaks[j].start}-${validBreaks[j].end} пересекаются`,
            "warning"
          );
          return;
        }
      }
    }
    setSaving(true);
    try {
      const data = await addExtraDay({
        date,
        start_time: startTime,
        end_time: endTime,
        breaks: validBreaks
      });
      if (data.success) {
        onSaved();
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
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.backdrop, onClick: handleBackdropClick, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.modal, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.header, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h5", { className: styles$2.title, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-plus" }),
        "Добавить допдень"
      ] }),
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
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.body, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { id: "extra-day-form", onSubmit: handleSave, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.formField, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$2.formLabel, children: "Дата" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "date",
            className: styles$2.formInput,
            value: date,
            min: today,
            onChange: handleDateChange,
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.row, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.formField, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$2.formLabel, children: "Начало работы" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "time",
              className: styles$2.formInput,
              value: startTime,
              onChange: (e) => setStartTime(e.target.value),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.formField, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$2.formLabel, children: "Конец работы" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "time",
              className: styles$2.formInput,
              value: endTime,
              onChange: (e) => setEndTime(e.target.value),
              required: true
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(BreaksEditor, { breaks, onChange: setBreaks })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.footer, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: styles$2.btnSecondary,
          onClick: onClose,
          disabled: saving,
          children: "Отмена"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "submit",
          form: "extra-day-form",
          className: styles$2.btnPrimary,
          disabled: saving,
          children: saving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }),
            "Сохранение..."
          ] }) : "Сохранить"
        }
      )
    ] })
  ] }) });
}
const backdrop = "_backdrop_1i6nn_9";
const modal = "_modal_1i6nn_33";
const header = "_header_1i6nn_61";
const title = "_title_1i6nn_79";
const closeBtn = "_closeBtn_1i6nn_107";
const body = "_body_1i6nn_141";
const formField = "_formField_1i6nn_153";
const formLabel = "_formLabel_1i6nn_161";
const formInput = "_formInput_1i6nn_177";
const btnPrimary$1 = "_btnPrimary_1i6nn_223";
const btnSecondary = "_btnSecondary_1i6nn_275";
const footer = "_footer_1i6nn_325";
const styles$1 = {
  backdrop,
  modal,
  header,
  title,
  closeBtn,
  body,
  formField,
  formLabel,
  formInput,
  btnPrimary: btnPrimary$1,
  btnSecondary,
  footer
};
function DayOffModal({ onClose, onSaved }) {
  const [date, setDate] = reactExports.useState("");
  const [reason, setReason] = reactExports.useState("");
  const [saving, setSaving] = reactExports.useState(false);
  const { showAlert } = useModal();
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }
  async function handleSave(e) {
    e.preventDefault();
    if (!date) {
      showAlert("Выберите дату", "warning");
      return;
    }
    setSaving(true);
    try {
      const data = await addDayOff({ date, reason: reason.trim() });
      if (data.success) {
        onSaved();
        onClose();
        if (data.message) {
          showAlert(data.message, "success");
        }
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
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.backdrop, onClick: handleBackdropClick, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.modal, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.header, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h5", { className: styles$1.title, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-calendar-times" }),
        "Добавить выходной день"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: styles$1.closeBtn,
          onClick: onClose,
          "aria-label": "Закрыть",
          children: "✕"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.body, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { id: "day-off-form", onSubmit: handleSave, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.formField, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$1.formLabel, children: "Дата" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "date",
            className: styles$1.formInput,
            value: date,
            min: today,
            onChange: (e) => setDate(e.target.value),
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.formField, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$1.formLabel, children: "Причина (необязательно)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            className: styles$1.formInput,
            value: reason,
            onChange: (e) => setReason(e.target.value),
            placeholder: "Например: Отпуск, больничный, праздник"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.footer, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: styles$1.btnSecondary,
          onClick: onClose,
          disabled: saving,
          children: "Отмена"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "submit",
          form: "day-off-form",
          className: styles$1.btnPrimary,
          disabled: saving,
          children: saving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }),
            "Сохранение..."
          ] }) : "Сохранить"
        }
      )
    ] })
  ] }) });
}
const page = "_page_j41jr_9";
const pageHeader = "_pageHeader_j41jr_17";
const card = "_card_j41jr_41";
const sectionTitle = "_sectionTitle_j41jr_71";
const sectionActions = "_sectionActions_j41jr_99";
const btnPrimary = "_btnPrimary_j41jr_115";
const styles = {
  page,
  pageHeader,
  card,
  sectionTitle,
  sectionActions,
  btnPrimary
};
function SchedulePage() {
  const [schedules, setSchedules] = reactExports.useState([]);
  const [futureExtraDays, setFutureExtraDays] = reactExports.useState([]);
  const [pastExtraDays, setPastExtraDays] = reactExports.useState([]);
  const [pastDaysHasMore, setPastDaysHasMore] = reactExports.useState(false);
  const [pastDaysPage, setPastDaysPage] = reactExports.useState(1);
  const [daysOff, setDaysOff] = reactExports.useState([]);
  const [loadingSchedules, setLoadingSchedules] = reactExports.useState(true);
  const [loadingExtra, setLoadingExtra] = reactExports.useState(true);
  const [loadingDaysOff, setLoadingDaysOff] = reactExports.useState(true);
  const [scheduleModal, setScheduleModal] = reactExports.useState(null);
  const [extraDayModal, setExtraDayModal] = reactExports.useState(false);
  const [dayOffModal, setDayOffModal] = reactExports.useState(false);
  const { showAlert } = useModal();
  const reloadSchedules = reactExports.useCallback(() => {
    setLoadingSchedules(true);
    loadSchedules().then((data) => {
      setSchedules(data.schedules || []);
      setLoadingSchedules(false);
    }).catch((error) => {
      console.error("Ошибка загрузки расписаний:", error);
      setLoadingSchedules(false);
      showAlert("Не удалось загрузить расписания", "error");
    });
  }, [showAlert]);
  const reloadExtraDays = reactExports.useCallback(() => {
    setLoadingExtra(true);
    Promise.all([loadUpcomingExtraDays(), loadPastExtraDays(1, 10)]).then(([upcoming, past]) => {
      setFutureExtraDays(upcoming.future_days || []);
      setPastExtraDays(past.past_days || []);
      setPastDaysHasMore(past.has_more);
      setPastDaysPage(1);
      setLoadingExtra(false);
    }).catch((error) => {
      console.error("Ошибка загрузки доп. дней:", error);
      setLoadingExtra(false);
    });
  }, []);
  const reloadDaysOff = reactExports.useCallback(() => {
    setLoadingDaysOff(true);
    loadDaysOff().then((data) => {
      setDaysOff(data.days_off || []);
      setLoadingDaysOff(false);
    }).catch((error) => {
      console.error("Ошибка загрузки выходных:", error);
      setLoadingDaysOff(false);
    });
  }, []);
  reactExports.useEffect(() => {
    reloadSchedules();
    reloadExtraDays();
    reloadDaysOff();
  }, [reloadSchedules, reloadExtraDays, reloadDaysOff]);
  function loadMorePastDays() {
    const nextPage = pastDaysPage + 1;
    loadPastExtraDays(nextPage, 10).then((data) => {
      setPastExtraDays((prev) => [...prev, ...data.past_days || []]);
      setPastDaysHasMore(data.has_more);
      setPastDaysPage(nextPage);
    }).catch((error) => {
      console.error("Ошибка догрузки прошедших дней:", error);
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.page, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.pageHeader, children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "Расписание" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.card, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.sectionTitle, children: "Регулярная работа" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SchedulesList,
        {
          schedules,
          loading: loadingSchedules,
          onEdit: (schedule) => setScheduleModal({ mode: "edit", schedule }),
          onDelete: () => reloadSchedules(),
          onDataChanged: reloadSchedules
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.sectionActions, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: styles.btnPrimary,
          onClick: () => setScheduleModal({ mode: "add" }),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-plus" }),
            "Добавить рабочий день"
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.card, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.sectionTitle, children: "Дополнительно работаю" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        ExtraDaysList,
        {
          futureDays: futureExtraDays,
          pastDays: pastExtraDays,
          pastDaysHasMore,
          loading: loadingExtra,
          onLoadMorePast: loadMorePastDays,
          onDataChanged: reloadExtraDays
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.sectionActions, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: styles.btnPrimary,
          onClick: () => setExtraDayModal(true),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-plus" }),
            "Добавить допдень"
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.card, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.sectionTitle, children: "Выходные дни" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        DaysOffList,
        {
          daysOff,
          loading: loadingDaysOff,
          onDataChanged: reloadDaysOff
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.sectionActions, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: styles.btnPrimary,
          onClick: () => setDayOffModal(true),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-plus" }),
            "Добавить выходной"
          ]
        }
      ) })
    ] }),
    scheduleModal && /* @__PURE__ */ jsxRuntimeExports.jsx(
      ScheduleModal,
      {
        mode: scheduleModal.mode,
        schedule: scheduleModal.schedule,
        onClose: () => setScheduleModal(null),
        onSaved: reloadSchedules
      }
    ),
    extraDayModal && /* @__PURE__ */ jsxRuntimeExports.jsx(
      ExtraDayModal,
      {
        schedules,
        onClose: () => setExtraDayModal(false),
        onSaved: reloadExtraDays
      }
    ),
    dayOffModal && /* @__PURE__ */ jsxRuntimeExports.jsx(
      DayOffModal,
      {
        onClose: () => setDayOffModal(false),
        onSaved: reloadDaysOff
      }
    )
  ] });
}
const scheduleEl = document.getElementById("react-schedule");
if (scheduleEl) {
  client.createRoot(scheduleEl).render(
    /* @__PURE__ */ jsxRuntimeExports.jsx(ModalProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SchedulePage, {}) })
  );
}
