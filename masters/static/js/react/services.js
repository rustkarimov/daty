import { r as reactExports, j as jsxRuntimeExports, c as client } from "./chunk-react.js";
import { u as useModal } from "./chunk-useModal.js";
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
function loadCategories() {
  return request("/api/categories/", { method: "GET" });
}
function addCategory(data) {
  return request("/api/categories/add/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
function editCategory(id, data) {
  return request(`/api/categories/${id}/edit/`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}
function deleteCategory(id) {
  return request(`/api/categories/${id}/delete/`, { method: "POST" });
}
function getService(id) {
  return request(`/api/services/${id}/get/`, { method: "GET" });
}
function addService(data) {
  return request("/api/services/add/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}
function editService(id, data) {
  return request(`/api/services/${id}/edit/`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}
function deleteService(id) {
  return request(`/api/services/${id}/delete/`, { method: "POST" });
}
const list$1 = "_list_1khpi_9";
const categoryCard = "_categoryCard_1khpi_23";
const categoryHeader = "_categoryHeader_1khpi_51";
const categoryTitle = "_categoryTitle_1khpi_79";
const chevron = "_chevron_1khpi_105";
const chevronOpen = "_chevronOpen_1khpi_117";
const badge = "_badge_1khpi_125";
const categoryActions = "_categoryActions_1khpi_145";
const servicesGrid = "_servicesGrid_1khpi_157";
const serviceCard = "_serviceCard_1khpi_173";
const serviceName = "_serviceName_1khpi_193";
const serviceDescription = "_serviceDescription_1khpi_205";
const serviceMeta = "_serviceMeta_1khpi_223";
const serviceDuration = "_serviceDuration_1khpi_239";
const servicePrice = "_servicePrice_1khpi_255";
const serviceActions = "_serviceActions_1khpi_269";
const iconBtn$1 = "_iconBtn_1khpi_285";
const iconBtnDanger$1 = "_iconBtnDanger_1khpi_329";
const emptyState = "_emptyState_1khpi_341";
const btnPrimary$3 = "_btnPrimary_1khpi_397";
const styles$3 = {
  list: list$1,
  categoryCard,
  categoryHeader,
  categoryTitle,
  chevron,
  chevronOpen,
  badge,
  categoryActions,
  servicesGrid,
  serviceCard,
  serviceName,
  serviceDescription,
  serviceMeta,
  serviceDuration,
  servicePrice,
  serviceActions,
  iconBtn: iconBtn$1,
  iconBtnDanger: iconBtnDanger$1,
  emptyState,
  btnPrimary: btnPrimary$3
};
function ServicesList({
  categories,
  uncategorized,
  onAddService,
  onEditService,
  onEditCategory,
  onDataChanged
}) {
  const [openCategories, setOpenCategories] = reactExports.useState(/* @__PURE__ */ new Set());
  const { showAlert, showConfirm } = useModal();
  const hasAnything = categories.length > 0 || uncategorized.length > 0;
  function toggleCategory(catId) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  }
  async function handleDeleteCategory(cat) {
    const ok = await showConfirm(
      `Удалить категорию "${cat.name}"?
Услуги из этой категории будут перемещены в «Без категории».`,
      { type: "danger" }
    );
    if (!ok) return;
    try {
      const data = await deleteCategory(cat.id);
      if (data.success) {
        onDataChanged();
      } else {
        showAlert(data.error || "Ошибка при удалении", "error");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      showAlert("Ошибка соединения", "error");
    }
  }
  async function handleDeleteService(service) {
    const ok = await showConfirm(
      `Удалить услугу "${service.name}"?`,
      { type: "danger" }
    );
    if (!ok) return;
    try {
      const data = await deleteService(service.id);
      if (data.success) {
        onDataChanged();
      } else {
        showAlert(data.error || "Ошибка при удалении", "error");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      showAlert("Ошибка соединения", "error");
    }
  }
  if (!hasAnything) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.emptyState, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-cut" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { children: "У вас пока нет услуг" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Добавьте первую услугу или категорию" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", className: styles$3.btnPrimary, onClick: onAddService, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-plus" }),
        "Добавить услугу"
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.list, children: [
    categories.map((cat) => {
      const isOpen = openCategories.has(cat.id);
      const hasServices = cat.services.length > 0;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.categoryCard, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: styles$3.categoryHeader,
            onClick: () => hasServices && toggleCategory(cat.id),
            style: { cursor: hasServices ? "pointer" : "default" },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.categoryTitle, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "i",
                  {
                    className: `fas fa-chevron-right ${styles$3.chevron} ${isOpen ? styles$3.chevronOpen : ""}`
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-folder-open" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: cat.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$3.badge, children: cat.services.length })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: styles$3.categoryActions,
                  onClick: (e) => e.stopPropagation(),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        className: styles$3.iconBtn,
                        onClick: () => onEditCategory(cat),
                        title: "Редактировать категорию",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-edit" })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        className: `${styles$3.iconBtn} ${styles$3.iconBtnDanger}`,
                        onClick: () => handleDeleteCategory(cat),
                        title: "Удалить категорию",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-trash" })
                      }
                    )
                  ]
                }
              )
            ]
          }
        ),
        hasServices && isOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.servicesGrid, children: cat.services.map((service) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          ServiceCard,
          {
            service,
            onEdit: () => onEditService(service.id),
            onDelete: () => handleDeleteService(service)
          },
          service.id
        )) })
      ] }, cat.id);
    }),
    uncategorized.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.categoryCard, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.categoryHeader, style: { cursor: "default" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.categoryTitle, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-tag" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Без категории" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$3.badge, children: uncategorized.length })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.servicesGrid, children: uncategorized.map((service) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        ServiceCard,
        {
          service,
          onEdit: () => onEditService(service.id),
          onDelete: () => handleDeleteService(service)
        },
        service.id
      )) })
    ] })
  ] });
}
function ServiceCard({ service, onEdit, onDelete }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.serviceCard, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.serviceName, children: service.name }),
    service.description && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.serviceDescription, children: service.description }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.serviceMeta, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$3.serviceDuration, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "far fa-clock" }),
        service.duration,
        " мин"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$3.servicePrice, children: [
        service.price,
        " ₽"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.serviceActions, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: styles$3.iconBtn,
          onClick: onEdit,
          title: "Редактировать",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-edit" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: `${styles$3.iconBtn} ${styles$3.iconBtnDanger}`,
          onClick: onDelete,
          title: "Удалить",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-trash" })
        }
      )
    ] })
  ] });
}
const backdrop$1 = "_backdrop_182nc_11";
const modal$1 = "_modal_182nc_37";
const header$1 = "_header_182nc_67";
const title$1 = "_title_182nc_85";
const closeBtn$1 = "_closeBtn_182nc_113";
const body$1 = "_body_182nc_149";
const form = "_form_182nc_163";
const formField$1 = "_formField_182nc_177";
const formLabel$1 = "_formLabel_182nc_193";
const formInput$1 = "_formInput_182nc_209";
const formHint = "_formHint_182nc_241";
const listBlock = "_listBlock_182nc_257";
const listTitle = "_listTitle_182nc_265";
const emptyText = "_emptyText_182nc_285";
const list = "_list_182nc_257";
const listItem = "_listItem_182nc_311";
const viewRow = "_viewRow_182nc_349";
const viewName = "_viewName_182nc_365";
const viewBadge = "_viewBadge_182nc_381";
const viewOrder = "_viewOrder_182nc_401";
const editRow = "_editRow_182nc_415";
const editName = "_editName_182nc_431";
const editOrder = "_editOrder_182nc_463";
const itemActions = "_itemActions_182nc_499";
const iconBtn = "_iconBtn_182nc_511";
const iconBtnSuccess = "_iconBtnSuccess_182nc_555";
const iconBtnDanger = "_iconBtnDanger_182nc_573";
const btnPrimary$2 = "_btnPrimary_182nc_585";
const btnSecondary$1 = "_btnSecondary_182nc_635";
const footer$1 = "_footer_182nc_671";
const styles$2 = {
  backdrop: backdrop$1,
  modal: modal$1,
  header: header$1,
  title: title$1,
  closeBtn: closeBtn$1,
  body: body$1,
  form,
  formField: formField$1,
  formLabel: formLabel$1,
  formInput: formInput$1,
  formHint,
  listBlock,
  listTitle,
  emptyText,
  list,
  listItem,
  viewRow,
  viewName,
  viewBadge,
  viewOrder,
  editRow,
  editName,
  editOrder,
  itemActions,
  iconBtn,
  iconBtnSuccess,
  iconBtnDanger,
  btnPrimary: btnPrimary$2,
  btnSecondary: btnSecondary$1,
  footer: footer$1
};
function CategoryModal({
  mode = "add",
  category = null,
  categories = [],
  onClose,
  onSaved
}) {
  const [formId, setFormId] = reactExports.useState("");
  const [formName, setFormName] = reactExports.useState("");
  const [formOrder, setFormOrder] = reactExports.useState(0);
  const [saving, setSaving] = reactExports.useState(false);
  const [editingId, setEditingId] = reactExports.useState(null);
  const [editingName, setEditingName] = reactExports.useState("");
  const [editingOrder, setEditingOrder] = reactExports.useState(0);
  const { showAlert, showConfirm } = useModal();
  reactExports.useEffect(() => {
    if (mode === "edit" && category) {
      setFormId(category.id);
      setFormName(category.name);
      setFormOrder(category.order || 0);
    } else {
      setFormId("");
      setFormName("");
      setFormOrder(0);
    }
  }, [mode, category]);
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }
  async function handleSaveForm(e) {
    e.preventDefault();
    const name = formName.trim();
    if (!name) {
      showAlert("Введите название категории", "warning");
      return;
    }
    setSaving(true);
    try {
      const payload = { name, order: parseInt(formOrder) || 0 };
      const data = formId ? await editCategory(formId, payload) : await addCategory(payload);
      if (data.success) {
        setFormId("");
        setFormName("");
        setFormOrder(0);
        onSaved();
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
  function handleStartEdit(cat) {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setEditingOrder(cat.order || 0);
  }
  function handleCancelEdit() {
    setEditingId(null);
    setEditingName("");
    setEditingOrder(0);
  }
  async function handleSaveInline(catId) {
    const name = editingName.trim();
    if (!name) {
      showAlert("Введите название", "warning");
      return;
    }
    try {
      const data = await editCategory(catId, {
        name,
        order: parseInt(editingOrder) || 0
      });
      if (data.success) {
        setEditingId(null);
        onSaved();
      } else {
        showAlert(data.error || "Ошибка сохранения", "error");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      showAlert("Ошибка соединения", "error");
    }
  }
  async function handleDelete(cat) {
    const ok = await showConfirm(
      `Удалить категорию "${cat.name}"?
Услуги из этой категории будут перемещены в «Без категории».`,
      { type: "danger" }
    );
    if (!ok) return;
    try {
      const data = await deleteCategory(cat.id);
      if (data.success) {
        onSaved();
      } else {
        showAlert(data.error || "Ошибка удаления", "error");
      }
    } catch (error) {
      console.error("Ошибка:", error);
      showAlert("Ошибка соединения", "error");
    }
  }
  const titleIcon = mode === "edit" ? "fa-edit" : "fa-folder-plus";
  const titleText = mode === "edit" ? "Редактировать категорию" : "Добавить категорию";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.backdrop, onClick: handleBackdropClick, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.modal, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.header, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h5", { className: styles$2.title, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${titleIcon}` }),
        titleText
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
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.body, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: styles$2.form, onSubmit: handleSaveForm, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.formField, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$2.formLabel, children: "Название категории" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              className: styles$2.formInput,
              value: formName,
              onChange: (e) => setFormName(e.target.value),
              placeholder: "Например: Маникюр, Педикюр, Уход",
              autoFocus: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.formField, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$2.formLabel, children: "Порядок сортировки" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "number",
              className: styles$2.formInput,
              value: formOrder,
              onChange: (e) => setFormOrder(e.target.value),
              min: "0"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("small", { className: styles$2.formHint, children: "Чем меньше число, тем выше категория в списке" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "submit",
            className: styles$2.btnPrimary,
            disabled: saving,
            children: saving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }),
              "Сохранение..."
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-check" }),
              "Сохранить категорию"
            ] })
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.listBlock, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.listTitle, children: "Другие категории" }),
        categories.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.emptyText, children: "У вас пока нет категорий" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.list, children: categories.map((cat) => {
          const isEditing = editingId === cat.id;
          return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.listItem, children: isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.editRow, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  className: styles$2.editName,
                  value: editingName,
                  onChange: (e) => setEditingName(e.target.value),
                  autoFocus: true
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "number",
                  className: styles$2.editOrder,
                  value: editingOrder,
                  onChange: (e) => setEditingOrder(e.target.value),
                  min: "0"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.itemActions, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: `${styles$2.iconBtn} ${styles$2.iconBtnSuccess}`,
                  onClick: () => handleSaveInline(cat.id),
                  title: "Сохранить",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-check" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: styles$2.iconBtn,
                  onClick: handleCancelEdit,
                  title: "Отмена",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-times" })
                }
              )
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.viewRow, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: styles$2.viewName, children: cat.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$2.viewBadge, children: [
                cat.services.length,
                " услуг"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$2.viewOrder, children: [
                "порядок: ",
                cat.order
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.itemActions, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: styles$2.iconBtn,
                  onClick: () => handleStartEdit(cat),
                  title: "Редактировать",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-edit" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: `${styles$2.iconBtn} ${styles$2.iconBtnDanger}`,
                  onClick: () => handleDelete(cat),
                  title: "Удалить",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-trash" })
                }
              )
            ] })
          ] }) }, cat.id);
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.footer, children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: styles$2.btnSecondary, onClick: onClose, children: "Закрыть" }) })
  ] }) });
}
const backdrop = "_backdrop_1rzgw_11";
const modal = "_modal_1rzgw_37";
const header = "_header_1rzgw_67";
const title = "_title_1rzgw_85";
const closeBtn = "_closeBtn_1rzgw_113";
const body = "_body_1rzgw_149";
const loading$1 = "_loading_1rzgw_161";
const formField = "_formField_1rzgw_173";
const formLabel = "_formLabel_1rzgw_181";
const required = "_required_1rzgw_197";
const formInput = "_formInput_1rzgw_205";
const formSelect = "_formSelect_1rzgw_207";
const formTextarea = "_formTextarea_1rzgw_209";
const row = "_row_1rzgw_281";
const checkboxField = "_checkboxField_1rzgw_303";
const checkboxInput = "_checkboxInput_1rzgw_321";
const checkboxLabel = "_checkboxLabel_1rzgw_337";
const checkboxHint = "_checkboxHint_1rzgw_351";
const btnPrimary$1 = "_btnPrimary_1rzgw_367";
const btnSecondary = "_btnSecondary_1rzgw_419";
const footer = "_footer_1rzgw_471";
const styles$1 = {
  backdrop,
  modal,
  header,
  title,
  closeBtn,
  body,
  loading: loading$1,
  formField,
  formLabel,
  required,
  formInput,
  formSelect,
  formTextarea,
  row,
  checkboxField,
  checkboxInput,
  checkboxLabel,
  checkboxHint,
  btnPrimary: btnPrimary$1,
  btnSecondary,
  footer
};
function ServiceModal({
  mode = "add",
  serviceId = null,
  categories = [],
  onClose,
  onSaved
}) {
  const [loading2, setLoading] = reactExports.useState(mode === "edit");
  const [saving, setSaving] = reactExports.useState(false);
  const { showAlert } = useModal();
  const [formCategoryId, setFormCategoryId] = reactExports.useState("");
  const [formName, setFormName] = reactExports.useState("");
  const [formDescription, setFormDescription] = reactExports.useState("");
  const [formDuration, setFormDuration] = reactExports.useState("");
  const [formPrice, setFormPrice] = reactExports.useState("");
  const [formIsActive, setFormIsActive] = reactExports.useState(true);
  reactExports.useEffect(() => {
    if (mode !== "edit" || !serviceId) return;
    setLoading(true);
    getService(serviceId).then((response) => {
      if (!response.success) {
        showAlert(response.error || "Ошибка загрузки услуги", "error");
        onClose();
        return;
      }
      const service = response.data;
      setFormCategoryId(service.category_id || "");
      setFormName(service.name || "");
      setFormDescription(service.description || "");
      setFormDuration(service.duration || "");
      setFormPrice(service.price || "");
      setFormIsActive(service.is_active !== false);
      setLoading(false);
    }).catch((error) => {
      console.error("Ошибка:", error);
      showAlert("Ошибка соединения", "error");
      onClose();
    });
  }, [mode, serviceId, showAlert, onClose]);
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }
  async function handleSave(e) {
    e.preventDefault();
    const name = formName.trim();
    const duration = parseInt(formDuration);
    const price = parseFloat(formPrice);
    if (!name) {
      showAlert("Введите название услуги", "warning");
      return;
    }
    if (!duration || duration < 5) {
      showAlert("Длительность должна быть не меньше 5 минут", "warning");
      return;
    }
    if (isNaN(price) || price < 0) {
      showAlert("Введите корректную цену", "warning");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        description: formDescription.trim(),
        duration,
        price,
        is_active: formIsActive,
        category_id: formCategoryId || null
      };
      const data = mode === "edit" ? await editService(serviceId, payload) : await addService(payload);
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
  const titleText = mode === "edit" ? "Редактировать услугу" : "Добавить услугу";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.backdrop, onClick: handleBackdropClick, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.modal, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.header, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h5", { className: styles$1.title, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${titleIcon}` }),
        titleText
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
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.body, children: loading2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-border", style: { color: "var(--primary)" } }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { id: "service-form", onSubmit: handleSave, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.formField, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$1.formLabel, children: "Категория" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            className: styles$1.formSelect,
            value: formCategoryId,
            onChange: (e) => setFormCategoryId(e.target.value),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "— Без категории —" }),
              categories.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: cat.id, children: cat.name }, cat.id))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.formField, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: styles$1.formLabel, children: [
          "Название услуги ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$1.required, children: "*" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            className: styles$1.formInput,
            value: formName,
            onChange: (e) => setFormName(e.target.value),
            placeholder: "Например: Классический маникюр",
            autoFocus: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.formField, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: styles$1.formLabel, children: "Описание" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            className: styles$1.formTextarea,
            value: formDescription,
            onChange: (e) => setFormDescription(e.target.value),
            rows: "3",
            placeholder: "Необязательно"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.row, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.formField, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: styles$1.formLabel, children: [
            "Длительность (мин) ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$1.required, children: "*" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "number",
              className: styles$1.formInput,
              value: formDuration,
              onChange: (e) => setFormDuration(e.target.value),
              min: "5",
              step: "5",
              placeholder: "60"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.formField, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: styles$1.formLabel, children: [
            "Цена (₽) ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$1.required, children: "*" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "number",
              className: styles$1.formInput,
              value: formPrice,
              onChange: (e) => setFormPrice(e.target.value),
              min: "0",
              step: "50",
              placeholder: "1500"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.checkboxField, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "checkbox",
            id: "service-active",
            className: styles$1.checkboxInput,
            checked: formIsActive,
            onChange: (e) => setFormIsActive(e.target.checked)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "service-active", className: styles$1.checkboxLabel, children: "Активна" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$1.checkboxHint, children: "Неактивные услуги не видны клиентам" })
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
          form: "service-form",
          className: styles$1.btnPrimary,
          disabled: saving || loading2,
          children: saving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-spinner fa-spin" }),
            "Сохранение..."
          ] }) : "Сохранить"
        }
      )
    ] })
  ] }) });
}
const page = "_page_1ijv2_9";
const pageHeader = "_pageHeader_1ijv2_17";
const actionsBar = "_actionsBar_1ijv2_41";
const btnOutline = "_btnOutline_1ijv2_55";
const btnPrimary = "_btnPrimary_1ijv2_57";
const loading = "_loading_1ijv2_129";
const styles = {
  page,
  pageHeader,
  actionsBar,
  btnOutline,
  btnPrimary,
  loading
};
function ServicesPage() {
  const [categories, setCategories] = reactExports.useState([]);
  const [uncategorized, setUncategorized] = reactExports.useState([]);
  const [loading2, setLoading] = reactExports.useState(true);
  const [categoryModal, setCategoryModal] = reactExports.useState(null);
  const [serviceModal, setServiceModal] = reactExports.useState(null);
  const { showAlert } = useModal();
  const reloadData = reactExports.useCallback(() => {
    setLoading(true);
    loadCategories().then((data) => {
      setCategories(data.categories || []);
      setUncategorized(data.uncategorized || []);
      setLoading(false);
    }).catch((error) => {
      console.error("Ошибка загрузки категорий:", error);
      setLoading(false);
      showAlert("Не удалось загрузить услуги", "error");
    });
  }, [showAlert]);
  reactExports.useEffect(() => {
    reloadData();
  }, [reloadData]);
  function openAddCategory() {
    setCategoryModal({ mode: "add" });
  }
  function openEditCategory(category) {
    setCategoryModal({ mode: "edit", category });
  }
  function openAddService() {
    setServiceModal({ mode: "add" });
  }
  function openEditService(serviceId) {
    setServiceModal({ mode: "edit", serviceId });
  }
  function closeCategoryModal() {
    setCategoryModal(null);
  }
  function closeServiceModal() {
    setServiceModal(null);
  }
  function handleDataChanged() {
    reloadData();
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.page, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.pageHeader, children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "Мои услуги" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.actionsBar, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: styles.btnOutline,
          onClick: openAddCategory,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-folder-plus" }),
            "Добавить категорию"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          className: styles.btnPrimary,
          onClick: openAddService,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "fas fa-plus" }),
            "Добавить услугу"
          ]
        }
      )
    ] }),
    loading2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-border", style: { color: "var(--primary)" } }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      ServicesList,
      {
        categories,
        uncategorized,
        onAddService: openAddService,
        onEditService: openEditService,
        onEditCategory: openEditCategory,
        onDataChanged: handleDataChanged
      }
    ),
    categoryModal && /* @__PURE__ */ jsxRuntimeExports.jsx(
      CategoryModal,
      {
        mode: categoryModal.mode,
        category: categoryModal.category,
        categories,
        onClose: closeCategoryModal,
        onSaved: handleDataChanged
      }
    ),
    serviceModal && /* @__PURE__ */ jsxRuntimeExports.jsx(
      ServiceModal,
      {
        mode: serviceModal.mode,
        serviceId: serviceModal.serviceId,
        categories,
        onClose: closeServiceModal,
        onSaved: handleDataChanged
      }
    )
  ] });
}
const servicesEl = document.getElementById("react-services");
if (servicesEl) {
  client.createRoot(servicesEl).render(
    /* @__PURE__ */ jsxRuntimeExports.jsx(ModalProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(ServicesPage, {}) })
  );
}
