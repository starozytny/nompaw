import '../../css/pages/cryptos.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import { Trades } from "@userPages/Cryptos/Trades/Trades";

let el = document.getElementById("cryptos_list");
if(el){
    createRoot(el).render(<Trades {...el.dataset} />)
}
