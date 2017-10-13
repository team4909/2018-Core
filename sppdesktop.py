from bluetooth import *
import threading

server_sock=BluetoothSocket( RFCOMM )
server_sock.bind(("",PORT_ANY))
server_sock.listen(1)

port = server_sock.getsockname()[1]

uuid = "94f39d29-7d6d-437d-973b-fba39e49d4ee"

advertise_service( server_sock, "SampleServer",
                   service_id = uuid,
                   service_classes = [ uuid, SERIAL_PORT_CLASS ],
                   profiles = [ SERIAL_PORT_PROFILE ])

def bluetoothWorker(idx):
    print("Waiting for connection on RFCOMM channel %d" % port)

    client_sock, client_info = server_sock.accept()
    print("Accepted connection from ", client_info)

    try:
        while True:
            data = client_sock.recv(1024)
            if len(data) == 0: break
            print("received from {} {}".format(idx, data))
            client_sock.send(data)
    except IOError:
        pass

    client_sock.close()
    server_sock.close()


threads = []
for i in range(6):
    t = threading.Thread(target=bluetoothWorker, args=(i,))
    threads.append(t)
    t.start()

print("all done")
