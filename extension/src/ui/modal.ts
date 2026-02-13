/**
 * Modal manager that sits outside the render cycle.
 * Modals are appended to document.body to avoid being wiped by re-renders.
 */

let currentModal: HTMLElement | null = null;

export function showModal(
  html: string,
  onAction: (action: string, data: Record<string, string | undefined>) => void,
): void {
  closeModal();

  const overlay = document.createElement("div");
  overlay.innerHTML = html;
  const modalElement = overlay.firstElementChild as HTMLElement;

  document.body.appendChild(modalElement);
  currentModal = modalElement;

  // Handle clicks
  modalElement.addEventListener("click", (e) => {
    const clickedElement = e.target as HTMLElement;

    // Close on overlay click
    if (clickedElement.hasAttribute("data-modal-overlay")) {
      closeModal();
      return;
    }

    // Handle action buttons
    const target = clickedElement.closest("[data-action]") as HTMLElement | null;
    if (target) {
      const action = target.dataset.action;
      if (action === "close-modal") {
        closeModal();
      } else if (action) {
        onAction(action, target.dataset);
      }
    }
  });

  // Focus first input
  const firstInput = modalElement.querySelector("input, select, textarea") as HTMLElement | null;
  firstInput?.focus();
  if (firstInput instanceof HTMLInputElement && firstInput.type === "text") {
    firstInput.select();
  }
}

export function closeModal(): void {
  if (currentModal) {
    currentModal.remove();
    currentModal = null;
  }
}
