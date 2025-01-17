const moment = require("moment");
require('moment/locale/fr');

function sanitizeString(chaine){
    chaine.trim();

    let spe = [' ', '<', '>', '\'', 'é', 'è', 'ê', 'ë', 'á', 'ä', 'à', 'â', 'î', 'ï', 'ö', 'ô', 'ù', 'û',
        'É', 'È', 'Ê', 'Ë', 'À', 'Â', 'Á', 'Î', 'Ï', 'Ô', 'Ù', 'Û', 'ç','Ç'];
    let changer = ['-', '-', '-', '', 'e','e','e','e','á','a','a','a','i','i','o','o','u','u',
        'E','E','E','E','A','A','A','I','I','O','U','U','c','C'];

    spe.forEach((elem, index) => {
        chaine = chaine.replace(elem, changer[index]);
    })
    chaine = chaine.replace(/\s+/g, '-');
    chaine = chaine.toLowerCase();

    return chaine;
}

function addZeroToNumber (data) {
    return data > 9 ? data : "0" + data;
}

function capitalize(elem) {
    if(elem.length !== 0){
        let first = elem.substring(0, 1);
        elem = elem.substring(1);
        elem = first.toUpperCase() + elem;
    }

    return elem;
}

function removeAccents (str) {
    const accentsMap = {
        a: 'á|à|ã|â|À|Á|Ã|Â',
        e: 'é|è|ê|É|È|Ê',
        i: 'í|ì|î|Í|Ì|Î',
        o: 'ó|ò|ô|õ|Ó|Ò|Ô|Õ',
        u: 'ú|ù|û|ü|Ú|Ù|Û|Ü',
        c: 'ç|Ç',
        n: 'ñ|Ñ',
    };

    for (let pattern in accentsMap) {
        str = str.replace(new RegExp(accentsMap[pattern], 'g'), pattern);
    }

    return str;
}

function toFormatPhone(elem){
    if(elem !== "" && elem !== undefined && elem !== null){
        let arr = elem.match(/[0-9-+]/g);
        if(arr != null) {
            elem = arr.join('');
            if (!(/^((\+)33|0)[1-9](\d{2}){4}$/.test(elem))) {
                return elem;
            } else {
                let a = elem.substr(0, 2);
                let b = elem.substr(2, 2);
                let c = elem.substr(4, 2);
                let d = elem.substr(6, 2);
                let e = elem.substr(8, 2);

                return a + " " + b + " " + c + " " + d + " " + e;
            }
        }
        return elem;
    }else{
        return "";
    }
}

function toFormatCurrency(number)
{
    if(number){
        let num = new Intl.NumberFormat("de-DE", {style: "currency", currency: "EUR"}).format(number)

        let main = num.slice(0, num.length - 5);
        let decimale = num.slice(num.length - 5, num.length - 2);
        if(decimale === ",00"){
            decimale = "";
        }
        num = main + decimale + " €";

        return num.replaceAll('.', ' ');
    }

    return "0,00 €";
}

function toFormatBytesToSize(bytes) {
    let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function toFormatCalendar(value, retour = "") {
    if(value){
        return moment(value).calendar().replace(":", "h")
    }

    return retour;
}

function toFormatDate(date, format = 'LLL', retour = "", replaceHours = true, useUtc = false) {
    if(date === null) return retour;

    date = useUtc ? moment.utc(date) : moment(date);

    return replaceHours
        ? date.format(format).replace(':', 'h')
        : date.format(format)
    ;
}

function toFormatDuration(value){
    let duration = value.split('h');

    let hours = duration[0];
    let minutes = duration[1];

    if(hours === "00"){
        return parseInt(minutes) + 'min';
    }

    if(minutes === "00"){
        return parseInt(hours) + 'h';
    }

    if(parseInt(hours) < 10){
        return parseInt(hours) + 'h' + minutes
    }

    return value;
}

function toRoundTwoDec(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100
}

module.exports = {
    sanitizeString,
    addZeroToNumber,
    toFormatPhone,
    toFormatCurrency,
    toFormatBytesToSize,
    toFormatCalendar,
    capitalize,
    removeAccents,
    toFormatDate,
    toFormatDuration,
    toRoundTwoDec,
}
