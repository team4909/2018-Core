from bluetooth import BluetoothSocket
from bluetooth import *
import threading
import json
import requests
import sys

# ***** CONFIG *****
uuid = "94f39d29-7d6d-437d-973b-fba39e49d4ee"
data_webhook = 'http://127.0.0.1:4909/new_msg'
deviceCount = 6
# ***** CONFIG *****


## Bluetooth Worker Thread
def bluetoothWorker(idx, port, server_sock):
    # Thread Started
    print("Worker {}: Waiting for connection on RFCOMM channel {}...".format(idx, port))
    sys.stdout.flush()

    # Attempt Connection
    client_sock, client_info = server_sock.accept()
    print(" - Connected to Device {} ({})".format(idx, client_info[0]))
    sys.stdout.flush()
    
    while True:
        try:
            # Receive Data from Tablets
            receiveDataFromTablets(idx, client_sock, client_info)
        except IOError:
            # Attempt Reconnection
            print("Worker {}: Lost Connection on RFCOMM channel {}...".format(idx, port))
            print("Worker {}: Waiting for reconnection on RFCOMM channel {}...".format(idx, port))
            sys.stdout.flush()
            client_sock, client_info = server_sock.accept()
            print(" - Connected to Device {} ({})".format(idx, client_info[0]))
            sys.stdout.flush()

    client_sock.close()
    server_sock.close()

#
### Recv. New Data from BT Worker Thread
def receiveDataFromTablets(idx, client_sock, client_info):
    raw_data = client_sock.recv(1024).decode("utf-8")
    print(" - Received {} from Device {} ({})".format(raw_data, idx, client_info[0]))
    sys.stdout.flush()
    
    try:
        var = json.loads(raw_data)
        print(var)
        r = requests.post(data_webhook, json=var)
        print(" - Device {}: Succesfully Processed Data from {}".format(idx, client_info[0]))
        print(r)
        sys.stdout.flush()
    except (requests.packages.urllib3.exceptions.NewConnectionError, requests.packages.urllib3.exceptions.MaxRetryError, requests.exceptions.ConnectionError) as error:
        print("Worker {}: Unable to Connect to Webhook".format(idx))
        sys.stdout.flush()
    except (json.decoder.JSONDecodeError) as error:
        print(" - Device {}: Unable to Process JSON Data from {}".format(idx, client_info[0]))
        sys.stdout.flush()

## Start Application
#print("Starting Threads...")
#    
## Start Threads
#threads = []
#for i in range(deviceCount):
#    t = threading.Thread(target=bluetoothWorker, args=(i,))
#    threads.append(t)
#    t.start()
    
if __name__ == "__main__":
    print("Starting System...")
    sys.stdout.flush()

    server_sock = BluetoothSocket( RFCOMM )
    server_sock.bind(("", PORT_ANY))
    server_sock.listen(1)

    port = server_sock.getsockname()[1]

    # Advertise Serial Port Profile
    advertise_service( server_sock, "TGA Bluetooth Server",
                       service_id = uuid,
                       service_classes = [ uuid, SERIAL_PORT_CLASS ],
                       profiles = [ SERIAL_PORT_PROFILE ])

    
    print("Past Startup")
    sys.stdout.flush()
    
    threads = []
    for i in range(deviceCount):
        t = threading.Thread(target=bluetoothWorker, args=(i,port, server_sock,))
        threads.append(t)
        t.start()
    
#    bluetoothWorker(0, port, server_sock)

    print("Started Threads...")
