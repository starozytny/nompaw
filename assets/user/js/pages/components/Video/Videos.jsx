import React, { Component } from "react";
import { createPortal } from "react-dom";

import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Sort from "@commonFunctions/sort";
import List from "@commonFunctions/list";

import { VideosList } from "@userPages/Video/VideosList";
import { VideoFormulaire } from "@userPages/Video/VideoForm";

import { Modal } from "@tailwindComponents/Elements/Modal";
import { Search } from "@tailwindComponents/Elements/Search";
import { Filter } from "@tailwindComponents/Elements/Filter";
import { ModalDelete } from "@tailwindComponents/Shortcut/Modal";
import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { Pagination, TopSorterPagination } from "@tailwindComponents/Elements/Pagination";

const URL_GET_DATA = "intern_api_videos_list";
const URL_DELETE_ELEMENT = "intern_api_changelogs_delete";

const SESSION_PERPAGE = "nompaw.perpage.videos";
const SESSION_FILTERS = "nompaw.filters.videos";

export class Videos extends Component {
	constructor (props) {
		super(props);

		this.state = {
			perPage: List.getSessionPerpage(SESSION_PERPAGE, 20),
			currentPage: 0,
			sorter: Sort.compareCreatedAtInverse,
			loadingData: true,
			filters: List.getSessionFilters(SESSION_FILTERS, [], props.highlight),
			element: null,
		}

		this.pagination = React.createRef();
		this.delete = React.createRef();
		this.infos = React.createRef();
	}

	componentDidMount = () => {
		const { perPage, sorter, filters } = this.state;
		List.getData(this, Routing.generate(URL_GET_DATA), perPage, sorter, null, filters, this.handleFilters);
	}

	handleUpdateData = (currentData) => {
		this.setState({ currentData })
	}

	handleSearch = (search) => {
		const { perPage, sorter, dataImmuable, filters } = this.state;
		List.search(this, 'name', search, dataImmuable, perPage, sorter, true, filters, this.handleFilters)
	}

	handleFilters = (filters, nData = null) => {
		const { dataImmuable, perPage, sorter } = this.state;
		return List.filter(this, 'fileType', nData ? nData : dataImmuable, filters, perPage, sorter, SESSION_FILTERS);
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
		this.setState({ element: elem });
		this[identifiant].current.handleClick();
	}

	render () {
		const { isAdmin } = this.props;
		const { data, currentData, element, loadingData, perPage, currentPage, filters } = this.state;

		let filtersItems = [
			{ value: 0, label: "Information", id: "f-info" },
			{ value: 1, label: "Attention", id: "f-atte" },
			{ value: 2, label: "Danger", id: "f-dang" },
		]

		return <>
			{loadingData
				? <LoaderElements />
				: <>
					<div className="mb-2 flex flex-row">
						{/*<Filter haveSearch={true} filters={filters} items={filtersItems} onFilters={this.handleFilters} />*/}
						<Search onSearch={this.handleSearch} placeholder="Rechercher par nom de film.." />
					</div>

					<TopSorterPagination taille={data.length} currentPage={currentPage} perPage={perPage}
										 onClick={this.handlePaginationClick}
										 onPerPage={this.handlePerPage} />

					<VideosList data={currentData} isAdmin={isAdmin === "1"} onModal={this.handleModal} />

					<Pagination ref={this.pagination} items={data} taille={data.length} currentPage={currentPage}
								perPage={perPage} onUpdate={this.handleUpdateData} onChangeCurrentPage={this.handleChangeCurrentPage} />

					{element
						? createPortal(
							<ModalDelete refModal={this.delete} element={element} routeName={URL_DELETE_ELEMENT}
										 title="Supprimer ce film" msgSuccess="Film supprimé."
										 onUpdateList={this.handleUpdateList}>
								Êtes-vous sûr de vouloir supprimer définitivement ce film : <b>{element ? element.name : ""}</b> ?
							</ModalDelete>,
							document.body
						)
						: null
					}

					{createPortal(
						<Modal ref={this.infos} identifiant="infos" maxWidth={568}
							   title={element && element.id ? "Modifier les informations" : "Ajouter les informations"} isForm={true}
							   content={<VideoFormulaire identifiant="infos"
														 context={element && element.id ? "update" : "create"} element={element}
														 key={element ? (element.id ? element.id : 1) : 0} />}
							   footer={null}
						/>,
						document.body
					)}
				</>
			}
		</>
	}
}
