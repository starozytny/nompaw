import React, { useRef } from "react";
import PropTypes from 'prop-types';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Sanitaze from '@commonFunctions/sanitaze';

import { setHighlightClass, useHighlight } from "@commonHooks/item";

import { Badge } from "@tailwindComponents/Elements/Badge";
import { ButtonIcon, ButtonIconA } from "@tailwindComponents/Elements/Button";

const URL_UPDATE_PAGE = "user_budget_recurrences_update";

export function RecurrencesItem ({ elem, highlight, onModal }) {
    const refItem = useRef(null);

    let nHighlight = useHighlight(highlight, elem.id, refItem);

	let urlUpdate = Routing.generate(URL_UPDATE_PAGE, { id: elem.id });

    let badgesBudget = ['red', 'blue', 'yellow', 'gray', 'gray'];

    return <div className={`item${setHighlightClass(nHighlight)} border-t hover:bg-slate-50`} ref={refItem}>
		<div className="item-content">
			<div className="item-infos">
				<div className="col-1">
                    <Badge type={badgesBudget[elem.type]}>{elem.typeString}</Badge>
				</div>
				<div className="col-2">
					<div className="font-semibold">{elem.name}</div>
					<div className="text-gray-600 text-sm">
						Débute le {elem.initMonth}/{elem.initYear}.
					</div>
					{elem.category && <div className="mt-2">
                        <Badge type={badgesBudget[elem.category.type]}>{elem.category.name}</Badge>
                    </div>}
				</div>
				<div className="col-3">
					<div className={`font-semibold ${elem.type ? "text-blue-500" : "text-red-600"}`}>
						<span className={`icon-${elem.typeIcon}`}></span> {Sanitaze.toFormatCurrency(elem.price)}
					</div>
				</div>
				<div className="col-4 actions">
					<ButtonIconA type="default" icon="pencil" onClick={urlUpdate}>Modifier</ButtonIconA>
					<ButtonIcon type="default" icon="trash" onClick={() => onModal("delete", elem)}>Supprimer</ButtonIcon>
				</div>
			</div>
		</div>
	</div>
}

RecurrencesItem.propTypes = {
	elem: PropTypes.object.isRequired,
	onModal: PropTypes.func.isRequired,
	highlight: PropTypes.number,
}
