import React, { Component } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Sanitaze from "@commonFunctions/sanitaze";

import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { Button } from "@tailwindComponents/Elements/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@shadcnComponents/ui/card";

import { TradesList } from "@userPages/Cryptos/Trades/TradesList";
import { TradesFormulaire } from "@userPages/Cryptos/Trades/TradesForm";
import { ModalDelete } from "@tailwindComponents/Shortcut/Modal";

const URL_GET_DATA = "intern_api_cryptos_trades_list";
const URL_GET_HOLDINGS = "intern_api_cryptos_trades_holdings";
const URL_GET_HOLDINGS_YEAR = "intern_api_cryptos_trades_holdings_year";
const URL_GET_FILTERS = "intern_api_cryptos_trades_filters";
const URL_DELETE_ELEMENT = "intern_api_cryptos_trades_delete";

export class Trades extends Component {
	constructor (props) {
		super(props);

		this.state = {
			loadingData: true,
			errors: [],
			deleteElement: null,
			editElement: null,
			sheetOpen: false,
			selectedYear: null,
			years: [],
			yearStats: null,
			yearHoldings: [],
			holdings: [],
			netInvested: { depot: 0, retrait: 0 },
			filterOptions: { platforms: [], tokens: [], hasManual: false },
		}

		// One year's trades per key, so switching back to an already-visited year is instant instead of
		// refetching — the trade-off for moving the replay server-side and no longer holding the full
		// history in the browser. Cleared on any mutation/refresh so a stale year is never shown again.
		this.yearCache = {};

		this.delete = React.createRef();
	}

	componentDidMount = () => {
		this.handleGetYearData(null);
		this.handleGetHoldings();
		this.handleGetFilters();
	}

	componentDidUpdate = (prevProps) => {
		if (prevProps.refreshSignal !== this.props.refreshSignal) {
			this.yearCache = {};
			this.handleGetYearData(this.state.selectedYear);
			this.handleGetHoldings();
			this.handleGetFilters();
		}
	}

	// `year: null` asks the server for the most recent year with data (only used on first load, before
	// any year is known). `silent: true` (used after a create/update/delete) skips the loadingData flip so
	// the Transactions card/TradesList stays mounted and its accordion/filter state survives the refetch,
	// instead of being blanked out by LoaderElements for a mutation the user just triggered themselves.
	handleGetYearData = (year, { silent = false } = {}) => {
		const self = this;

		if (year !== null && this.yearCache[year]) {
			const cached = this.yearCache[year];
			this.setState({ data: cached.trades, selectedYear: year, years: cached.years, yearStats: cached.yearStats, yearHoldings: cached.yearHoldings, loadingData: false });
			return;
		}

		if (!silent) {
			this.setState({ loadingData: true });
		}

		axios({ method: "GET", url: Routing.generate(URL_GET_DATA), params: year !== null ? { year } : {} })
			.then(function (response) {
				const { trades, years, yearStats, year: resolvedYear } = response.data;

				if (resolvedYear === null) {
					self.setState({ data: trades, years, yearStats, yearHoldings: [], selectedYear: resolvedYear, loadingData: false });
					return;
				}

				axios({ method: "GET", url: Routing.generate(URL_GET_HOLDINGS_YEAR, { year: resolvedYear }) })
					.then(function (holdingsResponse) {
						const yearHoldings = holdingsResponse.data.holdings;
						self.yearCache[resolvedYear] = { trades, years, yearStats, yearHoldings };
						self.setState({ data: trades, years, yearStats, yearHoldings, selectedYear: resolvedYear, loadingData: false });
					})
					.catch(function (error) {
						console.log(error)
						Formulaire.displayErrors(self, error);
						self.yearCache[resolvedYear] = { trades, years, yearStats, yearHoldings: [] };
						self.setState({ data: trades, years, yearStats, yearHoldings: [], selectedYear: resolvedYear, loadingData: false });
					})
				;
			})
			.catch(function (error) {
				console.log(error)
				Formulaire.displayErrors(self, error);
				self.setState({ loadingData: false })
			})
		;
	}

	handleGetHoldings = () => {
		const self = this;
		axios({ method: "GET", url: Routing.generate(URL_GET_HOLDINGS) })
			.then(function (response) {
				self.setState({ holdings: response.data.holdings, netInvested: response.data.netInvested })
			})
			.catch(function (error) {
				Formulaire.displayErrors(self, error);
			})
		;
	}

	handleGetFilters = () => {
		const self = this;
		axios({ method: "GET", url: Routing.generate(URL_GET_FILTERS) })
			.then(function (response) {
				self.setState({ filterOptions: response.data })
			})
			.catch(function (error) {
				Formulaire.displayErrors(self, error);
			})
		;
	}

	handleYearChange = (year) => {
		this.handleGetYearData(year);
	}

	// A create/update/delete can shift the running "Dispo" balance and holdings for any year from the
	// mutated trade's date onward (not just the currently displayed one), so the safe, simple choice is
	// to drop the whole cache and refetch rather than try to patch state locally.
	handleUpdateList = () => {
		this.yearCache = {};
		this.handleGetYearData(this.state.selectedYear, { silent: true });
		this.handleGetHoldings();
		this.handleGetFilters();
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
		const { data, loadingData, deleteElement, editElement, sheetOpen, years, selectedYear, yearStats, yearHoldings, holdings, netInvested, filterOptions } = this.state;

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
										{Sanitaze.toFormatCurrency(netInvested.depot - netInvested.retrait)}
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
							<CardTitle className="text-sm">Transactions</CardTitle>
							<Button type="blue" onClick={this.handleOpenCreate}>
								<span className="icon-add mr-1"></span>Ajouter
							</Button>
						</CardHeader>
						<CardContent className="p-0">
							<TradesList data={data} years={years} selectedYear={selectedYear} yearStats={yearStats}
										yearHoldings={yearHoldings}
										filterOptions={filterOptions} onYearChange={this.handleYearChange}
										onModal={this.handleModal} onEdit={this.handleEdit} />
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
