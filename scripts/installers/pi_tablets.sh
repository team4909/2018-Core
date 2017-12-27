# For Webhook Server (Node)
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs

# For Webhook Server (Node Dependencies)
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

# For Bluetooth Pairing GUI (optional)
# sudo apt-get install bluemam