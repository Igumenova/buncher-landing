import '@/styles/style.scss';
import {setLanguageSelectorBehavior} from "@/scripts/languageSelection";
import {setScrollingAnimations} from "@/scripts/scrollAnimations";
import {setModalBehaviour} from "@/scripts/modalBehavior";
import {setCoverTypingAnimation} from "@/scripts/coverTypingAnimation";
import {setSubscribeFormBehavior} from "@/scripts/subscribeForm";

window.addEventListener('load', function () {
    setLanguageSelectorBehavior();
    setCoverTypingAnimation();
    setScrollingAnimations();
    setModalBehaviour();
    setSubscribeFormBehavior();

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document
                .getElementById('custom-scrollbar')
                ?.classList.remove('custom-scrollbar_loading-locked');
        });
    });
});
