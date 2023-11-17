import React, { Component } from "react";

import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Sort         from "@commonFunctions/sort";
import List         from "@commonFunctions/list";

import { Pagination, TopSorterPagination } from "@commonComponents/Elements/Pagination";
import { LoaderElements } from "@commonComponents/Elements/Loader";
import { Search }         from "@commonComponents/Elements/Search";
import { Filter }         from "@commonComponents/Elements/Filter";
import { ModalDelete }    from "@commonComponents/Shortcut/Modal";

import { RecurrencesList } from "@userPages/Budget/Reccurences/RecurrencesList";

const URL_GET_DATA        = "intern_api_budget_recurrences_list";
const URL_DELETE_ELEMENT  = "intern_api_budget_recurrences_delete";

let SORTER = Sort.compareName;

export class Recurrences extends Component {
    constructor(props) {
        super(props);

        this.state = {
            perPage: 20,
            currentPage: 0,
            sorter: SORTER,
            sessionName: "local.recu.list.pagination",
            loadingData: true,
            filters: [],
            element: null
        }

        this.pagination = React.createRef();
        this.delete = React.createRef();
    }

    componentDidMount = () => { this.handleGetData(); }

    handleGetData = () => {
        let url = this.props.urlGetData ? this.props.urlGetData : Routing.generate(URL_GET_DATA);
        List.getData(this, url, this.state.perPage, this.state.sorter);
    }

    handleUpdateData = (currentData) => { this.setState({ currentData }) }

    handleSearch = (search) => {
        const { perPage, sorter, dataImmuable, filters } = this.state;
        List.search(this, 'recurrence', search, dataImmuable, perPage, sorter, true, filters, this.handleFilters)
    }

    handleFilters = (filters) => {
        const { dataImmuable, perPage, sorter } = this.state;
        return List.filter(this, 'type', dataImmuable, filters, perPage, sorter);
    }

    handleModal = (identifiant, elem) => {
        let ref;

        if (identifiant === "delete"){
            ref = this.delete;
        }
        ref.current.handleClick();
        this.setState({ element: elem })
    }

    handleUpdateList = (element, context) => {
        const { data, dataImmuable, currentData, sorter } = this.state;
        List.updateListPagination(this, element, context, data, dataImmuable, currentData, sorter)
    }

    handlePaginationClick = (e) => { this.pagination.current.handleClick(e) }

    handleChangeCurrentPage = (currentPage) => { this.setState({ currentPage }); }

    handlePerPage = (perPage) => { List.changePerPage(this, this.state.data, perPage, this.state.sorter); }

    render () {
        const { highlight } = this.props;
        const { sessionName, data, currentData, element, loadingData, perPage, currentPage, filters } = this.state;

        let filtersItems = [
            {value: 0, label: "Dépenses",  id: "f-0"},
            {value: 1, label: "Revenus",   id: "f-1"},
            {value: 2, label: "Economies", id: "f-2"},
        ]

        return <>
            {loadingData
                ? <LoaderElements />
                : <>
                    <div className="toolbar">
                        <div className="col-1">
                            <div className="filters">
                                <Filter filters={filters} items={filtersItems} onFilters={this.handleFilters}/>
                            </div>
                            <Search onSearch={this.handleSearch} placeholder="Rechercher pas intitulé.."/>
                        </div>
                    </div>

                    <TopSorterPagination taille={data.length} currentPage={currentPage} perPage={perPage}
                                         onClick={this.handlePaginationClick}
                                         onPerPage={this.handlePerPage} onSorter={this.handleSorter} />

                    <RecurrencesList data={currentData} highlight={parseInt(highlight)} onModal={this.handleModal} />

                    <Pagination ref={this.pagination} sessionName={sessionName} items={data} taille={data.length}
                                perPage={perPage} onUpdate={this.handleUpdateData} onChangeCurrentPage={this.handleChangeCurrentPage}/>


                    <ModalDelete refModal={this.delete} element={element} routeName={URL_DELETE_ELEMENT}
                                 title="Supprimer cet élément" msgSuccess="Elément supprimé"
                                 onUpdateList={this.handleUpdateList} >
                        Etes-vous sûr de vouloir supprimer définitivement cet élément ?
                    </ModalDelete>
                </>
            }
        </>
    }
}