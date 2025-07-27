
// --- DOM SELECTORS ---
const loaderContainer = document.getElementById('loader-container');
const generateBtn = document.getElementById('generate-btn');
const generateDifferentQuizBtn = document.getElementById('generate-different-quiz-btn');
const generateDifferentQuizBtnFromReview = document.getElementById('generate-different-quiz-btn-from-review');
const errorMessageEl = document.getElementById('error-message');

/**
 * Shows a specific page and hides all others.
 * @param pageId The ID of the page element to show.
 */
export function showPage(pageId: string) {
    document.querySelectorAll('.main-container > .page').forEach(page => {
        (page as HTMLElement).classList.remove('active');
    });
    const pageToShow = document.getElementById(pageId);
    if (pageToShow) {
        pageToShow.classList.add('active');
    }
}

/**
 * Shows or hides a modal dialog.
 * @param modalId The ID of the modal container element.
 * @param show True to show, false to hide.
 */
export function showModal(modalId: string, show = true) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.toggle('active', show);
    }
}


export function showError(message: string) {
    if (errorMessageEl) {
        errorMessageEl.textContent = message;
        errorMessageEl.style.display = 'block';
    }
    if (loaderContainer) loaderContainer.style.display = 'none';
    if (generateBtn) {
        generateBtn.style.display = 'block';
        (generateBtn as HTMLButtonElement).disabled = false;
    }
    if (generateDifferentQuizBtn) (generateDifferentQuizBtn as HTMLButtonElement).disabled = false;
    if (generateDifferentQuizBtnFromReview) (generateDifferentQuizBtnFromReview as HTMLButtonElement).disabled = false;
}

export function hideError() {
    if(errorMessageEl) errorMessageEl.style.display = 'none';
}
