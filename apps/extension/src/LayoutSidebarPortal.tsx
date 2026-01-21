import ReactDOM from "react-dom";

export default function LayoutSidebarPortal({ children }: { children: React.ReactNode }) {
  const target = document.querySelector("[data-slot='layout-sidebar-portal']");
  if (!target) {
    return null;
  }
  return ReactDOM.createPortal(children, target);
}
