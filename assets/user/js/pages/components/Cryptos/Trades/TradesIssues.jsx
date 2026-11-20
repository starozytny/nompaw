import React, { useState } from "react";
import PropTypes from 'prop-types';

import moment from "moment/moment";
import "moment/locale/fr";

import Sanitaze from "@commonFunctions/sanitaze";
import { cn } from "@shadcnComponents/lib/utils";

import { Button } from "@tailwindComponents/Elements/Button";
import { Badge } from "@shadcnComponents/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@shadcnComponents/ui/card";
import { CoinIcon } from "@userPages/Cryptos/CoinIcon";

const DEPOT = 2;
const STAKING = 5;

const KIND_LABEL = { deposit: 'Dépôt manquant', reward: 'Récompenses non importées', transfer: 'Achat ou transfert manquant' };

function formatAmount (qty, coin) {
	return coin === "EUR" ? Sanitaze.toFormatCurrency(qty) : `${parseFloat(qty.toFixed(8))} ${coin}`;
}

function formatDate (at) {
	return moment(at).format('D MMM YYYY');
}

function diagnosis (issue) {
	const where = issue.platform ? ` sur ${issue.platform}` : "";
	const amount = <b className="text-foreground">{formatAmount(issue.maxDeficit, issue.coin)}</b>;

	switch (issue.kind) {
		case 'deposit':
			return <>Il manque {amount}{where} avant le <b className="text-foreground">{formatDate(issue.startAt)}</b>. Un dépôt n'a probablement pas été importé.</>;
		case 'reward':
			return <>Écart de {amount} seulement ({(issue.maxDeficit / issue.rootQty * 100).toFixed(1).replace('.', ',')} % de l'opération) : récompenses de staking ou frais non importés.</>;
		default:
			return <>Opération de <b className="text-foreground">{formatAmount(issue.rootQty, issue.coin)}</b>{where} le {formatDate(issue.startAt)} alors que
				seulement <b className="text-foreground">{formatAmount(Math.max(0, issue.rootQty - issue.rootDeficit), issue.coin)}</b> étaient disponibles.
				Un achat ou un transfert depuis un autre portefeuille manque (au moins {amount}).</>;
	}
}

/**
 * Prefilled draft for TradesFormulaire (create mode): the minimum quantity that closes the gap, dated one
 * hour before the trade that went negative. Prices/EUR amount stay empty on purpose — the user knows them,
 * we don't.
 */
function fixDraft (issue) {
	const qty = issue.coin === "EUR" ? Math.round(issue.maxDeficit * 100) / 100 : parseFloat(issue.maxDeficit.toFixed(8));
	const type = issue.kind === 'reward' ? STAKING : DEPOT;

	return {
		prefillKey: `fix-${issue.coin}-${issue.rootId}`,
		tradeAt: moment(issue.startAt).subtract(1, 'hour').toDate(),
		type,
		fromCoin: type === STAKING ? issue.coin : '',
		fromNbToken: type === STAKING ? qty : '',
		toCoin: issue.coin,
		toNbToken: qty,
		toPrice: '',
		fromPrice: '',
		costPrice: 0,
		costCoin: issue.coin,
		totalReal: issue.coin === "EUR" ? qty : '',
	};
}

function fixLabel (issue) {
	const amount = formatAmount(issue.maxDeficit, issue.coin);
	switch (issue.kind) {
		case 'deposit': return `Ajouter un dépôt de ${amount}`;
		case 'reward': return `Ajouter ${amount} de stacking`;
		default: return `Ajouter un transfert entrant de ${amount}`;
	}
}

export function TradesIssues ({ issues, invalidCount, onFix, onShow }) {
	const [selectedKey, setSelectedKey] = useState(null);

	const keyOf = (issue) => `${issue.coin}-${issue.rootId}`;
	const selected = issues.find(i => keyOf(i) === selectedKey) ?? issues[0];

	return <Card className="overflow-hidden">
		<CardHeader className="space-y-0 border-b p-4">
			<CardTitle className="text-sm">À corriger</CardTitle>
			<div className="text-xs text-muted-foreground">
				{issues.length} cause{issues.length > 1 ? "s" : ""} expliquent {invalidCount} opération{invalidCount > 1 ? "s" : ""} en rouge
			</div>
		</CardHeader>
		<CardContent className="p-0">
			{issues.map(issue => {
				const active = issue === selected;
				return <button key={keyOf(issue)} type="button" aria-current={active}
							   onClick={() => setSelectedKey(keyOf(issue))}
							   className={cn("flex w-full flex-col gap-1.5 border-t px-4 py-3 text-left transition-colors first:border-t-0 hover:bg-muted/40",
								   active && "bg-[var(--cat-crypto-soft)] shadow-[inset_3px_0_0_var(--cat-crypto)] hover:bg-[var(--cat-crypto-soft)]")}>
					<span className="flex items-center justify-between gap-2">
						<span className="flex items-center gap-2 text-sm font-semibold">
							<CoinIcon coin={issue.coin} />
							{KIND_LABEL[issue.kind]}
						</span>
						<Badge variant="outline" className="whitespace-nowrap" style={{ borderColor: 'var(--status-critical)55', color: 'var(--status-critical)' }}>
							{formatAmount(issue.maxDeficit, issue.coin)}
						</Badge>
					</span>
					<span className="text-xs text-muted-foreground">
						{formatDate(issue.startAt)} · {issue.count} opération{issue.count > 1 ? "s" : ""} touchée{issue.count > 1 ? "s" : ""}
						{issue.endAt === null && <> · <b style={{ color: 'var(--status-critical)' }}>toujours ouvert</b></>}
					</span>
				</button>
			})}

			{selected && <div className="m-4 flex flex-col gap-3 rounded-lg border border-dashed border-[var(--cat-crypto)]/40 bg-[var(--cat-crypto-soft)]/60 p-3">
				<div className="text-[13px] leading-relaxed text-muted-foreground">{diagnosis(selected)}</div>
				<div className="flex flex-wrap gap-1.5">
					<Button type="blue" onClick={() => onFix(fixDraft(selected))}>{fixLabel(selected)}</Button>
					<Button type="default" onClick={() => onShow(moment(selected.startAt).year(), selected.coin)}>Voir dans la liste</Button>
				</div>
				<div className="text-[11px] text-muted-foreground">Diagnostic automatique : vérifie avant d'enregistrer.</div>
			</div>}
		</CardContent>
	</Card>
}

TradesIssues.propTypes = {
	issues: PropTypes.array.isRequired,
	invalidCount: PropTypes.number.isRequired,
	onFix: PropTypes.func.isRequired,
	onShow: PropTypes.func.isRequired,
}
