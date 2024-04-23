import React, { useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import Routing   from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Sanitaze from '@commonFunctions/sanitaze';

import { ButtonIcon } from "@tailwindComponents/Elements/Button";

const URL_UPDATE_PAGE   = "user_budget_categories_update";

export function CategoriesItem ({ elem, highlight, onModal })
{
    const refItem = useRef(null);

    let nHighlight = highlight === elem.id;

    useEffect(() => {
        if(nHighlight && refItem.current){
            refItem.current.scrollIntoView({block: "center"})
        }
    })

    let urlUpdate = Routing.generate(URL_UPDATE_PAGE, {'id': elem.id});

    return <div className={"item" + (nHighlight ? " highlight" : "")} ref={refItem}>
        <div className="item-content">
            <div className="item-infos item-infos-categories">
                <div className="col-1 col-with-image">
                    <div className={"badge badge-type-" + elem.type}>{elem.typeString}</div>
                </div>
                <div className="col-2">
                    <div>{elem.name}</div>
                </div>
                <div className="col-3">
                    {elem.type === 2 && <div>{Sanitaze.toFormatCurrency(elem.goal)}</div>}
                </div>
                <div className="col-4 actions">
                    <ButtonIcon outline={true} icon="pencil" onClick={urlUpdate} element="a">Modifier</ButtonIcon>
                    <ButtonIcon outline={true} icon="trash" onClick={() => onModal("delete", elem)}>Supprimer</ButtonIcon>
                </div>
            </div>
        </div>
    </div>
}

CategoriesItem.propTypes = {
    elem: PropTypes.object.isRequired,
    onModal: PropTypes.func.isRequired,
    highlight: PropTypes.number,
}
