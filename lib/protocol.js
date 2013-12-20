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
    
    var _this = this;
    
    var maxSize = this.config.msgSizeLimit;
    
    if (data.length > maxSize) {
      
      var totalPackets = data.length / maxSize;
      
      if (data.length % maxSize > 0) totalPackets += 1;
    
      var encTotalPackets = chr(totalPackets >> 8) +
                            chr(totalPackets & 0xff);
      
      var seqNumber = 0, startPos = 0;
      
      while (seqNumber < totalPackets) {
      
        var packetData = data.substr(
          startPos, startPost+this.msgSizeLimit);
        
        var encSeqNumber = chr(seqNumber >> 8) +
                           chr(seqNumber & 0xff);
    
        var txData = '\x00' + encTotalPackets +
                      encSeqNumber + rpcId +
                      '\x00' + packetData;
        
        Q.delay(this.config.maxToSendDelay).done(function () {
          _this.transport.write(data, address);
        });
        
      }
      
    } else {
      
      _this.transport.write(data, address);
      
    }
    
  },
  
  _sendResponse: function (contact, rpcId, response) {
    
    var msg = new ResponseMessage(rpcId, this._node.id, response),
        msgPrimitive = this._translator.toPrimitive(msg),
        encodedMsg = this._encoder.encode(msgPrimitive);
    
    this._send(encodedMsg, rpcId, [contact.address, contact.port]);
    
  },
  
  _sendError: function (contact, rpcId, exceptionType, exceptionMessage) {
    
    var msg = new ErrorMessage(rpcId, this._node.id,
                  exceptionType, exceptionMessage),
        msgPrimitive = this._translator.toPrimitive(msg),
        encodedMsg = this._encoder.encode(msgPrimitive);
    
    this._send(encodedMsg, rpcId, [contact.address, contact.port]);
    
  },
  
  _handleRPC: function (senderContact, rpcId, method, args) {
    
    var _this = this;
    
    if (this._node[method]) {
      
      try {
        this.apply(this._node[method], args, handleRPCResult);
      } catch (error) {
        this._handleRPCError(error)
      }
      
    } else {
      var error = new Error('Invalid method: ' + method);
      this._handleRPCError(error);
    }
    
  },
  
  _handleRPCResult: function (result) {
    
    _this._sendResponse(senderContact, rpcId, result);
    
  },
  
  _handleRPCError: function (error) {
    
    _this._sendError(senderContact, rpcId,
      error.type, error.getErrorMessage());
      
  },
  
  _msgTimeout: function(messageId) {
    
    if (this._sentMessages[messageId]) {
      
      var remoteContactId = this._sentMessages[messageId][0],
          deferred = this._sentMessages[messageId][1],
          partialMessages = this._partialMessages[messageId],
          partialProgress = this._partialMessagesProgress[messageId];
      
      if (partialMessages) {
        
        if ( partialProgress && partialProgress.length ==
             this._partialMessages[messageId]) ) {

          delete this._partialMessagesProgress[messageId];
          delete this._partialMessages[messageId];

          deferred.reject(new Error('Message timeout'));

          return null;

        }
        
        var timeoutCall = Q.delay(this.config.rpcTimeout, this._msgTimeout, messageId);
        
        this._sentMessages[messageId] = [remoteContactId, deferred, timeoutCall];
        
        return null;
        
      }
      
      delete this._sentMessages[messageId];
      
      this._node.removeContact(remoteContactId);
      deferred.reject(new Error('Message timeout'));
      
    } else {
    
      throw 'Fatal error: deferred timed out, but is ' +
            'not present in sent messages list.';
      
    }
    
  }
  
});