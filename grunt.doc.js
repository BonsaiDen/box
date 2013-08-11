
// Doc Parsing and Extraction -------------------------------------------------
function filterCommentText(text) {
    return text.trim().split('\n').map(function(line) {
        line = line.trim();
        return line.substring(line.indexOf('*') + 1).trim();

    }).filter(function(line) {
        return line.length > 0;
    }).join('');
}

function filterComments(comments) {
    return comments.filter(function(comment) {
        return comment.type === 'Block';

    }).slice(-1).map(function(comment) {
        return filterCommentText(comment.value);

    })[0];
}

function trimArray(values) {
    return values.map(function(v) {
        return v.trim();
    });
}

function addDot(text) {
    return text.slice(-1) === '.' ? text : text + '.';
}

function parseDocStruct(text, name, isConstructor) {

    if (text.indexOf(':') === -1) {
        text = ':' + text;
    }

    var typeAndDesc = trimArray(text.split(':')),
        typeAndDefault = typeAndDesc[0].match(/\{([a-zA-Z_0-9\.\$]+)\}\s*(\((.*)\))?/),
        defaultValue = typeAndDefault ? typeAndDefault[3] || null : null;

    return {
        name: name || null,
        base: isConstructor ? defaultValue : null,
        type: typeAndDefault ? typeAndDefault[1] : null,
        defaultValue: isConstructor ? null : defaultValue,
        description: addDot(typeAndDesc[1] || '')
    };

}

function parseDocText(text, paramNames, isConstructor) {

    var data = {
            params: [],
            returns: null
        },
        paramIndex = 0,
        segments = text.split(';');

    segments.forEach(function(s) {

        var defAndReturn = trimArray(s.split('->')),
            def = defAndReturn[0],
            ret = defAndReturn[1];

        if (def && paramNames.length !== 0) {
            data.params.push(parseDocStruct(def, paramNames[paramIndex]));
            paramIndex++;

        } else if (!ret) {
            data.returns = parseDocStruct(def, null, false);
        }

        if (ret) {
            data.returns = parseDocStruct(ret, null, isConstructor);
        }

    });

    return data;

}

function extractDoc(comments, paramNames, isConstructor) {
    var text = filterComments(comments);
    if (text) {
        return parseDocText(text, paramNames, isConstructor);

    } else {
        return null;
    }
}


// Exports --------------------------------------------------------------------
// ----------------------------------------------------------------------------
exports.parse = function(value, isConstructor) {

    // Only parse plain comment arrays
    if (value.doc instanceof Array) {
        value.doc = extractDoc(value.doc, value.params || [], isConstructor);
    }

};

