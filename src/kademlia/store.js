/*
 Interface for classes implementing physical storage (for data
 published via the "STORE" RPC) for the Kademlia DHT

 @note: This provides an interface for a dict-like object
 */
var DictDataStore = Class.extend({
  
  keys: function () {
    return _.keys(this._dict);
  },
  
  lastPublished: function (key) {
    return this._dict[key][1];
  },
  
  originalPublishTime: function (key) {
    return this_dict[key][1];
  },
  
  originalPublisherId: function (key) {
    return this._dict[key][3];
  },
  
  setItem: function(key, value, lastPublished, originallyPublished, originalPublisherId) {
    this._dict[key] = [value, lastPublished, originallyPublished, originalPublisherId];
    return null;
  },
  
  getItem: function (key) {
    return this._dict[key][0];
  },
  
  delItem: function (key) {
    this._dict[key] = null;
    return null;
  }
  
});