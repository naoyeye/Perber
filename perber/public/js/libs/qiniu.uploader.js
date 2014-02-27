/* utf.js - UTF-8 <=> UTF-16 convertion
 *
 * Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
 * Version: 1.0
 * LastModified: Dec 25 1999
 * This library is free. You can redistribute it and/or modify it.
 */
/*
 * Interfaces:
 * utf8 = utf16to8(utf16);
 * utf16 = utf8to16(utf8);
 */

function utf16to8(str) {
    var out, i, len, c;
    out = "";
    len = str.length;
    for (i = 0; i < len; i++) {
        c = str.charCodeAt(i);
        if ((c >= 0x0001) && (c <= 0x007F)) {
            out += str.charAt(i);
        } else if (c > 0x07FF) {
            out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
            out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
            out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
        } else {
            out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
            out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
        }
    }
    return out;
}

function utf8to16(str) {
    var out, i, len, c;
    var char2, char3;
    out = "";
    len = str.length;
    i = 0;
    while (i < len) {
        c = str.charCodeAt(i++);
        switch (c >> 4) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                // 0xxxxxxx
                out += str.charAt(i - 1);
                break;
            case 12:
            case 13:
                // 110x xxxx 10xx xxxx
                char2 = str.charCodeAt(i++);
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                // 1110 xxxx 10xx xxxx 10xx xxxx
                char2 = str.charCodeAt(i++);
                char3 = str.charCodeAt(i++);
                out += String.fromCharCode(((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
                break;
        }
    }
    return out;
}

/*
 * Interfaces:
 * b64 = base64encode(data);
 * data = base64decode(b64);
 */
var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
var base64DecodeChars = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);

function base64encode(str) {
    var out, i, len;
    var c1, c2, c3;
    len = str.length;
    i = 0;
    out = "";
    while (i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if (i == len) {
            out += base64EncodeChars.charAt(c1 >> 2);
            out += base64EncodeChars.charAt((c1 & 0x3) << 4);
            out += "==";
            break;
        }
        c2 = str.charCodeAt(i++);
        if (i == len) {
            out += base64EncodeChars.charAt(c1 >> 2);
            out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            out += base64EncodeChars.charAt((c2 & 0xF) << 2);
            out += "=";
            break;
        }
        c3 = str.charCodeAt(i++);
        out += base64EncodeChars.charAt(c1 >> 2);
        out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
        out += base64EncodeChars.charAt(c3 & 0x3F);
    }
    return out;
}

function base64decode(str) {
    var c1, c2, c3, c4;
    var i, len, out;
    len = str.length;
    i = 0;
    out = "";
    while (i < len) {
        /* c1 */
        do {
            c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
        } while (i < len && c1 == -1);
        if (c1 == -1)
            break;
        /* c2 */
        do {
            c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff];
        } while (i < len && c2 == -1);
        if (c2 == -1)
            break;
        out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));
        /* c3 */
        do {
            c3 = str.charCodeAt(i++) & 0xff;
            if (c3 == 61)
                return out;
            c3 = base64DecodeChars[c3];
        } while (i < len && c3 == -1);
        if (c3 == -1)
            break;
        out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));
        /* c4 */
        do {
            c4 = str.charCodeAt(i++) & 0xff;
            if (c4 == 61)
                return out;
            c4 = base64DecodeChars[c4];
        } while (i < len && c4 == -1);
        if (c4 == -1)
            break;
        out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
    }
    return out;
}


/*  
===============================================================================
Crc32 is a JavaScript function for computing the CRC32 of a string
...............................................................................

Version: 1.2 - 2006/11 - http://noteslog.com/category/javascript/

-------------------------------------------------------------------------------
Copyright (c) 2006 Andrea Ercolino      
http://www.opensource.org/licenses/mit-license.php
===============================================================================
*/
(function() {
    var strTable = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D".split(' ');

    var table = new Array();
    for (var i = 0; i < strTable.length; ++i) {
        table[i] = parseInt("0x" + strTable[i]);
    }

    /* Number */
    crc32 = function( /* String */ str, /* Number */ crc) {
        if (crc == window.undefined) crc = 0;
        var n = 0; //a number between 0 and 255
        var x = 0; //an hex number
        crc = crc ^ (-1);
        for (var i = 0, iTop = str.length; i < iTop; i++) {
            n = (crc ^ str.charCodeAt(i)) & 0xFF;
            crc = (crc >>> 8) ^ table[n];
        }
        var number = crc ^ (-1);
        if (number < 0) {
            number = 0xFFFFFFFF + number + 1;
        }
        return number;

    };
})();

