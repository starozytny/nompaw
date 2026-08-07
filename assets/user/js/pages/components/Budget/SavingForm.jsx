import React, { Component } from 'react';

import Inputs from "@commonFunctions/inputs";
import Sanitaze from "@commonFunctions/sanitaze";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Input } from "@tailwindComponents/Elements/Fields";
import { Button } from "@tailwindComponents/Elements/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@shadcnComponents/ui/dialog";

export class SavingForm extends Component {
	constructor (props) {
		super(props);

		this.state = {
			total: '',
			errors: [],
		}
	}

	handleChange = (e) => {
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		if (name === "total") {
			value = Inputs.textMoneyMinusInput(value, this.state.total);
		}

		this.setState({ [name]: value })
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { saving } = this.props;
		const { total } = this.state;

		this.setState({ errors: [] });

		let validate = Validateur.validateur([{ type: "text", id: 'total', value: total }])
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			const available = saving.total - saving.used;
			if (parseFloat(total) > available) {
				Formulaire.showErrors(this, {
					code: false,
					errors: [{ name: "total", message: `Le montant ne peut pas dépasser ${Sanitaze.toFormatCurrency(available)}` }]
				});
				return;
			}

			this.props.onUseSaving(saving, total)
		}
	}

	render () {
		const { open, onOpenChange, saving } = this.props;
		const { errors, total } = this.state;

		const available = saving ? saving.total - saving.used : 0;

		return <Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{saving && <>
					<DialogHeader>
						<DialogTitle>Utiliser vos économies</DialogTitle>
					</DialogHeader>

					<div className="p-4 bg-[var(--cat-saving-soft)] rounded-lg border border-[var(--cat-saving)]/30">
						<div className="flex items-start justify-between">
							<div>
								<h4 className="font-semibold mb-1">{saving.name}</h4>
								<p className="text-sm text-muted-foreground">Objectif : {Sanitaze.toFormatCurrency(saving.goal)}</p>
							</div>
							<div className="text-right">
								<div className="text-2xl font-bold text-[var(--cat-saving)] tabular-nums">
									{Sanitaze.toFormatCurrency(available)}
								</div>
								<div className="text-xs text-muted-foreground">disponible</div>
							</div>
						</div>
					</div>

					<form onSubmit={this.handleSubmit} className="flex flex-col gap-3">
						<p className="text-sm text-muted-foreground">
							Combien souhaitez-vous utiliser de cette économie&nbsp;: <b>{saving.name}</b> ?
						</p>

						<Input identifiant="total" valeur={total} errors={errors} onChange={this.handleChange} placeholder={`max : ${Sanitaze.toFormatCurrency(available)}`}>
							Solde à utiliser (€)
						</Input>

						<div className="flex flex-wrap gap-2">
							{[0.25, 0.5, 0.75, 1].map(pct => (
								<button
									key={pct}
									type="button"
									className="text-xs px-3 py-1 bg-muted hover:bg-accent rounded-md transition-colors"
									onClick={() => this.setState({ total: (available * pct).toFixed(2) })}
								>
									{pct === 1 ? 'Tout' : `${pct * 100}%`}
								</button>
							))}
						</div>
					</form>

					<DialogFooter>
						<Button type="default" onClick={() => onOpenChange(false)}>Annuler</Button>
						<Button type="blue" onClick={this.handleSubmit}>Confirmer l'utilisation</Button>
					</DialogFooter>
				</>}
			</DialogContent>
		</Dialog>
	}
}
