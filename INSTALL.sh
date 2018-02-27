#!/usr/bin/env bash

# TL;DR of Script
echo
echo "THE GREEN ALLIANCE SCOUTING PLATFORM"
echo " - INSTALLER SCRIPT"
echo
echo " will do the following: "
echo " - change device hostname to the 'the-green-alliance' "
echo " - enable ethernet tethering"
echo " - enable SSH for remote access"
echo " - install and configure the CouchDB datastore"
echo " - install and configure the TGA Bluetooth syncing server"
echo
echo "You may press Ctrl+C now to abort this script."
echo "+ sleep 20"
sleep 20

sudo apt-get update
sudo apt-get -qq --yes install git

# Clone Repo
cd /home/pi
git clone https://github.com/FRCteam4909/the-green-alliance.git

# Update Repo
cd /home/pi/the-green-alliance
git checkout -f master
git pull

# Change Hostname to 'the-green-alliance'
echo "[TGA] Changing Hostname to 'the-green-alliance' ..."
echo "the-green-alliance" | sudo tee /etc/hostname > /dev/null
sudo sed -i 's/127.0.1.1.*/127.0.1.1\t'"the-green-alliance"'/g' /etc/hosts
sudo hostname "the-green-alliance"

# For Ethernet Tethering to Pi
echo "[TGA] Enabling Ethernet Tethering..."
sudo apt-get -qq --yes install avahi-daemon
sudo update-rc.d avahi-daemon defaults

# Enable SSH
echo "[TGA] Enabling SSH Server..."
sudo rm /etc/ssh/ssh_host_*
sudo dpkg-reconfigure openssh-server
sudo systemctl enable ssh
sudo systemctl start ssh

# For Database Installation
echo "[TGA] Installing CouchDB Server..."
curl -sSL https://get.docker.com | sh
sudo docker run -e COUCHDB_USER=admin -e COUCHDB_PASSWORD=password -p 5984:5984 -d --restart=always --name tga-couchdb matthiasg/rpi-couchdb

echo "+ sleep 5"
sleep 5
# Config DB
echo "[TGA] Configuring CouchDB Server..."
curl -X PUT http://admin:password@127.0.0.1:5984/_users
curl -X PUT http://admin:password@127.0.0.1:5984/_replicator
curl -X PUT http://admin:password@127.0.0.1:5984/_global_changes
curl -X PUT http://admin:password@127.0.0.1:5984/tga-2018
curl -X PUT http://admin:password@127.0.0.1:5984/_node/nonode@nohost/_config/httpd/enable_cors -d '"true"'
curl -X PUT http://admin:password@127.0.0.1:5984/_node/nonode@nohost/_config/cors/origins -d '"*"'
curl -X PUT http://admin:password@127.0.0.1:5984/_node/nonode@nohost/_config/cors/credentials -d '"true"'
curl -X PUT http://admin:password@127.0.0.1:5984/_node/nonode@nohost/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"'
curl -X PUT http://admin:password@127.0.0.1:5984/_node/nonode@nohost/_config/cors/headers -d '"accept, authorization, content-type, origin, referer, x-csrf-token"'

# For Webhook Server Dependencies
echo "[TGA] Configuring Bluetooth Worker Daemon..."
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get -qq --yes install nodejs
cd /home/pi/the-green-alliance/bluetooth-worker
sudo npm install

# For Python Bluetooth Dependencies/Libraries
echo "[TGA] Installing Bluetooth Dependencies..."
sudo apt-get -qq --yes install libboost-python-dev
sudo apt-get -qq --yes install libboost-thread-dev
sudo apt-get -qq --yes install libbluetooth-dev
sudo apt-get -qq --yes install libglib2.0-dev
sudo apt-get -qq --yes install bluez
sudo apt-get -qq --yes install python-bluez
sudo apt-get -qq --yes install python3-pip
sudo pip3 -q install pybluez
sudo pip3 -q install requests

# Start Bluetooth Daemon
echo "[TGA] Starting OS Bluetooth Daemon..."
sudo usermod -G bluetooth -a pi
sudo sed -i 's/bluetoothd/bluetoothd -C/g' /lib/systemd/system/bluetooth.service
sudo systemctl daemon-reload
sudo systemctl restart bluetooth
sudo sdptool add SP

# Start Bluetooth Worker Daemon
echo "[TGA] Starting TGA Bluetooth Worker Daemon..."
sudo cp /home/pi/the-green-alliance/bluetooth-worker/bt-worker-hook.service /lib/systemd/system/
sudo cp /home/pi/the-green-alliance/bluetooth-worker/bt-worker.service /lib/systemd/system/
sudo chmod 644 /lib/systemd/system/bt-worker-hook.service
sudo chmod 644 /lib/systemd/system/bt-worker.service
sudo chmod +x /home/pi/the-green-alliance/bluetooth-worker/server.js
sudo chmod +x /home/pi/the-green-alliance/bluetooth-worker/bluetooth-worker.py
sudo systemctl daemon-reload

sudo systemctl enable bt-worker-hook.service
sudo systemctl enable bt-worker.service
sudo systemctl restart bt-worker-hook.service
sudo systemctl restart bt-worker.service

echo
echo "THE GREEN ALLIANCE SCOUTING PLATFORM"
echo "    BY TEAM 4909 (THE BILLERICA BIONICS)"
echo
echo "DEBUGGING NOTES"
echo "For debugging purposes, the Pi is now configured"
echo "to allow SSH access at 'the-green-alliance.local' when"
echo "when tethered via ethernet cable."
echo 
echo "In addition, the local CouchDB server can be "
echo "accessed at 'the-green-alliance.local:5984'"
echo "using the credentials below:"
echo
echo "    Username: admin"
echo "    Password: password"
echo
echo "BLUETOOTH CONFIGURATION"
echo "Take note of the following Bluetooth MAC Address. This"
echo "identifier is needed to configure the Bluetooth portion"
echo "of the transfer mechanism. Ex. 00:25:96:12:34:56"
echo
hcitool dev
echo
echo "The GitHub documentation has detailed information"
echo "on how to setup Bluetooth on Android devices for"
echo "TGA. If you need additional help, please use the"
echo "#issues channel on the TGA Slack."
echo 
echo "Please reboot to complete the installation."
echo