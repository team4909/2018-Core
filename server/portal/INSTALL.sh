# For Ethernet Tethering to Pi
sudo apt-get --yes install avahi-daemon
sudo update-rc.d avahi-daemon defaults

# For Server (Node)
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs

# For Server (Node Dependencies)
sudo npm install