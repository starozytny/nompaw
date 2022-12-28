import React, { Component } from "react";

import axios      from "axios";
import toastr     from "toastr";
import Routing    from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire       from "@commonFunctions/formulaire";
import Sort             from "@commonFunctions/sort";
import SearchFunction   from "@commonFunctions/search";
import FilterFunction   from "@commonFunctions/filter";
import List             from "@commonFunctions/list";

import { UsersList } from "./UsersList";

import { Pagination, TopSorterPagination } from "@commonComponents/Elements/Pagination";
import { Search }           from "@commonComponents/Elements/Search";
import { Filter }           from "@commonComponents/Elements/Filter";
import { LoaderElements }   from "@commonComponents/Elements/Loader";
import { Modal }            from "@commonComponents/Elements/Modal";
import { Button }           from "@commonComponents/Elements/Button";

const URL_GET_DATA       = "api_users_list";
const URL_DELETE_ELEMENT = "api_users_delete";

let SORTER = Sort.compareLastname;
let sorters = [
    { value: 0, label: 'Nom',           identifiant: 'sorter-nom' },
    { value: 1, label: 'Email',         identifiant: 'sorter-email' },
]
let sortersFunction = [Sort.compareLastname, Sort.compareEmail];

export class Users extends Component {
    constructor(props) {
        super(props);

        this.state = {
            perPage: 20,
            currentPage: 0,
            sorter: SORTER,
            sessionName: "local.users.list.pagination",
            loadingData: true,
            filters: [],
            element: null
        }

        this.pagination = React.createRef();
        this.delete = React.createRef();

        this.handleGetData = this.handleGetData.bind(this);
        this.handleUpdateData = this.handleUpdateData.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.handleFilters = this.handleFilters.bind(this);
        this.handleModal = this.handleModal.bind(this);
        this.handleDeleteElement = this.handleDeleteElement.bind(this);
        this.handlePaginationClick = this.handlePaginationClick.bind(this);
        this.handlePerPage = this.handlePerPage.bind(this);
        this.handleChangeCurrentPage = this.handleChangeCurrentPage.bind(this);
        this.handleSorter = this.handleSorter.bind(this);
    }

    componentDidMount = () => { this.handleGetData(); }

    handleGetData = () => {
        const { perPage, sorter } = this.state;

        let self = this;
        axios({ method: "GET", url: Routing.generate(URL_GET_DATA), data: {} })
            .then(function (response) {
                let data = response.data; data.sort(sorter);
                let currentData = data.slice(0, perPage);
                self.setState({ data: data, dataImmuable: data, currentData: currentData, loadingData: false })
            })
            .catch(function (error) { Formulaire.displayErrors(self, error); })
        ;
    }

    handleUpdateData = (currentData) => { this.setState({ currentData }) }

    handleSearch = (search) => {
        const { perPage, sorter, filters } = this.state;

        let dataImmuable = this.handleFilters(filters);
        if(search !== ""){
            let newData = SearchFunction.search("user", dataImmuable, search);
            if(sorter) newData.sort(sorter);
            this.setState({ data: newData, currentData: newData.slice(0, perPage) });
        }
    }

    handleFilters = (filters) => {
        const { dataImmuable, perPage, sorter } = this.state;

        let newData = FilterFunction.filter("highRoleCode", dataImmuable, filters);
        if(sorter) newData.sort(sorter);

        this.pagination.current.handlePageOne();
        this.setState({ data: newData, currentData: newData.slice(0, perPage), filters: filters });
        return newData;
    }

    handleModal = (identifiant, elem) => {
        let ref;
        if(identifiant === "delete") ref = this.delete;
        ref.current.handleClick();
        this.setState({ element: elem })
    }

    handleDeleteElement = () => {
        const { element } = this.state;

        let self = this;
        axios({ method: "DELETE", url: Routing.generate(URL_DELETE_ELEMENT, {'id': element.id}), data: {} })
            .then(function (response) {
                toastr.info("Utilisateur supprimé !");
                self.delete.current.handleClose();
                self.handleUpdateList(element, "delete");
            })
            .catch(function (error) { Formulaire.displayErrors(self, error); })
        ;
    }

    handleUpdateList = (element, context) => {
        const { data, dataImmuable, currentData, sorter } = this.state;
        List.updateListPagination(this, element, context, data, dataImmuable, currentData, sorter)
    }

    handlePaginationClick = (e) => { this.pagination.current.handleClick(e) }

    handleChangeCurrentPage = (currentPage) => { this.setState({ currentPage }); }

    handlePerPage = (perPage) => {
        const { data, sorter } = this.state;

        this.pagination.current.handlePerPage(perPage);
        List.updatePerPage(this, data, perPage, sorter)
    }

    handleSorter = (nb) => {
        const { data, perPage } = this.state;

        let sorter = sortersFunction[nb];
        List.updatePerPage(this, data, perPage, sorter)
    }

    render () {
        const { sessionName, data, currentData, loadingData, perPage, currentPage, filters } = this.state;

        let filtersItems = [
            {value: 0, label: "Utilisateur", id: "f-user"},
            {value: 1, label: "Développeur", id: "f-dev"},
            {value: 2, label: "Administrateur", id: "f-admin"},
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
                            <Search onSearch={this.handleSearch} placeholder="Rechercher pas identifiant, nom ou prénom.."/>
                        </div>
                    </div>
                    <TopSorterPagination taille={data.length} currentPage={currentPage} perPage={perPage} sorters={sorters}
                                         onClick={this.handlePaginationClick}
                                         onPerPage={this.handlePerPage} onSorter={this.handleSorter} />
                    <UsersList data={currentData} onDelete={this.handleModal} />
                    <Pagination ref={this.pagination} sessionName={sessionName} items={data} taille={data.length}
                                perPage={perPage} onUpdate={this.handleUpdateData} onChangeCurrentPage={this.handleChangeCurrentPage}/>

                    <Modal ref={this.delete} identifiant="delete" maxWidth={414} title="Supprimer un utilisateur"
                           content={<p>Etes-vous sûr de vouloir supprimer définitivement cet utilisateur ?</p>}
                           footer={<>
                               <Button onClick={this.handleDeleteElement} type="primary">Confirmer la suppression</Button>
                               <div className="close-modal">
                                   <Button type="cancel">Annuler</Button>
                               </div>
                           </>}
                    />
                </>
            }
        </>
    }
}
