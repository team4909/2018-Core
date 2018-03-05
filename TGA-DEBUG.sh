echo "This script runs a bunch of logging utilities to help in"
echo "debuggin issues with TGA. Please post the resulting output"
echo "in #issues on Slack to get help."

echo "Latest Git Commit: "
cd ~/the-green-alliance && git show --oneline -s

echo "Webhook Logs: "
sudo systemctl status bt-worker-hook.service

echo "Bluetooth Worker Logs: "
sudo systemctl status bt-worker.service