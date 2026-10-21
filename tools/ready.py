# Позначає теми готовими, якщо є файл content/topics/<id>.js
import re,os
p='content/index.js'; s=open(p).read()
def mark(m):
    line=m.group(0); i=re.search(r'id: "(\w+)"',line).group(1)
    if os.path.exists(f'content/topics/{i}.js') and 'ready: true' not in line:
        line=line.replace(' },',', ready: true },') if line.rstrip().endswith('},') else line
    return line
s=re.sub(r'^  \{ id: "\w+".*$',mark,s,flags=re.M)
open(p,'w').write(s)
