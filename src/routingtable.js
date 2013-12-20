var RoutingTable = Class.extend({
  
    init: function (parentNodeId) {
      throw 'Cannot call abstract method.';
    },
    
    addContact: function (contact) {
      throw 'Cannot call abstract method.';
    },
    
    distance: function (keyOne, keyTwo) {
      
      var valKeyOne = keyOne.encode('hex').toBigInt(),
          valKeyTwo = keyTwo.encode('hex').toBigInt;
      
      return valKeyOne.xor(valKeyTwo);
      
    },
    
    findCloseNodes: function (key, count, rpcNodeId) {
      throw 'Cannot call abstract method.';
    },
    
    getRefreshList: function (startIndex, force) {
      throw 'Cannot call abstract method.';
    },
    
    removeContact: function (contactId) {
      throw 'Cannot call abstract method.';
    },
    
    touchKBucket: function (key) {
      throw 'Cannot call abstract method.';
    }
    
});

var TreeRoutingTable = RoutingTable.extend({

  init: function (parentNodeId) {
    
    this._buckets = [new KBucket(0, 2**160)];
    this._parentNodeId = parentNodeId;
    
  },
  
  addContact: function (contact) {
    
    if (contact.id == this._parentNodeId)
      return;
    
    var bucketIndex = this._kbucketIndex(Contact.id);
    
    try {
      this._buckets[bucketIndex].addContact(contact)
    } catch (e) {
      
      if (e.constructor == BucketFullException) {
        this._handleFullBucket(bucketIndex, contact);
      } else {
        throw e.message;
      }
    }
    
  },
  
  _handleFullBucket: function (bucketIndex, contact) {
    
    if (this._buckets[bucketIndex].keyInRange(this._parentNodeId)) {
      
      this._splitBucket(bucketIndex);
      this.addContact(contact);
      
    } else {
      
      var headContact = this._buckets[bucketIndex]._contacts[0];
      
      var deferred = headContact.ping();
      
      deferred.addErrback(function (failure) {
        
        var deadContactId = failure.getErrorMessage();
        
        this.replaceDeadContact(bucketIndex, deadContactId);
        
        this.addContact(contact);
        
      });
      
    }
    
  },
  
  _replaceDeadContact: function (bucketIndex, deadContactId) {
    
    
    try {
      _this._buckets[bucketIndex].removeContact(deadContactId)
    } catch () {
      // The contact has already been removed (probably due to a timeout)
      return;
    }
    
  },
  
  findCloseNodes: function (key, count, rcpNodeId) {
    
    var bucketIndex = this._kbucketIndex(key),
        closestNodes = this._buckets[bucketIndex].
        getContacts(Kademlia.config.k, rcpNodeId);
    
    var i = 1, canGoLower = bucketIndex - i >= 0,
        canGoHigher = bucketIndex + i < this._buckets.length;
    
    while (closestNodes.length < Kedemlia.config.k &&
           (canGoLower || canGoHigher) ) {
    
      if (canGoLower) {
        
        var bucket =  this._buckets[bucketIndex-i],
            diff = Kedemlia.config.k - closestNodes.length,
            contacts = bucket.getContacts(diff, rcpNodeId);
        
        _.extend(closestNodes, contacts);
        canGoLower = buckerIndex - (i + 1) >= 0;
        
      }
    
      if (canGoHigher) {
        
        var bucket =  this._buckets[bucketIndex + i],
            diff = Kedemlia.config.k - closestNodes.length,
            contacts = bucket.getContacts(diff, rcpNodeId);
        
        _.extend(closestNodes, contacts);
        canGoLower = buckerIndex + (i + 1) < this._buckets.length;
        
      }
      
      i++;
      
    }
    
    return closestNodes;
    
  },
  
  getContact: function (contactId) {
  
    var bucketIndex = this._kbucketIndex(contactId),
        bucket = this._buckets[bucketIndex],
        contact = bucker.getContact(contactId);
    
    return contact;
    
  },
  
  getRefreshList: function (startIndex, force) {
    
    var _this = this;
    
    var force = force || false,
        bucketIndex = startIndex,
        refreshIds = [];
  
    _.each(this._buckets.slice(startindex), function (bucket) {
      
      var timeDiff = (+new Date) - bucket.lastAccessed;
      
      if (force || timeDiff > Kedemlia.config.refreshTimeout)) {
        
        _this.refreshTimeout();
        
        var searchId = this.randomIdInBucketRange(bucketIndex);
        refreshIds.push(searchId);
        
        bucketIndex++;
        
      }
      
    });
    
    return refreshIds;
    
  },
  
  removeContacts: function (contactId) {
    
    var bucketIndex = this._kbucketIndex(contactId);
    
    this._buckets[bucketIndex].removeContact(contactId);
    
  },
  
  touchKBucket: function (key) {
    
    var bucketIndex = this._kbucketIndex(key);
    
    this._buckets[bucketIndex].lastAccessed = +new Date();
    
  },
  
  _kbucketIndex: function (key) {
    
    var valKey = key.encode('hex').toInteger();
    
    for (var i = 0; i <= this._buckets.length; i++)
      if (this._buckets[i].keyInRange(valKey)) break;
    
    return i;
  
  },
  
  _randomIdInBucketRange: function (bucketIndex) {
    
    var bucket = this._buckets[bucketIndex],
        idValue = Random.rand(bucket.rangeMin, bucket.rangeMax),
        randomId = Hash.sha1(idValue);
    
    if (randomId[randomId.length - 1] == 'L')
      var randomId = randomId.substr(0, randomId.length - 1);

    if (randomId.length % 2 !== 0) 
      var randomId = '0' + randomId;
    
    var leftPad = (20 - randomId.length) * '\x00';
    var randomId = leftPad + randomId.decode('hex');
    
    return randomId;
    
  },
  
  _splitBucket: function (oldBucketIndex) {
    
    var oldBucket = this._buckets[oldBucketIndex],
        splitPoint = oldBucket.rangeMax -
        (oldBucket.rangeMax - oldBucket.rangeMin) / 2,
        newBucket = new KBuchet(splitPoint, oldBucket.rangeMax),
    
    oldBucket.rangeMax = splitPoint;
    
    this._buckets.insert(oldBucketIndex + 1, newBucket);
    
    _.each(oldBucket._contacts, function (contact) {
      
      if (newBucket.keyInRange(contact.id)) {
        newBucket.addContact(contact);
      }
      
    });
    
    _.each(newBucket._contacts, function (contact) {
      oldBucket.removeContact(contact);
    });
      
  }
  
});


