/*
 Encapsulation for remote contact
 
 This class contains information on a single remote contact, and also
 provides a direct RPC API to the remote node which it represents.
 */
var Contact = Class.extend({
  
  init: function (id, ipAddress, udpPort, networkProtocol, firstComm) {
    
    this.id = id;
    this.address = ipAddress;
    this.port = udpPort;
    this._networkProtocol = networkProtocol;
    this.commTime = firstComm || 0;
    
  },
  
  getAttr: function (name) {
    
    var _this = this;
    
    var _sendRPC = function () {
      return _this.networkProtocol.sendRPC(_this, name, arguments);
    };
    
    return _sendRPC;
    
  },
  
  toString: function () {
    return "<IP: " + this.address + ", UDP port: " + this.port + ">";
  }
  
});