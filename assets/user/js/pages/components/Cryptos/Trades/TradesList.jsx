import React, { Component } from "react";
import PropTypes from 'prop-types';

import { TradesItem } from "@userPages/Cryptos/Trades/TradesItem";

import { Alert } from "@tailwindComponents/Elements/Alert";
import { Input, Radiobox } from "@tailwindComponents/Elements/Fields";
import { ButtonIcon } from "@tailwindComponents/Elements/Button";
import Inputs from "@commonFunctions/inputs";

export class TradesList extends Component {
    constructor (props) {
        super(props);

        this.state = {
            tradeAt: '',
            type: 0,
            fromCoin: '',
            toCoin: '',
            fromPrice: '',
            nbToken: '',
            cost: '',
            costType: '',
            toPrice: '',
            errors: [],
        }
    }

    handleChange = (e) => {
        let name = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name === "fromPrice" || name === "nbToken" || name === "cost" || name === "toPrice"){
            value = Inputs.textNumericInput(value, this.state[name])
        }

        this.setState({ [name]: value })
    }

    render () {
        const { data, onModal } = this.props;
        const { errors, tradeAt, type, fromCoin, toCoin, fromPrice, nbToken, cost, costType, toPrice } = this.state;

        let typeItems = [
            { value: 0, identifiant: 'type-0', label: 'Achat' },
            { value: 1, identifiant: 'type-1', label: 'Vente' },
        ]

        let params0 = { errors: errors, onChange: this.handleChange }

        return <div className="list">
            <div className="list-table bg-white rounded-md shadow">
                <div className="items items-trades">
                    <div className="item item-header uppercase text-sm text-gray-600">
                        <div className="item-content">
                            <div className="item-infos">
                                <div className="col-1">Date</div>
                                <div className="col-2">Type</div>
                                <div className="col-3">Paire</div>
                                <div className="col-4">Prix A</div>
                                <div className="col-5">Nb Token</div>
                                <div className="col-6">Frais</div>
                                <div className="col-7">Prix B</div>
                                <div className="col-8 actions" />
                            </div>
                        </div>
                    </div>

                    <div className="item border-t border-b-2 hover:bg-slate-50">
                        <div className="item-content">
                            <div className="item-infos text-sm xl:text-base">
                                <div className="col-1">
                                    <div class="w-full">
                                        <Input type="date" valeur={tradeAt} identifiant="tradeAt" {...params0} />
                                    </div>
                                </div>
                                <div className="col-2">
                                    <Radiobox valeur={type} identifiant="type" items={typeItems} {...params0}
                                              classItems="flex flex-wrap gap-1" styleType="fat" />
                                </div>
                                <div className="col-3">
                                    <div className="flex gap-1">
                                        <div class="w-full">
                                            <Input valeur={fromCoin} identifiant="fromCoin" {...params0}>
                                                <span className="xl:hidden">Token A</span>
                                            </Input>
                                        </div>
                                        <div class="w-full">
                                            <Input valeur={toCoin} identifiant="toCoin" {...params0}>
                                                <span className="xl:hidden">Token B</span>
                                            </Input>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div class="w-full">
                                        <Input type="number" valeur={fromPrice} identifiant="fromPrice" {...params0}>
                                            <span className="xl:hidden">Prix A</span>
                                        </Input>
                                    </div>
                                </div>
                                <div className="col-5">
                                    <div class="w-full">
                                        <Input type="number" valeur={nbToken} identifiant="nbToken" {...params0}>
                                            <span className="xl:hidden">Nb token</span>
                                        </Input>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="flex gap-1">
                                        <div class="w-full">
                                            <Input type="number" valeur={cost} identifiant="cost" {...params0}>
                                                <span className="xl:hidden">Frais</span>
                                            </Input>
                                        </div>
                                        <div class="w-full">
                                            <Input valeur={costType} identifiant="costType" {...params0}>
                                                <span className="xl:hidden">Frais token</span>
                                            </Input>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-7">
                                    <div class="w-full">
                                        <Input type="number" valeur={toPrice} identifiant="toPrice" {...params0}>
                                            <span className="xl:hidden">Total B</span>
                                        </Input>
                                    </div>
                                </div>
                                <div className="col-8 actions">
                                    <ButtonIcon type="blue" icon="add">Ajouter</ButtonIcon>
                                </div>
                            </div>
                        </div>
                    </div>

                    {data.length > 0
                        ? data.map((elem) => {
                            return <TradesItem key={elem.id} elem={elem} onModal={onModal} />;
                        })
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
    onModal: PropTypes.func.isRequired,
}
