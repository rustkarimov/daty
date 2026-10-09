import { r as reactExports } from "./chunk-react.js";
import { a as ModalContext } from "./chunk-modals.js";
function useModal() {
  const ctx = reactExports.useContext(ModalContext);
  if (!ctx) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return ctx;
}
export {
  useModal as u
};
