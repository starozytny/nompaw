import React from "react";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Sanitaze from '@commonFunctions/sanitaze';

const URL_DOWNLOAD_ELEMENT = "user_videotheque_download";

export function VideosItem ({ elem, isAdmin, onModal }) {

	let fileInfos = [];
	if(elem.fileDuration){
		fileInfos.push(`${Sanitaze.toFormatDuration(elem.fileDuration)}`);
	}
	if(elem.fileYear){
		fileInfos.push(elem.fileYear)
	}
	if(elem.fileType){
		fileInfos.push(elem.fileType)
	}

	return <div className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
		<div className="aspect-video bg-gradient-to-br from-blue-200 to-indigo-300 relative overflow-hidden">
			<div className="absolute inset-0 flex items-center justify-center">
				<svg className="w-16 h-16 text-blue-600 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<div className="absolute top-3 right-3">
				{elem.id
					? null
					: <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-semibold rounded-full">À traiter</span>
				}
			</div>
			<div className="absolute bottom-3 left-3 flex gap-0.5">
				{elem.notation
					? <>
						<svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
						</svg>
						<svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
						</svg>
						<svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
						</svg>
						<svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
						</svg>
						<svg className="w-4 h-4 text-slate-300 fill-current" viewBox="0 0 24 24">
							<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
						</svg>
					</>
					: null
				}
			</div>
		</div>

		<div className="p-5">
			<h3 className="font-semibold text-slate-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
				{elem.name}
			</h3>
			{fileInfos
				? <p className="text-xs text-slate-500 mb-3">{fileInfos.join('•')}</p>
				: null
			}
			<div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
				{elem.fileExtension
					? <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">{elem.fileExtension.toUpperCase()}</span>
					: null
				}
				{elem.fileSize
					? <span>{Sanitaze.toFormatBytesToSize(elem.fileSize)}</span>
					: null
				}
				{elem.fileQuality
					? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{elem.fileQuality}</span>
					: null
				}
			</div>

			<div className="flex gap-2">
				{isAdmin
					? <>
						{elem.id
							? <>
								<a href={Routing.generate(URL_DOWNLOAD_ELEMENT, { id: elem.id })} download
								   className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
									</svg>
									Télécharger
								</a>
								<button onClick={() => onModal('infos', elem)} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all">
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
									</svg>
								</button>
							</>
							: <button onClick={() => onModal('infos', elem)}
									  className="flex-1 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium flex items-center justify-center gap-2">
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
								</svg>
								Créer
							</button>
						}
					</>
					: <a href={Routing.generate(URL_DOWNLOAD_ELEMENT, { id: elem.id })} download
						 className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium flex items-center justify-center gap-2"
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
						</svg>
						Télécharger
					</a>
				}
			</div>
		</div>
	</div>
}
