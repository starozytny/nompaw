import React, { Component } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Sort from "@commonFunctions/sort";
import List from "@commonFunctions/list";
import Formulaire from "@commonFunctions/formulaire";
import Sanitaze from "@commonFunctions/sanitaze";
import CryptoHoldings from "@userFunctions/cryptoHoldings";

import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { Button } from "@tailwindComponents/Elements/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@shadcnComponents/ui/card";

import { TradesList } from "@userPages/Cryptos/Trades/TradesList";
import { TradesFormulaire } from "@userPages/Cryptos/Trades/TradesForm";
import { ModalDelete } from "@tailwindComponents/Shortcut/Modal";

const DEPOT = 2;
const RETRAIT = 3;

const URL_GET_DATA = "intern_api_cryptos_trades_list";
const URL_DELETE_ELEMENT = "intern_api_cryptos_trades_delete";

export class Trades extends Component {
	constructor (props) {
		super(props);

		this.state = {
			loadingData: true,
			errors: [],
			sorter: Sort.compareTradeAt,
			deleteElement: null,
			editElement: null,
			sheetOpen: false,
		}

		this.delete = React.createRef();
	}

	componentDidMount = () => {
		this.handleGetData();
	}

	componentDidUpdate = (prevProps) => {
		if (prevProps.refreshSignal !== this.props.refreshSignal) {
			this.handleGetData();
		}
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

	handleModal = (identifiant, elem) => {
		this[identifiant].current.handleClick();
		this.setState({ deleteElement: elem })
	}

	handleOpenCreate = () => {
		this.setState({ editElement: null, sheetOpen: true })
	}

	handleEdit = (elem) => {
		this.setState({ editElement: elem, sheetOpen: true })
	}

	handleSheetOpenChange = (open) => {
		this.setState(prev => ({ sheetOpen: open, editElement: open ? prev.editElement : null }))
	}

	render () {
		const { data, loadingData, deleteElement, editElement, sheetOpen } = this.state;

		let totalDepot = 0, totalRetrait = 0;
		if (data) {
			data.forEach(elem => {
				if (elem.type === DEPOT) totalDepot += elem.total;
				if (elem.type === RETRAIT) totalRetrait += elem.totalReal;
			})
		}

		let holdings = data ? CryptoHoldings.computeHoldingsAndAlerts(data).holdings : [];

		return <>
			{loadingData
				? <LoaderElements />
				: <div className="flex flex-col gap-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Card className="overflow-hidden">
							<CardContent className="flex items-center gap-4 p-4">
								<div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl"
									 style={{ background: 'var(--cat-crypto-soft)', color: 'var(--cat-crypto)' }}>
									<span className="icon-bank text-lg" />
								</div>
								<div>
									<div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Net investi</div>
									<span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--cat-crypto)' }}>
										{Sanitaze.toFormatCurrency(totalDepot - totalRetrait)}
									</span>
									<div className="text-[10px] text-muted-foreground">Dépôts - retraits</div>
								</div>
							</CardContent>
						</Card>

						<Card className="overflow-hidden">
							<CardContent className="flex items-center gap-4 p-4">
								<div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl"
									 style={{ background: 'var(--cat-income-soft)', color: 'var(--cat-income)' }}>
									<span className="icon-storage text-lg" />
								</div>
								<div className="min-w-0">
									<div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Cryptos détenues</div>
									<span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--cat-income)' }}>
										{holdings.length}
									</span>
									{holdings.length > 0 && <div className="truncate text-[10px] text-muted-foreground">
										{holdings.map(h => h.coin).join(', ')}
									</div>}
								</div>
							</CardContent>
						</Card>
					</div>

					<Card className="overflow-hidden">
						<CardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b p-4">
							<CardTitle className="text-sm">
								Transactions <span className="font-normal text-muted-foreground">({data.length})</span>
							</CardTitle>
							<Button type="blue" onClick={this.handleOpenCreate}>
								<span className="icon-add mr-1"></span>Ajouter
							</Button>
						</CardHeader>
						<CardContent className="p-0">
							<TradesList data={data} onModal={this.handleModal} onEdit={this.handleEdit} />
						</CardContent>
					</Card>
				</div>
            }

			<TradesFormulaire context={editElement ? "update" : "create"} element={editElement}
							  open={sheetOpen} onOpenChange={this.handleSheetOpenChange}
							  onUpdateList={this.handleUpdateList} />

			<ModalDelete refModal={this.delete} element={deleteElement} routeName={URL_DELETE_ELEMENT}
						 title="Supprimer cette transaction" msgSuccess="Transaction supprimée."
						 onUpdateList={this.handleUpdateList}>
				Êtes-vous sûr de vouloir supprimer définitivement cette transaction ?
			</ModalDelete>
        </>
    }
}
