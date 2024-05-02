import React, { Component } from "react";

import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Sort from "@commonFunctions/sort";
import List from "@commonFunctions/list";

import { Search } from "@tailwindComponents/Elements/Search";
import { Filter } from "@tailwindComponents/Elements/Filter";
import { ModalDelete } from "@tailwindComponents/Shortcut/Modal";
import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { Pagination, TopSorterPagination } from "@tailwindComponents/Elements/Pagination";

import { RecurrencesList } from "@userPages/Budget/Reccurences/RecurrencesList";

const URL_GET_DATA = "intern_api_budget_recurrences_list";
const URL_DELETE_ELEMENT = "intern_api_budget_recurrences_delete";

const SESSION_PERPAGE = "nompaw.perpage.recurrences";
const SESSION_FILTERS = "nompaw.filters.recurrences";

export class Recurrences extends Component {
	constructor (props) {
		super(props);

		this.state = {
            perPage: List.getSessionPerpage(SESSION_PERPAGE, 20),
			currentPage: 0,
			sorter: Sort.compareName,
			loadingData: true,
            filters: List.getSessionFilters(SESSION_FILTERS, [], props.highlight),
			element: null
		}

		this.pagination = React.createRef();
		this.delete = React.createRef();
	}

	componentDidMount = () => {
		this.handleGetData();
	}

    handleGetData = () => {
        const { perPage, sorter, filters } = this.state;

        let url = this.props.urlGetData ? this.props.urlGetData : Routing.generate(URL_GET_DATA);
        List.getData(this, url, perPage, sorter, this.props.highlight, filters, this.handleFilters);
    }

	handleUpdateData = (currentData) => {
		this.setState({ currentData })
	}

	handleSearch = (search) => {
		const { perPage, sorter, dataImmuable, filters } = this.state;
		List.search(this, 'recurrence', search, dataImmuable, perPage, sorter, true, filters, this.handleFilters)
	}

    handleFilters = (filters, nData = null) => {
		const { dataImmuable, perPage, sorter } = this.state;
		return List.filter(this, 'type', nData ? nData : dataImmuable, filters, perPage, sorter, SESSION_FILTERS);
	}

	handleUpdateList = (element, context) => {
		const { data, dataImmuable, currentData, sorter } = this.state;
		List.updateListPagination(this, element, context, data, dataImmuable, currentData, sorter)
	}

	handlePaginationClick = (e) => {
		this.pagination.current.handleClick(e)
	}

	handleChangeCurrentPage = (currentPage) => {
		this.setState({ currentPage });
	}

	handlePerPage = (perPage) => {
        List.changePerPage(this, this.state.data, perPage, this.state.sorter, SESSION_PERPAGE);
	}

    handleModal = (identifiant, elem) => {
        this[identifiant].current.handleClick();
        this.setState({ element: elem })
    }

	render () {
		const { highlight } = this.props;
		const { sessionName, data, currentData, element, loadingData, perPage, currentPage, filters } = this.state;

		let filtersItems = [
			{ value: 0, label: "Dépenses", id: "f-0" },
			{ value: 1, label: "Revenus", id: "f-1" },
			{ value: 2, label: "Economies", id: "f-2" },
		]

		return <>
			{loadingData
				? <LoaderElements />
				: <>
                    <div className="mb-2 flex flex-row">
                        <Filter haveSearch={true} filters={filters} items={filtersItems} onFilters={this.handleFilters} />
                        <Search haveFilter={true} onSearch={this.handleSearch} placeholder="Rechercher pas intitulé.." />
                    </div>

                    <TopSorterPagination taille={data.length} currentPage={currentPage} perPage={perPage}
                                         onClick={this.handlePaginationClick}
                                         onPerPage={this.handlePerPage} onSorter={this.handleSorter} />

                    <RecurrencesList data={currentData} highlight={parseInt(highlight)} onModal={this.handleModal} />

                    <Pagination ref={this.pagination} sessionName={sessionName} items={data} taille={data.length}
                                perPage={perPage} onUpdate={this.handleUpdateData} onChangeCurrentPage={this.handleChangeCurrentPage} />

                    <ModalDelete refModal={this.delete} element={element} routeName={URL_DELETE_ELEMENT}
                                 title="Supprimer cet élément" msgSuccess="Elément supprimé"
                                 onUpdateList={this.handleUpdateList}>
                        Êtes-vous sûr de vouloir supprimer définitivement cet élément ?
                    </ModalDelete>
                </>
            }
        </>
    }
}
