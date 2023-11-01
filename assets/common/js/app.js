import "../css/app.scss"

import '@commonFunctions/toastrOptions';

backTop()

function backTop () {
    let btn = document.querySelector('.back-top');
    console.log(btn);
    btn.addEventListener('click', () => {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    })
}