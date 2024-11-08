import React, { Component } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Sort from "@commonFunctions/sort";
import List from "@commonFunctions/list";
import Formulaire from "@commonFunctions/formulaire";

import { LoaderElements } from "@tailwindComponents/Elements/Loader";

import { TradesList } from "@userPages/Cryptos/Trades/TradesList";

const URL_GET_DATA = "intern_api_cryptos_trades_list";

export class Trades extends Component {
	constructor (props) {
		super(props);

		this.state = {
			loadingData: true,
			errors: [],
			sorter: Sort.compareTradeAt
		}
	}

	componentDidMount = () => {
		this.handleGetData();
	}

    handleGetData = () => {
		const self = this;
		axios({ method: "GET", url: Routing.generate(URL_GET_DATA), data: {} })
			.then(function (response) {
				let data = response.data;

				self.setState({ data: data, loadingData: false })
			})
			.catch(function (error) {
				Formulaire.displayErrors(self, error);
			})
		;
    }

	handleUpdateList = (element, context) => {
		const { data, sorter } = this.state;
		let nData = List.updateData(element, context, data, sorter);

		this.setState({ data: nData })
	}

	render () {
		const { data, loadingData } = this.state;

		return <>
			{loadingData
				? <LoaderElements />
				: <TradesList data={data} onUpdateList={this.handleUpdateList} />
            }
        </>
    }
}
