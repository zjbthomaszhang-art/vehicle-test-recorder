with open('src/views/AdminView.jsx', 'rb') as f:
    data = f.read()

try:
    data.decode('utf-8')
    print('File is valid UTF-8')
except UnicodeDecodeError as e:
    print(f'Error at byte {e.start}: {repr(data[e.start-5:e.start+10])}')
