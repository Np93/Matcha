let currentToast = null;

export function showErrorToast(error) {
  let message = "An unexpected error occurred.";

  if (typeof error === "string") {
    message = error;
  } else if (error?.response?.data?.detail) {
    message = error.response.data.detail;
  } else if (error?.message) {
    message = error.message;
  }

  // Supprime l'ancien toast s'il existe
  if (currentToast) {
    currentToast.remove();
    currentToast = null;
  }

  // Ajoute le container s’il n’existe pas
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = `
      fixed top-4 left-1/2 transform -translate-x-1/2 z-50
      flex flex-col items-center space-y-2 pointer-events-none
    `;
    document.body.appendChild(toastContainer);
  }

  // Crée le toast
  const toast = document.createElement("div");
  toast.textContent = message;

  toast.className = `
    relative bg-red-600 text-white px-4 py-3
    rounded-xl shadow-lg text-sm sm:text-base
    break-words text-center max-w-[90vw] sm:max-w-md
    opacity-0 transition-opacity duration-300 pointer-events-auto
  `;

  toastContainer.appendChild(toast);
  void toast.offsetHeight; // Force repaint
  toast.classList.remove("opacity-0");

  currentToast = toast;

  // Supprimer après 5s avec fondu
  setTimeout(() => {
    toast.classList.add("opacity-0");
    setTimeout(() => {
      toast.remove();
      currentToast = null;
      if (toastContainer.children.length === 0) {
        toastContainer.remove();
      }
    }, 300);
  }, 5000);
}