var Qiniu_Cookie = {
    set: function(name, value) {
        value = JSON.stringify(value);
        var exp = new Date();
        exp.setTime(exp.getTime() + 30 * 24 * 3600);
        document.cookie = name + "=" + escape(value) + ";expires=" + exp.toGMTString();
    },
    get: function(name) {
        var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
        if (arr != null) return JSON.parse(unescape(arr[2]));
        return null;
    },
    del: function(name) {
        var exp = new Date();
        exp.setTime(exp.getTime() - 1);
        var cval = this.get(name);
        if (cval != null) document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
    }
};

JSON.stringifyArray = function(arr) {
    var rest = "";
    for (var i = 0; i < arr.length - 1; i++) {
        rest += JSON.stringify(arr[i]);
        rest += "+";
    }
    rest += JSON.stringify(arr[arr.length - 1]);
    return rest;
};

JSON.parseArray = function(str) {
    var rest = [];
    strs = str.split("+");
    for (var i = 0; i < strs.length; i++) {
        rest.push(JSON.parse(strs[i]));
    }
    return rest;
};












if (typeof FileReader == "undefined") {

    alert("您的浏览器不支持Qiniu大文件上传！");

}

(function Qiniu() {
    var Qiniu_status = new Object();
    var Qiniu_taking = 0;
    var Qiniu_key = null;

    var Qiniu_xhring = null;

    var Qiniu_isUploading = false;

    var Qiniu_retryTimes = 3;

    /******************
     * Settings
     ******************/
    var Qiniu_blockBits = 22;
    var Qiniu_blockMask = (1 << Qiniu_blockBits) - 1;
    var Qiniu_BLKSize = 4 * 1024 * 1024;
    var Qiniu_chunkSize = 1024 * 1024;

    //count
    var Qiniu_chunks = 0;

    var Qiniu_blockCnt = function(fsize) {
        return (fsize + Qiniu_blockMask) >> Qiniu_blockBits;
    };

    var Qiniu_chunk = function(offset, blkSize) {
        return Qiniu_chunkSize < (blkSize - offset) ? Qiniu_chunkSize : (blkSize - offset);
    };

    var Qiniu_getBlksize = function(fsize, blkIdex) {
        var s = fsize > (blkIdex + 1) * Qiniu_BLKSize ? Qiniu_BLKSize : fsize - blkIdex * Qiniu_BLKSize;
        return s;
    };
    var Qiniu_fileSize = function(size) {
        return (size / (1024 * 1024)).toFixed(2) + "MB";
    };

    var Qiniu_Progresses = [];

    // var Qiniu_UploadUrl = "/qiniu_upload";
    var Qiniu_UploadUrl = "http://up.qiniu.com";

    var Qiniu_file = undefined;

    //请求上传凭证时附带的客户端参数，用于生成 uptoken
    //如：提交自定义的表单
    var Qiniu_putExtra = undefined;

    //App server颁发上传凭证的Url,返回客户端正确的uptoken
    var Qiniu_signUrl = '';

    var Qiniu_token = undefined;

    var Qiniu_params = {};

    var Qiniu_ReqToken = function() {
        if (!Qiniu_signUrl&&Qiniu_token) {
            Qiniu_onUpToken(Qiniu_token);
            return;
        }

        var xhr = new XMLHttpRequest();
        xhr.open('POST', Qiniu_signUrl, true);
        // xhr.responseType('json');
        formData = new FormData();
        if (Qiniu_putExtra) {
            // console.log(1)
            console.log('Qiniu_putExtra', Qiniu_putExtra)
            formData.append('putExtra', Qiniu_putExtra);
        }
        xhr.onreadystatechange = function(response) {
            console.log('后端返回response', response)
            // console.log('xhr = ', xhr)
            if (xhr.readyState == 4 && xhr.status == 200 && response != "") {
                console.log('请求后端的token')
                console.log('xhr.responseText', JSON.parse(xhr.responseText))
                var toooooo = JSON.parse(xhr.responseText).token;
                Qiniu_onUpToken(toooooo);
            }
        }

        // console.log('formData', formData)
        xhr.send(formData);
        Qiniu_xhring = xhr;
    };

    var Qiniu_CRC = function(blob, fun) {
        var _reader = new FileReader();
        _reader.onloadend = function(evt) {
            if (evt.target.readyState == FileReader.DONE) { // DONE == 2
                var crc = crc32(evt.target.result);
                fun(crc);
            }
        };
        _reader.onerror = function(evt) {
            alert("Error: " + evt.target.error.code);
        };
        _reader.readAsBinaryString(blob);
    };

    //读取文件切片
    var Qiniu_slice = function(f, start, size) {

        if (f.slice) {
            return f.slice(start, start + size);
        }
        if (f.webkitSlice) {
            return f.webkitSlice(start, start + size);
        }
        return null;
    };

    // events,very simple event dirver
    var events = new Object();
    var addEvent = function(type, fn) {
        events[type] = fn;
    };
    var fireEvent = function(type) {
        return events[type];
    };

    var Qiniu_onBlockPutFinished = function() {};
    var Qiniu_onPutBlockFinished = function(file, blkIdex, blksize, blkCnt) {};
    var Qiniu_onMkblkFinished = function(ret, file, blkIdex, offset, blkSize, blkCnt) {};
    var Qiniu_onUpToken = function(token) {};

    //============================================================

    // history
    var Qiniu_historyTag = false;
    var Qiniu_history = new Object();
    //cookie前缀
    var QINIU_HISTORY = "QINIU_HISTORY";

    //============================================================

    var Qiniu_mkblk = function(file, blkIdex, blksize, blkCnt, r, retry) {
        if (!retry) {
            console.log("mkblk failded!retry = 0");
            return;
        }
        Qiniu_status = {
            file: file,
            blkIdex: blkIdex,
            offset: 0,
            blksize: blksize,
            preRet: null,
            mkblk: false,
            blkCnt: blkCnt
        };

        var cks = Qiniu_chunk(0, blksize);
        var blob = Qiniu_slice(file, Qiniu_chunks, cks);
        var startDate;

        Qiniu_CRC(blob, function(crc) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', Qiniu_UploadUrl + "/mkblk/" + blksize, true);
            xhr.setRequestHeader("Authorization", "UpToken " + Qiniu_token);
            xhr.upload.addEventListener("progress", function(evt) {
                if (evt.lengthComputable) {
                    var nowDate = new Date().getTime();
                    //计算网速
                    var x = (evt.loaded) / 1024;
                    var y = (nowDate - startDate) / 1000;
                    var uploadSpeed = (x / y);
                    var formatSpeed;
                    if (uploadSpeed > 1024) {
                        formatSpeed = (uploadSpeed / 1024).toFixed(2) + "Mb\/s";
                    } else {
                        formatSpeed = uploadSpeed.toFixed(2) + "Kb\/s";
                    }
                    var tmp = Qiniu_chunks + evt.loaded;
                    var percentComplete = Math.round(100 * tmp / file.size);
                    if (events["progress"]) {
                        fireEvent("progress")(percentComplete, formatSpeed);
                    }
                }
            }, false);
            xhr.upload.onerror = function(evt) {
                if (--retry == 0) { //failure

                } else {
                    console.log("mkblk failded,retyr = ", retry);
                    Qiniu_mkblk(file, blkIdex, blksize, blkCnt, r, retry);
                }
            };
            xhr.onreadystatechange = function(response) {
                if (xhr.readyState == 4 && xhr.status == 200 && response != "") {
                    var nowDate = new Date().getTime();
                    Qiniu_taking += (nowDate - startDate);
                    var blkRet = JSON.parse(xhr.responseText);
                    if (blkRet) {
                        if (blkRet["crc32"] != crc) {
                            if (--retry == 0) {
                                if (events["putFailure"]) {
                                    Qiniu_isUploading = false;
                                    fireEvent("putFailure")(xhr.responseText);
                                }
                            } else {
                                console.log("mkblk failded,retyr = ", retry);
                                Qiniu_mkblk(file, blkIdex, blksize, blkCnt, r, retry);
                            }
                        } else {
                            Qiniu_chunks += cks;
                            Qiniu_Progresses[blkIdex] = blkRet;
                            Qiniu_status.mkblk = true;
                            Qiniu_status.preRet = blkRet;
                            Qiniu_onMkblkFinished(blkRet, file, blkIdex, blkRet["offset"], blksize, blkCnt);
                        }
                    }
                }
            };
            startDate = new Date().getTime();
            xhr.send(blob);
            Qiniu_xhring = xhr;
        });
    };

    var Qiniu_putblk = function(file, blkIdex, offset, blksize, preRet, blkCnt, r, retry) {
        if (preRet === null) {
            return;
        }
        Qiniu_status = {
            file: file,
            blkIdex: blkIdex,
            offset: offset,
            blksize: blksize,
            preRet: preRet,
            mkblk: true,
            blkCnt: blkCnt
        };
        if (file.size == Qiniu_chunks) {
            Qiniu_onBlockPutFinished(file, blkIdex, blksize, blkCnt);
            return;
        }
        var cks = Qiniu_chunk(offset, blksize);
        var blob = Qiniu_slice(file, Qiniu_chunks, cks);
        var startDate;
        Qiniu_CRC(blob, function(crc) {
            var xhr = new XMLHttpRequest();
            xhr.open('POST', preRet["host"] + "/bput/" + preRet["ctx"] + "/" + offset, true);
            xhr.setRequestHeader("Authorization", "UpToken " + Qiniu_token);
            xhr.upload.addEventListener("progress", function(evt) {
                if (evt.lengthComputable) {
                    var nowDate = new Date().getTime();
                    var x = (evt.loaded) / 1024;
                    var y = (nowDate - startDate) / 1000;
                    var uploadSpeed = (x / y);
                    var formatSpeed;
                    if (uploadSpeed > 1024) {
                        formatSpeed = (uploadSpeed / 1024).toFixed(2) + "Mb\/s";
                    } else {
                        formatSpeed = uploadSpeed.toFixed(2) + "Kb\/s";
                    }
                    var tmp = Qiniu_chunks + evt.loaded;
                    var percentComplete = Math.round(100 * tmp / file.size);
                    if (!r) {
                        if (events["progress"]) {
                            fireEvent("progress")(percentComplete, formatSpeed);
                        }
                    }
                }
            }, false);
            xhr.upload.onerror = function(evt) {
                if (--retry == 0) { //failure
                    if (events["putFailure"]) {
                        Qiniu_isUploading = false;
                        fireEvent("putFailure")(xhr.responseText);
                    }
                } else {
                    console.log("onerror, mkblk failded,retyr = ", retry);
                    Qiniu_putblk(file, blkIdex, offset, blksize, preRet, blkCnt, r, retry);
                }
            };
            xhr.onreadystatechange = function(response) {
                if (xhr.readyState == 4 && xhr.status == 200 && response != "") {
                    var blkRet = JSON.parse(xhr.responseText);
                    if (blkRet != null) {
                        //console.log("crc32=" , blkRet["crc32"])
                        if (blkRet["crc32"] != crc) {
                            console.log("checksum failed!")
                            if (--retry == 0) { //failure
                                if (events["putFailure"]) {
                                    Qiniu_isUploading = false;
                                    fireEvent("putFailure")(xhr.responseText);
                                }
                            } else {
                                Qiniu_putblk(file, blkIdex, offset, blksize, preRet, blkCnt, r, retry);
                            }
                        } else {
                            var nowDate = new Date().getTime();
                            Qiniu_taking += (nowDate - startDate);
                            Qiniu_chunks += cks;
                            Qiniu_Progresses[blkIdex] = blkRet;
                            Qiniu_status.preRet = blkRet;
                            if (blkRet["offset"] < blksize) {
                                Qiniu_putblk(file, blkIdex, blkRet["offset"], blksize, blkRet, blkCnt, false, Qiniu_retryTimes);
                            } else {
                                Qiniu_onBlockPutFinished(file, blkIdex, blksize, blkCnt);
                            }
                        }
                    }
                }
            };
            startDate = new Date().getTime();
            xhr.send(blob);
            Qiniu_xhring = xhr;
        });
    };

    var Qiniu_mkfile = function(file, key, fsize) {

        var body = "";
        var len = Qiniu_Progresses.length;
        for (var i = 0; i < len - 1; i++) {
            body += Qiniu_Progresses[i]["ctx"];
            body += ",";
        }
        body += Qiniu_Progresses[len - 1]["ctx"];
        var xhr = new XMLHttpRequest();
        var url = Qiniu_UploadUrl + "/mkfile/" + fsize;
        if (key !== null && key !== undefined) {
            url = url + "/key/" + base64encode(utf16to8(key));
        }
        for (var k in Qiniu_params) {
            url = url + "/" + k + "/" + base64encode(utf16to8(Qiniu_params[k]));
        }
        if (file.type) {
            url = url + "/mimeType/" + base64encode(utf16to8(file.type));
        }
        xhr.open('POST', url, true);
        xhr.setRequestHeader("Authorization", "UpToken " + Qiniu_token);
        xhr.onreadystatechange = function(response) {
            if (xhr.readyState == 4 && xhr.status == 200 && response != "") {
                var blkRet = JSON.parse(xhr.responseText);
                if (blkRet) {
                    if (Qiniu_historyTag) {
                        Qiniu_Cookie.del(QINIU_HISTORY + file.name);
                        Qiniu_history = new Object();
                    }
                    if (events["putFinished"]) {
                        Qiniu_isUploading = false;
                        fireEvent("putFinished")(fsize, blkRet, Qiniu_taking);
                    }
                }
            } else if (xhr.status != 200 && xhr.responseText) {
                if (events["putFailure"]) {
                    Qiniu_isUploading = false;
                    fireEvent("putFailure")(xhr.responseText);
                }
            }
        };
        xhr.send(body);
    };


    // 这里才是真正的上传 T_T 写的真啰嗦啊
    var Qiniu_Upload = function(file, key) {

        console.log('这里才是真正的上传 T_T 写的真啰嗦啊')


        Qiniu_key = key;
        Qiniu_file = file;



        if (!Qiniu_file) {
            if (events["putFailure"]) {
                fireEvent("putFailure")("上传文件未指定");
            }
            return;
        }

        var f = Qiniu_file;


        //============
        if (Qiniu_historyTag) {
            console.log("get cookie:", QINIU_HISTORY + f.name);
            Qiniu_history = Qiniu_Cookie.get(QINIU_HISTORY + f.name);
            if (Qiniu_history && f.name == Qiniu_history.name) {
                if (events["historyFound"]) {
                    fireEvent("historyFound")(Qiniu_history.name);
                }
                return;
            } else {
                Qiniu_historyTagy = new Object();
            }
        }
        //============

        if (!Qiniu_signUrl && !Qiniu_token) {
            if (events["putFailure"]) {
                fireEvent("putFailure")("signUrl或token未指定");
                console.log('signUrl或token未指定')
            }
            return;
        }
        if (events["beforeUp"]) {
            fireEvent("beforeUp")();
        }

        console.log('准备： //请求uptoken完成回调')

        //请求uptoken完成回调
        Qiniu_onUpToken = function(token) {

            console.log('Qiniu_onUpToken token = ', token)

            if (Qiniu_historyTag) {
                Qiniu_history.key = key;
                Qiniu_history.token = token;
            }

            Qiniu_token = token;

            Qiniu_Progresses.length = 0;
            Qiniu_chunks = 0;
            Qiniu_taking = 0;
            Qiniu_status = null;
            var size = f.size;
            Qiniu_isUploading = true;
            if (size < Qiniu_BLKSize) {
                console.log('切换回去了？')

                // 前方高能！！@
                Qiniu_upload(f, key);

            } else {
                Qiniu_ResumbleUpload(f, key);
            }
        };
        //请求uptoken
        Qiniu_ReqToken();
    };

    //r,暂停继续开关
    var Qiniu_resumbalePutBlock = function(file, blkIdex, blksize, blkCnt, key, r) {
        if (blkIdex && Qiniu_historyTag) {
            Qiniu_history.progress = JSON.stringifyArray(Qiniu_Progresses);
            Qiniu_history.name = file.name;
            Qiniu_history.blkIdex = blkIdex;
            Qiniu_history.complete_chunks = Qiniu_chunks;
            Qiniu_Cookie.set(QINIU_HISTORY + file.name, Qiniu_history);
            console.log("set cookie:", QINIU_HISTORY + file.name);
        }
        //...n-1,n,end ,up next block
        Qiniu_onBlockPutFinished = function(file, blkIdex, blksize, blkCnt) {
            if (events["onBlockFinished"]) {
                fireEvent("onBlockFinished")(file,blkIdex,Qiniu_Progresses[blkIdex]);
            }
            if (file.size == Qiniu_chunks) {
                Qiniu_mkfile(file, key, file.size);
                return;
            }
            blkIdex++;
            Qiniu_resumbalePutBlock(file, blkIdex, Qiniu_getBlksize(file.size, blkIdex), blkCnt, key);
        };
        Qiniu_onMkblkFinished = function(ret, file, blkIdex, offset, blksize, blkCnt) {
            //2,3,4,5,...,
            Qiniu_putblk(file, blkIdex, offset, blksize, ret, blkCnt, Qiniu_retryTimes);
        };
        //1
        if (r && Qiniu_status.mkblk) {
            Qiniu_putblk(file, blkIdex, Qiniu_status.offset, blksize, Qiniu_status.preRet, blkCnt, r, Qiniu_retryTimes);
        } else {
            Qiniu_mkblk(file, blkIdex, blksize, blkCnt, r, Qiniu_retryTimes);
        }
    };

    //恢复上传,需要cookie支持
    var Qiniu_ResumeHistory = function() {

        if (!Qiniu_file)
            return;

        var f = Qiniu_file;
        if (Qiniu_historyTag) {
            Qiniu_history = Qiniu_Cookie.get(QINIU_HISTORY + f.name);
            if (!Qiniu_history) {
                return;
            }
            //从cookie中恢复上传进度
            Qiniu_Progresses = JSON.parseArray(Qiniu_history.progress);
            Qiniu_token = Qiniu_history.token;
            Qiniu_chunks = Qiniu_history.complete_chunks;
            //数据不一致时
            if (Qiniu_Progresses.length != Qiniu_history.blkIdex)
                return;
            if (Qiniu_history.blkIdex && Qiniu_history.key) {
                Qiniu_status = {
                    mkblk: Qiniu_history.mkblk,
                    offset: 0,
                    preRet: Qiniu_Progresses[Qiniu_Progresses.length - 1],
                };
                var size = f.size;
                var blkCnt = Qiniu_blockCnt(size);
                //从blkIdex块重传
                Qiniu_resumbalePutBlock(f, Qiniu_history.blkIdex, Qiniu_getBlksize(f.size, Qiniu_history.blkIdex), blkCnt, Qiniu_history.key, true);
            }

        }
    };

    var Qiniu_Resume = function() {
        var f = Qiniu_file;
        var blkCnt = Qiniu_blockCnt(f.size);
        Qiniu_resumbalePutBlock(f, Qiniu_status.blkIdex, Qiniu_getBlksize(f.size, Qiniu_status.blkIdex), blkCnt, Qiniu_key, true);
    };

    var Qiniu_Pause = function(argument) {
        if (Qiniu_xhring) {
            Qiniu_xhring.abort();
        }
    };

    //普通上传
    var Qiniu_upload = function(f, key) {

        console.log('普通上传 1111 key = ', key)

        var xhr = new XMLHttpRequest();



        xhr.open('POST', Qiniu_UploadUrl, true);

        // xhr.open('POST', '/qiniu_upload', true);


        var formData, startDate;
        formData = new FormData();
        if (key !== null && key !== undefined) formData.append('key', key);
        for (var k in Qiniu_params) {
            formData.append(k, Qiniu_params[k]);
        }

        console.log('普通上传 Qiniu_token', Qiniu_token)
        console.log('普通上传 file', f)

        formData.append('token', Qiniu_token);
        formData.append('file', f);
        formData.append('callbackBody', "name=$(fname)&hash=$(etag)&location=$(x:location)&=$(x:prise)")
        // formData.append('testFile', file);

        // console.log('普通上传 formData', formData)

        var taking;

        xhr.upload.addEventListener("progress", function(evt) {
            if (evt.lengthComputable) {

                var nowDate = new Date().getTime();
                taking = nowDate - startDate;
                var x = (evt.loaded) / 1024;
                var y = taking / 1000;
                var uploadSpeed = (x / y);
                var formatSpeed;
                if (uploadSpeed > 1024) {
                    formatSpeed = (uploadSpeed / 1024).toFixed(2) + "Mb\/s";
                } else {
                    formatSpeed = uploadSpeed.toFixed(2) + "Kb\/s";
                }
                var percentComplete = Math.round(evt.loaded * 100 / evt.total);
                console.log('percentComplete', percentComplete)
                if (events["progress"]) {
                    fireEvent("progress")(percentComplete, formatSpeed);
                }
            }

        }, false);

        // putFinished or putFailure
        xhr.onreadystatechange = function(response) {
            if (xhr.readyState == 4 && xhr.status == 200 && xhr.responseText != "") {
                Qiniu_taking += taking;
                //checksum,crc32,ctx,host,offset
                var blkRet = JSON.parse(xhr.responseText);
                if (blkRet && events["putFinished"]) {
                    Qiniu_isUploading = false;
                    fireEvent("putFinished")(f.size, blkRet, Qiniu_taking);
                }
            } else if (xhr.status != 200 && xhr.responseText && events["putFailure"]) {
                Qiniu_isUploading = false;
                fireEvent("putFailure")(xhr.responseText);
            }
        };

        startDate = new Date().getTime();
        xhr.send(formData);
    };

    // Note: If you want to use the auto-resume feature, you must use any browser other than IE9 and older
    // besides, the file's size should bigger than 4MB
    var Qiniu_ResumbleUpload = function(f, key) {
        Qiniu_Progresses.length = 0;
        size = f.size;
        blkCnt = Qiniu_blockCnt(size);
        Qiniu_chunks = 0;
        Qiniu_resumbalePutBlock(f, 0, Qiniu_getBlksize(f.size, 0), blkCnt, key);
    };

    window.Q = window.Qiniu = {
        Upload: Qiniu_Upload,
        Stop: function() {
            if (Qiniu_xhring) {
                Qiniu_xhring.abort();
            }
            Qiniu_Progresses.length = 0;
            Qiniu_chunks = 0;
            Qiniu_taking = 0;
            Qiniu_status = null;
        },
        Pause: Qiniu_Pause,
        AddParams: function(field, value) {
            Qiniu_params[field] = value;
        },
        SetToken: function(token) {
            Qiniu_token = token;
        },
        SignUrl: function(url) {
            Qiniu_signUrl = url;
        },
        Resume: Qiniu_Resume,
        ResumeHistory: Qiniu_ResumeHistory,
        Bucket: function(name) {
            Qiniu_bucket = name;
        },
        getFile: function() {
            return Qiniu_file;
        },
        addEvent: addEvent,
        SetPutExtra: function(extra) {
            Qiniu_putExtra = extra;
        },
        Histroy: function(his) {

            Qiniu_historyTag = his;
        },
        ClearHistory: function(name) {
            Qiniu_history = null;
            Qiniu_Cookie.del(QINIU_HISTORY + name);
        },
        fileSize: Qiniu_fileSize,
        IsUploading: function() {
            return Qiniu_isUploading;
        }
    };

})();
