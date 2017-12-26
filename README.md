# The Green Alliance
Team 4909's 2018+ Scouting System.

We built The Green Alliance to alleviate many of the difficulties regarding scouting.

## Devices
The Green Alliance tries to accomodate the workflows of most teams using the following configurations.

### Supported Input Device Configurations
- 6 Devices (Laptop/Tablet/Phone) Connected to Cloud Server
  - Syncs directly to Cloud
- 6 Kindle Fires Connected to Raspberry Pi
  - Connected via Bluetooth
- 6 Laptops Connected to Raspberry Pi
  - Connected via Ethernet switch
  
### Supported Analysis Device Configurations
- Devices (Laptop/Tablet/Phone) Connected to Cloud Server
  - Connected via Event WiFi or Cellular
- Laptop Connected to Raspberry Pi
  - Connected via Ethernet Switch
  - Required for Offline Data Analysis

That said, a laptop is recommended for best results.

## Architecture
![](https://i.imgur.com/E78J5CI.png)

### Syncing
All devices run either [CouchDB](https://github.com/apache/couchdb) or [PouchDB](https://github.com/pouchdb/pouchdb) to store and sync data. The Bluetooth transfer protocol uses the [pouchdb-replication-stream](https://github.com/pouchdb-community/pouchdb-replication-stream) project to tunnel the API calls between the Kindle Fires and the Raspberry Pi CouchDB server.

When connected, devices will connect and sync data to reach [eventual consistency](http://docs.couchdb.org/en/2.1.1/intro/consistency.html).

## Bugs / Feature Requests
Please create a GitHub issue for any bugs or new feature requests.
