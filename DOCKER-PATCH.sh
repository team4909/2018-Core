#!/usr/bin/env bash

sudo apt-get remove docker-ce

export CHANNEL=stable
curl -sSL https://get.docker.com | sh