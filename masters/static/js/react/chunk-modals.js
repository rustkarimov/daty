import { r as reactExports, j as jsxRuntimeExports } from "./chunk-react.js";
const backdrop$1 = "_backdrop_1uwbg_9";
const modal$1 = "_modal_1uwbg_31";
const fadeInUp$1 = "_fadeInUp_1uwbg_1";
const header$1 = "_header_1uwbg_57";
const title$1 = "_title_1uwbg_75";
const closeBtn = "_closeBtn_1uwbg_105";
const body$1 = "_body_1uwbg_139";
const footer$1 = "_footer_1uwbg_155";
const btnPrimary = "_btnPrimary_1uwbg_171";
const success = "_success_1uwbg_207";
const error = "_error_1uwbg_215";
const warning = "_warning_1uwbg_223";
const styles$1 = {
  backdrop: backdrop$1,
  modal: modal$1,
  fadeInUp: fadeInUp$1,
  header: header$1,
  title: title$1,
  closeBtn,
  body: body$1,
  footer: footer$1,
  btnPrimary,
  success,
  error,
  warning
};
const ICONS = {
  success: "fa-check-circle",
  error: "fa-exclamation-circle",
  warning: "fa-exclamation-triangle",
  info: "fa-info-circle"
};
const DEFAULT_TITLES = {
  success: "Готово!",
  error: "Ошибка",
  warning: "Внимание",
  info: "Уведомление"
};
function AlertModal({ message, title: title2, type = "info", onClose }) {
  const okBtnRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);
  reactExports.useEffect(() => {
    if (okBtnRef.current) okBtnRef.current.focus();
  }, []);
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
  const displayTitle = title2 || DEFAULT_TITLES[type] || "Уведомление";
  const iconClass = ICONS[type] || ICONS.info;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.backdrop, onClick: handleBackdropClick, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${styles$1.modal} ${styles$1[type] || ""}`, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.header, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h5", { className: styles$1.title, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${iconClass}` }),
        displayTitle
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
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.body, children: message }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.footer, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        className: styles$1.btnPrimary,
        onClick: onClose,
        ref: okBtnRef,
        children: "OK"
      }
    ) })
  ] }) });
}
const backdrop = "_backdrop_1hqnv_9";
const modal = "_modal_1hqnv_31";
const fadeInUp = "_fadeInUp_1hqnv_1";
const header = "_header_1hqnv_57";
const title = "_title_1hqnv_75";
const body = "_body_1hqnv_105";
const footer = "_footer_1hqnv_121";
const btnSecondary = "_btnSecondary_1hqnv_139";
const btnConfirm = "_btnConfirm_1hqnv_175";
const danger = "_danger_1hqnv_211";
const info = "_info_1hqnv_235";
const styles = {
  backdrop,
  modal,
  fadeInUp,
  header,
  title,
  body,
  footer,
  btnSecondary,
  btnConfirm,
  danger,
  info
};
function ConfirmModal({
  message,
  title: title2 = "Подтверждение",
  confirmText = "Да",
  cancelText = "Отмена",
  type = "warning",
  onConfirm,
  onCancel
}) {
  const confirmBtnRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onCancel]);
  reactExports.useEffect(() => {
    if (confirmBtnRef.current) confirmBtnRef.current.focus();
  }, []);
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  }
  const ICONS2 = {
    warning: "fa-exclamation-triangle",
    danger: "fa-exclamation-circle",
    info: "fa-question-circle"
  };
  const iconClass = ICONS2[type] || ICONS2.warning;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.backdrop, onClick: handleBackdropClick, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${styles.modal} ${styles[type] || ""}`, onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.header, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h5", { className: styles.title, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: `fas ${iconClass}` }),
      title2
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.body, children: message }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.footer, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: styles.btnSecondary,
          onClick: onCancel,
          children: cancelText
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          className: styles.btnConfirm,
          onClick: onConfirm,
          ref: confirmBtnRef,
          children: confirmText
        }
      )
    ] })
  ] }) });
}
const ModalContext = reactExports.createContext(null);
function ModalProvider({ children }) {
  const [alertState, setAlertState] = reactExports.useState(null);
  const [confirmState, setConfirmState] = reactExports.useState(null);
  const showAlert = reactExports.useCallback((message, options = {}) => {
    const opts = typeof options === "string" ? { type: options } : options;
    return new Promise((resolve) => {
      setAlertState({
        message,
        type: opts.type || "info",
        title: opts.title,
        resolve
      });
    });
  }, []);
  const showConfirm = reactExports.useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setConfirmState({
        message,
        title: options.title || "Подтверждение",
        confirmText: options.confirmText || "Да",
        cancelText: options.cancelText || "Отмена",
        type: options.type || "warning",
        resolve
      });
    });
  }, []);
  const handleAlertClose = reactExports.useCallback(() => {
    if (alertState == null ? void 0 : alertState.resolve) alertState.resolve();
    setAlertState(null);
  }, [alertState]);
  const handleConfirmOk = reactExports.useCallback(() => {
    if (confirmState == null ? void 0 : confirmState.resolve) confirmState.resolve(true);
    setConfirmState(null);
  }, [confirmState]);
  const handleConfirmCancel = reactExports.useCallback(() => {
    if (confirmState == null ? void 0 : confirmState.resolve) confirmState.resolve(false);
    setConfirmState(null);
  }, [confirmState]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(ModalContext.Provider, { value: { showAlert, showConfirm }, children: [
    children,
    alertState && /* @__PURE__ */ jsxRuntimeExports.jsx(
      AlertModal,
      {
        message: alertState.message,
        title: alertState.title,
        type: alertState.type,
        onClose: handleAlertClose
      }
    ),
    confirmState && /* @__PURE__ */ jsxRuntimeExports.jsx(
      ConfirmModal,
      {
        message: confirmState.message,
        title: confirmState.title,
        confirmText: confirmState.confirmText,
        cancelText: confirmState.cancelText,
        type: confirmState.type,
        onConfirm: handleConfirmOk,
        onCancel: handleConfirmCancel
      }
    )
  ] });
}
export {
  ModalProvider as M,
  ModalContext as a
};
