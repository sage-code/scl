function apply_style(str) {
 
    //special case must be fist to avoid overlapp with css class
    str = str.replace(/^class\b/,keyword("class"))    

    // global declarations, at beginning of line
    str = str.replace(/^driver\b/,keyword("driver"))
    str = str.replace(/^module\b/,keyword("module"))
    str = str.replace(/^aspect\b/,keyword("aspect"))
    str = str.replace(/^import\b/,keyword("import"))
    str = str.replace(/^alias\b/,keyword("alias")) 
    str = str.replace(/^global\b/,keyword("global"))   
    str = str.replace(/^constant\b/,keyword("constant")) 
    str = str.replace(/^process\b/,keyword("process")) 
    str = str.replace(/^initialize\b/,keyword("initialize")) 
    str = str.replace(/^recover\b/,keyword("recover"))
    str = str.replace(/^finalize\b/,keyword("finalize")) 
    str = str.replace(/^trait\b/,keyword("trait")) 

    // optional keywords
    str = str.replace(/^constructor\b/,keyword("constructor"))
    str = str.replace(/^function\b/,keyword("function"))
    str = str.replace(/^routine\b/,keyword("routine")) 
    str = str.replace(/^release\b/,keyword("release"))

    // mandatory 2 space intentation
    str = str.replace(/\bobject\b/,keyword("object")) 
    str = str.replace(/\bmethod\b/,keyword("method"))  
    str = str.replace(/\bshell\b/,keyword("shell"))
    str = str.replace(/\breturn\b/,keyword("return"))   

    // keywords in statement     
    str = str.replace(/\bsession\b/,keyword("session"))
    str = str.replace(/\bupdate\b/,keyword("update"))
    str = str.replace(/\insert\b/,keyword("insert"))
    str = str.replace(/\bcommit\b/,keyword("commit")) 
    str = str.replace(/\bfrom\b/,keyword("from"))
    str = str.replace(/\buse\b/,keyword("use"))

    // keyword operators  
    str = str.replace(/\bin\b/g,operator("in"))     
    str = str.replace(/\bis\b/g,operator("is"))
    str = str.replace(/\bas\b/g,operator("as"))    
    str = str.replace(/\bor\b/g,operator("or"))
    str = str.replace(/\beq\b/g,operator("eq"))    
    str = str.replace(/\band\b/g,operator("and"))
    str = str.replace(/\bnot\b/g,operator("not"))


    // mandatory two space indentation
    str = str.replace(/\bnew\b/g,keyword("new"))
    str = str.replace(/\blet\b/g,keyword("let"))
    str = str.replace(/\bset\b/g,keyword("set"))
    
    // database singular statements
    str = str.replace(/\bscrub\b/g,keyword("scrub"))
    str = str.replace(/\bdelete\b/g,keyword("delete"))

    //  creat control flow 
    str = str.replace(/\bcycle\b/,control("cycle"))
    str = str.replace(/\brepeat\b/,control("repeat"))    
    str = str.replace(/\bwhen\b/,control("when"))
    str = str.replace(/\bjob\b/,control("job"))
    str = str.replace(/\btry\b/,control("try"))
    str = str.replace(/\bcatch\b/,control("catch")) 
    str = str.replace(/\bresolve\b/,control("resolve"))   
    str = str.replace(/\bcase\b/,control("case"))  
    str = str.replace(/\bon\b/,control("on"))    
    str = str.replace(/\bloop\b/,control("loop"))
    str = str.replace(/\bwhile\b/,control("while"))
    str = str.replace(/\bfor\b/,control("for"))
    str = str.replace(/\btask\b/,control("task"))
    str = str.replace(/\bmiss\b/,control("miss"))
    str = str.replace(/\bmatch\b/,control("match"))
    str = str.replace(/\bif\b/g,control("if"))
    str = str.replace(/\bthen\b/,control("then"))    
    str = str.replace(/\belse\b/g,control("else"))
    str = str.replace(/\bdone\b/g,control("done"))
    str = str.replace(/\bbegin\b/,control("begin"))  
    str = str.replace(/\bsplit\b/,control("split"))  
    str = str.replace(/\bjoin\b/,control("join"))      

    // colorize data types keywords
    str = str.replace(/\bByte\b/g,types("Byte"))
    str = str.replace(/\bShort\b/g,types("Short"))
    str = str.replace(/\bInteger\b/g,types("Integer"))
    str = str.replace(/\bNatural\b/g,types("Natural"))
    str = str.replace(/\bReal\b/g,types("Real"))
    str = str.replace(/\bFloat\b/g,types("Float"))
    str = str.replace(/\bRational\b/g,types("Rational"))
    str = str.replace(/\bString\b/g,types("String"))
    str = str.replace(/\bLogic\b/g,types("Logic"))
    str = str.replace(/\bTable\b/g,types("Table"))
    str = str.replace(/\bSymbol\b/g,types("Symbol"))
    str = str.replace(/\bRecord\b/g,types("Record"))
    str = str.replace(/\bOrdinal\b/g,types("Ordinal"))
    str = str.replace(/\bVariant\b/g,types("Variant"))
    str = str.replace(/\bDate\b/g,types("Date"))
    str = str.replace(/\bTime\b/g,types("Time"))
    str = str.replace(/\bArray\b/g,types("Array")) 
    str = str.replace(/\bList\b/g,types("List"))
    str = str.replace(/\bSymbol\b/g,types("Symbol"))
    str = str.replace(/\bObject\b/g,types("Object"))
    str = str.replace(/\bClass\b/g,types("Class"))
    str = str.replace(/\bLambda\b/g,types("Lambda"))
    str = str.replace(/\bFunction\b/g,types("Function"))   
    str = str.replace(/\bDataSet\b/g,types("DataSet"))
    str = str.replace(/\bHashMap\b/g,types("HashMap"))
    str = str.replace(/\bFolder\b/g,types("Folder"))
    str = str.replace(/\bFile\b/g,types("File"))

    // reserved types
    str = str.replace(/\bNull\b/g,types("Null"))
    str = str.replace(/\bTrue\b/g,types("True"))
    str = str.replace(/\bFalse\b/g,types("False"))
    str = str.replace(/\bType\b/g,types("Type")) 

    // reserved constants
    str = str.replace(/\bany\b/g,constant("any"))
    str = str.replace(/\bother\b/g,constant("other"))
    str = str.replace(/\ball\b/g,constant("all"))
    str = str.replace(/\bone\b/g,constant("one"))
    str = str.replace(/\blabel\b/g,constant("label"))
    str = str.replace(/\bself\b/g,constant("self"))
    str = str.replace(/\bargs\b/g,constant("args"))
    str = str.replace(/\bsuper\b/g,constant("super"))

    //  interruption statements
    str = str.replace(/\bexpect\b/,keyword("expect"))
    str = str.replace(/\bbreak\b/,keyword("break"))
    str = str.replace(/\bhalt\b/,keyword("halt"))
    str = str.replace(/\bnext\b/,keyword("next"))
    str = str.replace(/\balter\b/,keyword("alter"))
    str = str.replace(/\bmake\b/,keyword("make"))
    str = str.replace(/\bstore\b/,keyword("store"))
    str = str.replace(/\bstart\b/,keyword("start"))
    str = str.replace(/\byield\b/,keyword("yield"))
    str = str.replace(/\brun\b/,keyword("run"))
    str = str.replace(/\bcall\b/,keyword("call"))
    str = str.replace(/\bwait\b/,keyword("wait"))
    str = str.replace(/\bexit\b/,keyword("exit"))
    str = str.replace(/\bstop\b/,keyword("stop"))   
    str = str.replace(/\bprint\b/,keyword("print"))
    str = str.replace(/\bwrite\b/,keyword("write"))
    str = str.replace(/\bread\b/,keyword("read"))
    str = str.replace(/\bover\b/,keyword("over"))
    str = str.replace(/\bpanic\b/,keyword("panic"))
    str = str.replace(/\bpass\b/,keyword("pass"))
    str = str.replace(/\bskip\b/,keyword("skip"))
    str = str.replace(/\bfail\b/,keyword("fail"))
    str = str.replace(/\braise\b/,keyword("raise"))
    str = str.replace(/\bretry\b/,keyword("retry"))
    str = str.replace(/\bsuspend\b/,keyword("suspend"))
    str = str.replace(/\bresume\b/,keyword("resume"))
    str = str.replace(/\bsynchronise\b/,keyword("synchronise"))
    str = str.replace(/\brollback\b/,keyword("rollback"))

    // two symbol operators
    str = str.replace(/::/g,operator("::"))
    str = str.replace(/:=/g,operator(":="))
    str = str.replace(/==/g,operator("==")) 
    str = str.replace(/!=/g,operator("!="))    
    str = str.replace(/=>/g,operator("=>"))

    str = str.replace(/:>/g,operator(":>"))
    str = str.replace(/<:/g,operator("<:"))
    str = str.replace(/<-/g,operator("<-"))
    str = str.replace(/->/g,operator("->"))

    // replace range operator
    str = str.replace(/\.\.\./g,operator("..."))
    str = str.replace(/\.\./g,operator(".."))

    // two symbol modifiers
    str = str.replace(/\*=/g,operator("*="))
    str = str.replace(/\/=/g,operator("/="))
    str = str.replace(/\-=/g,operator("-="))
    str = str.replace(/\+=/g,operator("+="))    
    str = str.replace(/\^=/g,operator("^="))  
    str = str.replace(/\%=/g,operator("%=")) 
    str = str.replace(/\&=/g,operator("&="))

    //problematic operators
    str = str.replace(/ <= /g,operator(" <= "))
    str = str.replace(/ >= /g,operator(" >= "))    
    str = str.replace(/ << /g,operator(" << ")) 
    str = str.replace(/ >> /g,operator(" >> ")) 
    str = str.replace(/ && /g,operator(" && ")) 
    str = str.replace(/ \|\| /g,operator(" || "))   

    // supertype & coercion111
    str = str.replace(/<\+/g,operator("<+"))
    str = str.replace(/\+>/g,operator("+>"))
    

    // fix encoded symbols
    str = str.replace(/\b=\&gt;\b/g,operator("=&gt;"))
    str = str.replace(/\b\.&\.\b/g,operator(".&."))
    str = str.replace(/\b\.\|\.\b/g,operator(".|."))
    str = str.replace(/\b\.\+\.\b/g,operator(".+."))
    str = str.replace(/\b-\&gt;\b/g,operator("-&gt;"))
    str = str.replace(/\b\&lt;-\b/g,operator("&lt;-"))


    //prefix
    str = str.replace(/\*(?=\w)/g,operator("*"))
    str = str.replace(/\@(?=\S)/g,operator("@"))  

    //sigils
    str = str.replace(/\$(?=\w)/g,operator("$"))    
    str = str.replace(/\_(?=\W)/g,operator("_"))

    //fix single simbol
    str = str.replace(/\?(?=\s|\b|\w)/,operator("?"))
    str = str.replace(/\:(?=\s|\b|$)/,operator(":"))
    str = str.replace(/\:(?=\s|\w|\W|[\{\[\(])/g,operator(":"))
    str = str.replace(/\;(?=\s|\b|$)/,operator(";")) 

    //fix concatenation
    str = str.replace(/\"\/\"/,operator("/"))

    //fix operators
    str = str.replace(/\s=\s/g,operator(" = "))
    str = str.replace(/\s>\s/g,operator(" > "))
    str = str.replace(/\s<\s/g,operator(" < "))
    str = str.replace(/\s\+\s/g,operator(" + "))
    str = str.replace(/\s\-\s/g,operator(" - "))
    str = str.replace(/\s\/\s/g,operator(" / "))
    str = str.replace(/\s\*\s/g,operator(" * "))
    str = str.replace(/\s\&\s/g,operator(" & "))
    str = str.replace(/\s\|\s/g,operator(" | "))

    // special indexes
    str = str.replace(/\*(?=\W)/g,operator("*"))
    str = str.replace(/\#(?=\W)/g,operator("#"))
    str = str.replace(/\?(?=\W)/g,operator("?"))

    // stile single quoted symbols 
    // squote is a callback function
    str = str.replace(/\'.\'/g, squote)

    // create the new statement
    return str
}

//style Real quoted string
function style_string(line) {
    let result = ""
    let q = 0
    let chars = line.split("")
    let stmt  = [] //statement buffer
    let strg  = [] //string buffer
    let pchar = "" //previous character
    let instr = false;
    for (char of chars) {   
        if ((char == '"') && (pchar != "\\")) {
           if (instr == true) {
              result  += strings('"'+strg.join("")+'"') 
              strg     = [] // flush string buffer
           } else {
              result  += apply_style(stmt.join(""))
              stmt     = [] // flush statement buffer
           }
           q +=1 // new quote (no escape \")
           instr = (q % 2 > 0);
        } else if (instr == true) {
           strg.push(char) 
        } else {
           stmt.push(char)
        }
        pchar = char // look back
    }
    //fix the result 
    if (stmt.length > 0) {
        result += apply_style(stmt.join("")) 
    }
    if (strg.length > 0) {
        result += strings('"'+strg.join("")+'"')
    }   
    return result
}

//stile single goted strings
function squote(match, offset, string) {
  return strings(match);
}

/* it is called in every eve page at on-load event */
function eve_render() {
    const eve_code = document.getElementsByClassName("language-eve");
    if (typeof(eve_code) != "undefined") {
        let t = ""
        let i = 0 
        let q = 0 // how meny qotes
        let pozition = 0
        let comment = ""
        let start_comments = false
        let start_string   = false   
        let my_string = ""
        for (e of eve_code ) {
            if (e.tagName =="CODE") {
                lines = e.innerText.split("\n")
                //  format each line
                for (line of lines) {
                    // check if line is empty
                    if (i == 0 && line =="") {
                        i += 1
                        continue
                    }
                    // check first character
                    if (line.trim().substr(0,1)=="#") {
                        line = title(line)
                    } else if (line.trim().substr(0,2)=="**") {
                        line = subtitle(line)
                    } else if (line.trim().substr(0,2)=="--") {
                        line = comments(line) 
                    } else if ((line.trim().substr(0,2)=="/*") || 
                               (line.trim().substr(0,2)=="+-") ||
                                start_comments)
                               {
                        start_comments = true
                    } else if (line.search(/=\s*"""/g)>0) {
                        parts=line.split('"""')
                        my_string = '"""'+parts[1]
                        line = apply_style(parts[0])
                        start_string = true
                    } else if (line.search(/"""/g)>0) {
                        parts=line.split('"""')
                        line = strings(parts[0]+'"""')+parts[1]     
                        start_string = false  
                        my_string=""                
                    } else if (start_string) {
                        line  = strings(line)              
                    } else {
                        // split away end comments 
                        parts = line.split(/\s--/)
                        line  = parts[0]
                        if (parts.length > 1) {
                            comment = " --" + parts[1]
                        } else {
                            comment = ""
                        }
                        // style first part (before comment)
                        line = style_string(line);
                        // attach back the comment
                        if (comment!="") {
                            line += comments(comment)         
                        }  
                    }
                    // skip block comments from style
                    if (start_comments) {
                        if (line.search(/\*\//gm) > 0 ||
                            line.search(/\-\+/gm) > 0 ||
                            line.trim().substr(0,2)=="*/"||
                            line.trim().substr(0,2)=="-+") 
                        {
                            start_comments = false
                        } 
                        line = comments(line)
                    } else if (start_string) {
                        if (my_string) {
                           line = line + strings(my_string)
                        } else {
                           line = strings(line) 
                        }
                        my_string =""
                    }

                    // add new line if required
                    i += 1
                    if (i < lines.length || line!="") {
                       t += line_span(line)
                    }
                } // end for (line of lines)
                e.innerHTML = t;
                t = ""; i = 0
            } // end if (e.tagName =="CODE") 
        } // end for (e of eve_code )
    } else {
      console.log("not_found")
    }
}

function line_span(str) {
    var span = document.createElement("span");
    return "<span class=\"line\">"+ str + "</span>\n"
}


function title(str) {
    return "<span class=\"title\">"+ str + "</span>"
}

function subtitle(str) {
    return "<span class=\"subtitle\">"+ str + "</span>"
}

function comments(str) {
    return "<span class=\"comment\">"+ str + "</span>"
}

function keyword(str) {
    return "<span class=\"keyword\">"+ str + "</span>"
}

function keyword(str) {
    return "<span class=\"keyword\">"+ str + "</span>"
}

function types(str) {
    return "<span class=\"type\">"+ str + "</span>"
}

function control(str) {
    return "<span class=\"control\">"+ str + "</span>"
}

function interrupt(str) {
    return "<span class=\"interrupt\">"+ str + "</span>"
}

function operator(str) {
    return "<span class=\"operator\">"+ str + "</span>"
}

function strings(str) {
    return "<span class=\"string\">"+ str + "</span>"
}


function constant(str) {
    return "<span class=\"constant\">"+ str + "</span>"
}

function builtin(str) {
    return "<span class=\"builtin\">"+ str + "</span>"
}

// Add this to the bottom of eve1.js
document.addEventListener('DOMContentLoaded', () => {
    eve_render();
});