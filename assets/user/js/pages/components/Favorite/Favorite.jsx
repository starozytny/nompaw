import React, { useState } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";

import { ButtonIcon } from "@tailwindComponents/Elements/Button";

const URL_FAVORITE_ELEMENT = 'intern_api_cook_favorites_favorite';

export function Favorite ({ id, isFav }) {
	const [fav, setFav] = useState(parseInt(isFav) === 1);
	const [loadFav, setLoadFav] = useState(false);

	const handleClick = () => {
		let self = this;

		if (!loadFav) {
			setLoadFav(true);
			axios({ method: "POST", url: Routing.generate(URL_FAVORITE_ELEMENT, { id: id }), data: {} })
				.then(function (response) {
					let code = response.data.code;
					setFav(parseInt(code) !== 0)
					setLoadFav(false);
				})
				.catch(function (error) {
					Formulaire.displayErrors(self, error);
					Formulaire.loader(false);
				})
			;
		}
	}

	let icon = loadFav ? 'chart-3' : (fav ? 'heart1' : 'heart');
	let text = fav ? 'Enlever des favoris' : 'Mettre en favoris';

	return <>
		<ButtonIcon icon={icon} type="default" onClick={handleClick} tooltipWidth={128}>{text}</ButtonIcon>
	</>
}

Favorite.propTypes = {
	id: PropTypes.string.isRequired,
	isFav: PropTypes.string.isRequired,
}
