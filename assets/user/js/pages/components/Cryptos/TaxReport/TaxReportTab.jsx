import React, { useEffect, useState } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";

import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { Button } from "@tailwindComponents/Elements/Button";
import { SelectSimple } from "@shadcnComponents/elements/Select/Select";

import { TaxReportTable } from "@userPages/Cryptos/TaxReport/TaxReportTable";
import { TaxReportSummary } from "@userPages/Cryptos/TaxReport/TaxReportSummary";

const URL_GET_REPORT = "intern_api_cryptos_tax_report_index";
const URL_EXPORT = "intern_api_cryptos_tax_report_export";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

export function TaxReportTab () {
	const [year, setYear] = useState(CURRENT_YEAR);
	const [report, setReport] = useState(null);
	const [loadingData, setLoadingData] = useState(true);
	const [exporting, setExporting] = useState(false);

	useEffect(() => {
		setLoadingData(true);

		axios({ method: "GET", url: Routing.generate(URL_GET_REPORT, { year: year }), data: {} })
			.then(function (response) {
				setReport(response.data);
				setLoadingData(false);
			})
			.catch(function (error) {
				Formulaire.displayErrors(null, error);
				setLoadingData(false);
			})
		;
	}, [year]);

	const handleLineUpdate = (updatedLine) => {
		setReport(function (prev) {
			let lines = prev.lines.map(l => l.id === updatedLine.id ? updatedLine : l);
			let totalPlusValue = lines.reduce((sum, l) => sum + (l.plusValue !== null ? l.plusValue : 0), 0);
			let hasMissingValues = lines.some(l => l.plusValue === null);

			return { ...prev, lines: lines, totalPlusValue: Math.round(totalPlusValue * 100) / 100, hasMissingValues: hasMissingValues };
		});
	}

	const handleExport = (format) => (e) => {
		e.preventDefault();
		if (exporting) return;

		setExporting(true);
		axios({ method: "GET", url: Routing.generate(URL_EXPORT, { year: year, format: format }), data: {} })
			.then(function (response) {
				const link = document.createElement('a');
				link.href = response.data.url;
				link.setAttribute('download', `rapport-fiscal-${year}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

				setExporting(false);
			})
			.catch(function (error) {
				Formulaire.displayErrors(null, error);
				setExporting(false);
			})
		;
	}

	return <div className="flex flex-col gap-4">
		<div className="flex flex-wrap items-end justify-between gap-3">
			<div>
				<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
					<span className="icon-shield text-xs" style={{ color: 'var(--cat-crypto)' }} />
					Application de l'art. 150 VH bis du CGI — compréhension non vérifiée par un professionnel
				</div>
				<div className="text-xs text-muted-foreground">À faire valider avant toute déclaration réelle.</div>
			</div>

			<div className="flex items-center gap-2">
				<div className="w-28">
					<SelectSimple identifiant="year" valeur={String(year)} noEmpty
						items={YEARS.map(y => ({ identifiant: y, value: String(y), label: String(y) }))}
						onSelect={(identifiant, value) => setYear(parseInt(value))} />
				</div>
				<Button type="default" iconLeft="download" onClick={handleExport('excel')}>Excel</Button>
				<Button type="default" iconLeft="download" onClick={handleExport('pdf')}>PDF</Button>
			</div>
		</div>

		{loadingData
			? <LoaderElements />
			: <>
				<TaxReportSummary year={year} totalPlusValue={report ? report.totalPlusValue : 0} />

				{report && report.hasMissingValues && <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800">
					<span className="icon-warning1 text-sm flex-none" />
					Certaines lignes n'ont pas de valeur de portefeuille disponible automatiquement — elles ne sont pas incluses dans le total tant qu'une valeur manuelle n'est pas renseignée ci-dessous.
				</div>}

				<TaxReportTable lines={report ? report.lines : []} onLineUpdate={handleLineUpdate} />
			</>
		}
	</div>
}
