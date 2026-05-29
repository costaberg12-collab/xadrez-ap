content = open('src/screens/AnalysisScreen.js').read()
# Fix the eyebrow line - the issue is an extra backtick at the end
old = 'eyebrow={`Análise ${analysisMode === \\'beginner\\' ? \\'para iniciantes\\' : \\'técnica\\'}`}`}'
new = 'eyebrow={`Análise ${analysisMode === \\'beginner\\' ? \\'para iniciantes\\' : \\'técnica\\'}`}'
if old in content:
    content = content.replace(old, new)
    open('src/screens/AnalysisScreen.js', 'w').write(content)
    print('Fixed!')
else:
    # Show line 239
    lines = content.split('\n')
    print(repr(lines[238]))