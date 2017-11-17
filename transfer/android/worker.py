from bluetooth import *
import threading
import requests
import json

server_sock = BluetoothSocket( RFCOMM )
server_sock.bind(("", PORT_ANY))
server_sock.listen(1)

port = server_sock.getsockname()[1]

# Unique UUID, Must Correspond w/ Tablets
uuid = "94f39d29-7d6d-437d-973b-fba39e49d4ee"

# Advertise Serial Port Profile
advertise_service( server_sock, "TGA Bluetooth Server",
                   service_id = uuid,
                   service_classes = [ uuid, SERIAL_PORT_CLASS ],
                   profiles = [ SERIAL_PORT_PROFILE ])

deviceCount = 6
deviceQueue = [[] for i in range(deviceCount)]

# Bluetooth Worker Thread
def bluetoothWorker(idx):
    # Thread Started
    print(" - Device {}: Waiting for connection on RFCOMM channel {}...".format(idx, port))

    # Attempt Connection
    client_sock, client_info = server_sock.accept()
    connectionEstablished(idx, client_sock, client_info)
    
    while True:
        try:
            # Receive Data from Tablets
            receiveDataFromTablets(idx, client_sock, client_info)
            
            # Send Data to Tablets
            sendDataToTablets(idx, client_sock, client_info)
        except IOError:
            # Connection Failed
            connectionTerminated(idx, client_sock, client_info)
            
            # Attempt Reconnection
            client_sock, client_info = server_sock.accept()
            connectionEstablished(idx, client_sock, client_info)

    client_sock.close()
    server_sock.close()

def connectionEstablished(idx, client_sock, client_info):
    requests.post('http://127.0.0.1:4909/new_connection', json={
        'thread_id': idx,
        'client_mac': client_info[0]
    })
    print(" - Device {}: Accepted connection from {}.".format(idx, client_info[0]))
    
def connectionTerminated(idx, client_sock, client_info):
    requests.post('http://127.0.0.1:4909/lost_connection', json={
        'thread_id': idx,
        'client_mac': client_info[0]
    })
    print(" - Device {}: Lost connection to {}.".format(idx, client_info[0]))
    
# Recv. New Data from BT Worker Thread
def receiveDataFromTablets(idx, client_sock, client_info):
    raw_data = client_sock.recv(1024).decode("utf-8")
    
    try:
        json_data = json.loads(raw_data)

        requests.post('http://127.0.0.1:4909/new_data', json={
            'thread_id': idx,
            'client_mac': client_info[0],
            'msg_data': json_data
        })
        print(" - Device {}: Succesfully Processed Data".format(idx))
    except json.decoder.JSONDecodeError:
        requests.post('http://127.0.0.1:4909/bad_data', json={
            'thread_id': idx,
            'client_mac': client_info[0],
            'msg_data': raw_data
        })
        print(" - Device {}: Unable to Process JSON Data".format(idx))
    
# Send New Data to BT Worker Thread
def sendDataToTablets(idx, client_sock, client_info):
    for message in deviceQueue[idx][:]:
        client_sock.send(message)
        deviceQueue[idx].remove(message)
    
# Start Application
print('Press `Ctrl+Shift+\` to Exit')
print("Starting Threads...")
    
# Start Threads
threads = []
for i in range(deviceCount):
    t = threading.Thread(target=bluetoothWorker, args=(i,))
    threads.append(t)
    t.start()
    
print("Started Threads...")