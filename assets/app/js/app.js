import '../css/app.scss';

const routes = require('@publicFolder/js/fos_js_routes.json');
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min';

import Menu from "@tailwindFunctions/menu";

Routing.setRoutingData(routes);

Menu.menuListener();
inputPassword();
backTop()

function inputPassword () {
    let inputShow = document.querySelector('.input-show');
    if(inputShow){
        let see = false;
        let input = document.querySelector('#password');
        let icon = document.querySelector('.input-show > span');
        inputShow.addEventListener('click', function (e){
            if(see){
                see = false;
                input.type = "password";
                icon.classList.remove("icon-vision-not");
                icon.classList.add("icon-vision");
            }else{
                see = true;
                input.type = "text";
                icon.classList.add("icon-vision-not");
                icon.classList.remove("icon-vision");
            }
        })
    }
}

function backTop () {
    let btn = document.querySelector('.back-top');
    if(btn){
        btn.addEventListener('click', () => {
            document.body.scrollTop = 0; // For Safari
            document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        })
    }
}
