function getBudget (participants, routePrice, housePrice, lifestyle, activities)
{
	let nParticipants = participants !== "" ? participants : 1;

	let housePromo = housePrice ? housePrice - (housePrice * 30 / 100) : 0;
	housePromo = housePromo ? Math.round((housePromo + Number.EPSILON) * 100) / 100 : 0;

	let totalPrice = (routePrice ? parseFloat(routePrice) : 0) + (housePrice ? parseFloat(housePrice) : 0);
	let totalPromo = (routePrice ? parseFloat(routePrice) : 0) + (housePromo ? housePromo : 0);

	let lifeStylePrice = 0, activitiesPrice = 0;
	JSON.parse(lifestyle).map(el => {
		lifeStylePrice += el.price ? el.price * (el.priceType === 0 ? nParticipants : 1) : 0;
	})
	JSON.parse(activities).map(el => {
		if (el.price) {
			activitiesPrice += el.price * (el.priceType === 0 ? nParticipants : 1);
		}
	})

	totalPrice += lifeStylePrice + activitiesPrice;
	totalPromo += lifeStylePrice + activitiesPrice;

	return {
		total: totalPrice,
		totalPromo: totalPromo,
		participants: nParticipants,
		breakdown: {
			transport: { label: "Trajet", amount: routePrice ? routePrice : 0, color: "bg-blue-500", promo: null },
			accommodation: { label: "Hébergement", amount: housePrice ? housePrice : 0, color: "bg-purple-500", promo: housePromo },
			activities: { label: "Activités", amount: activitiesPrice ? activitiesPrice : 0, color: "bg-emerald-500", promo: null },
			food: { label: "Style de vie", amount: lifeStylePrice ? lifeStylePrice : 0, color: "bg-amber-500", promo: null }
		}
	};
}

module.exports = {
	getBudget
}
