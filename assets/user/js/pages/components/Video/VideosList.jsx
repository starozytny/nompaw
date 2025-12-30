import React from "react";
import PropTypes from 'prop-types';

import { Alert } from "@tailwindComponents/Elements/Alert";

import { VideosItem } from "@userPages/Video/VideosItem";

export function VideosList ({ data, isAdmin, onModal }) {
    return <div className="my-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.length > 0
            ? data.map((elem) => {
                return <VideosItem key={elem.filename} elem={elem} isAdmin={isAdmin} onModal={onModal} />;
            })
            : <div>
                <Alert type="gray">Aucun résultat.</Alert>
            </div>
        }
    </div>
}

VideosList.propTypes = {
    data: PropTypes.array.isRequired,
    onModal: PropTypes.func.isRequired,
    highlight: PropTypes.number,
}
