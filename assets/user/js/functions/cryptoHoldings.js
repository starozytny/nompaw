const ACHAT = 0;
const VENTE = 1;
const DEPOT = 2;
const RETRAIT = 3;
const RECUP = 4;
const STAKING = 5;

/**
 * Per-type holdings rules, confirmed with the app's owner (not derivable from the field names alone,
 * since "fromCoin" means "given up" for Achat/Vente but "received" for Recuperation/Stacking):
 * - Achat: toCoin received (+toNbToken)
 * - Vente: fromCoin given up (-fromNbToken); if toCoin isn't EUR (a crypto-to-crypto swap), toCoin
 *   received too (+toNbToken)
 * - Recuperation/Stacking: fromCoin received as a reward (+fromNbToken)
 * - Depot/Retrait: a plain EUR cash movement (no holdings impact) UNLESS the coin involved isn't
 *   EUR, in which case it represents a real external crypto deposit/withdrawal (e.g. an exchange
 *   import's "deposit" of BTC from an outside wallet) and must adjust the balance like Achat/Vente
 *   would — Depot: +toCoin, Retrait: -fromCoin.
 * - Transfert: moves between the user's own wallets, no net holdings impact
 *
 * Replays trades in chronological order (not just a final sum) so a Vente that spends more of a coin
 * than was held at that point in time is caught and surfaced as an inconsistency, rather than silently
 * netting out against a later purchase.
 *
 * @param {{asOf?: string|Date, excludeId?: number}} [options] asOf stops the replay at that date instead
 *        of running through the full history — e.g. TradesForm shows "what did I actually hold right
 *        before this transaction", which is meaningless as a *current* total for a transaction backdated
 *        years ago. excludeId leaves one trade (typically the one being edited) out of the replay entirely,
 *        so its own effect doesn't count towards "what was available before it".
 */
function computeHoldingsAndAlerts (data, options = {}) {
	let { asOf, excludeId } = options;
	let scoped = data.filter(elem => {
		if (excludeId !== undefined && excludeId !== null && elem.id === excludeId) return false;
		if (asOf && new Date(elem.tradeAt) > new Date(asOf)) return false;
		return true;
	});
	let sorted = [...scoped].sort((a, b) => new Date(a.tradeAt) - new Date(b.tradeAt));
	let balances = {};
	let alerts = [];

	let add = (coin, qty) => {
		if (!coin || coin === 'EUR' || qty === null) return;
		balances[coin] = (balances[coin] || 0) + qty;
	}

	sorted.forEach(elem => {
		switch (elem.type) {
			case ACHAT:
				add(elem.toCoin, elem.toNbToken);
				break;
			case VENTE:
				add(elem.fromCoin, -elem.fromNbToken);
				if (balances[elem.fromCoin] < -0.00000001) {
					alerts.push({
						id: elem.id,
						tradeAt: elem.tradeAt,
						coin: elem.fromCoin,
						action: 'vente',
						qty: elem.fromNbToken,
						deficit: -balances[elem.fromCoin],
					});
				}
				if (elem.toCoin !== 'EUR') add(elem.toCoin, elem.toNbToken);
				break;
			case DEPOT:
				if (elem.toCoin !== 'EUR') add(elem.toCoin, elem.toNbToken);
				break;
			case RETRAIT:
				if (elem.fromCoin !== 'EUR') {
					add(elem.fromCoin, -elem.fromNbToken);
					if (balances[elem.fromCoin] < -0.00000001) {
						alerts.push({
							id: elem.id,
							tradeAt: elem.tradeAt,
							coin: elem.fromCoin,
							action: 'retrait',
							qty: elem.fromNbToken,
							deficit: -balances[elem.fromCoin],
						});
					}
				}
				break;
			case RECUP:
			case STAKING:
				add(elem.fromCoin, elem.fromNbToken);
				break;
			default: break;
		}
	})

	let holdings = Object.keys(balances)
		.map(coin => ({ coin: coin, quantity: balances[coin] }))
		.filter(h => Math.abs(h.quantity) > 0.00000001)
		.sort((a, b) => b.quantity - a.quantity);

	return { holdings, alerts };
}

/**
 * Flags transactions that couldn't physically have happened given what was actually available right
 * before them — e.g. an Achat spending EUR you hadn't deposited yet, or a Vente of more BTC than you
 * held at that moment. Deliberately a SEPARATE replay from computeHoldingsAndAlerts() above rather than
 * an extension of it: that function's Achat/Depot/Retrait rules (documented in its own docblock) are
 * tailored to portfolio *valuation* — EUR is intentionally left untracked there, and Achat intentionally
 * never debits fromCoin — because several other features (the tax report, TradesForm's "solde à cette
 * date", the Holdings tab's crypto-only list) depend on exactly that behavior. This function tracks EVERY
 * coin including EUR, and DOES debit fromCoin on an Achat, because here the question is different: not
 * "what crypto do I hold for valuation", but "could this transaction really have happened".
 *
 * Per-type rule: Achat/Vente/Retrait debit fromCoin (checked against the running balance); Achat/Vente/
 * Depot credit toCoin; Recuperation/Stacking credit fromCoin (a reward, never a deficit). Transfert and
 * ACategoriser are left alone, same as computeHoldingsAndAlerts.
 *
 * @return {Object<number, {coin: string, deficit: number, action: string}>} invalid transaction id => why
 */
function computeTransactionValidity (data) {
	let sorted = [...data].sort((a, b) => new Date(a.tradeAt) - new Date(b.tradeAt));
	let balances = {};
	let invalid = {};

	let add = (coin, qty) => {
		if (!coin || qty === null) return;
		balances[coin] = (balances[coin] || 0) + qty;
	}

	let debit = (elem, coin, qty, action) => {
		add(coin, -qty);
		if (balances[coin] < -0.00000001) {
			invalid[elem.id] = { coin: coin, deficit: -balances[coin], action: action };
		}
	}

	sorted.forEach(elem => {
		switch (elem.type) {
			case ACHAT:
				debit(elem, elem.fromCoin, elem.fromNbToken, 'achat');
				add(elem.toCoin, elem.toNbToken);
				break;
			case VENTE:
				debit(elem, elem.fromCoin, elem.fromNbToken, 'vente');
				add(elem.toCoin, elem.toNbToken);
				break;
			case DEPOT:
				add(elem.toCoin, elem.toNbToken);
				break;
			case RETRAIT:
				debit(elem, elem.fromCoin, elem.fromNbToken, 'retrait');
				break;
			case RECUP:
			case STAKING:
				add(elem.fromCoin, elem.fromNbToken);
				break;
			default: break;
		}
	})

	return invalid;
}

module.exports = {
	computeHoldingsAndAlerts,
	computeTransactionValidity,
}
