import React, { useState } from "react";
import PropTypes from 'prop-types';

// Public, MIT-licensed icon set (atomiclabs/cryptocurrency-icons), served via jsDelivr's GitHub CDN.
const CDN_BASE = "https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@0.18.1/svg/color";

const FIAT_SYMBOL = { EUR: '€', USD: '$', GBP: '£' };

export function CoinIcon ({ coin, size = 18 }) {
	const [failed, setFailed] = useState(false);
	const ticker = (coin || '').toUpperCase();

	if (!ticker) return null;

	if (FIAT_SYMBOL[ticker]) {
		return <span className="inline-flex items-center justify-center rounded-full font-semibold flex-shrink-0"
					  style={{ width: size, height: size, fontSize: size * 0.55, background: '#2775ca', color: '#fff' }}>
			{FIAT_SYMBOL[ticker]}
		</span>
	}

	if (failed) {
		return <span className="inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold flex-shrink-0"
					  style={{ width: size, height: size, fontSize: size * 0.4 }}>
			{ticker.slice(0, 2)}
		</span>
	}

	return <img src={`${CDN_BASE}/${ticker.toLowerCase()}.svg`} alt="" width={size} height={size} loading="lazy"
				className="inline-block flex-shrink-0" onError={() => setFailed(true)} />;
}

CoinIcon.propTypes = {
	coin: PropTypes.string,
	size: PropTypes.number,
}