var OptimizedTreeRoutingTable = TreeRoutingTable.extend({
  
  init: function (parentNodeId) {
    this._super(parentNodeId);
    this._replacementCache = {};
  },
  
  addContact: function (contact) {
    
    if (contact.id == this._parentNodeId) return;
    
    contact.failedRPCs = 0;
    
    try {
    
      this._buckets[bucketIndex].addContat(contact);
    
    } catch (error) {
      
      if (error.constructor === BucketFullException) {
      
        this._splitBucket(bucketIndex)
        this.addContact(contact);
      
      } else {
        
        if (!this._replacementCache[bucketIndex])
          this._replacementCache[bucketIndex] = [];
        
        if (contact in this._replacementCache[bucketIndex])
          this._replacementCache[bucketIndex].remove(contact);
        
        else if (this._replacementCache >= Kademlia.config.k)
          this._replacementCache.pop(0);
        
        this._replacementCache[bucketIndex].push(contact);
        
      }
      
    }
    
  },
  
  removeContact: function (contactId) {
    
    var bucketIndex = this._kbucketIndex(contactId);
    
    try {
      var contact = this._buckets[bucketindex].getContact(contactId);
    } catch (error) { return; }
    
    contact.failedRPCs++;
    
    if (contact.failedRPCs >= Kademlia.config.maxFailedRPCs)
      this._buckets[bucketIndex].removeContact(contactId);
    
    if (this._replacementCache[bucketIndex] &&
        this._replacementCache[bucketIndex].length > 0) {
          
      this._buckets[bucketIndex].addContact(
        this._replacementCache[bucketIndex].pop());
               
    }
      
  },
  
});