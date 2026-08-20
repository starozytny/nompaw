import '../../css/pages/cryptos.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import Cryptos from "@userPages/Cryptos/Cryptos";

let el = document.getElementById("cryptos_list");
if(el){
    createRoot(el).render(<Cryptos {...el.dataset} />)
}
