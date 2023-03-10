import React, { Component } from "react";

import axios   from "axios";
import toastr  from "toastr";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire   from "@commonFunctions/formulaire";
import Sort         from "@commonFunctions/sort";
import List         from "@commonFunctions/list";

import { SocietiesList } from "@adminPages/Societies/SocietiesList";

import { Pagination, TopSorterPagination }  from "@commonComponents/Elements/Pagination";
import { Search }                           from "@commonComponents/Elements/Search";
import { Modal }                            from "@commonComponents/Elements/Modal";
import { Button }                           from "@commonComponents/Elements/Button";
import { ModalDelete }                      from "@commonComponents/Shortcut/Modal";
import { LoaderElements, LoaderTxt }        from "@commonComponents/Elements/Loader";

const URL_GET_DATA          = "api_societies_list";
const URL_DELETE_ELEMENT    = "api_societies_delete";
const URL_ACTIVATE_ELEMENT  = "api_societies_activate";
const URL_GENERATE_ELEMENT  = "api_societies_generate";

let SORTER = Sort.compareCode;
let sorters = [
    { value: 0, label: 'Code',  identifiant: 'sorter-code' },
    { value: 1, label: 'Nom',   identifiant: 'sorter-nom' },
]
let sortersFunction = [Sort.compareCode, Sort.compareName];

export class Societies extends Component {
    constructor(props) {
        super(props);

        this.state = {
            perPage: 20,
            currentPage: 0,
            sorter: SORTER,
            sessionName: "local.societies.list.pagination",
            loadingData: true,
            element: null
        }

        this.pagination = React.createRef();
        this.delete = React.createRef();
        this.activate = React.createRef();
        this.generate = React.createRef();
    }

    componentDidMount = () => { this.handleGetData(); }

    handleGetData = () => {
        const { highlight } = this.props;
        const { perPage, sorter } = this.state;

        let self = this;
        axios({ method: "GET", url: Routing.generate(URL_GET_DATA), data: {} })
            .then(function (response) {
                let data    = JSON.parse(response.data.donnees);
                let settings = JSON.parse(response.data.settings);

                if(sorter) data.sort(sorter);
                let [currentData, currentPage] = List.setCurrentPage(highlight, data, perPage);

                self.setState({ data: data, dataImmuable: data, currentData: currentData, currentPage: currentPage, settings: settings, loadingData: false })
            })
            .catch(function (error) { Formulaire.displayErrors(self, error); })
        ;
    }

    handleUpdateData = (currentData) => { this.setState({ currentData }) }

    handleSearch = (search) => {
        const { perPage, sorter, dataImmuable } = this.state;
        List.search(this, 'society', search, dataImmuable, perPage, sorter)
    }

    handleModal = (identifiant, elem) => {
        let ref;
        if(identifiant === "delete"){
            ref = this.delete.current;
        }else if(identifiant === "activate"){
            ref = this.activate.current;
            modalActivationDefault(this);
        }else{
            ref = this.generate.current;
            modalGenerationDefault(this);
        }
        ref.handleClick();
        this.setState({ element: elem })
    }

    handleUpdateList = (element, context) => {
        const { data, dataImmuable, currentData, sorter } = this.state;
        List.updateListPagination(this, element, context, data, dataImmuable, currentData, sorter)
    }

    handlePaginationClick = (e) => { this.pagination.current.handleClick(e) }

    handleChangeCurrentPage = (currentPage) => { this.setState({ currentPage }); }

    handlePerPage = (perPage) => { List.changePerPage(this, this.state.data, perPage, this.state.sorter); }

    handleSorter = (nb) => { List.changeSorter(this, this.state.data, this.state.perPage, sortersFunction, nb); }

    handleActivate = () => {
        const { element } = this.state;

        let self = this;
        let instance = axios.create();
        instance.interceptors.request.use((config) => {
            self.activate.current.handleUpdateContent(<LoaderTxt text="En cours d'activation" />);
            self.activate.current.handleUpdateFooter(null);
            self.activate.current.handleUpdateCloseTxt("Fermer");
            return config;
        }, function(error) {
            modalActivationDefault(self);
            return Promise.reject(error);
        });
        instance({ method: "PUT", url: Routing.generate(URL_ACTIVATE_ELEMENT, {'id': element.id}), data: {} })
            .then(function (response) {
                toastr.info("Soci??t?? activ??e.");
                self.activate.current.handleUpdateContent("<p>La soci??t?? a ??t?? activ??e avec succ??s.</p>");
                self.activate.current.handleUpdateFooter(null);
                self.activate.current.handleUpdateCloseTxt("Fermer");
                instance.interceptors.request.clear();

                self.handleUpdateList(response.data, "update")
            })
            .catch(function (error) { Formulaire.displayErrors(self, error); })
        ;
    }

