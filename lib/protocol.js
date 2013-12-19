var KademliaProtocol = Class.extend({
  
  config: {
    msgSizeLimit = Kademlia.config.udpDatagramMaxSize - 26,
    maxToSendDelay = 10 ** -3,
    minToSendDelay = 10 ** -5
  },
  
  init: function (node, msgEncoder, msgTranslator) {
    this._node = node;
    this._encoder = msgEncoder || Bencode;
    this._translator = msgTranslator;
    this._sentMessages = {};
    this._partialMessages = {};
    this._partialMessagesProgress = {};
  },
  
  sendRPC: function (contact, method, args, rawResponse) {
    
  },
  
  receiveData: function (msgEncoded, address) {
    
    var msgPrimitive = _this._encoder.decode(msgEncoded),
        message = _this._translator.fromPrimitive(msgPrimitive);
        
    var remoteContact = new Contact(message.nodeId,
        address[0], address[1], this);
    
    this._node.addContact(remoteContact);
    
    if (message.constructor === RequestMessage) {
      this._handleRPC(remoteContact, message.id, message.request, message.args);
    } else if (message.constructor == ResponseMessage) {
      
      if (this._sentMessages[message.id]) {
        
        var df = this._sentMessages[message.id].slice(1,3);
        
        delete this._sentMessages[message.id];
        
        if (df._rpcRawResponse) {
          
          df.callback([message, address])
          
        } else if (message.constructor == ErrorMessage)
          
          df.errback(new RemoteException(message.exceptionType))
        
        } else {
          df.callback(message.response);
        }
        
      }
      
    } else {
      
      throw 'Whats up with this';
      
    }
    
  },
  
  /*
   Transmit the specified data over UDP, breaking it up into several
  packets if necessary
  
  If the data is spread over multiple UDP datagrams, the packets have the
  following structure::
      |           |     |      |      |        ||||||||||||   0x00   |
      |Transmision|Total number|Sequence number| RPC ID   |Header end|
      | type ID   | of packets |of this packet |          | indicator|
      | (1 byte)  | (2 bytes)  |  (2 bytes)    |(20 bytes)| (1 byte) |
      |           |     |      |      |        ||||||||||||          |
  
  @note: The header used for breaking up large data segments will
         possibly be moved out of the KademliaProtocol class in the
         future, into something similar to a message translator/encoder
         class (see C{kademlia.msgformat} and C{kademlia.encoding}).
  */
  _send: function (data, rpcId, address) {
    
  }
  
});