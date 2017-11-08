#
# The Green Alliance by Team 4909 <team4909@gmail.com>
# - Author: Roshan Ravi <roshanravi10@gmail.com>
#
# This script is assuming the following is setup:
# - Raspberry Pi 3 w/ at least 8GB SD card
#       (16GB Recommended)
# - The Pi is Connected to the Internet and can access 
#       the apt and npm repositories.
# - The Pi has SSH/VNC preconfigured
#       This can be done via the GUI or on the terminal
#       using the `sudo raspi-config` command.

# Change Password for Remote Access
echo "pi:TGA-4909" | sudo chpasswd

# For Ethernet Tethering to Pi
sudo apt-get install avahi-daemon
sudo update-rc.d avahi-daemon defaults

# For Python Bluetooth Dependencies
sudo apt-get install libboost-python-dev
sudo apt-get install libboost-thread-dev
sudo apt-get install libbluetooth-dev
sudo apt-get install libglib2.0-dev
sudo apt-get install python-bluez

# For Bluetooth Pairing GUI (optional)
# sudo apt-get install blueman

# For Database Usage
sudo apt-get install mongodb

# For Node.JS Server Dependencies
sudo apt-get install npm

# Install Node.JS Dependencies
npm install