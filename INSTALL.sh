#!/usr/bin/env bash

# Clone Repo
cd /home/pi
git clone https://github.com/FRCteam4909/the-green-alliance.git

# Update Repo
cd /home/pi/the-green-alliance
git checkout -f master
git pull

echo
echo
echo "The Green Alliance Pi Installer Script will do the following: "
echo " - change device hostname to the 'the-green-alliance' "
echo " - enable ethernet tethering"
echo " - enable SSH for remote access"
echo " - install and configure the CouchDB datastore"
echo " - install and configure the TGA Bluetooth syncing server"
echo
echo
echo "You may press Ctrl+C now to abort this script."
echo "+ sleep 20"
sleep 20

# Change Hostname to 'the-green-alliance'
echo "Changing Hostname to 'the-green-alliance' ..."
echo "the-green-alliance" | sudo tee /etc/hostname > /dev/null
sudo sed -i 's/127.0.1.1.*/127.0.1.1\t'"the-green-alliance"'/g' /etc/hosts
sudo hostname "the-green-alliance"

# For Ethernet Tethering to Pi
echo "Enabling Ethernet Tethering..."
sudo apt-get -qq --yes install avahi-daemon
sudo update-rc.d avahi-daemon defaults

# Enable SSH
echo "Enabling SSH Server..."
sudo systemctl enable ssh
sudo systemctl start ssh

# For Database Installation
echo "Installing CouchDB Server..."
curl -sSL https://get.docker.com | sh
sudo docker run -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=password -p 5984:5984 -d --restart=always matthiasg/rpi-couchdb
sleep 1

# Config DB
echo "Configuring CouchDB Server..."
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

# For Webhook Server Dependencies
echo "Configuring TGA Bluetooth Worker Daemon..."
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get -qq --yes install nodejs
cd /home/pi/the-green-alliance/bluetooth-worker
sudo npm install

# For Python Bluetooth Dependencies/Libraries
echo "Installing Bluetooth Dependencies..."
sudo apt-get -qq --yes install libboost-python-dev
sudo apt-get -qq --yes install libboost-thread-dev
sudo apt-get -qq --yes install libbluetooth-dev
sudo apt-get -qq --yes install libglib2.0-dev
sudo apt-get -qq --yes install bluez
sudo apt-get -qq --yes install python-bluez
sudo pip3 install pybluez
sudo pip3 install requests

# Start Bluetooth Daemon
echo "Starting Bluetooth Daemon..."
sudo sed -i 's/bluetoothd/bluetoothd -C/g' /lib/systemd/system/bluetooth.service
sudo systemctl daemon-reload
sudo service bluetooth restart
sudo sdptool add SP

# Start Bluetooth Worker Daemon
echo "Starting TGA Bluetooth Worker Daemon..."
sudo cp /home/pi/the-green-alliance/bluetooth-worker/bt-worker.service /lib/systemd/system/
sudo chmod 644 /lib/systemd/system/bt-worker.service
chmod +x /home/pi/the-green-alliance/bluetooth-worker/server.js
sudo systemctl daemon-reload
sudo systemctl enable bt-worker.service
sudo systemctl start bt-worker.service

# Inform User to Reboot
echo
echo "Please reboot to complete the installation."
echo