## POST thegreenalliance.local:4909/msg
All messages should be sent as JSON bodies.

### To Insert New Match Record
`{
	"msg_type": "New_Match",
	"client_mac": "AE:ED:ED:SC:SA:SC",
	"msg_data": {
		*** JSON DATA GOES HERE ***
	}
}`

### To Change Event Key
`{
	"msg_type": "New_Event_Key",
	"client_mac": "AE:ED:ED:SC:SA:SC",
	"msg_data": {
		"event_key": "botb"
	}
}`

### To Send New Connection Event
`{
	"msg_type": "New_Connection",
	"client_mac": "AE:ED:ED:SC:SA:SC",
}`

### To Send Lost Connection Event
`{
	"msg_type": "Lost_Connection",
	"client_mac": "AE:ED:ED:SC:SA:SC",
}`