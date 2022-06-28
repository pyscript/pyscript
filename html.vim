syntax match htmlTagName contained "py-\(script\|env\|list\|repl\|box\)"

" Copied from html.vim javascript section and changed java->py
" Not sure why python.vim needs to be loaded twice
syn include @htmlPyScript syntax/python.vim
unlet b:current_syntax
syn include @htmlPyScript syntax/python.vim
unlet b:current_syntax
syn region  pyScript start=+<py-script\_[^>]*>+ keepend end=+</py-script\_[^>]*>+me=s-1 contains=@htmlPyScript,htmlCssStyleComment,htmlScriptTag,@htmlPreproc
syn region  htmlScriptTag     contained start=+<py-script+ end=+>+ fold contains=htmlTagN,htmlString,htmlArg,htmlValue,htmlTagError,htmlEvent
