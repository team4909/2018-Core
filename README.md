# The Green Alliance
Team 4909's 2018+ Scouting System.

The Green Alliance Scouting Platform has been designed from the ground up to enable teams to share data beyond any event, district, or region. This influx of data is especially beneficial to teams at higher levels of play as they have more data to reference in strategic decisions and picking alliance partners. TGA consists of a cross-platform application and a community of FIRSTers willing to gather scouting data for the collective.

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

## Community
[Join our Slack Group](https://join.slack.com/t/thegreenalliance/shared_invite/enQtMjc3NzUyNjIyNzUzLTdjYTI3NmE5MjJiNGQ3NjJjOWJhZjQzZmU5Y2ZlZWNiNzRiZGFkZThjMWZkZjAwNWVjMWNiZGVmYWQ2MzM0YzY)
