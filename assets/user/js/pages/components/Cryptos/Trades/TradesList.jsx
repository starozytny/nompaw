import React, { Component } from "react";
import PropTypes from 'prop-types';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import moment from "moment/moment";
import "moment/locale/fr";

import Sanitaze from "@commonFunctions/sanitaze";
import Validateur from "@commonFunctions/validateur";
import Formulaire from "@commonFunctions/formulaire";

import { TradesItem } from "@userPages/Cryptos/Trades/TradesItem";

import { Alert } from "@tailwindComponents/Elements/Alert";
import { ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Input, Select } from "@tailwindComponents/Elements/Fields";

const ACHAT = 0;
const VENTE = 1;
const DEPOT = 2;
const RETRAIT = 3;
const RECUP = 4;
const STAKING = 5;
const TRANSFERT = 6;

const URL_CREATE_ELEMENT = "intern_api_cryptos_trades_create";
const URL_UPDATE_ELEMENT = "intern_api_cryptos_trades_update";

export class TradesList extends Component {
    constructor (props) {
        super(props)

        this.state = {
            context : 'create',
            id: '',
            tradeAt: Formulaire.setValueDateTime(new Date()),
            type: 0,
            fromCoin: '',
            toCoin: '',
            costPrice: '',
            costCoin: '',
            fromNbToken: '',
            toNbToken: '',
            toPrice: '',
            fromPrice: '',
            totalReal: '',
            errors: [],
        }
    }

    handleEditElement = (element) => {
        this.setState({
            context: element ? "update" : "create",
            id: element ? element.id : "",
            tradeAt: Formulaire.setValueDateTime(element.tradeAt),
            type: element ? Formulaire.setValue(element.type) : 0,
            fromCoin: element ? Formulaire.setValue(element.fromCoin) : '',
            toCoin: element ? Formulaire.setValue(element.toCoin) : '',
            costPrice: element ? Formulaire.setValue(element.costPrice) : '',
            costCoin: element ? Formulaire.setValue(element.costCoin) : '',
            fromNbToken: element ? Formulaire.setValue(element.fromNbToken) : '',
            toNbToken: element ? Formulaire.setValue(element.toNbToken) : '',
            toPrice: element ? Formulaire.setValue(element.toPrice) : '',
            fromPrice: element ? Formulaire.setValue(element.fromPrice) : '',
            totalReal: element ? Formulaire.setValue(element.totalReal) : '',
        })
    }

    handleChange = (e) => {
        let name = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name === 'fromCoin' || name === 'toCoin' || name === 'costCoin'){
            value = value !== "" ? value.toUpperCase() : value;
        }

