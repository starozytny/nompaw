import React, { Component } from "react";
import PropTypes from "prop-types";

import ModalFunctions from '@commonFunctions/modal';

export class LightBox extends Component {
	constructor (props) {
		super(props);

		this.state = {
			contentUpdated: null,
		}
	}

	handleClick = (e) => {
		const { identifiant } = this.props;

		let [body, modal, modalContent, btns] = ModalFunctions.getElements(identifiant);

		ModalFunctions.openM(body, modal, modalContent);

		window.onclick = (e) => {
			if (e.target === modal) {
				ModalFunctions.closeM(body, modal, modalContent);
			}
		}

		btns.forEach(btn => {
			btn.addEventListener('click', () => {
				ModalFunctions.closeM(body, modal, modalContent);
			})
		})
	}

	handleClose = (e) => {
		const { identifiant } = this.props;

		let [body, modal, modalContent, btns] = ModalFunctions.getElements(identifiant);

		ModalFunctions.closeM(body, modal, modalContent);
	}

	handleUpdateContent = (content) => {
		this.setState({ contentUpdated: content })
	}

	render () {
		const { content, identifiant, maxWidth, margin = 0 } = this.props;
		const { contentUpdated } = this.state;

		let divStyle = maxWidth ? {
			maxWidth: maxWidth + "px",
			margin: margin + "% auto"
		} : null;

		let nContent = contentUpdated ? contentUpdated : content;
		if (typeof nContent === "string") {
			nContent = <div dangerouslySetInnerHTML={{ __html: nContent }} />;
		}

		return <div id={identifiant} className="modal fixed top-0 left-0 w-full h-full -z-10 opacity-0 bg-gray-800/90 overflow-hidden" role="dialog" aria-modal="true">
			<div className="modal-content relative w-screen h-full bg-gray-800/30 text-left transition-all ease-out duration-300 opacity-0 sm:w-full" style={divStyle}>
				<div className="flex justify-center items-center h-full">{nContent}</div>
			</div>
		</div>
	}
}

LightBox.propTypes = {
	identifiant: PropTypes.string.isRequired,
	title: PropTypes.string,
	maxWidth: PropTypes.number,
	margin: PropTypes.number,
	content: PropTypes.node,
	footer: PropTypes.node,
	closeTxt: PropTypes.string,
	showClose: PropTypes.bool,
	isForm: PropTypes.bool,
}
