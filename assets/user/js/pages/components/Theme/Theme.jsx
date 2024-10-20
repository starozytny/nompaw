import React, { useState, useEffect } from 'react';

import { ButtonIcon } from "@tailwindComponents/Elements/Button";

export function Theme ()
{
    let saveTheme = localStorage.getItem('help.nompaw.theme');
    const [theme, setTheme] = useState(saveTheme ? saveTheme :"moon");

    let handleSwitch = (e) => {
        setTheme(theme === 'light' ? 'moon' : 'light');
    }

    useEffect(() => {
        setThemeClasse(theme)
        localStorage.setItem('help.nompaw.theme', theme);
    }, [theme]);

    return <ButtonIcon icon={theme} outline={true} tooltipWidth={102} onClick={handleSwitch}>Thème sombre</ButtonIcon>
}

function setThemeClasse(value) {
    let body = document.getElementById("body-theme");
    if(value === 'moon'){
        body.classList.remove('light-mode');
    }else{
        body.classList.add('light-mode');
    }
}
