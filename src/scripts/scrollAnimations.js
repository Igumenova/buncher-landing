export let refreshSizes = function () {
    //reainitiated later, do not remove
}

export const setScrollingAnimations = function () {
    const NUMBER_OF_BLOCKS = 5;
    const COUNTER_RATIO = 0.65;

    const measure100vh = document.querySelector('.section-footer');
    const blocks = document.querySelectorAll('.trackable');

    const addStyleWithPrefixes = function (element, styleName, value) {
        element.style.setProperty(`-webkit-${styleName}`, value);
        element.style.setProperty(`-moz-${styleName}`, value);
        element.style.setProperty(`-ms-${styleName}`, value);
        element.style.setProperty(`-o-${styleName}`, value);
        element.style.setProperty(styleName, value);
    }
    const createNumberIntersectionObserver = function (blocks) {
        const REGEX = /_\d+-\d+$/;
        const numberCont = document.getElementById('changing-number');
        const visibleBlocks = [];

        const options = {
            root: null,
            threshold: 0.5,
        };

        visibleBlocks.length = NUMBER_OF_BLOCKS;
        visibleBlocks.fill(false);

        let recount = true;
        const callback = (entries) => {
            entries.forEach(entry => {
                const nextArrayIndex = Number(entry.target.dataset.num);
                const curArrayIndex = nextArrayIndex - 1;

                if (recount) {
                    if (entry.isIntersecting) {
                        visibleBlocks[curArrayIndex] = true;
                        numberCont.className = numberCont.className.replace(REGEX, `_${nextArrayIndex}-${nextArrayIndex}`);
                    }
                    return;
                }

                if (visibleBlocks[nextArrayIndex] === true ||
                    (nextArrayIndex === NUMBER_OF_BLOCKS && entry.target.getBoundingClientRect().top < 0)) {
                    return;
                }
                if (entry.isIntersecting) {
                    visibleBlocks[curArrayIndex] = true;
                    numberCont.className = numberCont.className.replace(REGEX, `_${curArrayIndex}-${nextArrayIndex}`);
                }
                else {
                    visibleBlocks[curArrayIndex] = false;
                    numberCont.className = numberCont.className.replace(REGEX, `_${nextArrayIndex}-${curArrayIndex}`);
                }
            });
            recount = false;
        };

        const observer = new IntersectionObserver(callback, options);

        blocks.forEach(block => {
            observer.observe(block);
        });
    }
    const createPhoneAnimation = function (blocks) {
        const REGEX = /\d+-\d+$/;
        const ANCHORS_PER_ELEMENT = [1, 3, 2, 4, 2];
        const anchorElements = [];
        const insertAnchors = (elements, anchorsPerEl) => {
            const getAnchorContainer = (anchors, id) => {
                const anchorContainer = document.createElement('div');
                anchorContainer.classList.add('anchor', `anchor_${id}`);
                anchorContainer.append(...anchors);
                return anchorContainer;
            }
            const getAnchor = (containerId, anchorId, num) => {
                const anchor = document.createElement('div');
                anchor.dataset.num = num;
                anchor.dataset.id = `${containerId}-${anchorId}`;
                anchor.classList.add(`anchor__item`, `anchor__item_${containerId}-${anchorId}`);
                return anchor;
            };

            let counter = 0;
            elements.forEach((el, ind) => {
                let anchors = [];
                for (let i = 0; i < anchorsPerEl[ind]; i++) {
                    anchors[i] = getAnchor(ind, i, ++counter);
                }
                el.appendChild(getAnchorContainer(anchors, ind));
                anchorElements.push(anchors);
            });
            return anchorElements;
        };
        const createObserver = (anchors) => {
            const phone = document.getElementById('phone');
            const options = {
                root: null,
                threshold: 0.5,
            };

            let first = true;
            const callback = (entries) => {
                entries.forEach(entry => {

                    const curNum = Number(entry.target.dataset.num);
                    const prevNum = curNum - 1;


                    if (first) {
                        if (entry.isIntersecting) {
                            phone.className = phone.className.replace(REGEX, anchors[prevNum].dataset.id);
                        }
                        return;
                    }

                    //if intersection from above -> return
                    const top = entry.target.getBoundingClientRect().top;
                    if (top < measure100vh.clientHeight - top) {
                        return;
                    }

                    if (entry.isIntersecting) {
                        phone.className = phone.className.replace(REGEX, anchors[prevNum].dataset.id);
                    }
                    else {
                        phone.className = phone.className.replace(REGEX, anchors[prevNum - 1]?.dataset.id ?? '999-999');
                    }
                });
                first = false;
            };

            const observer = new IntersectionObserver(callback, options);

            anchors.forEach(el => {
                observer.observe(el);
            });
        }

        insertAnchors(blocks, ANCHORS_PER_ELEMENT);
        createObserver(anchorElements.flat());
    }
    const createMainIntersectionObserver = function () {
        const mainSection = document.getElementById('section-main');
        const longDecorationLine = document.getElementById('decoration-line-long');
        const counterBlock = document.getElementById('counter');
        const options = {
            root: null,
            threshold: 0.05,
        };

        const callback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    longDecorationLine.classList.add('section-main__decoration_long_hidden');
                    counterBlock.classList.add('section-main__counter-block_shown');
                }
                else {
                    longDecorationLine.classList.remove('section-main__decoration_long_hidden');
                    counterBlock.classList.remove('section-main__counter-block_shown');
                }
            });
        };

        const observer = new IntersectionObserver(callback, options);
        observer.observe(mainSection);
    }
    const createEndIntersectionObserver = function () {
        const endBlock = document.getElementById('section-footer');
        const decorativeLine = document.querySelector('.decoration-line_hor_trackable')
        const decorativeMask = document.querySelector('.section-main__mask_trackable ')

        const options = {
            root: null,
            threshold: 0.1,
        };

        const callback = (entries) => {

            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    decorativeLine.classList.add('section-main__decoration_hor_hidden');
                    decorativeMask.classList.add('section-main__mask_hidden');
                    decorativeMask.classList.add('section-main__mask_animated');
                }
                else {
                    decorativeLine.classList.remove('section-main__decoration_hor_hidden');
                    decorativeMask.classList.remove('section-main__mask_hidden');
                }
            });
        };

        const observer = new IntersectionObserver(callback, options);
        observer.observe(endBlock);
    }
    const setNewScreenProps = function () {
        const textContainer = document.getElementById('section-main__text-container');
        const contentContainer = document.getElementById('section-main__content-block');
        const phone = document.getElementById('phone');
        const counter = document.getElementById('counter');
        const wrapper = document.getElementById('main-wrapper');
        const scrollEl = document.getElementById('custom-scrollbar');
        const arrowEl = document.querySelector('.section-main__arrow-block');
        const footerSection = document.getElementById('section-footer');
        const footerContainer = footerSection.querySelector('.section-footer__footer-container');
        const socialContainer = footerContainer.querySelector('.section-footer__socials-container');


        const changeSmallerSocialsPosition = () => {
            if (socialContainer.parentNode === footerContainer) {
                socialContainer.classList.add('section-footer__socials-container_mobile');
                footerContainer.removeChild(socialContainer);
                footerSection.appendChild(socialContainer);
            }
        }
        const changeBiggerSocialsPosition = () => {
            if (socialContainer.parentNode === footerSection) {
                socialContainer.classList.remove('section-footer__socials-container_mobile');
                footerSection.removeChild(socialContainer);
                footerContainer.appendChild(socialContainer);
            }
        }
        const changeSmallerMaskPosition = () => {
            const bottom = contentContainer.getBoundingClientRect().bottom;
            const top = textContainer.getBoundingClientRect().top;
            addStyleWithPrefixes(textContainer, 'mask-position', `0 ${-top + bottom}px`);
        }
        const changeBiggerMaskPosition = () => {
            const top = textContainer.getBoundingClientRect().top;
            addStyleWithPrefixes(textContainer, 'mask-position', `0 ${-top}px`);

        }
        const addBiggerScreenEventListener = () => {
            scrollEl.addEventListener("scroll", changeBiggerMaskPosition);
        }
        const addSmallerScreenEventListener = () => {
            scrollEl.addEventListener("scroll", changeSmallerMaskPosition);
        }
        const removeListener = (func) => {
            scrollEl.removeEventListener("scroll", func);
        }
        const setSmallerScreenStyles = () => {
            textContainer.classList.add('section-main__text-container_small'); //must be executed first!
            requestAnimationFrame(() => {
                const gap_between_numbers = measure100vh.clientHeight * 0.1;
                const halfGap = gap_between_numbers * 0.5;
                const rect = contentContainer.getBoundingClientRect();
                const visibleSize = measure100vh.clientHeight - rect.height;
                const textContainerSize = visibleSize * (NUMBER_OF_BLOCKS + 1.4); //+1.4 as we have pseudo-elements;
                addStyleWithPrefixes(arrowEl, 'mask-size', `${rect.right - rect.width * 0.24}px`);
                wrapper.style.paddingBottom = `${visibleSize}px`;
                wrapper.style.height = `${rect.height + textContainerSize}px`;
                textContainer.style.minHeight = `${textContainerSize}px`;
                addStyleWithPrefixes(textContainer, 'mask-size', `100% ${visibleSize}px`);

                const phoneRect = phone.getBoundingClientRect();
                const counterBottom = visibleSize - halfGap;
                let counterWidth = window.innerWidth - phoneRect.right + 8;

                if (measure100vh.clientHeight - (gap_between_numbers + counterBottom + counterWidth / COUNTER_RATIO) < 20) {

                    counterWidth = (measure100vh.clientHeight - gap_between_numbers - counterBottom - 20) * COUNTER_RATIO;
                }

                counter.style.width = `${counterWidth}px`;
                counter.style.height = `${counterWidth / COUNTER_RATIO}px`;
                counter.style.top = 'auto';
                counter.style.bottom = `${counterBottom}px`;
            });
        }
        const setBiggerScreenStyles = () => {
            textContainer.classList.remove('section-main__text-container_small'); //must be executed first!
            addStyleWithPrefixes(arrowEl, 'mask-size', 'unset');
            wrapper.style.paddingBottom = '0';
            wrapper.style.height = `auto`;
            textContainer.style.minHeight = `100vh`;
            addStyleWithPrefixes(textContainer, 'mask-size', `100% 100vh`);

            requestAnimationFrame(() => {
                const gap_between_numbers = measure100vh.clientHeight * 0.1;
                const rect = contentContainer.getBoundingClientRect();
                const phoneRect = phone.getBoundingClientRect();
                let counterWidth = window.innerWidth - phoneRect.right + 10;
                const counterTop = phoneRect.top - rect.top - gap_between_numbers * 0.5;
                counter.style.width = `${counterWidth}px`;
                counter.style.height = `${counterWidth / COUNTER_RATIO}px`;
                counter.style.top = `${counterTop}px`;
                counter.style.bottom = `auto`;
            });
        }
        const changeMode = () => {
            if (window.innerWidth <= 600 || window.innerWidth < window.innerHeight) {
                setSmallerScreenStyles();
                requestAnimationFrame(() => {
                    removeListener(changeBiggerMaskPosition);
                    addSmallerScreenEventListener();
                    changeSmallerMaskPosition();
                });
                changeSmallerSocialsPosition();
            }
            else {
                setBiggerScreenStyles();
                requestAnimationFrame(() => {
                    removeListener(changeSmallerMaskPosition);
                    addBiggerScreenEventListener();
                    changeBiggerMaskPosition();
                });
                changeBiggerSocialsPosition();
            }
        }
        window.addEventListener('resize', () => {
            setTimeout(changeMode, 250);
        });
        requestAnimationFrame(changeMode);
        return changeMode;
    }

    refreshSizes = setNewScreenProps();
    createNumberIntersectionObserver(blocks);
    createPhoneAnimation(blocks);
    createMainIntersectionObserver();
    createEndIntersectionObserver();
}