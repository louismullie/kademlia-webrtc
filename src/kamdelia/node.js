class Node = Class.extend({

  init: function (updPort, dataStore, routingTable, networkProtocol) {
    
    this.id = this._generateId();
    this.port = udpPort || 4000;
    
    this._joinDeferred = null;
    
    this._routingTable = routingTable ||
    OptimizedTreeRoutingTable(this.id);
    
    this._protocol = networkProtocol ||
      KademliaProtocol(this);
    
    this._dataStore = dataStore ||
      DictDataStore();
    
    if (dataStore && 'nodeState' in dataStore) {
      
      var state = dataStore['nodeState'],
      
      this.id = state['id'];
      
      _.each(state['closestNodes'], function (contactInfo) {
        
        var contact = Contact(
          contactInfo[0], contactInfo[1],
          contactInfo[2], this._protocol);
        
        _this._routingTable.addContact(contact);
        
      });
      
    }
      
  },
  
  delete: function () {
    this._persistState();
  },
  
  joinNetwork: function(knownNodeAddresses) {
    
    // listen UDP
    
    var _this = this;
    
    var bootStrapContacts = [];
    
    if (knownNodeAddresses) {
      
      _.each(knownNodeAddresses, function (address, port) {
        
        var contact = Contact(_this._generateId(),
            address, port, _this._protocol);
        
        bootstrapContacts.push(contact);
        
      });
      
    }
    
    _this._joinDeferred = _this._iterativeFind(
        this.id, bootstrapContacts);
    
    _this._joinDeferred.addCallback(_this.persistState);
    
    // Start calling with refresh interval
    callLater(Kamdelia.config.checkRefreshInterval, this.refreshNode);
    
  },
  
  iterativeStore: function (key, value, originalPublisherId, age) {
    
    var age = age || 0;
    
    if (!originalPublisherId) originalPublisherId = this.id;
    
    var df = this.iterativeFindNode(key);
    
    df.addCallback(executeStoreRPCs);
    
    return df;
    
  },
  
  executeStoreRPCs: function (nodes, key, value, originalPublisherId, age) {

    if (nodes.length > Kamdelia.config.k) {
      
      var distanceA = this._routingTable.distance(key, this.id),
          distanceB = this._routingTable.distance(
                      key, nodes[nodes.length-1].id);
                      
      if (distanceA < distanceB) nodes.pop();
      
    }
    
    this.store(key, value, originalPublisherId, age);
  
    _.each(nodes, function (contact) {
    
      contact.store(key, value, originalPublisherId, age);
      
    });
      
  },
  
  iterativeFindNode: function(key) {
    return this._iterativeFind(key);
  },
  
  iterativeFindValue: function (key) {

    this._iterativeFind(key, 'findValue', this.checkResult);
    
    return null;
    
  },
  
  checkResult: function (result, callback) {
    
    if (result.constructor === Object &&
        result.closestNodeValue) {
        
        callback(result);
        
    } else {
      
      var value = this._dataStore[key];
      var dict = {}; dict[key] = value;
      
      if (value && result.length > 0) {
        var contact = result[0];
        contact.store(key, value);
      }
      
      callback({ key: value });
      
    }
    
    return null;
    
  },
  
  addContact: function (contact) {
    this._routingTable.addContact(contact);
  },
  
  removeContact: function (contactId) {
    this._routingTable.removeContact(contactId);
  },
  
  // ??
  findContact: function (contactId, callback) {
    
    try {
      var contact = this._routingTable.getContact(contactId);
      callback(contact);
      
    } catch (e) {
      
      this.iterativeFindNode(contactId, function (nodes) {
        if (contactId in nodes[contactId])
          return nodes[nodes.index(contactId)];
        else
          return null;
      });
      
    }
    
  },
  
  ping: function () {
    return 'pong';
  },
  
  store: function (key, value, originalPublisherId, age, kwargs) {
    
    var rpcSenderId = kwargs._rpcNodeId || null;
    
    if (!originalPublisherId) {
      if (!rpcSenderId) originalPublisherId = rpcSenderId;
      else throw 'No publisher or caller ID available.';
    }
    
    var now = +new Date(), originallyPublished = now - age;
    
    this._dataStore.setItem(key, value, now,
      originallyPublished, originallPublisherId);
    
    return null;
  },
  
  findNode: function (key, kwargs) {
    
    var rpcSenderId = kwargs._rpcNodeId || null;
  
    var contacts = this._routingTable.findCloseNodes(
      key, Kamdelia.config.k, rpcSenderId);
    
    var contactInfos = [];
    
    _.each(contacts, function (contact) {
      contactInfos.push([
        contact.id,
        contact.address,
        contact.port ]);
    });
    
    return contactInfos;
    
  },
  
  findValue: function (key, kwargs) {
    
    return self._dataStore[key] ?
           { key: this._dataStore[key] }:
           this.findNode(key, kwargs);
  },
  
  _generateId: function () {
    
    return Random.uuid();
    
  },
  
  _iterativeFind: function (key, startupShortList, rpc) {
    
    var rpc = rpc || 'findNode',
        findValue = (rpc != 'findNode'),
        shortList = [];
    
    var shortList = startupShortList;
    
    if (!shortList) {
      
      if (key != this.id)
        self._routingTable.touchKBucket(key);
      
      if (shortList.length == 0)
        return fakeDf;
      
    }
    
    var findEnv = {
      activeProbes: [],
      alreadyContacted: [],
      activeContacts: [],
      pendingIterationCalls: [],
      prevClosestNode: [null],
      findValueResult: {},
      slowNodeCount: [0]
    };
    
  },
  
  // apply with activeContacts, alreadyContacted, shortList
  extendShortList: function(responseTuple, shortList) {
     
    var _this = this;
     
    var responseMsg = responseTuple[0];
    var originAddress = responseTuble[1];
    
    if ((responseMsg.nodeId in this.activeContacts) ||
        (responseMsg.nodeId = this.id)) {
      return responseMsg.nodeId;
    }
    
    if (responseMsg.nodeId in this.shortList) {
      var aContact = this.shortList[
        this.shortList.index(responseMsg.nodeId)];
    } else {
      var aContact = new Contact(responseMsg.nodeId,
        originAddress[0], originAddress[1], this._protocol);
    }
    
    activeContacts.append(aContact);
    
    if (responseMsg.nodeId not in this.alreadyContacted)
      this.alreadyContacted.append(responseMsg.nodeId);
    
    var result = responseMsg.response;
    
    if (findValue == true && result.constructor === Object) {
     findValueResult[key] = result[key];
   } else {
     
     if (findValue == true) {
       
       if ( findValueResult.closestNodeNoValue ) {
         
         if (this._routingTable.distance(key, responseMsg.nodeId) <
             this._routingTable.distance(key, activeContacts[0].id)
            findValueResult['closestNodeNoValue'] = aContact
        
       } else {
         
         findValueResult['closestNodeNoValue'] = aContact;
         
       }
        
     }
     
     _.each(result, function (contactInfo) {
       
       var testContact = new Contact(contactTriple[0],
         contactTriple[1], contactTriple[2], _this._protocol);
        
       if (!(testContact in shortList))
         shortList.push(testContact);
      
     });
     
   }
    
   return responseMsg.nodeId;
    
  },
  
  removeFromShortList: function (failure) {
  
    // failure.trap(protocol.TimeoutError)
    var deadContactId = failure.getErrorMessage();
    
    if (deadContatId in this.shortList)
      this.shortList.remove(deadContactId);
    
    return deadContactId;
  
  },
  
  cancelActiveProbe: function (contactId) {
    
    this.activeProbes.pop();
    
    var alpha = Kamdelia.config.alpha;
    
    if (this.activeProbes.length <= alpha / 2 &&
        this.pendingIterationCalls.length) {
    
      this.pendingIterationCalls[0].cancel();
    
      delete pendingIterationCalls[0];
      
      this.searchIteration();
      
    }
    
  },
  
  searchIteration: function (callback) {
    
    var _this = this;
    
    this.slowNodeCount[0] = this.activeProbes.length;
    
    this.activeContacts.sort(function (firstContact, secondContact, targetKey) {
      cmp(_this._routingTable.distance(firstContact.id, targetKey || _this.key),
          _this._routingTable.distance(secondContact.id, targetKey));
    });
    
    while (this.pendingIterationCalls.length) {
      delete this.pendingIterationCalls[0];
    }
    
    if (this.key in this.findValueResult) {
      
      callback(findValueResult);
      return null;
      
    } else if (this.activeContacts.length && findValue == false) {
      
      if (this.activeContacts.length > Kamdelia.config.k ||
         (this.activeContacts[0] == this.prevClosestNode[0] &&
          this.activeProbes.length == this.slowNodeCount[0])) {
            
        callback(this.activeContacts);
        return null;
      }
      
    }
    
    if (activeContacts.length)
      this.prevClosestNode = this.activeContacts[0];
    
    var contactedNow = 0;
    
    shortList.sort(function (firstContact, secondContact, targetKey) {
      
      cmp(_this._routingTable.distance(firstContact.id, targetKey || _this.key),
          _this._routingTable.distance(secondContact.id, targetKey));
      
    });
    
    var prevShortlistLength = shortList.length;
    
    _.each(shortList, function (contact) {
      
      if (!(contact.id in _this.alreadyContacted)) {
        
        _this.activeProbes.append(contact.id);
        
        var rpcMethod = contact.rpc;
        
        var df = rpcMethod(key, true, {
          success: _this.extendShortList,
          error: _this.removeFromShortList:
          then: cancelActiveProbe) });
        
        _this.alreadyContacted.push(contact.id);
        
      }
      
      if (contactedNow == Kamdelia.config.alpha) break; // !!
      
    });
    
    if (activeProbes.length > this.slowNodeCount[0] ||
        (shortList.length < Kamdelia.config.k && 
        activeContacts.length < shortList.length &&
        activeProbes.length > 0)) {
      
      var call = callLater(constants.iterativeLookupDelay, searchIteration);
      var pendingIterationCalls.append(call);
      
    } else if(prevShortListLength < shortList.length) {
      this.searchIteration();
    } else {
      outerDf.callback(this.activeContacts);
    }
    
    this.searchIteration();
    return outerDf;
    
  },
  
  _persistState: function (self, kwargs) {
    
    var state = { 'id': this.id, 'closetsNodes': this.findNode(this.id) };
    var now = +new Date();
    
    this._dataStore.setItem('nodeState', state, now, now, this.id);
    
  },
  
  // Periodically called to perform k-bucket refreshes and data
  // replication/republishing as necessary
  _refreshNode: function () {
    
    var _this = this;
    
    this._refreshRoutingTable(function () {
      
      _this._republishData(function () {
        
        _this.scheduleNextNodeRefresh();
        
      })
      
    });
    
    return null;
    
  },
  
  _refreshRoutingTable: function () {
    
    var nodeIds = this._routingTabke.getRefreshList(0, false);
    
    return Q.fcall(this._searchForNextNodeId);
    
  },
  
  _searchForNextNodeId: function () {
    
    var _this = this;
    
    if (nodeIds.length > 0) {
      
      var searchId = nodeIds.pop();
      
      Q.fcall(function () {
        _this.iterativeFindNode(searchId);
      }).then(this.searchForNextNodeId);
      
    }
      
  },
  
  _republishData: function () {
    
    var args = arguments;
    
    
  },
  
  _scheduleNextNodeRefresh: function () {
    
    Q.delay(Kademlia.config.checkRefreshInterval).done(this._refreshNode);
    
    return null;
    
  },
  
  // Should be in web worker
  threadedRepublishData: function () {
   
   var _this = this, expiredKeys = [];
   
   _.each(_.keys(this._dataStore), function (key) {
     
     if (key == 'nodeState') return;
     
     var now = +new Date();
     
     var age = now - _this._dataStore.originalPublish(key),
         originalPublisherId = _this._dataStore.originalPublisherId(key);
         
     if (originalPublisherId == this.id &&
        age >= Kademlia.config.dataExpireTimeout) {
       
      // Call from thread
      _this.iterativeStore(key, _this.dataStore[key]);

     } else {
       
       
       if (age >= Kademlia.config.dataExpireTimeout) {
         
         expiredKeys.append(key);
         
       } else if ( (now - _this.dataStore.lastPublished(key)) >=
                    Kademlia.config.replicateInterval )
        
         // Call from thread
         _this.iterativeStore(key, _this.dataStore[key], {
           originalPublisherId: originalPublisherId, age: age });
        
       }
       
     }
      
   });
   
   _.each(expiredKeys, function (expiredKey) {
     
     delete _this.dataStore[key];
     
   });
    
  }
  
  
});