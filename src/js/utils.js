"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function convertEthersBNs(object) {
    const result = {};
    for (let key of Object.keys(object)) {
        const value = object[key];
        if (typeof (value) == 'object' && value != null && value.hasOwnProperty("_bn")) {
            result[key] = value._bn;
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
exports.convertEthersBNs = convertEthersBNs;
//# sourceMappingURL=utils.js.map