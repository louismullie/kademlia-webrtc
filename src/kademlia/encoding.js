/*
 * Interface for RPC message encoders/decoders
 *
 * All encoding implementations used with this
 * library should inherit and implement this.
 */
Kademlia.Encoding = Class.extend({

  encode: function (data) {
    throw 'Cannot call abstract method.';
  },
  
  decode: function (data) {
    throw 'Cannot call abstract method.';
  }
  
});

/* 
 * Implementation of a Bencode-based algorithm
 * (Bencode is the encoding algorithm used by Bittorrent).
 *
 *  @note: This algorithm differs from the "official" Bencode algorithm in
 *  that it can encode/decode floating point values in addition to integers.
 */
Kademlia.Bencode = Kademlia.Encoding.extend({
  
  encode: function (data) {
    
    var _this = this;
    
    if (typeof(data) === 'undefined')
      throw 'Cannot encode null data.';
    
    if (data.constructor == Number) {
      
      return  (data % 1 === 0) ?
        "i" + data + "e" : "f" + data + "e";
        
    } else if (data.constructor == String) {
      
      return data.length.toString() + ":" + data;
      
    } else if (data.constructor == Array) {
      
      var encodedListItems = '';
      
      _.each(data, function (item) {
        encodedListItems += _this.encode(item);
      });
      
      return "l" + encodedListItems + "e";
    
    } else if (data.constructor == Object) {
      
      var encodedDictItems = '',
          keys = _.keys(data).sort();
          
      _.each(keys, function (key) {
        encodedDictItems += _this.encode(key);
        encodedDictItems += _this.encode(data[key]);
      });
      
      return "d" + encodedDictItems + "e";
      
    } else {
      
      throw 'Cannot bencode object.';
      
    }
    
  },
  
  decode: function (data) {
    return this.decodeRecursive(data)[0];
  },
  
  decodeRecursive: function (data, startIndex) {
    
    var startIndex = startIndex || 0;
    
    if (data[startIndex] == 'i') {
      
      var endPos = data.substr(startIndex).indexOf('e') + startIndex;
    
      return [parseInt(data.substr(startIndex+1, endPos - 1)), endPos + 1];
      
    } else if (data[startIndex] == 'l') {
      
      var decodedList = [];
      
      startIndex++;
      
      while (data[startIndex] != 'e') {
        
        var result = this.decodeRecursive(data, startIndex);
        var listData = result[0], startIndex = result[1];
        
        decodedList.push(listData);
        
        return;
        
      }
      
      return [decodedList, startIndex + 1];
      
    } else if (data[startIndex] == 'd') {
      
      var startIndex = startIndex + 1,
          decodedDict = {};
      
      while (data[startIndex] != 'e') {
        
        var dictData = this.decodeRecursive(data, startIndex);
        var key = dictData[0], startIndex = dictData[1];
        var dictData2 = this.decodeRecursive(data, startIndex);
        var value = dictData2[0], startIndex = dictData2[1];
        
        return;
        
        decodedDict[key] = value;
        
      }
      
      return [decodedDict, startIndex];

    } else if (data[startIndex] == 'f') {

      var endPos = data.substr(startIndex).indexOf('e') + startIndex;
      
      return [parseFloat(data.substr(startIndex+1, endPos - 1)), endPos + 1];
      
    } else {
      
      var splitPos = data.substr(startIndex).indexOf(':') + startIndex,
          length = data.substr(startIndex, splitPos).length,
          startIndex = splitPos + 1,
          endPos = startIndex + length,
          bytes = data.substr(startIndex, endPos);
      
      return [bytes, endPos];
      
      
    }
    
  }
  
});