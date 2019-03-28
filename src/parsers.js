const PRIMITIVE = 0;
const KEYPATH = 1;
const TEXT = 0;
const BINDING = 1;

const QUOTED_STR = /^'.*'$|^".*"$/;
const WHITESPACES = ' \n\r\t'.split('');

// Parser and tokenizer for getting the type and value from a string.
export function parseType(string) {
  let type = PRIMITIVE;
  let value = string;

  if (QUOTED_STR.test(string)) {
    value = string.slice(1, -1);
  } else if (string === "true") {
    value = true;
  } else if (string === "false") {
    value = false;
  } else if (string === "null") {
    value = null;
  } else if (string === "undefined") {
    value = undefined;
  } else if (!isNaN(string)) {
    value = Number(string);
  } else {
    type = KEYPATH;
  }

  return { type: type, value: value };
}

// Template parser and tokenizer for mustache-style text content bindings.
// Parses the template and returns a set of tokens, separating static portions
// of text from binding declarations.
export function parseTemplate(template, delimiters) {
  var tokens;
  let length = template.length;
  let index = 0;
  let lastIndex = 0;
  let open = delimiters[0],
    close = delimiters[1];

  while (lastIndex < length) {
    index = template.indexOf(open, lastIndex);

    if (index < 0) {
      if (tokens) {
        tokens.push({
          type: TEXT,
          value: template.slice(lastIndex)
        });
      }

      break;
    } else {
      tokens || (tokens = []);
      if (index > 0 && lastIndex < index) {
        tokens.push({
          type: TEXT,
          value: template.slice(lastIndex, index)
        });
      }

      lastIndex = index + open.length;
      index = template.indexOf(close, lastIndex);

      if (index < 0) {
        let substring = template.slice(lastIndex - close.length);
        let lastToken = tokens[tokens.length - 1];

        if (lastToken && lastToken.type === TEXT) {
          lastToken.value += substring;
        } else {
          tokens.push({
            type: TEXT,
            value: substring
          });
        }

        break;
      }

      let value = template.slice(lastIndex, index).trim();

      tokens.push({
        type: BINDING,
        value: value
      });

      lastIndex = index + close.length;
    }
  }

  return tokens;
}

export function parseFnExpr(expr) {
  function jsNested(statement) {
    var regex = new RegExp("([a-zA-Z0-9_$]+)\\((.*)\\)", "g");
    var root = { _: [] };

    if (QUOTED_STR.test(statement)) {
      root._.push({ k: statement, t: "l" });
      return root;
    }

    var r = regex.exec(statement);
    if (!r || r.length < 3) {
      return root;
    }
    var parameters = args(r[2]);
    var node = { _: [] };
    parameters.forEach(function(p) {
      if (p.e) {
        if (p.e.indexOf("(") == -1) {
          node._.push({ k: p.e, t: "p" });
        } else {
          var wrappedNode = jsNested(p.e),
            k;
          for (k in wrappedNode) {
            node._.push(wrappedNode[k][0]);
          }
        }
      } else {
        //node[p.s] = p.s;
      }
    });

    // Assign node to the node's identifier
    root._.push({ k: r[1], t: 'f', _: node._ });
    //root._.push(r[1]:node);
    return root;
  }

  function args(statement) {
    statement += ","; // so I don't have to handle the "last, leftover parameter"
    var results = [];
    var chars = statement.split("");
    var level = 0; // levels of parenthesis, used to track how deep I am in ().
    var index = 0; // determines which parameter am I currently on.
    var temp = "", match = '', temp2 = '';
    chars.forEach(function(char) {
      switch (true) {
        case char === "'":
        case char === '"':
          if (match.length && match === char) {
            temp += match + temp2 + match;
            results[index] = { s: temp2 };
            match = temp2 = '';
            //level--;
            //temp = '';
            index++;
          } else {
            match = char;
            //level++;
          }
          //level++;
          break;
        case !match.length && WHITESPACES.indexOf(char) !== -1:
          break;
        case !match.length && char === '(':
          temp += char;
          level++;
          break;
        case !match.length && char === ')':
          temp += char;
          level--;
          break;
        case !match.length && char === ',':
          // if the comma is between a set of parenthesis, ignore.
          if (level !== 0) {
            temp += char;
          }
          // if the comma is external, split the string.
          else {
            results[index] = { e: temp };
            temp = '';
            index++;
          }
          break;
        default:
          if (match.length) {
            temp2 += char;
          } else {
            temp += char;
          }
          break;
      }
    });
    return results;
  }

  //return if we were able to parse functions otherwise it will be null
  return jsNested(expr)._[0] || null;
}
