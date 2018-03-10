echo
echo "This script runs a bunch of logging utilities to help in"
echo "debugging issues with TGA. Please post the resulting output"
echo "in #issues on Slack to get help."
echo
echo "Latest Git Commit: "
cd ~/the-green-alliance && git show --oneline -s
echo
echo "Webhook Logs: "
sudo journalctl -u bt-worker-hook.service -b
echo
echo "Bluetooth Worker Logs: "
sudo journalctl -u bt-worker.service -b
echo
echo "Docker CouchDB Status: "
sudo docker ps -a -f name=tga-couchdb