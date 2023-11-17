const Sanitaze = require('@commonFunctions/sanitaze')

function compareFirstname(a, b){
    return compareWithoutAccent(a.firstname, b.firstname);
}

function compareLastname(a, b){
    return compareWithoutAccent(a.lastname, b.lastname);
}

function compareUsername(a, b){
    return compareWithoutAccent(a.username, b.username);
}

function compareTitle(a, b){
    return compareWithoutAccent(a.title, b.title);
}

function compareName(a, b){
    return compareWithoutAccent(a.name, b.name);
}

function compareCreatedAt(a, b){
    return comparison(a.createdAt, b.createdAt);
}

function compareCreatedAtInverse(a, b){
    return comparison(b.createdAt, a.createdAt);
}

function compareEmail(a, b){
    return compareWithoutAccent(a.email, b.email);
}

function compareZipcode(a, b){
    return compareWithoutAccent(a.zipcode, b.zipcode);
}

function compareCity(a,b){
    return compareWithoutAccent(a.city, b.city);
}

function compareDateAt(a, b){
    return comparison(a.dateAt, b.dateAt);
}

function compareDateAtInverse(a, b){
    return comparison(b.dateAt, a.dateAt);
}

function compareDateAtInverseThenId(a, b){
    if (b.dateAt > a.dateAt) {
        return 1;
    } else if (b.dateAt < a.dateAt) {
        return -1;
    }

    return comparison(b.id, a.id);
}

function compareStartAt(a, b){
    return comparison(a.startAt, b.startAt);
}

function compareWithoutAccent(aVal, bVal) {
    let aName = Sanitaze.removeAccents(aVal);
    let bName = Sanitaze.removeAccents(bVal);
    return comparison(aName.toLowerCase(), bName.toLowerCase());
}

function compareCode(a, b){
    return comparison(a.code, b.code);
}

function compareRankThenLabel(a, b){
    if (a.rank > b.rank) {
        return 1;
    } else if (a.rank < b.rank) {
        return -1;
    }
    return comparison(a.label, b.label);
}

function compareLabel(a, b){
    return comparison(a.label, b.label);
}

function comparison (objA, objB){
    let comparison = 0;
    if (objA > objB) {
        comparison = 1;
    } else if (objA < objB) {
        comparison = -1;
    }
    return comparison;
}

module.exports = {
    compareUsername,
    compareLastname,
    compareFirstname,
    compareTitle,
    compareName,
    compareCreatedAt,
    compareCreatedAtInverse,
    compareEmail,
    compareZipcode,
    compareCity,
    compareCode,
    compareRankThenLabel,
    compareLabel,
    compareDateAt,
    compareDateAtInverse,
    compareDateAtInverseThenId,
    compareStartAt,
}
