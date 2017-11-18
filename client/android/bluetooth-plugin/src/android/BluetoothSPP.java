package org.team4909.bluetooth;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;

import java.io.OutputStream;
import java.util.UUID;

public class BluetoothSPP extends CordovaPlugin {
    private BluetoothAdapter mBluetoothAdapter;
    private BluetoothDevice mBluetoothDevice;
    private BluetoothSocket mBluetoothSocket;
    private OutputStream mBluetoothOutStream;
    
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("initConnection")) {
            String macAddr = args.getString(0);
            this.initializeConnection(macAddr, callbackContext);
            
            return true;
        } else if (action.equals("sendData")){
            String data = args.getString(0);
            this.sendData(data, callbackContext);
            
            return true;
        } else {
            return false;
        }
    }

    private void initializeConnection(String macAddr, CallbackContext callbackContext){
        try {
            mBluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
            mBluetoothDevice = mBluetoothAdapter.getRemoteDevice(macAddr);

            UUID SERIAL_UUID = UUID.fromString("94f39d29-7d6d-437d-973b-fba39e49d4ee");
            mBluetoothSocket = mBluetoothDevice.createRfcommSocketToServiceRecord(SERIAL_UUID);
            mBluetoothSocket.connect();
            
            mBluetoothOutStream = mBluetoothSocket.getOutputStream();
            callbackContext.success("Connection Succeeded");
        } catch (Exception e) {
            callbackContext.error(e.getMessage());
        }
    }
    
    private void sendData(String data, CallbackContext callbackContext) {
        if (data != null && data.length() > 0) {
            try {
                byte[] testArray = data.getBytes();

                mBluetoothOutStream.write(testArray);
                mBluetoothOutStream.flush();

                callbackContext.success("Data Sent");
            } catch (Exception e) {
                callbackContext.error(e.getMessage());
            }
        } else {
            callbackContext.error("Expected one non-empty string argument.");
        }
    }
}
