import json,re,os
D=os.path.dirname(os.path.abspath(__file__))
css=open(D+'/admin.css').read(); tpl=open(D+'/tpl.html').read().replace('__CSS__',css)
ic=open(D+'/../ic.js').read(); body=ic[ic.index('{'):ic.rindex('}')+1]
body=re.sub(r"/\*.*?\*/","",body)
data=open(D+'/data.js').read().replace('__ICONS__',body); logic=open(D+'/logic.js').read()
assert '}}' not in css
html='''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Lux Flow Integrity — admin console</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800&amp;display=swap">
<style>
body{margin:0}
</style>
</helmet>
'''+tpl+'''
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":900}}'>
'''+data+'\n'+logic+'''
</script>
</body>
</html>
'''
open(D+'/../lux/project/Admin.dc.html','w').write(html)
print(len(html))