    handleGenerate = () => {
        const { element } = this.state;

        let self = this;
        let instance = axios.create();
        instance.interceptors.request.use((config) => {
            self.generate.current.handleUpdateContent(<LoaderTxt text="En cours de g??n??ration" />);
            self.generate.current.handleUpdateFooter(null);
            self.generate.current.handleUpdateCloseTxt("Fermer");
            return config;
        }, function(error) {
            modalGenerationDefault(self);
            return Promise.reject(error);
        });
        instance({ method: "PUT", url: Routing.generate(URL_GENERATE_ELEMENT, {'id': element.id}), data: {} })
            .then(function (response) {
                toastr.info("Soci??t?? activ??e.");
                self.generate.current.handleUpdateContent("<p>La soci??t?? a ??t?? g??n??r??e avec succ??s.</p>");
                self.generate.current.handleUpdateFooter(null);
                self.generate.current.handleUpdateCloseTxt("Fermer");
                instance.interceptors.request.clear();

                self.handleUpdateList(response.data, "update")
            })
            .catch(function (error) { Formulaire.displayErrors(self, error); })
        ;
    }

    render () {
        const { highlight } = this.props;
        const { sessionName, data, currentData, element, loadingData, perPage, currentPage, settings } = this.state;

        return <>
            {loadingData
                ? <LoaderElements />
                : <>
                    <div className="toolbar">
                        <div className="col-1">
                            <Search onSearch={this.handleSearch} placeholder="Rechercher pas nom ou code.."/>
                        </div>
                    </div>

                    <TopSorterPagination taille={data.length} currentPage={currentPage} perPage={perPage} sorters={sorters}
                                         onClick={this.handlePaginationClick}
                                         onPerPage={this.handlePerPage} onSorter={this.handleSorter} />

                    <SocietiesList data={currentData} highlight={parseInt(highlight)} settings={settings} onModal={this.handleModal} />

                    <Pagination ref={this.pagination} sessionName={sessionName} items={data} taille={data.length}
                                perPage={perPage} onUpdate={this.handleUpdateData} onChangeCurrentPage={this.handleChangeCurrentPage}/>

                    <ModalDelete refModal={this.delete} element={element} routeName={URL_DELETE_ELEMENT}
                                 title="Supprimer cette soci??t??" msgSuccess="Soci??t?? supprim??e"
                                 onUpdateList={this.handleUpdateList} >
                        Etes-vous s??r de vouloir supprimer d??finitivement cette soci??t?? ?
                    </ModalDelete>

                    <Modal ref={this.activate} identifiant="activate" maxWidth={414} title="Activer la soci??t??"
                           content={null} footer={null}
                    />

                    <Modal ref={this.generate} identifiant="generate" maxWidth={414} title="G??n??rer la soci??t??"
                           content={null} footer={null}
                    />
                </>
            }
        </>
    }
}

function modalActivationDefault (self) {
    self.activate.current.handleUpdateContent(<p>Avant de proc??der ?? l'activation, veuillez v??rifier que la base de donn??e a ??t?? cr???? dans le CPANEL.</p>);
    self.activate.current.handleUpdateFooter(<Button onClick={self.handleActivate} type="primary">Confirmer l'activation</Button>);
    self.activate.current.handleUpdateCloseTxt("Annuler");
}

function modalGenerationDefault (self) {
    self.generate.current.handleUpdateContent(<p>
        La g??n??ration va modifier les fichiers pour prendre en compte le syst??me de multiple base de donn??es.
        <br/><br/>
        Ensuite, vous pourrez activer la soci??t?? et l'utiliser.
    </p>);
    self.generate.current.handleUpdateFooter(<Button onClick={self.handleGenerate} type="primary">Confirmer la g??n??ration</Button>);
    self.generate.current.handleUpdateCloseTxt("Annuler");
}
