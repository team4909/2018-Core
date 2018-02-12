# This should be executed from Root of TGA Repository

# Change Hostname
sudo hostname the-green-alliance
sudo "the-green-alliance" > /etc/hostname
sudo sed -i 's/127.0.1.1.*/127.0.1.1\t'"the-green-alliance"'/g' /etc/hosts
service hostname start

# For Ethernet Tethering to Pi
sudo apt-get --yes install avahi-daemon
sudo update-rc.d avahi-daemon defaults

# For Database Installation
curl -sSL https://get.docker.com | sh
docker run -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=password -p 5984:5984 -d --restart=always couchdb
curl -X PUT http://127.0.0.1:5984/_users
curl -X PUT http://127.0.0.1:5984/_replicator
curl -X PUT http://127.0.0.1:5984/_global_changes
curl -X PUT http://127.0.0.1:5984/tga-2018

# For Webhook Server (Node)
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs

# For Webhook Server (Node Dependencies)
cd bluetooth-worker
sudo npm install

# For Python Bluetooth Dependencies
sudo apt-get --yes install libboost-python-dev
sudo apt-get --yes install libboost-thread-dev
sudo apt-get --yes install libbluetooth-dev
sudo apt-get --yes install libglib2.0-dev
sudo apt-get --yes install python-bluez

# For Python Bluetooth Libraries
sudo pip3 install pybluez
sudo pip3 install requests

# Start Bluetooth Daemon
sudo sed -i 's/bluetoothd/bluetoothd -C/g' /lib/systemd/system/bluetooth.service
sudo systemctl daemon-reload
sudo service bluetooth restart
sudo sdptool add SP