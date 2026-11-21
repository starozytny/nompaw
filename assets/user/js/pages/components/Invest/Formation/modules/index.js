import { M00RevenusReels } from "@userPages/Invest/Formation/modules/M00RevenusReels";
import { M01BudgetEpargne } from "@userPages/Invest/Formation/modules/M01BudgetEpargne";
import { M02Enveloppes } from "@userPages/Invest/Formation/modules/M02Enveloppes";
import { M03EtfFonds } from "@userPages/Invest/Formation/modules/M03EtfFonds";
import { M04Allocation } from "@userPages/Invest/Formation/modules/M04Allocation";
import { M05Fiscalite } from "@userPages/Invest/Formation/modules/M05Fiscalite";
import { M06Patrimoine } from "@userPages/Invest/Formation/modules/M06Patrimoine";

/**
 * Parcours de formation. Each module is the JSX transcription of a docs/formation/NN-slug.md file
 * (format described in docs/formation/_FORMAT.md). To add one: create MNNSlug.jsx and list it here.
 */
export const MODULES = [
	M00RevenusReels,
	M01BudgetEpargne,
	M02Enveloppes,
	M03EtfFonds,
	M04Allocation,
	M05Fiscalite,
	M06Patrimoine,
].sort((a, b) => a.module - b.module);

// Planned topics, listed under the chapter.
export const UPCOMING = [];
