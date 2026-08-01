import '@/styles/style.scss';
import {setLanguageSelectorBehavior} from "@/scripts/languageSelection";
import {setScrollingAnimations} from "@/scripts/scrollAnimations";
import {setModalBehaviour} from "@/scripts/modalBehavior";

window.addEventListener('load', function () {
    setLanguageSelectorBehavior();
    setScrollingAnimations();
    setModalBehaviour();
});

