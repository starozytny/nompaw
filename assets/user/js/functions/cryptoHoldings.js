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
 */
function computeHoldingsAndAlerts (data) {
	let sorted = [...data].sort((a, b) => new Date(a.tradeAt) - new Date(b.tradeAt));
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

module.exports = {
	computeHoldingsAndAlerts
}
