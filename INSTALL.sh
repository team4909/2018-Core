#!/usr/bin/env bash

cd /home/pi
git clone https://github.com/FRCteam4909/the-green-alliance.git
cd /home/pi/the-green-alliance

# This should be executed from Root of TGA Repository

# Change Hostname
echo "the-green-alliance" | sudo tee /etc/hostname > /dev/null
sudo sed -i 's/127.0.1.1.*/127.0.1.1\t'"the-green-alliance"'/g' /etc/hosts
service hostname start

# For Ethernet Tethering to Pi
sudo apt-get --yes install avahi-daemon
sudo update-rc.d avahi-daemon defaults
sudo systemctl enable ssh
sudo systemctl start ssh

# For Database Installation
curl -sSL https://get.docker.com | sh
sudo docker run -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=password -p 5984:5984 -d --restart=always matthiasg/rpi-couchdb
sleep 1

# Config DB
HOST=http://admin:password@127.0.0.1:5984
curl -X PUT $HOST/_users
curl -X PUT $HOST/_replicator
curl -X PUT $HOST/_global_changes
curl -X PUT $HOST/tga-2018
curl -X PUT $HOST/_node/nonode@nohost/_config/httpd/enable_cors -d '"true"'
curl -X PUT $HOST/_node/nonode@nohost/_config/cors/origins -d '"*"'
curl -X PUT $HOST/_node/nonode@nohost/_config/cors/credentials -d '"true"'
curl -X PUT $HOST/_node/nonode@nohost/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"'
curl -X PUT $HOST/_node/nonode@nohost/_config/cors/headers -d '"accept, authorization, content-type, origin, referer, x-csrf-token"'

# For Webhook Server (Node)
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs

# For Webhook Server (Node Dependencies)
cd /home/pi/the-green-alliance/bluetooth-worker
sudo npm install

# For Python Bluetooth Dependencies
sudo apt-get --yes install libboost-python-dev
sudo apt-get --yes install libboost-thread-dev
sudo apt-get --yes install libbluetooth-dev
sudo apt-get --yes install libglib2.0-dev
sudo apt-get --yes install bluez
sudo apt-get --yes install python-bluez

# For Python Bluetooth Libraries
sudo pip3 install pybluez
sudo pip3 install requests

# Start Bluetooth Daemon
sudo sed -i 's/bluetoothd/bluetoothd -C/g' /lib/systemd/system/bluetooth.service
sudo systemctl daemon-reload
sudo service bluetooth restart
sudo sdptool add SP

# Start Bluetooth Worker Daemon
sudo cp /home/pi/the-green-alliance/bluetooth-worker/bt-worker.service /lib/systemd/system/
sudo chmod 644 /lib/systemd/system/bt-worker.service
chmod +x /home/pi/the-green-alliance/bluetooth-worker/server.js
sudo systemctl daemon-reload
sudo systemctl enable bt-worker.service
sudo systemctl start bt-worker.service