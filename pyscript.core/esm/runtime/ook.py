# From https://github.com/kade-robertson/pythook

def tobf(s):
    s = s.replace('\n'," ").replace('\r\n'," ")
    i = iter(s.split(' '))
    s = ''.join(map(' '.join,(zip(i,i))))
    s = s.replace("Ook. Ook?", ">")
    s = s.replace("Ook? Ook.", "<")
    s = s.replace("Ook. Ook.", "+")
    s = s.replace("Ook! Ook!", "-")
    s = s.replace("Ook! Ook.", ".")
    s = s.replace("Ook. Ook!", ",")
    s = s.replace("Ook! Ook?", "[")
    s = s.replace("Ook? Ook!", "]")
    return s

def runOok(program):
    program = tobf(program)
    try:
        d={'>':'p+=1\n','<':'p-=1\n','+':'n[p]+=1\n','-':'n[p]-=1\n','.':'print(chr(n[p]),end="")\n',',':'n[p]=raw_input()\n','[':'while n[p]:\n',']':''}
        s='n=[0]*32768\np=0\n'
        i=0
        index_track = 0
        for index, c in enumerate(program):
            index_track = index
            s += ' '*i + d[c]
            if c=='[': i+=1
            if c==']': i-=1; s += '\r'
        exec(s)
    except Exception as err:
        print(f"Unable to process program! at {index_track=}")
        print(f"{s=}")
        print(err)


