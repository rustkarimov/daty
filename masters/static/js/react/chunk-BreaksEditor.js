import { r as reactExports, j as jsxRuntimeExports } from "./chunk-react.js";
import { u as useModal } from "./chunk-useModal.js";
const editor = "_editor_1al4j_11";
const title = "_title_1al4j_29";
const breakRow = "_breakRow_1al4j_45";
const value = "_value_1al4j_85";
const input = "_input_1al4j_99";
const separator = "_separator_1al4j_131";
const actions = "_actions_1al4j_141";
const iconBtn = "_iconBtn_1al4j_153";
const iconBtnSuccess = "_iconBtnSuccess_1al4j_197";
const iconBtnSecondary = "_iconBtnSecondary_1al4j_215";
const iconBtnDanger = "_iconBtnDanger_1al4j_233";
const emptyRow = "_emptyRow_1al4j_245";
const emptyText = "_emptyText_1al4j_263";
const dot = "_dot_1al4j_275";
const styles = {
  editor,
  title,
  breakRow,
  value,
  input,
  separator,
  actions,
  iconBtn,
  iconBtnSuccess,
  iconBtnSecondary,
  iconBtnDanger,
  emptyRow,
  emptyText,
  dot
};
function BreaksEditor({ breaks, onChange }) {
  const [editingIndex, setEditingIndex] = reactExports.useState(null);
  const [editValues, setEditValues] = reactExports.useState({ start: "", end: "" });
  const [newBreak, setNewBreak] = reactExports.useState(null);
  const { showAlert, showConfirm } = useModal();
  function handleEditClick(index) {
    setEditingIndex(index);
    setEditValues({
      start: breaks[index].start,
      end: breaks[index].end
    });
  }
  function handleSaveEdit() {
    if (!editValues.start || !editValues.end) {
      showAlert("Заполните оба поля", "warning");
      return;
    }
    if (editValues.start >= editValues.end) {
      showAlert("Время начала должно быть раньше времени окончания", "warning");
      return;
    }
    const newBreaks = [...breaks];
    newBreaks[editingIndex] = { ...editValues };
    onChange(newBreaks);
    setEditingIndex(null);
  }
  function handleCancelEdit() {
    setEditingIndex(null);
  }
  async function handleDelete(index) {
    const ok = await showConfirm("Удалить этот перерыв?", { type: "danger" });
    if (!ok) return;
    const newBreaks = breaks.filter((_, i) => i !== index);
    onChange(newBreaks);
  }
  function handleAdd() {
    setNewBreak({ start: "", end: "" });
  }
  function handleSaveNew() {
    if (!newBreak.start || !newBreak.end) {
      showAlert("Заполните оба поля", "warning");
      return;
    }
    if (newBreak.start >= newBreak.end) {
      showAlert("Время начала должно быть раньше времени окончания", "warning");
      return;
    }
    const newBreaks = [...breaks, newBreak];
    onChange(newBreaks);
    setNewBreak(null);
  }
  function handleCancelNew() {
    setNewBreak(null);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.editor, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.title, children: "Перерывы:" }),
    breaks.map((br, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.breakRow, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.dot, children: "•" }),
      editingIndex === index ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "time",
            className: styles.input,
            value: editValues.start,
            onChange: (e) => setEditValues({ ...editValues, start: e.target.value })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.separator, children: "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "time",
            className: styles.input,
            value: editValues.end,
            onChange: (e) => setEditValues({ ...editValues, end: e.target.value })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: `${styles.iconBtn} ${styles.iconBtnSuccess}`,
            onClick: handleSaveEdit,
            title: "Сохранить",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-check" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            className: `${styles.iconBtn} ${styles.iconBtnSecondary}`,
            onClick: handleCancelEdit,
            title: "Отмена",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-times" })
          }
        )
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles.value, children: [
          br.start,
          " — ",
          br.end
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.actions, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: styles.iconBtn,
              onClick: () => handleEditClick(index),
              title: "Редактировать",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-edit" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: `${styles.iconBtn} ${styles.iconBtnDanger}`,
              onClick: () => handleDelete(index),
              title: "Удалить",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-trash" })
            }
          ),
          index === breaks.length - 1 && !newBreak && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: styles.iconBtn,
              onClick: handleAdd,
              title: "Добавить перерыв",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-plus" })
            }
          )
        ] })
      ] })
    ] }, index)),
    newBreak && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.breakRow, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.dot, children: "•" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "time",
          className: styles.input,
          value: newBreak.start,
          onChange: (e) => setNewBreak({ ...newBreak, start: e.target.value })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.separator, children: "—" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "time",
          className: styles.input,
          value: newBreak.end,
          onChange: (e) => setNewBreak({ ...newBreak, end: e.target.value })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: `${styles.iconBtn} ${styles.iconBtnSuccess}`,
          onClick: handleSaveNew,
          title: "Сохранить",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-check" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: `${styles.iconBtn} ${styles.iconBtnSecondary}`,
          onClick: handleCancelNew,
          title: "Отмена",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-times" })
        }
      )
    ] }),
    breaks.length === 0 && !newBreak && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.emptyRow, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.dot, children: "•" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.emptyText, children: "Нет перерывов" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: styles.iconBtn,
          onClick: handleAdd,
          title: "Добавить перерыв",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-plus" })
        }
      )
    ] })
  ] });
}
export {
  BreaksEditor as B
};
