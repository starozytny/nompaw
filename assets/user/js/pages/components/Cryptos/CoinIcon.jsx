import React, { useState } from "react";
import PropTypes from 'prop-types';

// Icons are stored locally by app:crypto:icons:download / the import (CrCoinIconService), as one file per
// ticker — svg or png depending on its source — so no third-party call from the browser. Initials otherwise.
const SOURCES = [
	t => `/crypto-icons/${t}.svg`,
	t => `/crypto-icons/${t}.png`,
];

// Same project under a new ticker (SwissBorg CHSB → BORG).
const ALIASES = { BORG: 'CHSB' };

// ticker → index of the first source known to work, shared by every icon on the page so a coin's
// failing sources are only tried once, not once per row.
const resolved = {};

const FIAT_SYMBOL = { EUR: '€', USD: '$', GBP: '£' };

export function CoinIcon ({ coin, size = 18 }) {
	const raw = (coin || '').toUpperCase();
	const ticker = ALIASES[raw] ?? raw;
	const [, rerender] = useState(0);
	const source = resolved[ticker] ?? 0;

	if (!ticker) return null;

	if (FIAT_SYMBOL[ticker]) {
		return <span className="inline-flex items-center justify-center rounded-full font-semibold flex-shrink-0"
					  style={{ width: size, height: size, fontSize: size * 0.55, background: '#2775ca', color: '#fff' }}>
			{FIAT_SYMBOL[ticker]}
		</span>
	}

	if (source >= SOURCES.length) {
		return <span className="inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold flex-shrink-0"
					  style={{ width: size, height: size, fontSize: size * 0.4 }}>
			{raw.slice(0, 2)}
		</span>
	}

	const handleError = () => {
		// Several icons of the same coin fail at once: only the first moves the shared index forward.
		if ((resolved[ticker] ?? 0) === source) {
			resolved[ticker] = source + 1;
		}
		rerender(n => n + 1);
	}

	return <img key={source} src={SOURCES[source](ticker)} alt="" width={size} height={size} loading="lazy"
				className="inline-block flex-shrink-0 rounded-full" onError={handleError} />;
}

CoinIcon.propTypes = {
	coin: PropTypes.string,
	size: PropTypes.number,
}
