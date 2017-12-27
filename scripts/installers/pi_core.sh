# Change Hostname
sudo hostname the-green-alliance
sudo "the-green-alliance" > /etc/hostname
sudo sed -i 's/127.0.1.1.*/127.0.1.1\t'"the-green-alliance"'/g' /etc/hosts
service hostname start

# For Ethernet Tethering to Pi
sudo apt-get --yes install avahi-daemon
sudo update-rc.d avahi-daemon defaults

# For Database Installation
echo "deb https://apache.bintray.com/couchdb-deb stretch main" | sudo tee -a /etc/apt/sources.list
curl -L https://couchdb.apache.org/repo/bintray-pubkey.asc | sudo apt-key add -
sudo apt-get update && sudo apt-get install couchdb