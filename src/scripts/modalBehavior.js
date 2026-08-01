export const setModalBehaviour = function () {
    let openedWindowBack = null;

    const closeWindow = function (modal, back) {
        back.setAttribute('tabindex', -1);
        modal.classList.remove('modal-window_shown');
        openedWindowBack = null;
    }
    const openWindow = function (modal, back) {
        back.setAttribute('tabindex', 0);
        modal.classList.add('modal-window_shown');
        openedWindowBack = back;
    }

    const mapOfModals = {
        policy: undefined,
        termsOfUse: undefined,
    }
    const modals = [...document.querySelectorAll('.modal-window')];
    const modalsWithBacks = modals.map(el => {
        return {
            modal: el,
            back: el.querySelector('.modal-window__back'),
        }
    });
    modalsWithBacks.forEach(el => mapOfModals[el.modal.dataset.modal] = el);

    const openButtons = [...document.querySelectorAll('.modal-open')];
    openButtons.forEach(el => {
        const modal = mapOfModals[el.dataset.modal].modal;
        const back = mapOfModals[el.dataset.modal].back;
        el.addEventListener('click', () => openWindow(modal, back));
        el.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                openWindow(modal, back);
            }
        })
    })

    modalsWithBacks.forEach(el => {
        el.back.addEventListener('click', () => closeWindow(el.modal, el.back));
        el.back.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                closeWindow(el.modal, el.back);
            }
        })
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && openedWindowBack) {
            openedWindowBack.focus();
            e.preventDefault();
        }
    });
}