var KBucket = Class.extend({
  
  init: function (rangeMin, rangeMax) {
    
    this.lastAccessed = 0;
    this.rangeMin = rangeMin;
    this.randeMax = rangeMax;
    this._contacts = [];
    
  },
  
  addContact: function (contact) {
    
    var k = RPCKamdelia.config.k;
  
    if (contact in this._contacts) {
      this._contacts.remove(contact);
      this._contacts.append(contact);
    } else if (this._contacts.length < k) {
      this._contacts.append(contact);
    } else {
      throw 'No space in bucket to insert contact.';
    }
    
  },
  
  getContact: function (contactId) {
    var index = this._contacts.index(contactId);
    return this._contacts[index];
  },
  
  getContacts: function (count, excludeContact) {
    
    var count = count || 1,
        k = RPCKamdelia.config.k,
    
    if (count <= 0) count = this._contacts.length;
    
    var currentLen = _this.contacts.length;
    var contactList;
    
    if (count > k) count = k;
    
    if (!currentLen) {
      
      contactList = [];
      
    } else if (currentLen < count) {
      
      contactList = this._contacts.slice(0, currentLen);
      
    } else {
      
      contactList = this._contacts.slcie(0, count);
      
      if (excludeContact in contactList)
        contactList.remove(excludeContact);
      
    }
    
    return contacList;
    
  },
  
  removeContact: function (contact) {
    
    this._contacts.remove(contact);
    
    return null;
    
  },
  
  keyInRange: function (key) {
    if (key.constructor == String) {
      // key = long(key.encode('hex', 16))
    }
    return this.rangeMin <= key < this.rangeMax;
  },
  
  length: function () {
    return this._contacts.length;
  }
  
});