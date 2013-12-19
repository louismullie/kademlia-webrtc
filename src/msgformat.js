/*

Interface for RPC message translators/formatters

Classes inheriting from this should provide a translation services between
the classes used internally by this Kademlia implementation and the actual
data that is transmitted between nodes.
*/

var MessageTranslator = Class.extend({
  
  fromPrimitive: function (msgPrimitive) {
    throw 'Cannot call abstract method.';
  },
  
  toPrimitive: function (message) {
    throw 'Cannot call abstract method.';
  }
  
});

var DefaultFormat = Class.extend({
  
  typeRequest: 0,
  typeResponse: 1,
  typeError: 3,
  
  headerType: 0,
  headerMsgId: 1,
  headerNodeId: 2,
  headerPayload: 3,
  headerArgs: 4,
  
  fromPrimitive: function (msgPrimitive) {
    
    var msgType = msgPrimitive[this.headerType];
    
    var msg;
    
    switch(msgType) {
    
      case this.typeRequest:
      
        return RequestMessage(
          msgPrimitive[this.headerNodeId],
          msgPrimitive[this.headerPayload],
          msgPrimitive[this.headerArgs],
          msgPrimitive[this.headerMsgId]);
    
      case this.typeResponse:
      
        return RequestMessage(
          msgPrimitive[this.headerMsgId],
          msgPrimitive[this.headerNodeId],
          msgPrimitive[this.headerPayload]);
    
      case this.typeError:
        
        return RequestMessage(
          msgPrimitive[this.headerMsgId],
          msgPrimitive[this.headerNodeId],
          msgPrimitive[this.headerPayload],
          msgPrimitive[this.headerArgs]);
      
      default:
        
        return Message(
          msgPrimitive[this.headerMsgId],
          msgPrimitive[this.headerNodeId]);
    
    }
    
  },
  
  toPrimitive: function (message) {
    
    var msg = {
      this.headerMsgId: message.id,
      this.headerNodeId: message.nodeId,
    };
    
    switch (message.constructor)
    
      case RequestMessage:
        
        return {
          msg[this.headerType]: this.typeRequest,
          msg[this.headerPayload]: message.request,
          msg[this.headerArgs]: message.args
        }
      
      case ErrorMessage:
      
        return {
          msg[this.headerType]: this.typeError,
          msg[this.headerPayload]: message.exceptionType
          msg[this.headerArgs]: message.response
        };
      
      case ResponseMessage:
      
        return {
          msg[this.headerType]: this.typeRequest,
          msg[this.headerPayload]: message.request,
          msg[this.headerArgs]: message.args
        }
      
      default:
        
        throw 'Unrecognized message type.';
      
    }
    
  }
  
    
});

var Message = Class.extend({
  
  init: function (rpcId, nodeId) {
    this.id = rpcId;
    this.nodeId = nodeId;
  }
  
});

var RequestMessage = Message.extend({
  
  init: function (nodeId, method, methodArgs, rpcId) {
    
    var rpcId = rpcId || Random.uuid();
    
    this._super(rpcId, nodeId);
    
    this.request = method;
    this.args = methodArgs;
  
  }
  
});

var ResponseMessage = Message.extend({
  
  init: function (rpcId, nodeId, response) {
   
    this._super(rpcId, nodeId);
    
    this.response = response;
  }
  
});


class ErrorMessage = ResponseMessage.extend({

  init: function (rpcId, nodeId, exceptionType, errorMessage) {
  
    this._super(rpcId, nodeId, errorMessage);
    
    // Handle custom exception types?
    
    this.exceptionType = exceptionType;
    
  }
  
});