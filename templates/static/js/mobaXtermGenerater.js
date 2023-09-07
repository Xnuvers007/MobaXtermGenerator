const VariantBase64Table = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split('');
const VariantBase64Dict = {};
VariantBase64Table.forEach((val, i) => VariantBase64Dict[i] = val);
const VariantBase64ReverseDict = {};
VariantBase64Table.forEach((val, i) => VariantBase64ReverseDict[val] = i);

/** License Types */
const LicenseType = {
    Professional: 1,
    Educational: 3,
    Personal: 4
}

/**
 * Encode a byte array to base64
 * @param {array[Number]} bs 
 * @returns 
 */
function VariantBase64Encode(bs) {
    let result = [];
    let blocksCount = Math.floor(bs.length / 3);
    let leftBytes = bs.length % 3;

    let codingInt, block;
    for (let i = 0; i < blocksCount; i++) {
        codingInt = bs.slice(3 * i, 3 * i + 3).toInt();
        block = VariantBase64Dict[codingInt & 0x3f];
        block += VariantBase64Dict[(codingInt >> 6) & 0x3f];
        block += VariantBase64Dict[(codingInt >> 12) & 0x3f];
        block += VariantBase64Dict[(codingInt >> 18) & 0x3f];
        result = result.concat(block.toBytes());
    }

    switch (leftBytes) {
        case 0:
            return result;
        case 1:
            codingInt = bs.slice(3 * blocksCount).toInt();
            block = VariantBase64Dict[codingInt & 0x3f];
            block += VariantBase64Dict[(codingInt >> 6) & 0x3f];
            result = result.concat(block.toBytes());
            return result;
        default:
            codingInt = bs.slice(3 * blocksCount).toInt();
            block = VariantBase64Dict[codingInt & 0x3f];
            block += VariantBase64Dict[(codingInt >> 6) & 0x3f];
            block += VariantBase64Dict[(codingInt >> 12) & 0x3f];
            result = result.concat(block.toBytes());
            return result;
    }
}

function EncryptBytes(key, bs) {
    let result = [];
    bs.forEach(val => {
        result.push(val ^ ((key >> 8) & 0xff))
        key = result[-1] & key | 0x482D
    });
    return result;
}

function DecryptBytes(key, bs) {
    let result = [];
    bs.forEach(val => {
        result.push(val ^ ((key >> 8) & 0xff));
        key = val & key | 0x482D;
    });
    return result;
}

/**
 * Convert a byte array to an integer (compatible with little-endian byte order)
 * @param {Number} offset Offset, default is 0
 * @returns The byte array converted to an integer
 */
Array.prototype.toInt = function (offset = 0) {
    let value = ((this[offset] & 0xFF)
        | ((this[offset + 1] & 0xFF) << 8)
        | ((this[offset + 2] & 0xFF) << 16)
        | ((this[offset + 3] & 0xFF) << 24)
    );
    return value;
}

/**
 * Convert a byte array back to a string
 */
Array.prototype.bytesToStr = function () {
    var str = '',
        _arr = this;
    for (var i = 0; i < _arr.length; i++) {
        var one = _arr[i].toString(2),
            v = one.match(/^1+?(?=0)/);
        if (v && one.length == 8) {
            var bytesLength = v[0].length;
            var store = _arr[i].toString(2).slice(7 - bytesLength);
            for (var st = 1; st < bytesLength; st++) {
                store += _arr[st + i].toString(2).slice(2);
            }
            str += String.fromCharCode(parseInt(store, 2));
            i += bytesLength - 1;
        } else {
            str += String.fromCharCode(_arr[i]);
        }
    }
    return str;
}

/**
 * Convert a string to a byte array
 */
String.prototype.toBytes = function () {
    var bytes = new Array();
    var len, char;
    len = this.length;
    for (var i = 0; i < len; i++) {
        char = this.charCodeAt(i);
        if (char >= 0x010000 && char <= 0x10FFFF) {
            bytes.push(((char >> 18) & 0x07) | 0xF0);
            bytes.push(((char >> 12) & 0x3F) | 0x80);
            bytes.push(((char >> 6) & 0x3F) | 0x80);
            bytes.push((char & 0x3F) | 0x80);
        } else if (char >= 0x000800 && char <= 0x00FFFF) {
            bytes.push(((char >> 12) & 0x0F) | 0xE0);
            bytes.push(((char >> 6) & 0x3F) | 0x80);
            bytes.push((char & 0x3F) | 0x80);
        } else if (char >= 0x000080 && char <= 0x0007FF) {
            bytes.push(((char >> 6) & 0x1F) | 0xC0);
            bytes.push((char & 0x3F) | 0x80);
        } else {
            bytes.push(char & 0xFF);
        }
    }
    return bytes;
}

/**
 * Generate a license based on the given parameters
 * @param {Number} type License type
 * @param {string} userName User name
 * @param {Number} count Number of users supported by the license
 * @param {Number} majorVersion Major version number (e.g., 21 for 21.0)
 * @param {Number} minorVersion Minor version number (e.g., 0 for 21.0)
 */
function generateLicense(type, userName, count, majorVersion, minorVersion) {
    /* LicenseString = '%d#%s|%d%d#%d#%d3%d6%d#%d#%d#%d#' % (Type,
    UserName, MajorVersion, MinorVersion,
    Count,
    MajorVersion, MinorVersion, MinorVersion,
    0, # Unknown
    0, # No Games flag. 0 means "NoGames = false". But it does not work.
    0) # No Plugins flag. 0 means "NoPlugins = false". But it does not work. */
    let licenseSourceStr = `${type}#${userName}|${majorVersion}${minorVersion}#${count}#${majorVersion}3${minorVersion}6${minorVersion}#0#0#0#`;
    return VariantBase64Encode(EncryptBytes(0x787, licenseSourceStr.toBytes())).bytesToStr();
}

export { LicenseType, generateLicense }