        this.setState({ [name]: value })
    }

    handleSubmit = (e) => {
        e.preventDefault();

        const { context, loadData, id, tradeAt, type, fromCoin, fromNbToken, toCoin, toNbToken, toPrice, fromPrice, costPrice, costCoin, totalReal } = this.state;

        this.setState({ errors: [] });

        let paramsToValidate = [
            { type: "text", id: 'tradeAt', value: tradeAt },
            { type: "text", id: 'type', value: type },
            { type: "text", id: 'toCoin', value: toCoin },
            { type: "text", id: 'toNbToken', value: toNbToken },
            { type: "text", id: 'costPrice', value: costPrice },
            { type: "text", id: 'costCoin', value: costCoin },
            { type: "text", id: 'totalReal', value: totalReal },
        ];

        if(parseInt(type) !== DEPOT){
            paramsToValidate = [...paramsToValidate, ...[
                { type: "text", id: 'fromCoin', value: fromCoin },
                { type: "text", id: 'fromNbToken', value: fromNbToken },
                { type: "text", id: 'toPrice', value: toPrice },
                { type: "text", id: 'fromPrice', value: fromPrice },
            ]]
        }

        let validate = Validateur.validateur(paramsToValidate)
        if (!validate.code) {
            Formulaire.showErrors(this, validate);
        } else {
            let self = this;

            if (!loadData) {
                this.setState({ loadData: true })
                Formulaire.loader(true);

                let methode = context === "create" ? "POST" : "PUT";
                let url = context === "create" ? Routing.generate(URL_CREATE_ELEMENT) : Routing.generate(URL_UPDATE_ELEMENT, {id: id})

                axios({ method: methode, url: url, data: this.state })
                    .then(function (response) {
                        self.props.onUpdateList(response.data, context);
                        self.handleEditElement(null);
                    })
                    .catch(function (error) {
                        Formulaire.displayErrors(self, error);
                    })
                    .then(function () {
                        Formulaire.loader(false);
                        self.setState({ loadData: false })
                    })
                ;
            }
        }
    }

    render () {
        const { data } = this.props;
        const { context, errors, tradeAt, type, fromCoin, toCoin, costPrice, costCoin, fromNbToken, toNbToken, toPrice, fromPrice, totalReal } = this.state;

        let typeItems = [
            { value: 0, identifiant: 'type-0', label: 'Achat' },
            { value: 1, identifiant: 'type-1', label: 'Vente' },
            { value: 2, identifiant: 'type-2', label: 'Depot' },
            { value: 3, identifiant: 'type-3', label: 'Retrait' },
            { value: 4, identifiant: 'type-4', label: 'Récupération' },
            { value: 5, identifiant: 'type-5', label: 'Stacking' },
            { value: 6, identifiant: 'type-6', label: 'Transfert' },
        ]

        let params0 = { errors: errors, onChange: this.handleChange }

        let yData = [];
        data.forEach(item => {
            let year = moment(item.tradeAt).year();

            let find = false;
            yData.forEach(yItem => {
                if(yItem.year === year){
                    find = true;
                    yItem.items.push(item);
                }
            })

            if(!find){
                yData.push({
                    year: year,
                    items: [item]
                })
            }
        })

        let nData = [];
        yData.forEach(item => {
            let nItems = [];
            item.items.forEach(mItem => {
                let month = moment(mItem.tradeAt).format('MMMM');

                let find = false;
                nItems.forEach(nItem => {
                    if(nItem.month === month){
                        find = true;
                        nItem.trades.push(mItem);
                    }
                })

                if(!find){
                    nItems.push({
                        month: month,
                        trades: [mItem]
                    })
                }
            })

            item.items = nItems;
            nData.push(item);
        })

        let total = 0, totalDepot = 0, totalRetrait = 0, totalBonus = 0;

        let items = [];
        nData.forEach((yItem, index) => {

            let cryptosY = [];
            let totalYDepot = 0, totalYRetrait = 0;

            let itemsMonth = [];
            yItem.items.forEach((mItem, ind) => {

                let itemsTrade = [];
                mItem.trades.forEach(elem => {
                    let findCryptoY = 2;

                    switch (elem.type){
                        case VENTE:
                            total += elem.total;

                            findCryptoY = 0;
                            cryptosY.forEach(cr => {
                                if(cr.name === elem.fromCoin){
                                    cr.total -= elem.fromNbToken;
                                    findCryptoY = 1;
                                }
                            })

                            if(findCryptoY === 0){
                                cryptosY.push({
                                    name: elem.fromCoin,
                                    total: elem.fromNbToken
                                })
                            }
                            break;
                        case DEPOT:
                            total += elem.total;
                            totalDepot += elem.total;
                            totalYDepot += elem.total;
                            break;
                        case ACHAT:
                            total -= elem.total;

                            findCryptoY = 0;
                            cryptosY.forEach(cr => {
                                if(cr.name === elem.toCoin){
                                    cr.total += elem.toNbToken;
                                    findCryptoY = 1;
                                }
                            })

                            if(findCryptoY === 0){
                                cryptosY.push({
                                    name: elem.toCoin,
                                    total: elem.toNbToken
                                })
                            }
                            break;
                        case RETRAIT:
                            total -= elem.total;
                            totalRetrait += elem.totalReal;
                            totalYRetrait += elem.totalReal;
                            break;
                        case RECUP:
                        case STAKING:
                            totalBonus += elem.total;
                            break;
                        default: break;
                    }

                    itemsTrade.push(<TradesItem key={elem.id} elem={elem}
                                       onEditElement={this.handleEditElement} />);
                })

                itemsMonth.push(<div key={ind}>
                    <div className="list-trades">
                        <div className="items-trades">
                            {itemsTrade}
                        </div>
                    </div>
                    <div className="item-month bg-color0/80 text-slate-50">
                        <div className="font-semibold text-xl">
                            Fin {mItem.month}
                        </div>
                        <div>
                            Dispo : {Sanitaze.toFormatCurrency(total)}
                        </div>
                        <div>
                            Dépôt : {Sanitaze.toFormatCurrency(totalDepot)}
                        </div>
                        <div>
                            Retrait : {Sanitaze.toFormatCurrency(totalRetrait)}
                        </div>
                        <div>
                            Bonus : {Sanitaze.toFormatCurrency(totalBonus)}
                        </div>
                    </div>
                    <div className="item-month bg-color0/80 text-slate-50">
                        {cryptosY.map(cr => {
                            return <div key={cr.name}>
                                {cr.name} : {cr.total}
                            </div>
                        })}
                    </div>
                </div>)
            })

            items.push(<div key={index}>
                <div>
                    {itemsMonth}
                </div>
                <div className="item-year bg-color0 text-slate-50">
                    <div className="font-semibold text-xl">
                        Fin {yItem.year} - Dépot: {Sanitaze.toFormatCurrency(totalYDepot)} - Retrait : {Sanitaze.toFormatCurrency(totalYRetrait)}
                    </div>
                </div>
            </div>)
        })

        return <div className="list">
            <div className="list-table bg-white rounded-md shadow">
                <div className="items items-trades">
                    <div className="item item-header uppercase text-sm text-gray-600">
                        <div className="item-content">
                            <div className="item-infos">
                                <div className="col-1">Date</div>
                                <div className="col-2">Type</div>
                                <div className="col-3">Token A</div>
                                <div className="col-4">Token B</div>
                                <div className="col-5">Prix Transaction</div>
                                <div className="col-6">Frais</div>
                                <div className="col-7">Total</div>
                                <div className="col-8 actions" />
                            </div>
                        </div>
                    </div>

                    <div className="item border-t border-b-2 hover:bg-slate-50">
                        <div className="item-content">
                            <div className="item-infos text-sm xl:text-base">
                                <div className="col-1">
                                    <Input type="datetime-local" valeur={tradeAt} identifiant="tradeAt" {...params0} />
                                </div>
                                <div className="col-2">
                                    <Select identifiant="type" valeur={type} items={typeItems} noEmpty={true} noErrors={true} {...params0}></Select>
                                </div>
                                <div className="col-3">
                                    {parseInt(type) === DEPOT
                                        ? null
                                        : <div className="flex gap-1">
                                            <div className="w-full">
                                                <Input type="number" valeur={fromNbToken} identifiant="fromNbToken" {...params0} placeholder="Nb token A">
                                                    <span className="xl:hidden">Nb token A</span>
                                                </Input>
                                            </div>
                                            <div className="w-full">
                                                <Input valeur={fromCoin} identifiant="fromCoin" {...params0} placeholder="Token A">
                                                    <span className="xl:hidden">Token A</span>
                                                </Input>
                                            </div>
                                        </div>
                                    }
                                </div>
                                <div className="col-4">
                                    <div className="flex gap-1">
                                        <div className="w-full">
                                            <Input valeur={toCoin} identifiant="toCoin" {...params0} placeholder="Token B">
                                                <span className="xl:hidden">Token B</span>
                                            </Input>
                                        </div>
                                        <div className="w-full">
                                            <Input type="number" valeur={toNbToken} identifiant="toNbToken" {...params0} placeholder="Nb token B">
                                                <span className="xl:hidden">Nb token B</span>
                                            </Input>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-5">
                                    {parseInt(type) === DEPOT
                                        ? null
                                        : <div className="flex gap-1">
                                            <div className="w-full">
                                                <Input type="number" valeur={fromPrice} identifiant="fromPrice" {...params0} placeholder="Prix transaction A">
                                                    <span className="xl:hidden">Prix transaction A</span>
                                                </Input>
                                            </div>
                                            <div className="w-full">
                                                <Input type="number" valeur={toPrice} identifiant="toPrice" {...params0} placeholder="Prix transaction B">
                                                    <span className="xl:hidden">Prix transaction B</span>
                                                </Input>
                                            </div>
                                        </div>
                                    }

                                </div>
                                <div className="col-6">
                                    <div className="flex gap-1">
                                        <div className="w-full">
                                            <Input type="number" valeur={costPrice} identifiant="costPrice" {...params0} placeholder="Frais">
                                            <span className="xl:hidden">Frais</span>
                                            </Input>
                                        </div>
                                        <div className="w-full">
                                            <Input valeur={costCoin} identifiant="costCoin" {...params0} placeholder="Frais Token">
                                                <span className="xl:hidden">Token Frais</span>
                                            </Input>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-7">
                                    <div className="w-full">
                                        <Input type="number" valeur={totalReal} identifiant="totalReal" {...params0} placeholder="Total réel">
                                            <span className="xl:hidden">Total réel</span>
                                        </Input>
                                    </div>
                                </div>
                                <div className="col-8 actions">
                                    {context === "update"
                                        ? <>
                                            <ButtonIcon type="blue" icon="check1" onClick={this.handleSubmit}>Modifier</ButtonIcon>
                                            <ButtonIcon type="default" icon="close" onClick={() => this.handleEditElement(null)}>Annuler</ButtonIcon>
                                        </>
                                        : <ButtonIcon type="blue" icon="add" onClick={this.handleSubmit}>Ajouter</ButtonIcon>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {data.length > 0
                        ? items
                        : <div className="item border-t">
                            <Alert type="gray">Aucun résultat.</Alert>
                        </div>
                    }
                </div>
            </div>
        </div>
    }
}

TradesList.propTypes = {
    data: PropTypes.array.isRequired,
}
