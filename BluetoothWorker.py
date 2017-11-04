from bluetooth import *
import threading

server_sock = BluetoothSocket( RFCOMM )
server_sock.bind(("", PORT_ANY))
server_sock.listen(1)

port = server_sock.getsockname()[1]

uuid = "94f39d29-7d6d-437d-973b-fba39e49d4ee"

advertise_service( server_sock, "TGA Bluetooth Server",
                   service_id = uuid,
                   service_classes = [ uuid, SERIAL_PORT_CLASS ],
                   profiles = [ SERIAL_PORT_PROFILE ])

def bluetoothWorker(idx):
    print("Device {}: Waiting for connection on RFCOMM channel {}...".format(idx, port))

    client_sock, client_info = server_sock.accept()
    print("Device {}: Accepted connection from {}.".format(idx, client_info))

    while True:
        try:
            # Receive Data
            # data = client_sock.recv(1024)
            
            # Send Data
            # client_sock.send(data)
        except IOError:
            print("Device {}: Unable to connect...".format(idx))
            print(IOError)
            client_sock, client_info = server_sock.accept()
            print("Device {}: Accepted connection from {}.".format(idx, client_info))

    client_sock.close()
    server_sock.close()

print('Press `Ctrl+Shift+\` to Exit')
print("Starting Threads...")
    
threads = []
for i in range(6):
    t = threading.Thread(target=bluetoothWorker, args=(i,))
    threads.append(t)
    t.start()

print("Waiting for Connections...")