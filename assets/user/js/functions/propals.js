const axios = require("axios");
const Routing = require("@publicFolder/bundles/fosjsrouting/js/router.min.js");

const Formulaire = require("@commonFunctions/formulaire");
const {Button} = require("@commonComponents/Elements/Button");

function updateList (context, data, response) {
    let nData = data;
    if(context === "create"){
        nData = [...data, ...[response.data]];
    }else if(context === "update"){
        nData = [];
        data.forEach(d => {
            if(d.id === response.data.id){
                d = response.data;
            }
            nData.push(d);
        })
    }

    return nData;
}

function deletePropal (self, modalRef, element, data, urlName, modalFunction) {
    axios({ method: "DELETE", url: Routing.generate(urlName, {'id': element.id}), data: {} })
        .then(function (response) {
            modalRef.current.handleClose();
            self.setState({ data: data.filter(d => { return d.id !== element.id }) })
        })
        .catch(function (error) { modalFunction(self); Formulaire.displayErrors(self, error); Formulaire.loader(false); })
    ;
}

function vote (self, element, data, userId, loadData, urlName) {
    if(!loadData){
        self.setState({ loadData: true });
        axios({ method: "PUT", url: Routing.generate(urlName, {'id': element.id}), data: {userId: userId} })
            .then(function (response) {
                let nData = [];
                data.forEach(d => {
                    if(d.id === response.data.id){
                        d = response.data;
                    }
                    nData.push(d);
                })

                self.setState({ data: nData });
            })
            .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); })
            .then(function () { self.setState({ loadData: false }); })
        ;
    }
}

function endPropal (self, element, urlName, modalFunction) {
    axios({ method: "PUT", url: Routing.generate(urlName, {'id': element.id}), data: {} })
        .then(function (response) {
            location.reload();
        })
        .catch(function (error) { modalFunction(self); Formulaire.displayErrors(self, error); Formulaire.loader(false); })
    ;
}

function cancel (self, projectId, urlName, modalFunction) {
    axios({ method: "PUT", url: Routing.generate(urlName, {'id': projectId}), data: {} })
        .then(function (response) {
            location.reload();
        })
        .catch(function (error) { modalFunction(self); Formulaire.displayErrors(self, error); Formulaire.loader(false); })
    ;
}

module.exports = {
    updateList,
    deletePropal,
    vote,
    endPropal,
    cancel,
}
