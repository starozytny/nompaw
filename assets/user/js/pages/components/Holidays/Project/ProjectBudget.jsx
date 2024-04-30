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

		return <div className="bg-white border rounded-md">

            <div className="p-4 bg-color0/80 text-slate-50 rounded-t-md">
                <div className="font-semibold">🏛️ Budget</div>
            </div>
            <div className="p-4">
                <div className="propals propals-budget">
                    <div>
                        <div className="propal propal-text">
                            <b>Récapitulatif des dépenses.</b>
                        </div>
                        <div className="propal propal-text">
                            <div>Trajet : {routePrice ? Sanitaze.toFormatCurrency(routePrice) : <span className="txt-danger">N.C</span>}</div>
                        </div>
                        <div className="propal propal-text">
                            <div>
                                Hébergement : {housePrice ? Sanitaze.toFormatCurrency(housePrice) : <span className="txt-danger">N.C</span>}
                                {housePromo ? <span style={{ opacity: "0.8", fontSize: "14px", paddingLeft: "8px" }}> (avec 30% : {housePromo})</span> : null}
                            </div>
                        </div>
                        <div className="propal propal-text">
                            <div>Style de vie : {lifeStylePrice ? Sanitaze.toFormatCurrency(lifeStylePrice) : <span className="txt-danger">N.C</span>}</div>
                        </div>
                        <div className="propal propal-text">
                            <div>
                                Activités : {activitiesPrice ? Sanitaze.toFormatCurrency(activitiesPrice) : (activitesWithoutPrice === 0 ? <span className="txt-danger">N.C</span> : "0€")}
                                {activitesWithoutPrice > 0 ? <span style={{ opacity: "0.8", fontSize: "14px", paddingLeft: "8px" }}> ({activitesWithoutPrice} sans prix)</span> : null}
                            </div>
                        </div>
                        <div className="text-red-500 text-sm">
                            Rafraichir la page pour voir les derniers calculs.
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div>
                            <Input identifiant="nbPers" valeur={nbPers} {...params}>Pour combien de personnes</Input>
                        </div>
                        <div>
                            <div className="text-gray-600">{Sanitaze.toFormatCurrency(totalPers / nNbPers)} / pers.</div>
                        </div>
                        {housePromo ? <div className="text-gray-600 text-sm">
                            {Sanitaze.toFormatCurrency(totalPPers / nNbPers)} / pers. avec les 30%
                        </div> : null}
                    </div>
                </div>
            </div>

            <div className="project-card-footer project-card-footer-total" style={{ flexDirection: "column" }}>
            <div>{Sanitaze.toFormatCurrency(totalPrice)}</div>
                {housePromo ? <div style={{ marginTop: "12px", fontSize: "16px", opacity: "0.8" }}>
                    {Sanitaze.toFormatCurrency(totalPromo)} avec les 30%
                </div> : null}
            </div>
        </div>
    }
}
