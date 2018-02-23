from bluetooth import BluetoothSocket
from bluetooth import *
import threading
import requests

# ***** CONFIG *****
uuid = "94f39d29-7d6d-437d-973b-fba39e49d4ee"
data_webhook = 'http://127.0.0.1:4909/new_msg'
deviceCount = 6
# ***** CONFIG *****

server_sock = BluetoothSocket( RFCOMM )
server_sock.bind(("", PORT_ANY))
server_sock.listen(1)

port = server_sock.getsockname()[1]

# Advertise Serial Port Profile
advertise_service( server_sock, "TGA Bluetooth Server",
                   service_id = uuid,
                   service_classes = [ uuid, SERIAL_PORT_CLASS ],
                   profiles = [ SERIAL_PORT_PROFILE ])

# Bluetooth Worker Thread
def bluetoothWorker(idx):
    # Thread Started
    print("Worker {}: Waiting for connection on RFCOMM channel {}...".format(idx, port))

    # Attempt Connection
    client_sock, client_info = server_sock.accept()
    print("Device {} Connected".format(idx))
    
    while True:
        try:
            # Receive Data from Tablets
            receiveDataFromTablets(idx, client_sock, client_info)
        except IOError:
            # Attempt Reconnection
            client_sock, client_info = server_sock.accept()
            print("Device {} Connected".format(idx))

    client_sock.close()
    server_sock.close()


# Recv. New Data from BT Worker Thread
def receiveDataFromTablets(idx, client_sock, client_info):
    raw_data = client_sock.recv(1024).decode("utf-8")
    print("Device {}: Received {}".format(idx, raw_data);
    
    try:
        requests.post(data_webhook, json=raw_data)
        print("Device {}: Succesfully Processed Data from {}".format(idx, client_info[0]))
    except json.decoder.JSONDecodeError:
        print("Device {}: Unable to Process JSON Data from {}".format(idx, client_info[0]))

# Start Application
print("Starting Threads...")
    
# Start Threads
threads = []
for i in range(deviceCount):
    t = threading.Thread(target=bluetoothWorker, args=(i,))
    threads.append(t)
    t.start()
    
print("Started Threads...")
