import React, { Component } from "react";

import Sanitaze from "@commonFunctions/sanitaze";

import { Input } from "@tailwindComponents/Elements/Fields";

export class ProjectBudget extends Component {
	constructor (props) {
		super(props);

		this.state = {
			nbPers: 1,
			errors: []
		}
	}

	handleChange = (e) => {
		this.setState({ [e.currentTarget.name]: e.currentTarget.value })
	}

	render () {
		const { routePrice, housePrice, lifestyle, activities } = this.props;
		const { errors, nbPers } = this.state;

		let params = { errors: errors, onChange: this.handleChange }

		let housePromo = housePrice ? housePrice - (housePrice * 30 / 100) : 0;
		housePromo = housePromo ? Math.round((housePromo + Number.EPSILON) * 100) / 100 : 0;

		let totalPrice = (routePrice ? parseFloat(routePrice) : 0) + (housePrice ? parseFloat(housePrice) : 0);
		let totalPromo = (routePrice ? parseFloat(routePrice) : 0) + (housePromo ? housePromo : 0);
		let totalPers = (routePrice ? parseFloat(routePrice) : 0) + (housePrice ? parseFloat(housePrice) : 0);
		let totalPPers = (routePrice ? parseFloat(routePrice) : 0) + (housePromo ? housePromo : 0);

		let nNbPers = nbPers !== "" ? nbPers : 1;

		let lifeStylePrice = 0, activitiesPrice = 0, activitesWithoutPrice = 0;
		let lifeStylePricePers = 0, activitiesPricePers = 0;
		JSON.parse(lifestyle).map(el => {
			lifeStylePrice += el.price ? el.price : 0;
			lifeStylePricePers += el.price ? el.price * (el.priceType === 0 ? nNbPers : 1) : 0;
		})
		JSON.parse(activities).map(el => {
			if (el.isSelected) {
				if (el.price) {
					activitiesPrice += el.price;
					activitiesPricePers += el.price * (el.priceType === 0 ? nNbPers : 1);
				} else {
					activitesWithoutPrice++;
				}
			}
		})

		totalPrice += lifeStylePrice + activitiesPrice;
		totalPromo += lifeStylePrice + activitiesPrice;
		totalPers += lifeStylePricePers + activitiesPricePers;
		totalPPers += lifeStylePricePers + activitiesPricePers;

		return <div className="bg-white border rounded-md max-w-screen-lg">
            <div className="p-4 bg-color0/80 text-slate-50 rounded-t-md">
                <div className="font-semibold text-xl">🏛️ Budget</div>
            </div>
            <div className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="w-full flex flex-col gap-2">
                        <div className="font-semibold">Récapitulatif des dépenses.</div>
                        <div>
                            <div>Trajet : {routePrice ? Sanitaze.toFormatCurrency(routePrice) : <span className="text-red-500">N.C</span>}</div>
                        </div>
                        <div>
							Hébergement : {housePrice ? Sanitaze.toFormatCurrency(housePrice) : <span className="text-red-500">N.C</span>}
							{housePromo ? <span className="text-gray-600 text-xs"> (avec 30% : {housePromo})</span> : null}
                        </div>
                        <div>
							Style de vie : {lifeStylePrice ? Sanitaze.toFormatCurrency(lifeStylePrice) : <span className="text-red-500">N.C</span>}
                        </div>
                        <div>
							Activités : {activitiesPrice ? Sanitaze.toFormatCurrency(activitiesPrice) : (activitesWithoutPrice === 0 ? <span className="text-red-500">N.C</span> : "0€")}
							{activitesWithoutPrice > 0 ? <span className="text-gray-600 text-xs"> ({activitesWithoutPrice} sans prix)</span> : null}
                        </div>
                        <div className="text-red-500 text-sm">
                            Rafraichir la page pour voir les derniers calculs.
                        </div>
                    </div>
                    <div className="w-full flex flex-col gap-4">
                        <div>
                            <Input identifiant="nbPers" valeur={nbPers} {...params}>Pour combien de personnes</Input>
                        </div>
                        <div>{Sanitaze.toFormatCurrency(totalPers / nNbPers)} / pers.</div>
                        {housePromo ? <div className="text-gray-600 text-sm">
                            {Sanitaze.toFormatCurrency(totalPPers / nNbPers)} / pers. avec les 30%
                        </div> : null}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2 justify-center items-center p-4 bg-color0/10 rounded-b-md">
            	<div className="text-xl font-bold text-yellow-500">{Sanitaze.toFormatCurrency(totalPrice)}</div>
                {housePromo ? <div  className="text-gray-600 text-xs">{Sanitaze.toFormatCurrency(totalPromo)} avec les 30%</div> : null}
            </div>
        </div>
    }
}
